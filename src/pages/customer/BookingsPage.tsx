import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Search,
  Filter,
  Eye,
  Loader2,
  Scissors,
  Palette,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabaseConfig } from '@/config/supabase';

interface Booking {
  id: string;
  bookingNumber: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  scheduledDate: string;
  scheduledTime: string;
  total: number;
  bookingType: 'SALON' | 'AT_HOME';
  serviceAddress?: string;
  serviceType: 'hair' | 'face' | 'extras';
  beautician?: {
    id: string;
    firstName: string;
    lastName: string;
    skills: string[];
  };
  vendor?: {
    id: string;
    shopname: string;
    address: string;
  };
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  createdAt: string;
  notes?: string;
}

const CustomerBookingsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const handleViewBooking = (booking: Booking) => {
    if (booking.bookingType === 'AT_HOME') {
      navigate(`/customer/athome-bookings/${booking.id}`);
    } else {
      navigate(`/customer/salon-bookings/${booking.id}`);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchBookings();

      // Add periodic refresh every 30 seconds to keep data updated
      const interval = setInterval(() => {
        fetchBookings();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    filterBookings();
    setCurrentPage(1); // Reset to first page when filters change
  }, [bookings, searchTerm, statusFilter, paymentFilter, typeFilter]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);


  const fetchBookings = async () => {
    try {
      setIsLoading(true);

      if (!user?.id) return;

      // Call backend endpoint which bypasses RLS and handles case-insensitive matching
      const response = await api.get('/customer/bookings');

      if (!(response.data as any).success) {
        throw new Error((response.data as any).message || 'Failed to fetch bookings');
      }

      const { salonBookings: salonData, atHomeBookings: athomeData } = (response.data as any).data;

      let allBookings: Booking[] = [];

      // Process Salon Bookings
      if (salonData) {
        const processedSalon = salonData.map((b: any) => {
          // vendor_orders has services as a JSON array snapshot
          const services = Array.isArray(b.services) ? b.services.map((item: any) => ({
            id: item.id || '',
            name: item.name || 'Service',
            price: item.price || 0,
            duration: item.duration || 60
          })) : [];

          return {
            id: b.id,
            bookingNumber: b.id.toString().substring(0, 8).toUpperCase(),
            status: mapBookingStatus(b.booking_status),
            paymentStatus: mapPaymentStatus(b.payment_status || 'PAID'),
            scheduledDate: b.appointment_date,
            scheduledTime: b.appointment_time,
            total: parseFloat(b.total_amount || '0'),
            bookingType: 'SALON',
            serviceAddress: b.vendor ? `${b.vendor.address}, ${b.vendor.city}` : 'Salon',
            serviceType: determineServiceType(b),
            vendor: b.vendor ? {
              id: b.vendor.id,
              shopname: b.vendor.shopname,
              address: `${b.vendor.address || ''}, ${b.vendor.city || ''}`
            } : undefined,
            services,
            createdAt: b.created_at
          } as Booking;
        });
        allBookings = [...allBookings, ...processedSalon];
      }

      // Process At-Home Bookings
      if (athomeData && athomeData.length > 0) {
        const athomeIds = athomeData.map((b: any) => b.id);

        // We still need to fetch service details separately or we could have included it in the backend
        // For now, let's keep this client-side or move it? 
        // Best to keep consistent. The backend endpoint returned raw athome bookings. 
        // We can fetch service names here or update backend. 
        // To be safe and fast, let's fetch service mapping here using supabase (public table usually fine)
        // OR better: update the backend code to include it. 
        // Actually, let's assume valid RLS for public service tables or fetch it here.
        // It's safer to fetch here for now to avoid breaking changes in backend logic if tables are complex.

        const { data: ahServices } = await supabase
          .from('athome_booking_services')
          .select('booking_id, admin_service_id, master:admin_services(name)')
          .in('booking_id', athomeIds);

        const ahServicesMap: Record<string, any[]> = {};
        if (ahServices) {
          ahServices.forEach((s: any) => {
            if (!ahServicesMap[s.booking_id]) ahServicesMap[s.booking_id] = [];
            ahServicesMap[s.booking_id].push({ name: s.master?.name || 'Service', price: 0, duration: 0 });
          });
        }

        const processedAtHome = athomeData.map((b: any) => {
          let addr = 'Home';
          if (typeof b.address === 'string') addr = b.address;
          else if (b.address?.street) addr = `${b.address.street}, ${b.address.city}`;

          return {
            id: b.id,
            bookingNumber: b.id.substring(0, 8).toUpperCase(),
            status: mapBookingStatus(b.status),
            paymentStatus: 'paid',
            scheduledDate: b.slot,
            scheduledTime: new Date(b.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            total: parseFloat(b.total_price || '0'),
            bookingType: 'AT_HOME',
            serviceAddress: addr,
            serviceType: 'hair',
            beautician: b.beautician ? {
              id: b.beautician.id,
              firstName: b.beautician.name.split(' ')[0],
              lastName: b.beautician.name.split(' ').slice(1).join(' '),
              skills: b.beautician.skills || []
            } : undefined,
            services: ahServicesMap[b.id] || [],
            createdAt: b.created_at
          } as Booking;
        });
        allBookings = [...allBookings, ...processedAtHome];
      }

      allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(allBookings);

    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map booking status
  const mapBookingStatus = (status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
    const statusMap: { [key: string]: 'pending' | 'confirmed' | 'completed' | 'cancelled' } = {
      'PENDING': 'pending',
      'CONFIRMED': 'confirmed',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled',
      'REJECTED': 'cancelled'
    };
    return statusMap[status?.toUpperCase()] || 'pending';
  };

  // Helper function to map payment status
  const mapPaymentStatus = (status: string): 'paid' | 'unpaid' | 'refunded' => {
    const statusMap: { [key: string]: 'paid' | 'unpaid' | 'refunded' } = {
      'PAID': 'paid',
      'UNPAID': 'unpaid',
      'REFUNDED': 'refunded'
    };
    return statusMap[status?.toUpperCase()] || 'unpaid';
  };

  // Helper function to determine service type based on booking
  const determineServiceType = (booking: any): 'hair' | 'face' | 'extras' => {
    // Check items (At-Home or legacy Salon)
    if (booking.items && booking.items.length > 0) {
      const serviceName = booking.items[0]?.service?.name?.toLowerCase() || '';
      if (serviceName.includes('hair')) return 'hair';
      if (serviceName.includes('facial') || serviceName.includes('face')) return 'face';
    }
    // Check services (vendor_orders for Salon)
    if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
      const serviceName = booking.services[0]?.name?.toLowerCase() || '';
      if (serviceName.includes('hair')) return 'hair';
      if (serviceName.includes('facial') || serviceName.includes('face')) return 'face';
    }
    return 'extras';
  };

  // Helper function to calculate total from booking items
  const calculateBookingTotal = (booking: any): number => {
    if (booking.total) return booking.total;
    if (booking.items && booking.items.length > 0) {
      return booking.items.reduce((sum: number, item: any) =>
        sum + (item.service?.price || item.price || 0), 0
      );
    }
    return 0;
  };


  const filterBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.beautician?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.beautician?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.services.some(service =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === paymentFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.bookingType === typeFilter);
    }

    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      unpaid: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      refunded: { color: 'bg-blue-100 text-blue-800', icon: DollarSign }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getServiceIcon = (type: string) => {
    const iconConfig = {
      hair: { icon: Scissors, color: 'text-purple-600' },
      face: { icon: Palette, color: 'text-pink-600' },
      extras: { icon: Sparkles, color: 'text-blue-600' }
    };

    const config = iconConfig[type as keyof typeof iconConfig];
    const Icon = config.icon;

    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#fdf6f0] p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#4e342e]">
                  {t('bookings.title')}
                </h1>
                <p className="text-base sm:text-lg text-[#6d4c41] mt-1 sm:mt-2">
                  {t('bookings.subtitle')}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-[#6d4c41]">{t('bookings.totalBookings')}</p>
                <p className="text-xl sm:text-2xl font-bold text-[#4e342e]">{bookings.length}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 bg-white shadow-lg mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-4 h-4" />
                  <Input
                    placeholder={t('bookings.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-[#4e342e]/20 focus:border-[#4e342e] text-sm sm:text-base"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-[#4e342e]/20 focus:border-[#4e342e]">
                    <SelectValue placeholder={t('bookings.filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('bookings.allStatuses')}</SelectItem>
                    <SelectItem value="pending">{t('bookings.pending')}</SelectItem>
                    <SelectItem value="confirmed">{t('bookings.confirmed')}</SelectItem>
                    <SelectItem value="completed">{t('bookings.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('bookings.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="border-[#4e342e]/20 focus:border-[#4e342e]">
                    <SelectValue placeholder={t('bookings.filterByPayment')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('bookings.allPayments')}</SelectItem>
                    <SelectItem value="paid">{t('bookings.paid')}</SelectItem>
                    <SelectItem value="unpaid">{t('bookings.unpaid')}</SelectItem>
                    <SelectItem value="refunded">{t('bookings.refunded')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="border-[#4e342e]/20 focus:border-[#4e342e]">
                    <SelectValue placeholder="Booking Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="SALON">At Salon</SelectItem>
                    <SelectItem value="AT_HOME">At Home</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setTypeFilter('all');
                  }}
                  variant="outline"
                  className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {t('bookings.clearFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table */}
          {filteredBookings.length > 0 ? (
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl font-serif font-bold text-[#4e342e] flex items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t('bookings.bookingHistory')} ({filteredBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#4e342e]/10">
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.bookingId')}</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.service')}</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.type')}</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.beautician')}</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.dateTime')}</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.status')}</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.payment')}</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.total')}</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">{t('bookings.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((booking) => (
                        <TableRow key={booking.id} className="border-[#4e342e]/10 hover:bg-[#fdf6f0]/50">
                          <TableCell className="font-medium text-[#4e342e] text-xs sm:text-sm">
                            <span className="hidden sm:inline">{booking.bookingNumber}</span>
                            <span className="sm:hidden">{booking.bookingNumber.slice(-6)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              {getServiceIcon(booking.serviceType)}
                              <div>
                                <p className="font-medium text-[#4e342e] capitalize text-xs sm:text-sm">
                                  {booking.serviceType}
                                </p>
                                <p className="text-xs text-[#6d4c41]">
                                  {booking.services.length} {t('bookings.services')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={booking.bookingType === 'AT_HOME' ? 'border-blue-500 text-blue-700' : 'border-[#6d4c41] text-[#6d4c41]'}>
                              {booking.bookingType === 'AT_HOME' ? t('bookings.atHome') : t('bookings.salon')}
                            </Badge>
                            <div className="text-xs text-[#6d4c41] mt-1 max-w-[150px] truncate" title={booking.serviceAddress}>
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {booking.serviceAddress}
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.beautician ? (
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#6d4c41]" />
                                <div>
                                  <p className="font-medium text-[#4e342e] text-xs sm:text-sm">
                                    {booking.beautician.firstName} {booking.beautician.lastName}
                                  </p>
                                  <p className="text-xs text-[#6d4c41] hidden sm:block">
                                    {booking.beautician.skills.slice(0, 2).join(', ')}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#6d4c41] text-xs sm:text-sm">{t('bookings.notAssigned')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#6d4c41]" />
                              <div>
                                <p className="font-medium text-[#4e342e] text-xs sm:text-sm">
                                  {formatDate(booking.scheduledDate)}
                                </p>
                                <p className="text-xs text-[#6d4c41] flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {booking.scheduledTime}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="scale-75 sm:scale-100">
                              {getStatusBadge(booking.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="scale-75 sm:scale-100">
                              {getPaymentStatusBadge(booking.paymentStatus)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-[#4e342e] text-xs sm:text-sm">
                            {formatCurrency(booking.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                              onClick={() => handleViewBooking(booking)}
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">{t('bookings.view')}</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-[#6d4c41] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">
                  {t('bookings.noBookingsFound')}
                </h3>
                <p className="text-[#6d4c41] mb-6">
                  {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                    ? t('bookings.noMatchingBookings')
                    : t('bookings.noBookingsYet')
                  }
                </p>
                <Button className="bg-[#4e342e] hover:bg-[#3b2c26] text-white">
                  {t('bookings.bookService')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredBookings.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-[#4e342e] text-[#4e342e]"
              >
                Previous
              </Button>
              <span className="text-[#4e342e]">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-[#4e342e] text-[#4e342e]"
              >
                Next
              </Button>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CustomerBookingsPage;
