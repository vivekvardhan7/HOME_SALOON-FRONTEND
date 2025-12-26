import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { api } from "@/lib/api";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  Plus,
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  Scissors,
  Bell,
  Settings,
  BarChart3,
  Star,
  MapPin,
  Users,
  Activity,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface VendorStats {
  newBookings: number;
  completedServices: number;
  monthlyRevenue: number;
  totalServices: number;
  pendingBookings: number;
  totalCustomers: number;
  averageRating: number;
  totalReviews: number;
}

interface Appointment {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  total: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Array<{
    service: {
      name: string;
    };
  }>;
  address: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  isActive: boolean;
}

const VendorDashboard = () => {
  const { user, vendor, isLoading: authLoading } = useSupabaseAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    // Check if vendor is approved
    // If no vendor record exists (null) OR status is not APPROVED, redirect
    if (user?.role === 'VENDOR' && (!vendor || vendor.status !== 'APPROVED')) {
      navigate('/vendor/pending-approval');
      return;
    }

    if (user?.role === 'VENDOR') {
      fetchDashboardData();
    }
  }, [user, vendor, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Ensure we have necessary IDs
      if (!user?.id) return;

      // Parallel fetch for optimal performance
      const [statsRes, profileRes, appointmentsRes, servicesRes, financialsRes] = await Promise.all([
        vendor?.id
          ? api.get(`/dashboard/vendor/stats?vendorId=${vendor.id}`).catch(() => ({ data: {} }))
          : Promise.resolve({ data: {} }),

        api.get(`/vendor/${user.id}/profile`).catch(() => ({ data: {} })),

        api.get(`/vendor/${user.id}/appointments?limit=5`).catch(() => ({ data: { appointments: [] } })),

        api.get(`/vendor/${user.id}/services`).catch(() => ({ data: { services: [] } })),

        api.get(`/vendor/${user.id}/financial-stats`).catch(() => ({ data: { data: null } }))
      ]);

      const statsData = (statsRes.data || {}) as any;
      const profileData = (profileRes.data || {}) as any;
      const finData = (financialsRes.data as any).data;

      // Aggregate stats from multiple sources
      const combinedStats: VendorStats = {
        newBookings: statsData.newBookings || 0,
        completedServices: statsData.completedServices || 0,
        monthlyRevenue: statsData.monthlyRevenue || 0,
        totalServices: statsData.totalServices || (servicesRes.data as any)?.services?.length || 0,
        pendingBookings: statsData.newBookings || 0,
        totalCustomers: profileData.stats?.totalBookings || 0,
        averageRating: profileData.stats?.averageRating || 0,
        totalReviews: profileData.stats?.totalReviews || 0
      };

      setStats(combinedStats);
      setRecentAppointments((appointmentsRes.data as any)?.appointments || []);
      setServices(((servicesRes.data as any)?.services || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        category: s.category || 'Other',
        isActive: s.isActive ?? true
      })));
      setFinancials(finData);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      // ... error handling ...
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hair': return <Scissors className="w-4 h-4" />;
      case 'face': return <User className="w-4 h-4" />;
      case 'nail': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#4e342e] mx-auto mb-4" />
              <p className="text-[#6d4c41]">{t('common.loading')}...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">
            {t('vendor.dashboard.title', { name: user?.firstName })}
          </h1>
          <p className="text-[#6d4c41]">
            {t('vendor.dashboard.subtitle')}
          </p>
        </div>

        {/* Financial Overview Card */}
        {financials && (
          <Card className="mb-8 border-0 bg-white shadow-lg border-l-4 border-l-[#4e342e]">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#4e342e]">Financial Overview</h2>
                  <p className="text-sm text-[#6d4c41]">Monthly Subscription & Payouts</p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <p className="text-xs text-[#6d4c41] uppercase tracking-wider">Subscription Status</p>
                    <Badge className={financials.subscription.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {financials.subscription.status === 'PAID' ? 'ACTIVE' : 'UNPAID'}
                    </Badge>
                    {financials.subscription.status !== 'PAID' && (
                      <p className="text-xs text-red-500 mt-1">Due: {new Date(financials.subscription.dueDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                  <div className="text-right">
                    <p className="text-xs text-[#6d4c41] uppercase tracking-wider">Received This Month</p>
                    <p className="text-xl font-bold text-[#4e342e]">${Number(financials.income?.this_month || 0).toFixed(2)}</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                  <div className="text-right">
                    <p className="text-xs text-[#6d4c41] uppercase tracking-wider">Pending Payout</p>
                    <p className="text-xl font-bold text-orange-600">${Number(financials.income?.pending_balance || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6d4c41] mb-1">{t('vendor.stats.newBookings')}</p>
                  <p className="text-2xl font-bold text-[#4e342e]">{stats?.newBookings || 0}</p>
                  <div className="flex items-center mt-2">
                    <Bell className="w-4 h-4 text-[#6d4c41] mr-1" />
                    <span className="text-sm text-[#6d4c41]">{stats?.pendingBookings || 0} {t('vendor.stats.pending')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6d4c41] mb-1">{t('vendor.stats.completedServices')}</p>
                  <p className="text-2xl font-bold text-[#4e342e]">{stats?.completedServices || 0}</p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-[#6d4c41] mr-1" />
                    <span className="text-sm text-[#6d4c41]">{t('vendor.stats.thisMonth')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6d4c41] mb-1">{t('vendor.stats.monthlyRevenue')}</p>
                  <p className="text-2xl font-bold text-[#4e342e]">${stats?.monthlyRevenue || 0}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-[#6d4c41] mr-1" />
                    <span className="text-sm text-[#6d4c41]">+12.5% {t('vendor.stats.revenueGrowth')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6d4c41] mb-1">{t('vendor.stats.totalCustomers')}</p>
                  <p className="text-2xl font-bold text-[#4e342e]">{stats?.totalCustomers || 0}</p>
                  <div className="flex items-center mt-2">
                    <Star className="w-4 h-4 text-[#6d4c41] mr-1" />
                    <span className="text-sm text-[#6d4c41]">{stats?.averageRating || 0} {t('vendor.stats.avgRating')}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#4e342e] flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {t('vendor.recentAppointments.title')}
                </CardTitle>
                <Link to="/vendor/appointments">
                  <Button variant="outline" size="sm" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                    {t('vendor.recentAppointments.viewAll')}
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAppointments.length > 0 ? (
                    recentAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 bg-[#f8d7da]/10 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#4e342e]">
                              {appointment.customer.firstName} {appointment.customer.lastName}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-[#6d4c41]">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(appointment.scheduledDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{appointment.scheduledTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>${appointment.total}</span>
                              </div>
                            </div>
                            <div className="text-xs text-[#6d4c41] mt-1">
                              {appointment.items
                                .map((item: any) => item.service?.name || item.catalogService?.name || 'Service')
                                .join(', ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={`px-3 py-1 ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-[#6d4c41] mx-auto mb-4" />
                      <p className="text-[#6d4c41]">{t('vendor.recentAppointments.noAppointments')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Services */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#4e342e]">{t('vendor.quickActions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/vendor/services" className="block">
                  <Button className="w-full bg-[#4e342e] hover:bg-[#6d4c41] text-white justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('vendor.quickActions.addService')}
                  </Button>
                </Link>
                <Link to="/vendor/profile" className="block">
                  <Button variant="outline" className="w-full border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('vendor.quickActions.profileSettings')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Services Overview */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#4e342e]">{t('vendor.services.title')}</CardTitle>
                <Link to="/vendor/services">
                  <Button variant="outline" size="sm" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                    {t('vendor.services.manage')}
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {services.slice(0, 4).map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-[#f8d7da]/10 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                          {getCategoryIcon(service.category)}
                        </div>
                        <div>
                          <p className="font-medium text-[#4e342e] text-sm">{service.name}</p>
                          <p className="text-xs text-[#6d4c41]">${service.price}</p>
                        </div>
                      </div>
                      <Badge className={`px-2 py-1 text-xs ${service.isActive
                        ? 'bg-[#f8d7da]/30 text-[#4e342e]'
                        : 'bg-[#6d4c41]/20 text-[#6d4c41]'
                        }`}>
                        {service.isActive ? t('vendor.services.active') : t('vendor.services.inactive')}
                      </Badge>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="text-center py-4">
                      <Package className="w-8 h-8 text-[#6d4c41] mx-auto mb-2" />
                      <p className="text-sm text-[#6d4c41]">{t('vendor.services.noServices')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Business Stats */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#4e342e]">{t('vendor.businessOverview.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6d4c41]">{t('vendor.businessOverview.totalServices')}</span>
                    <span className="font-semibold text-[#4e342e]">{stats?.totalServices || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6d4c41]">{t('vendor.businessOverview.activeServices')}</span>
                    <span className="font-semibold text-[#4e342e]">{services.filter(s => s.isActive).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6d4c41]">{t('vendor.businessOverview.customerRating')}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-[#6d4c41] fill-current" />
                      <span className="font-semibold text-[#4e342e]">{stats?.averageRating || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6d4c41]">{t('vendor.businessOverview.totalReviews')}</span>
                    <span className="font-semibold text-[#4e342e]">{stats?.totalReviews || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;
