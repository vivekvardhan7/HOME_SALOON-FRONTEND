import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  createBooking,
  fetchCustomerBookings,
  fetchManagerBookings,
  fetchVendorBookings,
  assignVendorToBooking,
  vendorAcceptBooking,
  vendorRejectBooking,
  assignBeautician,
  updateBookingStatus,
  type CreateBookingPayload,
  type AssignVendorPayload,
  type AssignBeauticianPayload,
} from "@/api/bookings";

const CUSTOMER_BOOKINGS_KEY = ["customer-bookings"];
const MANAGER_BOOKINGS_KEY = ["manager-bookings"];
const VENDOR_BOOKINGS_KEY = ["vendor-bookings"];

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MANAGER_BOOKINGS_KEY });
    },
  });
};

export const useCustomerBookings = (
  params: Parameters<typeof fetchCustomerBookings>[0],
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: [...CUSTOMER_BOOKINGS_KEY, params],
    queryFn: () => fetchCustomerBookings(params),
    staleTime: 1000 * 30,
    ...options,
  });
};

export const useManagerBookings = (
  params: Parameters<typeof fetchManagerBookings>[0],
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: [...MANAGER_BOOKINGS_KEY, params],
    queryFn: () => fetchManagerBookings(params),
    staleTime: 1000 * 15,
    ...options,
  });
};

export const useVendorBookings = (
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: VENDOR_BOOKINGS_KEY,
    queryFn: () => fetchVendorBookings(),
    staleTime: 1000 * 15,
    ...options,
  });
};

export const useAssignVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: AssignVendorPayload }) =>
      assignVendorToBooking(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGER_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: VENDOR_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKINGS_KEY });
    },
  });
};

export const useVendorDecision = () => {
  const queryClient = useQueryClient();
  const accept = useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload?: { employeeId?: string } }) =>
      vendorAcceptBooking(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MANAGER_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKINGS_KEY });
    },
  });

  const reject = useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload?: { reason?: string } }) =>
      vendorRejectBooking(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MANAGER_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKINGS_KEY });
    },
  });

  return { accept, reject };
};

export const useAssignBeautician = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: AssignBeauticianPayload }) =>
      assignBeautician(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MANAGER_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKINGS_KEY });
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: { status: string; notes?: string } }) =>
      updateBookingStatus(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: MANAGER_BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BOOKINGS_KEY });
    },
  });
};


