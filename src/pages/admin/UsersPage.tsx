import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  Shield,
  Clock,
  RefreshCw,
  DollarSign,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/adminApi';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
  lastLoginAt?: string;
  totalBookings: number;
  totalSpent: number;
  isVerified: boolean;
}

const UsersPage = () => {
  const { user } = useSupabaseAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('CUSTOMER'); // Default to CUSTOMER only
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const roleOptions = [
    { value: 'CUSTOMER', label: 'Customers' },
    { value: 'all', label: 'All Roles (Customers Only)' },
    { value: 'MANAGER', label: 'Managers' },
    { value: 'ADMIN', label: 'Admins' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' }
  ];

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]); // Refetch when filters change

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching all users from backend API...');

      const result = await adminApi.getAllUsers();

      if (!result.success) {
        console.error('❌ Admin API returned error:', result.message);
        throw new Error(result.message || 'Failed to load users');
      }

      if (!result.data || !result.data.users) {
        console.warn('⚠️ No users in API response');
        setUsers([]);
        setLoading(false);
        return;
      }

      let usersData = result.data.users;

      // Filter out unverified users - explicitly remove PENDING/PENDING_VERIFICATION
      // Admin should only see users who have verified their email
      usersData = usersData.filter((u: any) =>
        u.status !== 'PENDING_VERIFICATION' && u.status !== 'PENDING'
      );

      // Filter out vendors - only show customers by default
      // If roleFilter is 'all', still exclude vendors unless explicitly selected
      if (roleFilter === 'all') {
        usersData = usersData.filter((u: any) => u.role === 'CUSTOMER');
      } else {
        usersData = usersData.filter((u: any) => u.role === roleFilter);
      }

      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        usersData = usersData.filter((u: any) => u.status === statusFilter);
      }

      setUsers(usersData);
      console.log('✅ Users loaded successfully:', usersData.length);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      toast.error(`Failed to load users: ${error.message || 'Unknown error'}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const result = await adminApi.updateUserStatus(userId, newStatus);

      if (!result.success) {
        throw new Error(result.message || 'Failed to update user status');
      }

      toast.success(`User ${newStatus.toLowerCase()} successfully!`);
      // Optimistically update local state to avoid full refetch delay
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
    } catch (error: any) {
      console.error(`Error updating user status:`, error);
      toast.error(`Failed to ${newStatus.toLowerCase()} user: ${error.message || 'Unknown error'}`);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800';
      case 'VENDOR':
        return 'bg-green-100 text-green-800';
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800';
      case 'BEAUTICIAN':
        return 'bg-orange-100 text-orange-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-800';
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

  const filteredUsers = users.filter(user => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const email = user.email || '';

    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">User Management</h1>
              <p className="text-[#6d4c41]">Manage all platform users and their accounts</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge className="bg-[#4e342e] text-white">
                {users.length} Total Users
              </Badge>
              {filteredUsers.length !== users.length && (
                <Badge className="bg-[#6d4c41] text-white">
                  {filteredUsers.length} Filtered
                </Badge>
              )}
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
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-[#f8d7da] rounded-md focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-0 bg-white shadow-lg animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-[#6d4c41]/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">No Users Found</h3>
                <p className="text-[#6d4c41]">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'No users match your search criteria.'
                    : 'No verified users found.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <div key={user.id}>
                  <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-full flex items-center justify-center">
                              <User className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-semibold text-[#4e342e]">
                                  {user.firstName || 'Unknown'} {user.lastName || 'User'}
                                </h3>
                                {user.isVerified && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-[#6d4c41] mb-3">
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4" />
                                  <span>{user.email}</span>
                                </div>
                                {user.phone && (
                                  <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{user.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Joined {formatDate(user.createdAt)}</span>
                                </div>
                                {user.lastLoginAt && (
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Last login {formatDate(user.lastLoginAt)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-[#f8d7da]/20 rounded-lg">
                              <div className="text-lg font-semibold text-[#4e342e]">{user.totalBookings}</div>
                              <div className="text-xs text-[#6d4c41]">Bookings</div>
                            </div>
                            <div className="text-center p-3 bg-[#f8d7da]/20 rounded-lg">
                              <div className="text-lg font-semibold text-[#4e342e]">{formatCurrency(user.totalSpent)}</div>
                              <div className="text-xs text-[#6d4c41]">Total Spent</div>
                            </div>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex flex-col items-end space-y-3">
                          <div className="flex items-center space-x-2">
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </div>

                          <div className="flex space-x-2">
                            {user.status === 'ACTIVE' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserStatus(user.id, 'SUSPENDED')}
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              >
                                <UserX className="w-3 h-3 mr-1" />
                                Suspend
                              </Button>
                            ) : user.status === 'SUSPENDED' ? (
                              <Button
                                size="sm"
                                onClick={() => updateUserStatus(user.id, 'ACTIVE')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Reactivate
                              </Button>
                            ) : null}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsViewDialogOpen(true);
                              }}
                              className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-[#4e342e]">
                User Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the selected user
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6 mt-4">
                {/* User Profile Section */}
                <div className="flex items-start space-x-4 p-4 bg-[#f8d7da]/20 rounded-lg">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-[#4e342e]">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      {selectedUser.isVerified && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getRoleColor(selectedUser.role)}>
                        {selectedUser.role}
                      </Badge>
                      <Badge className={getStatusColor(selectedUser.status)}>
                        {selectedUser.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-[#f8d7da]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#6d4c41]">
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-[#6d4c41]" />
                        <span className="text-[#4e342e]">{selectedUser.email}</span>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-4 h-4 text-[#6d4c41]" />
                          <span className="text-[#4e342e]">{selectedUser.phone}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-[#f8d7da]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#6d4c41]">
                        Account Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-[#6d4c41]" />
                        <div>
                          <div className="text-xs text-[#6d4c41]">Joined</div>
                          <div className="text-[#4e342e]">{formatDate(selectedUser.createdAt)}</div>
                        </div>
                      </div>
                      {selectedUser.lastLoginAt && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="w-4 h-4 text-[#6d4c41]" />
                          <div>
                            <div className="text-xs text-[#6d4c41]">Last Login</div>
                            <div className="text-[#4e342e]">{formatDate(selectedUser.lastLoginAt)}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Statistics */}
                <Card className="border-[#f8d7da]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#6d4c41]">
                      Activity Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-[#f8d7da]/20 rounded-lg">
                        <BookOpen className="w-6 h-6 text-[#4e342e] mx-auto mb-2" />
                        <div className="text-2xl font-semibold text-[#4e342e]">
                          {selectedUser.totalBookings}
                        </div>
                        <div className="text-xs text-[#6d4c41]">Total Bookings</div>
                      </div>
                      <div className="text-center p-4 bg-[#f8d7da]/20 rounded-lg">
                        <DollarSign className="w-6 h-6 text-[#4e342e] mx-auto mb-2" />
                        <div className="text-2xl font-semibold text-[#4e342e]">
                          {formatCurrency(selectedUser.totalSpent)}
                        </div>
                        <div className="text-xs text-[#6d4c41]">Total Spent</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User ID */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">User ID</div>
                  <div className="text-sm font-mono text-gray-700">{selectedUser.id}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
