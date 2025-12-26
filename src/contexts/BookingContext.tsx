import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { CatalogProduct, CatalogService } from "@/lib/catalogApi";

export type BookingMode = "WITH_PRODUCTS" | "WITHOUT_PRODUCTS" | null;

export interface SelectedService {
  service: CatalogService;
  quantity: number;
}

export interface SelectedProduct {
  product: CatalogProduct;
  quantity: number;
}

export interface BookingAddress {
  id?: string;
  label?: string;
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingSchedule {
  date?: string; // ISO date string (YYYY-MM-DD)
  time?: string; // HH:mm or locale display
}

export interface BookingTotals {
  servicesTotal: number;
  productsTotal: number;
  adminProfit: number;
  vendorPayout: number;
  grandTotal: number;
}

export interface BookingState {
  mode: BookingMode;
  services: SelectedService[];
  products: SelectedProduct[];
  schedule: BookingSchedule;
  address?: BookingAddress;
  notes?: string;
  vendorId?: string;
  includeProducts: boolean;
  metadata?: Record<string, unknown>;
}

type BookingAction =
  | { type: "SET_MODE"; payload: BookingMode }
  | { type: "RESET" }
  | { type: "ADD_SERVICE"; payload: { service: CatalogService; quantity?: number } }
  | { type: "UPDATE_SERVICE_QUANTITY"; payload: { serviceId: string; quantity: number } }
  | { type: "REMOVE_SERVICE"; payload: { serviceId: string } }
  | { type: "ADD_PRODUCT"; payload: { product: CatalogProduct; quantity?: number } }
  | { type: "UPDATE_PRODUCT_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "REMOVE_PRODUCT"; payload: { productId: string } }
  | { type: "SET_SCHEDULE"; payload: BookingSchedule }
  | { type: "SET_ADDRESS"; payload?: BookingAddress }
  | { type: "SET_NOTES"; payload?: string }
  | { type: "SET_VENDOR"; payload?: string }
  | { type: "SET_METADATA"; payload?: Record<string, unknown> };

const DEFAULT_STATE: BookingState = {
  mode: null,
  services: [],
  products: [],
  schedule: {},
  address: undefined,
  notes: undefined,
  vendorId: undefined,
  includeProducts: false,
  metadata: undefined,
};

const STORAGE_KEY = "homebonzenga.booking-state.v1";

const reduceBooking = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case "RESET":
      return { ...DEFAULT_STATE };
    case "SET_MODE": {
      const mode = action.payload;
      return {
        ...state,
        mode,
        includeProducts: mode === "WITH_PRODUCTS",
        // Reset selections when switching mode to prevent stale entries
        services: mode ? state.services : [],
        products: mode === "WITH_PRODUCTS" ? state.products : [],
      };
    }
    case "ADD_SERVICE": {
      const { service, quantity = 1 } = action.payload;
      const existing = state.services.find((item) => item.service.id === service.id);
      if (existing) {
        return reduceBooking(state, {
          type: "UPDATE_SERVICE_QUANTITY",
          payload: { serviceId: service.id, quantity: existing.quantity + quantity },
        });
      }
      return {
        ...state,
        services: [
          ...state.services,
          {
            service,
            quantity: Math.max(1, quantity),
          },
        ],
      };
    }
    case "UPDATE_SERVICE_QUANTITY": {
      const { serviceId, quantity } = action.payload;
      if (quantity <= 0) {
        return reduceBooking(state, { type: "REMOVE_SERVICE", payload: { serviceId } });
      }
      return {
        ...state,
        services: state.services.map((item) =>
          item.service.id === serviceId
            ? {
                ...item,
                quantity: Math.max(1, quantity),
              }
            : item
        ),
      };
    }
    case "REMOVE_SERVICE":
      return {
        ...state,
        services: state.services.filter((item) => item.service.id !== action.payload.serviceId),
      };
    case "ADD_PRODUCT": {
      const { product, quantity = 1 } = action.payload;
      const existing = state.products.find((item) => item.product.id === product.id);
      if (existing) {
        return reduceBooking(state, {
          type: "UPDATE_PRODUCT_QUANTITY",
          payload: {
            productId: product.id,
            quantity: existing.quantity + quantity,
          },
        });
      }
      return {
        ...state,
        includeProducts: true,
        products: [
          ...state.products,
          {
            product,
            quantity: Math.max(1, quantity),
          },
        ],
      };
    }
    case "UPDATE_PRODUCT_QUANTITY": {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return reduceBooking(state, { type: "REMOVE_PRODUCT", payload: { productId } });
      }
      return {
        ...state,
        products: state.products.map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.max(1, quantity),
              }
            : item
        ),
      };
    }
    case "REMOVE_PRODUCT": {
      const updated = state.products.filter((item) => item.product.id !== action.payload.productId);
      return {
        ...state,
        products: updated,
        includeProducts: updated.length > 0 || state.includeProducts,
      };
    }
    case "SET_SCHEDULE":
      return {
        ...state,
        schedule: {
          date: action.payload.date,
          time: action.payload.time,
        },
      };
    case "SET_ADDRESS":
      return {
        ...state,
        address: action.payload ? { ...action.payload } : undefined,
      };
    case "SET_NOTES":
      return {
        ...state,
        notes: action.payload,
      };
    case "SET_VENDOR":
      return {
        ...state,
        vendorId: action.payload,
      };
    case "SET_METADATA":
      return {
        ...state,
        metadata: action.payload ? { ...action.payload } : undefined,
      };
    default:
      return state;
  }
};

const loadInitialState = (): BookingState => {
  if (typeof window === "undefined") {
    return { ...DEFAULT_STATE };
  }

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_STATE };
    }
    const parsed = JSON.parse(stored) as BookingState;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      services: Array.isArray(parsed?.services) ? parsed.services : [],
      products: Array.isArray(parsed?.products) ? parsed.products : [],
      schedule: parsed?.schedule ?? {},
    };
  } catch (error) {
    console.warn("Failed to parse stored booking state, resetting:", error);
    return { ...DEFAULT_STATE };
  }
};

interface BookingContextValue {
  state: BookingState;
  totals: BookingTotals;
  setMode: (mode: BookingMode) => void;
  addService: (service: CatalogService, quantity?: number) => void;
  updateServiceQuantity: (serviceId: string, quantity: number) => void;
  removeService: (serviceId: string) => void;
  addProduct: (product: CatalogProduct, quantity?: number) => void;
  updateProductQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  setSchedule: (schedule: BookingSchedule) => void;
  setAddress: (address?: BookingAddress) => void;
  setNotes: (notes?: string) => void;
  setVendor: (vendorId?: string) => void;
  setMetadata: (metadata?: Record<string, unknown>) => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reduceBooking, undefined, loadInitialState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Unable to persist booking state:", error);
    }
  }, [state]);

  const totals = useMemo<BookingTotals>(() => {
    const servicesTotal = state.services.reduce(
      (sum, item) => sum + item.quantity * (item.service.customerPrice ?? 0),
      0
    );
    const productsTotal = state.products.reduce(
      (sum, item) => sum + item.quantity * (item.product.customerPrice ?? 0),
      0
    );
    const vendorPayout =
      state.services.reduce(
        (sum, item) => sum + item.quantity * (item.service.vendorPayout ?? 0),
        0
      ) +
      state.products.reduce(
        (sum, item) => sum + item.quantity * (item.product.vendorPayout ?? 0),
        0
      );
    const grandTotal = servicesTotal + productsTotal;
    const adminProfit = Math.max(0, grandTotal - vendorPayout);

    return {
      servicesTotal,
      productsTotal,
      vendorPayout,
      adminProfit,
      grandTotal,
    };
  }, [state.products, state.services]);

  const setMode = useCallback((mode: BookingMode) => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  const addService = useCallback((service: CatalogService, quantity?: number) => {
    dispatch({ type: "ADD_SERVICE", payload: { service, quantity } });
  }, []);

  const updateServiceQuantity = useCallback((serviceId: string, quantity: number) => {
    dispatch({ type: "UPDATE_SERVICE_QUANTITY", payload: { serviceId, quantity } });
  }, []);

  const removeService = useCallback((serviceId: string) => {
    dispatch({ type: "REMOVE_SERVICE", payload: { serviceId } });
  }, []);

  const addProduct = useCallback((product: CatalogProduct, quantity?: number) => {
    dispatch({ type: "ADD_PRODUCT", payload: { product, quantity } });
  }, []);

  const updateProductQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_PRODUCT_QUANTITY", payload: { productId, quantity } });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_PRODUCT", payload: { productId } });
  }, []);

  const setSchedule = useCallback((schedule: BookingSchedule) => {
    dispatch({ type: "SET_SCHEDULE", payload: schedule });
  }, []);

  const setAddress = useCallback((address?: BookingAddress) => {
    dispatch({ type: "SET_ADDRESS", payload: address });
  }, []);

  const setNotes = useCallback((notes?: string) => {
    dispatch({ type: "SET_NOTES", payload: notes });
  }, []);

  const setVendor = useCallback((vendorId?: string) => {
    dispatch({ type: "SET_VENDOR", payload: vendorId });
  }, []);

  const setMetadata = useCallback((metadata?: Record<string, unknown>) => {
    dispatch({ type: "SET_METADATA", payload: metadata });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const contextValue: BookingContextValue = useMemo(
    () => ({
      state,
      totals,
      setMode,
      addService,
      updateServiceQuantity,
      removeService,
      addProduct,
      updateProductQuantity,
      removeProduct,
      setSchedule,
      setAddress,
      setNotes,
      setVendor,
      setMetadata,
      reset,
    }),
    [
      state,
      totals,
      setMode,
      addService,
      updateServiceQuantity,
      removeService,
      addProduct,
      updateProductQuantity,
      removeProduct,
      setSchedule,
      setAddress,
      setNotes,
      setVendor,
      setMetadata,
      reset,
    ]
  );

  return <BookingContext.Provider value={contextValue}>{children}</BookingContext.Provider>;
};

export const useBookingContext = (): BookingContextValue => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBookingContext must be used within a BookingProvider");
  }
  return context;
};


