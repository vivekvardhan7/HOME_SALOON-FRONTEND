import { getApiUrl } from "@/config/env";

const AUTH_HEADER_KEYS = ["supabase.accessToken", "accessToken", "token"];

const buildAuthHeaders = () => {
  if (typeof window === "undefined") {
    return {};
  }

  for (const key of AUTH_HEADER_KEYS) {
    const token = window.localStorage.getItem(key);
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  }

  return {};
};

export type BookingStatus =
  | "PENDING"
  | "AWAITING_MANAGER"
  | "AWAITING_VENDOR_RESPONSE"
  | "AWAITING_BEAUTICIAN"
  | "BEAUTICIAN_ASSIGNED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export interface CreateBookingPayload {
  customerId?: string;
  vendorId?: string | null;
  catalogServiceId?: string | null;
  services?: Array<{ id: string; quantity?: number; price?: number }>;
  productSelections?: Array<{ productCatalogId: string; quantity?: number }>;
  products?: Array<{ productCatalogId: string; quantity?: number }>;
  scheduledDate: string;
  scheduledTime: string;
  address?: {
    id?: string;
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
  addressId?: string;
  notes?: string;
  bookingType?: "AT_HOME" | "SALON_VISIT";
  paymentMethod?: "ONLINE" | "CASH";
  total?: number;
}

export interface AssignVendorPayload {
  vendorId: string;
}

export interface AssignBeauticianPayload {
  employeeId?: string;
  beautician?: {
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    experience?: number;
    specialization?: string;
  };
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  try {
    const json = await response.json();
    return (json?.data ?? json) as T;
  } catch (error) {
    throw new Error("Failed to parse server response");
  }
}

export const createBooking = async (payload: CreateBookingPayload) => {
  return request(getApiUrl("/bookings"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
};

export const fetchCustomerBookings = async (params: {
  page?: number;
  limit?: number;
  status?: BookingStatus | "Pending_Manager_Review" | "Assigned_To_Vendor" | "Beautician_Assigned";
  userId?: string;
}) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.status) query.set("status", params.status);
  if (params.userId) query.set("userId", params.userId);

  return request(
    getApiUrl(`/customer/bookings${query.toString() ? `?${query.toString()}` : ""}`),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
      },
    }
  );
};

export const fetchManagerBookings = async (params: {
  status?: BookingStatus | "Pending_Manager_Review";
  bookingType?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.bookingType) query.set("bookingType", params.bookingType);
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());

  return request(
    getApiUrl(`/manager/bookings${query.toString() ? `?${query.toString()}` : ""}`),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
      },
    }
  );
};

export const assignVendorToBooking = async (bookingId: string, payload: AssignVendorPayload) => {
  return request(getApiUrl(`/manager/bookings/${bookingId}/assign-vendor`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
};

export const fetchVendorBookings = async () => {
  return request(getApiUrl("/vendor/bookings"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
  });
};

export const vendorAcceptBooking = async (bookingId: string, payload?: { employeeId?: string }) => {
  return request(getApiUrl(`/vendor/bookings/${bookingId}/approve`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload ?? {}),
  });
};

export const vendorRejectBooking = async (bookingId: string, payload?: { reason?: string }) => {
  return request(getApiUrl(`/vendor/bookings/${bookingId}/reject`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload ?? {}),
  });
};

export const assignBeautician = async (bookingId: string, payload: AssignBeauticianPayload) => {
  return request(getApiUrl(`/vendor/bookings/${bookingId}/assign-beautician`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
};

export const updateBookingStatus = async (
  bookingId: string,
  payload: { status: BookingStatus; notes?: string }
) => {
  return request(getApiUrl(`/bookings/${bookingId}/status`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
};


