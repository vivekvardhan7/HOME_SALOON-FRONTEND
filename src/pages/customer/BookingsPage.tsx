import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
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

  const handleViewBooking = (booking: Booking) => {
    if (booking.bookingType === 'AT_HOME') {
      navigate(`/customer/athome-bookings/${booking.id}`);
    } else {
      toast.info(t('bookings.salonBookingUnavailable'));
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
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);

      if (!user?.id) return;

      const userId = user.id;

      // 1. Fetch SALON bookings
      // 1. Fetch SALON bookings
      const { data: salonData } = await supabase
        .from('bookings')
        .select(`*, address:addresses(*), vendor:vendor(*), booking_items(*), payments(*)`)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      // 2. Fetch AT-HOME bookings
      const { data: athomeData } = await supabase
        .from('athome_bookings')
        .select(`
            *,
            beautician:beauticians!athome_bookings_assigned_beautician_id_fkey (*)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      let allBookings: Booking[] = [];

      // Process Salon Bookings
      if (salonData) {
        const bookingItemIds = salonData.flatMap((b: any) => (b.booking_items || []).map((item: any) => item.service_id)).filter(Boolean);
        let servicesMap: Record<string, any> = {};
        if (bookingItemIds.length > 0) {
          const { data: sData } = await supabase.from('services').select('id, name, price, duration').in('id', [...new Set(bookingItemIds)]);
          if (sData) sData.forEach((s: any) => servicesMap[s.id] = s);
        }

        const processedSalon = salonData.map((b: any) => {
          const services = (b.booking_items || []).map((item: any) => ({
            id: item.service_id,
            name: servicesMap[item.service_id]?.name || 'Service',
            price: item.price,
            duration: servicesMap[item.service_id]?.duration || 60
          }));
          return {
            id: b.id,
            bookingNumber: b.id.substring(0, 8).toUpperCase(),
            status: mapBookingStatus(b.status),
            paymentStatus: mapPaymentStatus(b.payments?.some((p: any) => p.status === 'COMPLETED') ? 'PAID' : 'UNPAID'),
            scheduledDate: b.scheduled_date,
            scheduledTime: b.scheduled_time,
            total: parseFloat(b.total),
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
    if (booking.items && booking.items.length > 0) {
      const serviceName = booking.items[0]?.service?.name?.toLowerCase() || '';
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
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
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
                      {filteredBookings.map((booking) => (
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerBookingsPage;
