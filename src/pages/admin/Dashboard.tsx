import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi'; // Static import for better stability
import DashboardLayout from '@/components/DashboardLayout';
import {
  Users,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  Smartphone,
  ShoppingBag,
  Activity,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Scissors,
  Home,
  RefreshCw,
  Wallet,
  PieChart,
  UserCheck,
  UserX,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';


// Interface Definitions
interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalManagers: number;
  pendingApprovals: number;
  atHomeBookings: number;
  salonBookings: number;
  activeUsers: number;
  activeVendors: number;
  pendingVendors: number;
  activeCatalogServices: number;
  activeCatalogProducts: number;
}

interface FinanceBreakdown {
  gross: number;
  commission: number;
  net_payable: number;
  paid: number;
  pending: number;
  subscriptions?: number;
}

interface FinancialSummary {
  month: string;
  revenue: {
    gross: number;
    commission: number;
    subscriptions: number;
  };
  breakdown: {
    vendor: FinanceBreakdown;
    beautician: FinanceBreakdown;
  };
}

const AdminDashboard = () => {
  const { user } = useSupabaseAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [finance, setFinance] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching admin dashboard data...');

      // Parallel Fetching
      const [dashboardRes, financeRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.get<any>('/admin/finance/summary?month=lifetime') // Fetch LIFETIME data
      ]);

      // Handle Dashboard Stats
      if (dashboardRes.success && dashboardRes.data) {
        const d = dashboardRes.data.stats;
        setStats({
          totalUsers: d.totalUsers || 0,
          totalVendors: d.totalVendors || 0,
          totalManagers: d.totalManagers || 0,
          pendingApprovals: d.pendingApprovals || 0,
          atHomeBookings: d.atHomeBookings || 0,
          salonBookings: d.salonBookings || 0,
          activeUsers: d.activeUsers || 0,
          activeVendors: d.activeVendors || 0,
          pendingVendors: d.pendingVendors || 0,
          activeCatalogServices: d.activeCatalogServices || 0,
          activeCatalogProducts: d.activeCatalogProducts || 0
        });
        setPendingVendors(dashboardRes.data.pendingVendors || []);
      }

      // Handle Financial Stats
      if (financeRes.success && financeRes.data) {
        setFinance(financeRes.data);
      }

    } catch (error: any) {
      console.error('❌ Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#fdf6f0]">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#4e342e] mb-4" />
            <p className="text-[#6d4c41] font-medium">Loading Platform Overview...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#fdf6f0]/50 pb-12">
        <div className="container mx-auto px-4 py-8 space-y-8">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold text-[#4e342e] mb-2">
                Admin Dashboard
              </h1>
              <p className="text-[#6d4c41] text-lg">
                Welcome back, {user?.firstName}. Here is your platform overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-[#4e342e]">Current Period</p>
                <p className="text-xs text-[#6d4c41]">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <Button
                onClick={fetchAllData}
                variant="outline"
                className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={stats?.totalUsers || 0}
              subValue={`${stats?.activeUsers} Active`}
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Total Vendors"
              value={stats?.totalVendors || 0}
              subValue={`${stats?.pendingVendors} Pending`}
              icon={Building}
              color="orange"
            />
            <StatCard
              label="Pending Approvals"
              value={stats?.pendingApprovals || 0}
              subValue="Requires Action"
              icon={AlertCircle}
              color="red"
              highlight={((stats?.pendingApprovals ?? 0) > 0)}
            />
            <StatCard
              label="Total Services"
              value={stats?.activeCatalogServices || 0}
              subValue={`${stats?.activeCatalogProducts} Products`}
              icon={ShoppingBag}
              color="emerald"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Financial Overview (At-Home) */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Home className="w-5 h-5 text-orange-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4e342e]">At-Home Finance</h2>
                    <p className="text-xs text-gray-500">Lifetime Overview</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <TrendingUp className="w-3 h-3 mr-1" /> Live
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gross Revenue</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{formatCurrency(finance?.breakdown?.beautician?.gross || 0)}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Commission</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(finance?.breakdown?.beautician?.commission || 0)}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pending Payouts</p>
                    <p className="text-lg font-bold text-orange-700">{formatCurrency(finance?.breakdown?.beautician?.pending || 0)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Financial Overview (At-Salon) */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Scissors className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4e342e]">Salon Finance</h2>
                    <p className="text-xs text-gray-500">Lifetime Overview</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <TrendingUp className="w-3 h-3 mr-1" /> Live
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gross Revenue</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{formatCurrency(finance?.breakdown?.vendor?.gross || 0)}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Commission</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(finance?.breakdown?.vendor?.commission || 0)}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pending Payouts</p>
                    <p className="text-lg font-bold text-orange-700">{formatCurrency(finance?.breakdown?.vendor?.pending || 0)}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Live Monitors & Catalog */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Live Monitors */}
            <Card className="border-0 shadow-lg overflow-hidden bg-white">
              <CardHeader className="bg-[#fcfcfc] border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-bold text-[#4e342e] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-500" />
                  Live Activity Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid gap-4">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 hover:shadow-md transition-all cursor-pointer group" onClick={() => window.location.href = '/admin/at-home-bookings'}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Home className="w-5 h-5 text-orange-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#4e342e]">At-Home Bookings</p>
                        <p className="text-xs text-orange-700 font-medium">View Live Dashboard</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#4e342e]">{stats?.atHomeBookings}</p>
                      <p className="text-xs text-[#6d4c41]">Lifetime</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-orange-300 group-hover:text-orange-600 transition-colors" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 hover:shadow-md transition-all cursor-pointer group" onClick={() => window.location.href = '/admin/at-salon-services'}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Scissors className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#4e342e]">Salon Bookings</p>
                        <p className="text-xs text-purple-700 font-medium">View Live Dashboard</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#4e342e]">{stats?.salonBookings}</p>
                      <p className="text-xs text-[#6d4c41]">Lifetime</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-300 group-hover:text-purple-600 transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Catalog Management Shortcuts */}
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-[#4e342e] to-[#2c1b18] text-white">
              <CardHeader className="pb-2 border-white/10 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-200" />
                  Catalog Management
                </CardTitle>
                <CardDescription className="text-orange-100/70">
                  Manage services and products offered on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-2 gap-4">
                <Link to="/admin/at-home-services">
                  <div className="bg-white/10 hover:bg-white/20 transition-all p-4 rounded-xl text-center border border-white/5 cursor-pointer">
                    <Scissors className="w-8 h-8 mx-auto mb-2 text-orange-200" />
                    <p className="font-bold text-lg">{stats?.activeCatalogServices}</p>
                    <p className="text-xs text-orange-100/70 uppercase tracking-widest">Services</p>
                  </div>
                </Link>
                <Link to="/admin/at-home-products">
                  <div className="bg-white/10 hover:bg-white/20 transition-all p-4 rounded-xl text-center border border-white/5 cursor-pointer">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-orange-200" />
                    <p className="font-bold text-lg">{stats?.activeCatalogProducts}</p>
                    <p className="text-xs text-orange-100/70 uppercase tracking-widest">Products</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Pending Action Items */}
          {pendingVendors.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#4e342e]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Pending Vendor Approvals
                  </div>
                  <Link to="/admin/vendors?status=PENDING">
                    <Button variant="ghost" size="sm" className="text-sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {pendingVendors.map((vendor) => (
                    <div key={vendor.id} className="p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-700">
                          {vendor.shopname?.charAt(0) || 'V'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#4e342e]">{vendor.shopname}</p>
                          <p className="text-xs text-gray-500">{vendor.user?.email}</p>
                        </div>
                      </div>
                      <Link to={`/admin/vendors`}>
                        <Button size="sm" variant="outline">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
};

// Sub-components for cleaner code
const StatCard = ({ label, value, subValue, icon: Icon, color, highlight }: any) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }[color as string] || "bg-gray-50 text-gray-600";

  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-all ${highlight ? 'ring-2 ring-red-100' : ''}`}>
      <CardContent className="p-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <div className="text-3xl font-bold text-[#4e342e] mb-1">{value}</div>
          <p className="text-xs text-gray-400 font-medium">{subValue}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorStyles}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
};

const FinanceCard = ({ title, amount, subtitle, color, isPrimary }: any) => {
  const borderColors = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    orange: "border-l-orange-500",
    purple: "border-l-purple-500",
  }[color as string];

  const textColors = {
    blue: "text-blue-700",
    green: "text-green-700",
    orange: "text-orange-700",
    purple: "text-purple-700",
  }[color as string];

  return (
    <Card className={`border-0 bg-white shadow-lg rounded-xl overflow-hidden border-l-4 ${borderColors} ${isPrimary ? 'ring-1 ring-black/5 scan-lines' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
            <h3 className={`text-3xl font-extrabold mt-2 ${textColors}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(amount)}
            </h3>
          </div>
          <div className={`p-2 rounded-full bg-${color}-50`}>
            <DollarSign className={`w-5 h-5 text-${color}-500`} />
          </div>
        </div>
        <div className="pt-4 border-t border-gray-50">
          <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
