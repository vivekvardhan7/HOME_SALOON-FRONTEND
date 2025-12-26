import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  X,
  Search,
  Filter,
  Eye,
  User,
  Clock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PendingVendor {
  id: string;
  shopname: string;
  description: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  yearsInBusiness: number;
  numberOfEmployees: number;
  servicesOffered: string[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  status: string;
}

const PendingVendorsPage = () => {
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<PendingVendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [vendorToReject, setVendorToReject] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { t } = useTranslation();

  const businessTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'salon', label: 'Beauty Salon' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'beauty_center', label: 'Beauty Center' },
    { value: 'nail_salon', label: 'Nail Salon' },
    { value: 'barbershop', label: 'Barbershop' }
  ];

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const fetchPendingVendors = async () => {
    try {
      setLoading(true);

      // Import managerApi dynamically
      const { managerApi } = await import('@/lib/managerApi');

      console.log('📡 Fetching pending vendors...');
      const result = await managerApi.getPendingVendors();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load pending vendors');
      }

      const data = result.data;
      console.log('✅ Fetched pending vendors:', data?.vendors?.length || 0);

      // Transform the backend data to match the frontend interface
      const transformedVendors = (data?.vendors || []).map((vendor: any) => ({
        id: vendor.id,
        shopname: vendor.shopName,
        description: vendor.description || '',
        businessType: 'salon', // Default since schema doesn't have this field
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        zipCode: vendor.zipCode || '',
        yearsInBusiness: 0, // Not in schema
        numberOfEmployees: vendor.employeeCount || 0,
        servicesOffered: (vendor.services || []).map((s: any) => s.name),
        user: {
          firstName: vendor.user?.firstName || '',
          lastName: vendor.user?.lastName || '',
          email: vendor.user?.email || '',
          phone: vendor.user?.phone || ''
        },
        createdAt: vendor.createdAt,
        status: vendor.status,
        serviceCount: vendor.serviceCount || 0,
        productCount: vendor.productCount || 0,
        employeeCount: vendor.employeeCount || 0
      }));

      setPendingVendors(transformedVendors);
      toast.success(
        t('manager.pending.loadSuccess', { count: transformedVendors.length })
      );
    } catch (error: any) {
      console.error('❌ Error fetching pending vendors:', error);
      toast.error(
        error.message || t('manager.pending.loadError'),
        { duration: 5000 }
      );
      setPendingVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorAction = async (vendorId: string, action: 'approve' | 'reject') => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // Import managerApi dynamically
      const { managerApi } = await import('@/lib/managerApi');

      console.log(`📡 ${action === 'approve' ? 'Approving' : 'Rejecting'} vendor ${vendorId}...`);

      let result;
      if (action === 'approve') {
        result = await managerApi.approveVendor(vendorId);
      } else {
        result = await managerApi.rejectVendor(vendorId, rejectionReason || 'Application does not meet our current requirements.');
      }

      if (!result.success) {
        throw new Error(result.message || `Failed to ${action} vendor`);
      }

      toast.success(
        action === 'approve'
          ? t('manager.pending.toastApproveSuccess')
          : t('manager.pending.toastRejectSuccess'),
        {
          description:
            action === 'approve'
              ? t('manager.pending.toastApproveDescription')
              : t('manager.pending.toastRejectDescription'),
        }
      );

      // Reset rejection form
      setRejectionReason('');
      setShowRejectDialog(false);
      setVendorToReject(null);

      // Refresh data
      await fetchPendingVendors();
    } catch (error: any) {
      console.error(`❌ Error ${action}ing vendor:`, error);
      toast.error(
        error.message ||
        (action === 'approve'
          ? t('manager.pending.toastApproveError')
          : t('manager.pending.toastRejectError'))
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectDialog = (vendorId: string) => {
    setVendorToReject(vendorId);
    setShowRejectDialog(true);
  };

  const confirmRejection = () => {
    if (vendorToReject) {
      handleVendorAction(vendorToReject, 'reject');
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    const businessType = businessTypes.find(bt => bt.value === type);
    return businessType?.label || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredVendors = pendingVendors.filter(vendor => {
    const matchesSearch =
      vendor.shopname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = businessTypeFilter === 'all' || vendor.businessType === businessTypeFilter;

    return matchesSearch && matchesFilter;
  });

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div {...fadeInUp}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">
                {t('manager.pending.pageTitle')}
              </h1>
              <p className="text-[#6d4c41]">
                {t('manager.pending.pageSubtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Badge className="bg-[#4e342e] text-white">
                {t('manager.pending.statusCount', { count: filteredVendors.length })}
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 bg-white shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-4 h-4" />
                    <Input
                      placeholder={t('manager.pending.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={businessTypeFilter}
                    onChange={(e) => setBusinessTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[#f8d7da] rounded-md focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                  >
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendors List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 bg-white shadow-lg animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <Building className="w-16 h-16 text-[#6d4c41]/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">{t('manager.pending.emptyTitle')}</h3>
                <p className="text-[#6d4c41]">
                  {searchTerm || businessTypeFilter !== 'all'
                    ? t('manager.pending.emptyFiltered')
                    : t('manager.pending.emptyDefault')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredVendors.map((vendor, index) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        {/* Vendor Info */}
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                              <Building className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-[#4e342e] mb-2">{vendor.shopname}</h3>
                              <div className="flex items-center space-x-4 mb-3">
                                <Badge variant="secondary" className="text-xs">
                                  {getBusinessTypeLabel(vendor.businessType)}
                                </Badge>
                                <div className="flex items-center space-x-1 text-sm text-[#6d4c41]">
                                  <Clock className="w-4 h-4" />
                                  <span>{vendor.yearsInBusiness} years in business</span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-[#6d4c41]">
                                  <User className="w-4 h-4" />
                                  <span>{vendor.numberOfEmployees} employees</span>
                                </div>
                              </div>
                              <p className="text-[#6d4c41] text-sm mb-4 line-clamp-2">{vendor.description}</p>

                              {/* Contact Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h4 className="font-medium text-[#4e342e] mb-2">Owner Information</h4>
                                  <div className="space-y-1 text-sm text-[#6d4c41]">
                                    <div className="flex items-center space-x-2">
                                      <User className="w-4 h-4" />
                                      <span>{vendor.user.firstName} {vendor.user.lastName}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Mail className="w-4 h-4" />
                                      <span>{vendor.user.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Phone className="w-4 h-4" />
                                      <span>{vendor.user.phone}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-[#4e342e] mb-2">Business Location</h4>
                                  <div className="space-y-1 text-sm text-[#6d4c41]">
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="w-4 h-4" />
                                      <span>{vendor.address}</span>
                                    </div>
                                    <div className="text-sm text-[#6d4c41] ml-6">
                                      {vendor.city}, {vendor.state} {vendor.zipCode}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Services Offered */}
                              <div>
                                <h4 className="font-medium text-[#4e342e] mb-2">Services Offered</h4>
                                <div className="flex flex-wrap gap-2">
                                  {vendor.servicesOffered.map((service, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {service}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end space-y-4">
                          <div className="text-right">
                            <div className="text-sm text-[#6d4c41] mb-1">Application Date</div>
                            <div className="flex items-center space-x-1 text-[#4e342e]">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">{formatDate(vendor.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleVendorAction(vendor.id, 'approve')}
                              disabled={isProcessing}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              {t('manager.pending.approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRejectDialog(vendor.id)}
                              disabled={isProcessing}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <X className="w-4 h-4 mr-1" />
                              {t('manager.pending.reject')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedVendor(vendor)}
                              className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Rejection Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('manager.pending.rejectDialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('manager.pending.rejectDialogDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                {t('manager.pending.rejectionReasonLabel')}
              </label>
              <Textarea
                placeholder={t('manager.pending.rejectionReasonPlaceholder')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t('manager.pending.rejectionReasonHint')}
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                  setVendorToReject(null);
                }}
                disabled={isProcessing}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRejection}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('manager.pending.processing')}
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    {t('manager.pending.confirmRejection')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PendingVendorsPage;
