import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar, Clock, DollarSign, TrendingUp, User, MapPin,
  Phone, CheckCircle, AlertCircle, Home, Building,
  ArrowRight, Edit2, ShoppingBag, LogOut, Shield, Gift, Star
} from 'lucide-react';


import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

// --- Types ---
interface Booking {
  id: string;
  bookingNumber: string;
  type: string;
  category: string;
  status: string;
  paymentStatus: string;
  scheduledDate: string;
  scheduledTime: string;
  total: number;
  beautician?: {
    firstName: string;
    lastName: string;
  };
  services: Array<{ name: string }>;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  address?: {
    street: string;
    city: string;
    zipCode: string;
  };
}

const CustomerDashboard = () => {
  const { user } = useSupabaseAuth();

  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    activeCount: 0,
    completedCount: 0,
    savings: 0
  });



  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [profileRes, salonRes, athomeRes] = await Promise.all([
        api.get('/customer/profile'),
        supabase
          .from('bookings')
          .select(`*, address:addresses(*), vendor:vendor(*), booking_items(*), payments(*)`)
          .eq('customer_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('athome_bookings')
          .select(`
            *,
            beautician:beauticians!athome_bookings_assigned_beautician_id_fkey (*)
          `)
          .eq('customer_id', user?.id)
          .order('created_at', { ascending: false })
      ]);

      // 1. Process Profile
      if ((profileRes.data as any).success) {
        const p = (profileRes.data as any).data;
        const defaultAddr = p.addresses && p.addresses.length > 0 ? p.addresses[0] : null;

        setProfile({
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          avatar: p.avatar,
          address: defaultAddr ? {
            street: defaultAddr.street,
            city: defaultAddr.city,
            zipCode: defaultAddr.zipCode
          } : undefined
        });
      }

      // 2. Process Bookings (Merge Salon & At-Home)
      let allBookings: Booking[] = [];
      const salonData = salonRes.data;
      const athomeData = athomeRes.data;

      // Salon
      if (salonData) {
        const processedSalon = salonData.map((b: any) => ({
          id: b.id,
          bookingNumber: b.id.substring(0, 8).toUpperCase(),
          type: 'Salon',
          category: 'Beauty',
          status: b.status,
          paymentStatus: b.payments?.some((p: any) => p.status === 'COMPLETED') ? 'PAID' : 'UNPAID',
          scheduledDate: b.scheduled_date || new Date().toISOString(),
          scheduledTime: b.scheduled_time || 'TBD',
          total: Number(b.total) || 0,
          beautician: undefined,
          services: (b.booking_items || []).map((item: any) => ({ name: 'Salon Service' }))
        }));
        allBookings = [...allBookings, ...processedSalon];
      }

      // At-Home
      if (athomeData) {
        // Fetch services for these bookings to show correct names
        const athomeIds = athomeData.map(b => b.id);
        const { data: ahServices } = await supabase
          .from('athome_booking_services')
          .select('booking_id, master:admin_services(name)')
          .in('booking_id', athomeIds);

        const ahServicesMap: Record<string, any[]> = {};
        if (ahServices) {
          ahServices.forEach((s: any) => {
            if (!ahServicesMap[s.booking_id]) ahServicesMap[s.booking_id] = [];
            ahServicesMap[s.booking_id].push({ name: s.master?.name || 'Service' });
          });
        }

        const processedAtHome = athomeData.map((b: any) => ({
          id: b.id,
          bookingNumber: b.id.substring(0, 8).toUpperCase(),
          type: 'At-Home',
          category: 'Beauty',
          status: b.status,
          paymentStatus: b.payment_status || 'PAID', // Default to paid for at-home as per flow
          scheduledDate: b.slot || new Date().toISOString(),
          scheduledTime: b.slot ? new Date(b.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
          total: Number(b.total_price) || 0,
          beautician: b.beautician ? {
            firstName: b.beautician.name.split(' ')[0],
            lastName: b.beautician.name.split(' ').slice(1).join(' ') || ''
          } : undefined,
          services: ahServicesMap[b.id] || [{ name: 'At-Home Service' }]
        }));
        allBookings = [...allBookings, ...processedAtHome];
      }

      setBookings(allBookings);

      // Stats
      const totalSpent = allBookings
        .filter(b => b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
        .reduce((acc, curr) => acc + curr.total, 0);

      setStats({
        totalSpent,
        activeCount: allBookings.filter(b => ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'ACCEPTED'].includes(b.status)).length,
        completedCount: allBookings.filter(b => b.status === 'COMPLETED').length,
        savings: 0
      });

    } catch (error) {
      console.error('Data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  // Helper to map status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-200';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeBooking = bookings
    .filter(b => ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'PAYMENT_SUCCESS', 'ACCEPTED', 'PAID'].includes(b.status))
    .filter(b => {
      const d = new Date(b.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !isNaN(d.getTime()) && d >= today; // Show bookings from today onwards
    })
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-[#4e342e]/20 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-[#4e342e]/10 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#fffcf9] p-4 sm:p-6 lg:p-8 space-y-8">

        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#4e342e]">
              {t('dashboard.customer.hello', { name: profile?.firstName || t('dashboard.customer.valuedCustomer') })}
            </h1>
            <p className="text-[#8d6e63] mt-1">
              {t('dashboard.customer.manageAppointments')}
            </p>
          </div>
        </div>


        {/* --- MAIN DASHBOARD GRID --- */}
        {/* --- MAIN DASHBOARD CONTENT (Stacked) --- */}
        <div className="space-y-12">

          {/* 1. UPCOMING APPOINTMENT (Enhanced) */}
          <div className="w-full">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">{t('dashboard.customer.upcomingAppointment')}</h2>
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <CardContent className="p-0">
                {activeBooking ? (
                  <div className="flex flex-col md:flex-row">
                    {/* Left: Date & Status */}
                    <div className="bg-gradient-to-br from-[#4e342e] to-[#6d4c41] text-white p-8 md:w-1/3 flex flex-col justify-center items-start">
                      <div className="mb-4">
                        <p className="text-[#d7ccc8] font-medium uppercase tracking-wider text-sm mb-1">{t('dashboard.customer.date')}</p>
                        <h3 className="text-3xl font-serif font-bold">
                          {new Date(activeBooking.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </h3>
                        <p className="text-xl opacity-90">{activeBooking.scheduledTime}</p>
                      </div>

                      <div className="mt-4">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold bg-white/20 backdrop-blur-sm border border-white/10 w-fit`}>
                          {activeBooking.status}
                        </div>
                      </div>
                    </div>

                    {/* Right: Details & Actions */}
                    <div className="p-8 md:w-2/3 flex flex-col justify-between">
                      <div className="mb-6">
                        <h4 className="text-2xl font-serif font-bold text-[#4e342e] mb-2">
                          {activeBooking.services[0]?.name || 'Beauty Service'}
                        </h4>
                        <div className="flex items-center gap-2 text-[#8d6e63] mb-4">
                          {activeBooking.type === 'At-Home' ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                          <span className="font-medium">{activeBooking.type} Service</span>
                        </div>

                        {activeBooking.beautician ? (
                          <div className="flex items-center gap-3 bg-[#fdf6f0] p-3 rounded-lg w-fit border border-[#efebe9]">
                            <div className="w-10 h-10 rounded-full bg-[#d7ccc8] flex items-center justify-center text-[#4e342e] font-bold">
                              {activeBooking.beautician.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs text-[#8d6e63] font-medium uppercase">{t('dashboard.customer.yourExpert')}</p>
                              <p className="font-bold text-[#4e342e]">{activeBooking.beautician.firstName} {activeBooking.beautician.lastName}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[#8d6e63] text-sm italic bg-gray-50 p-2 rounded w-fit">
                            <Clock className="w-4 h-4" />
                            {t('dashboard.customer.expertAssignedShortly')}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 mt-auto">
                        <Button
                          className="bg-[#4e342e] hover:bg-[#3b2c26] text-white px-8 h-10 text-sm shadow-sm"
                          onClick={() => navigate(`/customer/athome-bookings/${activeBooking.id}`)}
                        >
                          {t('dashboard.customer.viewDetails')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center bg-[#fffcf9] border-2 border-dashed border-[#efebe9]">
                    <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center mx-auto mb-4 text-[#8d6e63]">
                      <Calendar className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-[#4e342e] mb-2 font-serif">{t('dashboard.customer.noUpcomingAppointments')}</h3>
                    <p className="text-[#8d6e63] mb-8 max-w-md mx-auto">{t('dashboard.customer.scheduleClear')}</p>
                    <Button
                      className="bg-[#4e342e] hover:bg-[#3b2c26] text-white px-8 h-12 text-base shadow-md"
                      onClick={() => navigate('/customer/at-home-services')}
                    >
                      {t('dashboard.customer.bookAtHomeService')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 2. QUICK ACTIONS */}
          <div className="w-full">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6">{t('dashboard.customer.quickActions')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Book At-Home */}
              <Card
                className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer bg-white group h-40 flex items-center justify-center transform hover:-translate-y-1"
                onClick={() => navigate('/customer/at-home-services')}
              >
                <CardContent className="p-0 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#fff8e1] flex items-center justify-center text-[#ff8f00] group-hover:bg-[#ff8f00] group-hover:text-white transition-all duration-300">
                    <Home className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-[#4e342e] font-serif tracking-wide">{t('dashboard.customer.atHomeService')}</span>
                </CardContent>
              </Card>

              {/* Book Salon */}
              <Card
                className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer bg-white group h-40 flex items-center justify-center transform hover:-translate-y-1"
                onClick={() => navigate('/salon-visit')}
              >
                <CardContent className="p-0 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#f3e5f5] flex items-center justify-center text-[#8e24aa] group-hover:bg-[#8e24aa] group-hover:text-white transition-all duration-300">
                    <Building className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-[#4e342e] font-serif tracking-wide">{t('dashboard.customer.salonVisit')}</span>
                </CardContent>
              </Card>

              {/* My Bookings */}
              <Card
                className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer bg-white group h-40 flex items-center justify-center transform hover:-translate-y-1"
                onClick={() => navigate('/customer/bookings')}
              >
                <CardContent className="p-0 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#e1f5fe] flex items-center justify-center text-[#0288d1] group-hover:bg-[#0288d1] group-hover:text-white transition-all duration-300">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-[#4e342e] font-serif tracking-wide">{t('dashboard.customer.myHistory')}</span>
                </CardContent>
              </Card>

              {/* Edit Profile */}
              <Card
                className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer bg-white group h-40 flex items-center justify-center transform hover:-translate-y-1"
                onClick={() => navigate('/customer/profile')}
              >
                <CardContent className="p-0 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#e0f2f1] flex items-center justify-center text-[#00897b] group-hover:bg-[#00897b] group-hover:text-white transition-all duration-300">
                    <Edit2 className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-[#4e342e] font-serif tracking-wide">{t('dashboard.customer.editProfile')}</span>
                </CardContent>
              </Card>
            </div>
          </div>


          {/* 3. RECENT BEAUTY JOURNEY */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-bold text-[#4e342e]">{t('dashboard.customer.recentBeautyJourney')}</h3>
              <Button variant="link" className="text-[#8d6e63] hover:text-[#4e342e] font-medium" onClick={() => navigate('/customer/bookings')}>
                {t('dashboard.customer.viewAllHistory')} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.slice(0, 3).map((booking) => (
                  <Card key={booking.id} className="bg-white border-none shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="secondary" className={`${getStatusColor(booking.status)} px-3 py-1 font-medium`}>
                          {booking.status}
                        </Badge>
                        <span className="text-sm font-medium text-[#8d6e63]">{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-lg text-[#4e342e] mb-1 font-serif">{booking.services[0]?.name || 'Beauty Service'}</h4>
                      <div className="flex items-center gap-2 text-sm text-[#8d6e63] mb-6">
                        {booking.type === 'At-Home' ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                        {booking.type} Service
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="w-full text-xs font-medium border-[#d7ccc8] text-[#6d4c41]"
                          onClick={() => navigate(`/customer/athome-bookings/${booking.id}`)}
                        >
                          {t('dashboard.customer.details')}
                        </Button>
                        {booking.status === 'COMPLETED' && (
                          <Button
                            className="w-full bg-[#4e342e] text-white hover:bg-[#3b2c26] text-xs font-medium"
                            onClick={() => navigate('/customer/at-home-services', { state: { rebook: booking } })}
                          >
                            {t('dashboard.customer.rebook')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#d7ccc8]">
                <p className="text-[#8d6e63]">{t('dashboard.customer.noHistoryYet')}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout >
  );
};

export default CustomerDashboard;



