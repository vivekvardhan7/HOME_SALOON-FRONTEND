import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  MapPin,
  Loader2,
  Building,
  Phone,
  Mail,
  User,
  X,
  Home
} from 'lucide-react';
import { toast } from 'sonner';

interface VendorStats {
  pending: number;
  approved: number;
  total: number;
  rejected: number;
}

interface AppointmentStats {
  total: number;
  completed: number;
}

interface PendingVendor {
  id: string;
  shopName: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  email?: string | null;
  phone?: string | null;
  ownerName?: string;
  serviceCount?: number;
  productCount?: number;
  employeeCount?: number;
  status: string;
  createdAt: string;
}

interface RecentAppointment {
  id: string;
  customerName: string;
  vendorName: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
}

const ManagerDashboard = () => {
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const [vendorStats, setVendorStats] = useState<VendorStats>({
    pending: 0,
    approved: 0,
    total: 0,
    rejected: 0,
  });
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    total: 0,
    completed: 0,
  });
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingVendorId, setProcessingVendorId] = useState<string | null>(null);

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      setLoading(true);

      // Import managerApi dynamically to avoid circular dependencies
      const { managerApi } = await import('@/lib/managerApi');

      console.log('📡 [Dashboard Component] Fetching manager dashboard data...');
      const result = await managerApi.getDashboard();

      console.log('📡 [Dashboard Component] Received result:', result);

      if (!result.success) {
        console.error('❌ [Dashboard Component] API returned error:', result.message);
        throw new Error(result.message || 'Failed to load dashboard data');
      }

      if (!result.data) {
        console.error('❌ [Dashboard Component] No data in result:', result);
        throw new Error('No data received from API');
      }

      console.log('✅ [Dashboard Component] Data received successfully:', result.data);

      const payload = (result.data as any)?.data ?? result.data;
      const {
        vendorStats = {},
        appointmentStats = {},
        pendingVendors = [],
        recentAppointments = [],
      } = payload || {};

      setVendorStats({
        pending: vendorStats?.pending ?? 0,
        approved: vendorStats?.approved ?? 0,
        total: vendorStats?.total ?? 0,
        rejected: vendorStats?.rejected ?? 0,
      });

      setAppointmentStats({
        total: appointmentStats?.total ?? 0,
        completed: appointmentStats?.completed ?? 0,
      });

      setPendingVendors(
        Array.isArray(pendingVendors)
          ? pendingVendors.map((vendor) => ({
            ...vendor,
            createdAt: vendor.createdAt || new Date().toISOString(),
          }))
          : []
      );
      setRecentAppointments(
        Array.isArray(recentAppointments)
          ? recentAppointments.map((appointment) => ({
            ...appointment,
            scheduledDate: appointment.scheduledDate || new Date().toISOString(),
            scheduledTime: appointment.scheduledTime || '',
          }))
          : []
      );

      toast.success('Dashboard data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading manager data:', error);
      console.error('Error details:', error.message);
      toast.error(
        error.message || 'Failed to load manager dashboard data. Please ensure the backend server is running on port 3001.',
        { duration: 5000 }
      );

      setVendorStats({ pending: 0, approved: 0, total: 0, rejected: 0 });
      setAppointmentStats({ total: 0, completed: 0 });
      setPendingVendors([]);
      setRecentAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorAction = async (vendorId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingVendorId(vendorId);
      // Import managerApi dynamically
      const { managerApi } = await import('@/lib/managerApi');

      console.log(`📡 ${action === 'approve' ? 'Approving' : 'Rejecting'} vendor ${vendorId}...`);

      let result;
      if (action === 'approve') {
        result = await managerApi.approveVendor(vendorId);
      } else {
        result = await managerApi.rejectVendor(vendorId, '');
      }

      if (!result.success) {
        throw new Error(result.message || `Failed to ${action} vendor`);
      }

      toast.success(`Vendor ${action}d successfully! Email notification sent.`, {
        description: action === 'approve'
          ? 'The vendor can now access their dashboard.'
          : 'Rejection email sent to vendor.'
      });

      await fetchManagerData(); // Refresh data
    } catch (error: any) {
      console.error(`❌ Error ${action}ing vendor:`, error);
      toast.error(error.message || `Failed to ${action} vendor. Please try again.`);
    } finally {
      setProcessingVendorId(null);
    }
  };



  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t('common.loading')}...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e]">
                {t('manager.dashboard.title')}
              </h1>
              <p className="text-[#6d4c41] mt-2">
                {t('manager.dashboard.welcome', { name: user?.firstName })}
              </p>
            </div>
            <Button onClick={fetchManagerData} disabled={loading}>{t('manager.dashboard.refresh')}</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6d4c41]">{t('manager.stats.pending_vendors')}</p>
                  <p className="text-2xl font-bold text-[#4e342e]">{vendorStats.pending}</p>
                  <p className="text-xs text-[#6d4c41] mt-1">{t('manager.stats.requires_approval')}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6d4c41]">{t('manager.stats.active_vendors')}</p>
                  <p className="text-2xl font-bold text-green-600">{vendorStats.approved}</p>
                  <p className="text-xs text-[#6d4c41] mt-1">{t('manager.stats.out_of_total', { total: vendorStats.total })}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6d4c41]">{t('manager.stats.total_appointments')}</p>
                  <p className="text-2xl font-bold text-blue-600">{appointmentStats.total}</p>
                  <p className="text-xs text-[#6d4c41] mt-1">{t('manager.stats.completed', { count: appointmentStats.completed })}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6d4c41]">{t('manager.stats.rejected_vendors')}</p>
                  <p className="text-2xl font-bold text-red-600">{vendorStats.rejected}</p>
                  <p className="text-xs text-[#6d4c41] mt-1">{t('manager.stats.not_approved')}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Vendor Applications */}
          <Card className="border-0 bg-white shadow-lg h-full">
            <CardHeader>
              <CardTitle className="text-xl font-serif font-bold text-[#4e342e] flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                {t('manager.pending_vendors.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingVendors.length > 0 ? (
                  pendingVendors
                    .slice(0, 3)
                    .map((vendor) => (
                      <div key={vendor.id} className="p-4 border border-[#f8d7da] rounded-lg bg-[#fdf6f0]">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-[#4e342e]">{vendor.shopName}</h4>
                            {vendor.ownerName && (
                              <p className="text-sm text-[#6d4c41]">{vendor.ownerName}</p>
                            )}
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {vendor.status?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-[#6d4c41] mb-3">
                          {vendor.description && (
                            <p className="text-sm text-[#6d4c41] mb-2">{vendor.description}</p>
                          )}
                          {(vendor.address || vendor.city || vendor.state || vendor.zipCode) && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{[vendor.address, vendor.city, vendor.state, vendor.zipCode].filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                          {vendor.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{vendor.email}</span>
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                          {(vendor.serviceCount !== undefined || vendor.productCount !== undefined || vendor.employeeCount !== undefined) && (
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#d7ccc8]">
                              {vendor.serviceCount !== undefined && (
                                <div className="text-xs">
                                  <span className="font-semibold text-[#4e342e]">{vendor.serviceCount}</span> {t('manager.pending_vendors.services')}
                                </div>
                              )}
                              {vendor.productCount !== undefined && (
                                <div className="text-xs">
                                  <span className="font-semibold text-[#4e342e]">{vendor.productCount}</span> {t('manager.pending_vendors.products')}
                                </div>
                              )}
                              {vendor.employeeCount !== undefined && (
                                <div className="text-xs">
                                  <span className="font-semibold text-[#4e342e]">{vendor.employeeCount}</span> {t('manager.pending_vendors.employees')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleVendorAction(vendor.id, 'approve')}
                            disabled={processingVendorId === vendor.id}
                          >
                            {processingVendorId === vendor.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {t('manager.actions.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            onClick={() => handleVendorAction(vendor.id, 'reject')}
                            disabled={processingVendorId === vendor.id}
                          >
                            {processingVendorId === vendor.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <X className="w-3 h-3 mr-1" />
                            )}
                            {t('manager.actions.reject')}
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-[#6d4c41] mx-auto mb-4" />
                    <p className="text-[#6d4c41]">{t('manager.pending_vendors.no_applications')}</p>
                  </div>
                )}
              </div>
              {pendingVendors.length > 3 && (
                <div className="mt-4 flex justify-end">
                  <Link to="/manager/pending-vendors">
                    <Button variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                      {t('manager.pending_vendors.view_more', { count: pendingVendors.length - 3 })}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 bg-white shadow-lg h-full">
            <CardHeader>
              <CardTitle className="text-xl font-serif font-bold text-[#4e342e]">
                {t('manager.quick_actions.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/manager/pending-vendors">
                  <Button className="bg-[#4e342e] hover:bg-[#3b2c26] text-white justify-start h-auto p-4 w-full">
                    <div className="text-left">
                      <AlertCircle className="w-5 h-5 mb-2" />
                      <div className="font-semibold">{t('manager.quick_actions.pending_vendors')}</div>
                      <div className="text-xs opacity-80">{t('manager.quick_actions.review_applications')}</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/manager/vendors">
                  <Button variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white justify-start h-auto p-4 w-full">
                    <div className="text-left">
                      <Building className="w-5 h-5 mb-2" />
                      <div className="font-semibold">{t('manager.quick_actions.all_vendors')}</div>
                      <div className="text-xs opacity-80">{t('manager.quick_actions.manage_vendors')}</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
