import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  Eye,
  User,
  Star,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  CheckCircle,
  X,
  AlertCircle,
  Shield,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Vendor {
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  stats: {
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
  };
}

const AllVendorsPage = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [processingVendorId, setProcessingVendorId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const businessTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'salon', label: 'Beauty Salon' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'beauty_center', label: 'Beauty Center' },
    { value: 'nail_salon', label: 'Nail Salon' },
    { value: 'barbershop', label: 'Barbershop' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  useEffect(() => {
    fetchAllVendors();
  }, []);

  const fetchAllVendors = async () => {
    try {
      setLoading(true);

      // Import managerApi dynamically
      const { managerApi } = await import('@/lib/managerApi');

      console.log('📡 Fetching all vendors...');
      const result = await managerApi.getAllVendors();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load vendors');
      }

      const data = result.data;
      console.log('✅ Fetched all vendors:', data?.vendors?.length || 0);

      // Transform the API response to match the frontend interface
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
        numberOfEmployees: vendor.stats?.totalEmployees || 0,
        servicesOffered: (vendor.services || []).map((s: any) => s.name || s),
        status: vendor.status,
        isVerified: vendor.status === 'APPROVED',
        user: {
          firstName: vendor.user?.firstName || '',
          lastName: vendor.user?.lastName || '',
          email: vendor.user?.email || '',
          phone: vendor.user?.phone || ''
        },
        createdAt: vendor.createdAt,
        stats: vendor.stats || {
          totalBookings: 0,
          completedBookings: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalReviews: 0,
          totalServices: vendor.services?.length || 0,
          totalProducts: vendor.products?.length || 0,
          totalEmployees: vendor.employees?.length || 0
        }
      }));

      console.log('✅ Loaded vendors with comprehensive data:', transformedVendors.length);
      setVendors(transformedVendors);
      toast.success(`Loaded ${transformedVendors.length} vendor(s)`);
    } catch (error: any) {
      console.error('❌ Error fetching vendors:', error);
      toast.error(
        error.message || 'Failed to load vendors. Please ensure the backend server is running.',
        { duration: 5000 }
      );
      setVendors([]);
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

      toast.success(`Vendor ${action}d successfully! Email notification sent.`);
      await fetchAllVendors(); // Refresh data
    } catch (error: any) {
      console.error(`❌ Error ${action}ing vendor:`, error);
      toast.error(error.message || `Failed to ${action} vendor. Please try again.`);
    } finally {
      setProcessingVendorId(null);
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    const businessType = businessTypes.find(bt => bt.value === type);
    return businessType?.label || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch =
      vendor.shopname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    const matchesType = businessTypeFilter === 'all' || vendor.businessType === businessTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
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
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">All Vendors</h1>
              <p className="text-[#6d4c41]">Manage all registered vendors and their status</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Badge className="bg-[#4e342e] text-white">
                {filteredVendors.length} Total
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 bg-white shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-4 h-4" />
                    <Input
                      placeholder="Search by shop name, owner, or city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[#f8d7da] rounded-md focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
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

          {/* Vendors Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">No Vendors Found</h3>
                <p className="text-[#6d4c41]">
                  {searchTerm || statusFilter !== 'all' || businessTypeFilter !== 'all'
                    ? 'No vendors match your search criteria.'
                    : 'No vendors have been registered yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor, index) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                            <Building className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-[#4e342e]">{vendor.shopname}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {getBusinessTypeLabel(vendor.businessType)}
                              </Badge>
                              {vendor.isVerified && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(vendor.status)}>
                          {vendor.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#6d4c41] text-sm mb-4 line-clamp-2">{vendor.description}</p>

                      {/* Owner Info */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 text-sm text-[#6d4c41] mb-1">
                          <User className="w-4 h-4" />
                          <span>{vendor.user.firstName} {vendor.user.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-[#6d4c41] mb-1">
                          <MapPin className="w-4 h-4" />
                          <span>{vendor.city}, {vendor.state}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-[#6d4c41]">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {formatDate(vendor.createdAt)}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      {vendor.status === 'APPROVED' && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-2 bg-[#f8d7da]/20 rounded-lg">
                            <div className="text-lg font-semibold text-[#4e342e]">{vendor.stats.totalBookings}</div>
                            <div className="text-xs text-[#6d4c41]">Bookings</div>
                          </div>
                          <div className="text-center p-2 bg-[#f8d7da]/20 rounded-lg">
                            <div className="text-lg font-semibold text-[#4e342e]">{formatCurrency(vendor.stats.totalRevenue)}</div>
                            <div className="text-xs text-[#6d4c41]">Revenue</div>
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      <div className="mb-4">
                        <div className="text-xs font-medium text-[#4e342e] mb-2">Services</div>
                        <div className="flex flex-wrap gap-1">
                          {vendor.servicesOffered.slice(0, 3).map((service, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {vendor.servicesOffered.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{vendor.servicesOffered.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        {vendor.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleVendorAction(vendor.id, 'approve')}
                              disabled={processingVendorId === vendor.id}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                              {processingVendorId === vendor.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVendorAction(vendor.id, 'reject')}
                              disabled={processingVendorId === vendor.id}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white flex-1"
                            >
                              {processingVendorId === vendor.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <X className="w-3 h-3 mr-1" />
                              )}
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/manager/vendors/${vendor.id}`)}
                          className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Vendor Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-[#4e342e]">
                Vendor Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the selected vendor
              </DialogDescription>
            </DialogHeader>

            {selectedVendor && (
              <div className="space-y-6 mt-4">
                {/* Vendor Profile Section */}
                <div className="flex items-start space-x-4 p-4 bg-[#f8d7da]/20 rounded-lg">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Building className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-[#4e342e]">
                        {selectedVendor.shopname}
                      </h3>
                      {selectedVendor.isVerified && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {getBusinessTypeLabel(selectedVendor.businessType)}
                      </Badge>
                      <Badge className={getStatusColor(selectedVendor.status)}>
                        {selectedVendor.status}
                      </Badge>
                    </div>
                    <p className="text-[#6d4c41] text-sm mt-2">
                      {selectedVendor.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Owner Information */}
                <Card className="border-[#f8d7da]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#6d4c41] flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Owner Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-[#6d4c41]" />
                      <span className="text-[#4e342e] font-medium">
                        {selectedVendor.user.firstName} {selectedVendor.user.lastName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-[#6d4c41]" />
                      <span className="text-[#4e342e]">{selectedVendor.user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-[#6d4c41]" />
                      <span className="text-[#4e342e]">{selectedVendor.user.phone || 'Not provided'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Location */}
                <Card className="border-[#f8d7da]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#6d4c41] flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Business Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedVendor.address && (
                      <div className="text-sm text-[#4e342e]">
                        <span className="text-[#6d4c41]">Address: </span>
                        {selectedVendor.address}
                      </div>
                    )}
                    <div className="text-sm text-[#4e342e]">
                      <span className="text-[#6d4c41]">City: </span>
                      {selectedVendor.city}
                    </div>
                    <div className="text-sm text-[#4e342e]">
                      <span className="text-[#6d4c41]">State: </span>
                      {selectedVendor.state}
                    </div>
                    {selectedVendor.zipCode && (
                      <div className="text-sm text-[#4e342e]">
                        <span className="text-[#6d4c41]">Zip Code: </span>
                        {selectedVendor.zipCode}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Statistics */}
                {selectedVendor.status === 'APPROVED' && (
                  <Card className="border-[#f8d7da]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#6d4c41] flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Business Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-[#f8d7da]/20 rounded-lg">
                          <BookOpen className="w-6 h-6 text-[#4e342e] mx-auto mb-2" />
                          <div className="text-2xl font-semibold text-[#4e342e]">
                            {selectedVendor.stats.totalBookings}
                          </div>
                          <div className="text-xs text-[#6d4c41]">Total Bookings</div>
                          <div className="text-xs text-[#6d4c41] mt-1">
                            {selectedVendor.stats.completedBookings} completed
                          </div>
                        </div>
                        <div className="text-center p-4 bg-[#f8d7da]/20 rounded-lg">
                          <DollarSign className="w-6 h-6 text-[#4e342e] mx-auto mb-2" />
                          <div className="text-2xl font-semibold text-[#4e342e]">
                            {formatCurrency(selectedVendor.stats.totalRevenue)}
                          </div>
                          <div className="text-xs text-[#6d4c41]">Total Revenue</div>
                        </div>
                        <div className="text-center p-4 bg-[#f8d7da]/20 rounded-lg">
                          <Star className="w-6 h-6 text-[#4e342e] mx-auto mb-2" />
                          <div className="text-2xl font-semibold text-[#4e342e]">
                            {selectedVendor.stats.averageRating.toFixed(1)}
                          </div>
                          <div className="text-xs text-[#6d4c41]">Average Rating</div>
                        </div>
                        <div className="text-center p-4 bg-[#f8d7da]/20 rounded-lg">
                          <Users className="w-6 h-6 text-[#4e342e] mx-auto mb-2" />
                          <div className="text-2xl font-semibold text-[#4e342e]">
                            {selectedVendor.stats.totalReviews}
                          </div>
                          <div className="text-xs text-[#6d4c41]">Total Reviews</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Services Offered */}
                {selectedVendor.servicesOffered.length > 0 && (
                  <Card className="border-[#f8d7da]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#6d4c41]">
                        Services Offered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedVendor.servicesOffered.map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Account Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-[#f8d7da]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#6d4c41] flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Registration Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-[#4e342e]">
                        {formatDate(selectedVendor.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-[#f8d7da]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#6d4c41]">
                        Employees
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-[#4e342e]">
                        {selectedVendor.numberOfEmployees} employees
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Vendor ID */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Vendor ID</div>
                  <div className="text-sm font-mono text-gray-700">{selectedVendor.id}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AllVendorsPage;
