import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/env';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Search,
  Filter,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  X,
  AlertTriangle,
  Loader2,
  Star,
  DollarSign,
  Users,
  Clock,
  Shield,
  Trash2,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  shopname: string;
  description: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isVerified: boolean;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  approvedAt?: string;
  stats: {
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
  };
}

const VendorsPage = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');

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
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'SUSPENDED', label: 'Suspended' }
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching all vendors from backend API...');

      // Import adminApi dynamically
      const { adminApi } = await import('@/lib/adminApi');

      const result = await adminApi.getAllVendors();

      if (!result.success) {
        console.error('❌ Admin API returned error:', result.message);
        throw new Error(result.message || 'Failed to load vendors');
      }

      if (!result.data || !result.data.vendors) {
        console.warn('⚠️ No vendors in API response');
        setVendors([]);
        setLoading(false);
        return;
      }

      setVendors(result.data.vendors);
      console.log('✅ Vendors loaded successfully:', result.data.vendors.length);
    } catch (error: any) {
      console.error('❌ Error fetching vendors:', error);
      toast.error(`Failed to load vendors: ${error.message || 'Unknown error'}`);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const updateVendorStatus = async (vendorId: string, newStatus: string) => {
    try {
      // Import adminApi dynamically
      const { adminApi } = await import('@/lib/adminApi');

      const result = await adminApi.updateVendorStatus(vendorId, newStatus);

      if (!result.success) {
        throw new Error(result.message || `Failed to ${newStatus.toLowerCase()} vendor`);
      }

      toast.success(`Vendor ${newStatus.toLowerCase()} successfully!`);
      fetchVendors(); // Refresh data
    } catch (error: any) {
      console.error(`Error updating vendor status:`, error);
      toast.error(`Failed to ${newStatus.toLowerCase()} vendor: ${error.message || 'Unknown error'}`);
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`admin/vendors/${vendorId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Vendor deleted successfully!');
        fetchVendors(); // Refresh data
      } else {
        toast.error('Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
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
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
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
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">Vendor Management</h1>
              <p className="text-[#6d4c41]">Manage all vendors and their business accounts</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Badge className="bg-[#4e342e] text-white">
                {filteredVendors.length} Vendors
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
                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">No Vendors Found</h3>
                <p className="text-[#6d4c41]">
                  {searchTerm || statusFilter !== 'all' || businessTypeFilter !== 'all'
                    ? 'No vendors match your search criteria.'
                    : 'No vendors have been registered yet.'}
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
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-semibold text-[#4e342e]">{vendor.shopname}</h3>
                                {vendor.isVerified && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[#6d4c41] text-sm mb-3 line-clamp-2">{vendor.description}</p>

                              {/* Owner Info */}
                              <div className="mb-3">
                                <div className="flex items-center space-x-2 text-sm text-[#6d4c41] mb-1">
                                  <User className="w-4 h-4" />
                                  <span>{vendor.user.firstName} {vendor.user.lastName}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-[#6d4c41] mb-1">
                                  <Mail className="w-4 h-4" />
                                  <span>{vendor.user.email}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-[#6d4c41] mb-1">
                                  <Phone className="w-4 h-4" />
                                  <span>{vendor.user.phone}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-[#6d4c41]">
                                  <MapPin className="w-4 h-4" />
                                  <span>{vendor.city}, {vendor.state}</span>
                                </div>
                              </div>

                              {/* Dates */}
                              <div className="space-y-1 text-sm text-[#6d4c41]">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Registered {formatDate(vendor.createdAt)}</span>
                                </div>
                                {vendor.approvedAt && (
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Approved {formatDate(vendor.approvedAt)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="text-center p-3 bg-[#f8d7da]/20 rounded-lg">
                              <div className="text-lg font-semibold text-[#4e342e]">{vendor.stats.totalBookings}</div>
                              <div className="text-xs text-[#6d4c41]">Total Bookings</div>
                            </div>
                            <div className="text-center p-3 bg-[#f8d7da]/20 rounded-lg">
                              <div className="text-lg font-semibold text-[#4e342e]">{formatCurrency(vendor.stats.totalRevenue)}</div>
                              <div className="text-xs text-[#6d4c41]">Revenue</div>
                            </div>
                            <div className="text-center p-3 bg-[#f8d7da]/20 rounded-lg">
                              <div className="text-lg font-semibold text-[#4e342e]">{vendor.stats.averageRating}</div>
                              <div className="text-xs text-[#6d4c41]">Rating</div>
                            </div>
                            <div className="text-center p-3 bg-[#f8d7da]/20 rounded-lg">
                              <div className="text-lg font-semibold text-[#4e342e]">{vendor.stats.totalReviews}</div>
                              <div className="text-xs text-[#6d4c41]">Reviews</div>
                            </div>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex flex-col items-end space-y-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getBusinessTypeLabel(vendor.businessType)}
                            </Badge>
                            <Badge className={getStatusColor(vendor.status)}>
                              {vendor.status}
                            </Badge>
                          </div>

                          <div className="flex space-x-2">
                            {vendor.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateVendorStatus(vendor.id, 'APPROVED')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateVendorStatus(vendor.id, 'REJECTED')}
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {vendor.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateVendorStatus(vendor.id, 'SUSPENDED')}
                                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Suspend
                              </Button>
                            )}

                            {vendor.status === 'SUSPENDED' && (
                              <Button
                                size="sm"
                                onClick={() => updateVendorStatus(vendor.id, 'APPROVED')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Reactivate
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
                              className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteVendor(vendor.id)}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="w-3 h-3" />
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
      </div>
    </DashboardLayout>
  );
};

export default VendorsPage;
