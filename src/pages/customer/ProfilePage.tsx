import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/DashboardLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Loader2,
  CreditCard,
  Home
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  createdAt: string;
  updatedAt: string;
  gender?: string;
  avatar?: string;
}

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money';
  lastFour: string;
  brand?: string;
  isDefault: boolean;
}

const CustomerProfilePage = () => {
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'DR Congo',
    gender: 'female' // Default or fetch
  });


  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Handle both {success: true, data: {...}} and direct object
        setProfile(data);
        setEditForm({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || '',
          street: data.addresses?.[0]?.street || '',
          city: data.addresses?.[0]?.city || '',
          state: data.addresses?.[0]?.state || '',
          zipCode: data.addresses?.[0]?.zipCode || '',
          country: data.addresses?.[0]?.country || 'DR Congo',
          gender: data.gender || 'female'
        });

      } else {
        // Use mock data if API is not available
        setProfile(getMockProfileData());
        setEditForm({
          firstName: user?.firstName || 'John',
          lastName: user?.lastName || 'Doe',
          phone: '+243 123 456 789',
          street: '123 Main Street',
          city: 'Kinshasa',
          state: 'Kinshasa',
          zipCode: '00000',
          country: 'DR Congo',
          gender: 'female'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use mock data on error
      setProfile(getMockProfileData());
      setEditForm({
        firstName: user?.firstName || 'John',
        lastName: user?.lastName || 'Doe',
        phone: '+243 123 456 789',
        street: '123 Main Street',
        city: 'Kinshasa',
        state: 'Kinshasa',
        zipCode: '00000',
        country: 'DR Congo',
        gender: 'female'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMockProfileData = (): CustomerProfile => ({
    id: user?.id || '1',
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+243 123 456 789',
    gender: 'male',
    addresses: [

      {
        id: '1',
        type: 'home',
        street: '123 Main Street',
        city: 'Kinshasa',
        state: 'Kinshasa',
        zipCode: '00000',
        country: 'DR Congo',
        isDefault: true
      }
    ],
    paymentMethods: [
      {
        id: '1',
        type: 'card',
        lastFour: '1234',
        brand: 'Visa',
        isDefault: true
      },
      {
        id: '2',
        type: 'mobile_money',
        lastFour: '5678',
        isDefault: false
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast.success(t('profile.profileUpdated'));
        setIsEditing(false);
        fetchProfileData();
      } else {
        toast.error(t('profile.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        street: profile.addresses?.[0]?.street || '',
        city: profile.addresses?.[0]?.city || '',
        state: profile.addresses?.[0]?.state || '',
        zipCode: profile.addresses?.[0]?.zipCode || '',
        country: profile.addresses?.[0]?.country || 'DR Congo',
        gender: profile.gender || 'female'
      });
    }
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

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <User className="w-12 h-12 text-[#6d4c41] mx-auto mb-4" />
            <p className="text-[#6d4c41]">Failed to load profile</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#fdf6f0] p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#4e342e]">
                  {t('profile.title')}
                </h1>
                <p className="text-base sm:text-lg text-[#6d4c41] mt-1 sm:mt-2">
                  {t('profile.subtitle')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-[#4e342e] hover:bg-[#3b2c26] text-white text-sm sm:text-base w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t('dashboard.customer.editProfile')}
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base w-full sm:w-auto"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isSaving ? t('profile.saving') : t('profile.saveChanges')}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white text-sm sm:text-base w-full sm:w-auto"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('profile.cancel')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Personal Information */}
            <div className="lg:col-span-2">
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg sm:text-xl font-serif font-bold text-[#4e342e] flex items-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    {t('profile.personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 pt-0">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-[#efebe9] flex items-center justify-center overflow-hidden border-2 border-[#4e342e]">
                        {profile.avatar ? (
                          <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-[#4e342e]">{profile.firstName?.charAt(0)}</span>
                        )}
                      </div>
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 bg-[#4e342e] text-white p-1 rounded-full hover:bg-[#3b2c26]">
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#4e342e]">Profile Picture</h3>
                      <p className="text-xs text-[#8d6e63]">Click to update</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                    <div>
                      <Label htmlFor="firstName" className="text-[#6d4c41] font-medium text-sm sm:text-base">
                        {t('profile.firstName')}
                      </Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="mt-1 text-sm sm:text-base"
                        />
                      ) : (
                        <p className="mt-1 text-[#4e342e] font-medium text-sm sm:text-base">{profile.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-[#6d4c41] font-medium text-sm sm:text-base">
                        {t('profile.lastName')}
                      </Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="mt-1 text-sm sm:text-base"
                        />
                      ) : (
                        <p className="mt-1 text-[#4e342e] font-medium text-sm sm:text-base">{profile.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-[#6d4c41] font-medium">
                      {t('profile.email')}
                    </Label>
                    <div className="mt-1 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-[#6d4c41]" />
                      <p className="text-[#4e342e] font-medium">{profile.email}</p>
                      <Badge variant="secondary" className="ml-2">Verified</Badge>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-[#6d4c41] font-medium">
                      {t('profile.phone')}
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-[#6d4c41]" />
                        <p className="text-[#4e342e] font-medium">{profile.phone}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-[#6d4c41] font-medium">
                      Gender
                    </Label>
                    {isEditing ? (
                      <select
                        id="gender"
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-[#4e342e] font-medium capitalize">{profile.gender || 'Not specified'}</p>
                    )}
                  </div>

                </CardContent>
              </Card>

              {/* Address Information */}
              <Card className="border-0 bg-white shadow-lg mt-6">
                <CardHeader>
                  <CardTitle className="text-xl font-serif font-bold text-[#4e342e] flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      {t('profile.address')}
                    </div>
                    {isEditing && (
                      <Button variant="outline" size="sm" className="text-xs border-[#4e342e] text-[#4e342e]">
                        + Add New
                      </Button>
                    )}
                  </CardTitle>

                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.addresses.map((address) => (
                    <div key={address.id} className="p-4 bg-[#fdf6f0] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Home className="w-4 h-4 mr-2 text-[#6d4c41]" />
                          <span className="font-medium text-[#4e342e] capitalize">
                            {address.type} Address
                          </span>
                          {address.isDefault && (
                            <Badge className="ml-2 bg-green-100 text-green-800">Default</Badge>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="street" className="text-[#6d4c41] font-medium">
                              {t('profile.street')}
                            </Label>
                            <Input
                              id="street"
                              value={editForm.street}
                              onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city" className="text-[#6d4c41] font-medium">
                              {t('profile.city')}
                            </Label>
                            <Input
                              id="city"
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state" className="text-[#6d4c41] font-medium">
                              {t('profile.state')}
                            </Label>
                            <Input
                              id="state"
                              value={editForm.state}
                              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipCode" className="text-[#6d4c41] font-medium">
                              {t('profile.zipCode')}
                            </Label>
                            <Input
                              id="zipCode"
                              value={editForm.zipCode}
                              onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#6d4c41]">
                          {address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Summary */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-serif font-bold text-[#4e342e]">
                    Account Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[#6d4c41]">Member Since</span>
                    <span className="text-[#4e342e] font-medium">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-[#6d4c41]">Last Updated</span>
                    <span className="text-[#4e342e] font-medium">
                      {new Date(profile.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerProfilePage;
