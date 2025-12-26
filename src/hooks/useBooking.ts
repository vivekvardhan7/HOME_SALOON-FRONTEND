import { useMemo } from "react";
import {
  useBookingContext,
  type BookingMode,
  type BookingAddress,
  type BookingSchedule,
  type SelectedProduct,
  type SelectedService,
  type BookingTotals,
} from "@/contexts/BookingContext";

export interface UseBooking {
  mode: BookingMode;
  services: SelectedService[];
  products: SelectedProduct[];
  schedule: BookingSchedule;
  address?: BookingAddress;
  notes?: string;
  vendorId?: string;
  includeProducts: boolean;
  totals: BookingTotals;
  setMode: (mode: BookingMode) => void;
  addService: (service: SelectedService["service"], quantity?: number) => void;
  updateServiceQuantity: (serviceId: string, quantity: number) => void;
  removeService: (serviceId: string) => void;
  addProduct: (product: SelectedProduct["product"], quantity?: number) => void;
  updateProductQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  setSchedule: (schedule: BookingSchedule) => void;
  setAddress: (address?: BookingAddress) => void;
  setNotes: (notes?: string) => void;
  setVendor: (vendorId?: string) => void;
  setMetadata: (metadata?: Record<string, unknown>) => void;
  reset: () => void;
}

export const useBooking = (): UseBooking => {
  const {
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
  } = useBookingContext();

  return useMemo(
    () => ({
      mode: state.mode,
      services: state.services,
      products: state.products,
      schedule: state.schedule,
      address: state.address,
      notes: state.notes,
      vendorId: state.vendorId,
      includeProducts: state.includeProducts,
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
      state.mode,
      state.services,
      state.products,
      state.schedule,
      state.address,
      state.notes,
      state.vendorId,
      state.includeProducts,
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
};


