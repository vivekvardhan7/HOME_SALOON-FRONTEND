import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  User,
  Lock,
  ArrowLeft,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

const vendorRegistrationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Please enter a valid phone number'),

  // Business Information
  shopname: z.string().min(2, 'Shop name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(5, 'Please enter a complete address'),
  city: z.string().min(2, 'Please enter a valid city'),
  state: z.string().min(2, 'Please enter a valid state'),
  zipCode: z.string().min(3, 'Please enter a valid zip code'),

  // Business Details
  businessType: z.enum(['salon', 'spa', 'beauty_center', 'nail_salon', 'barbershop']),
  yearsInBusiness: z.string().min(1, 'Please select years in business'),
  numberOfEmployees: z.string().min(1, 'Please enter number of employees'),

  // Services
  servicesOffered: z.array(z.string()).min(1, 'Please select at least one service'),

  // Operating Hours
  mondayOpen: z.string(),
  mondayClose: z.string(),
  tuesdayOpen: z.string(),
  tuesdayClose: z.string(),
  wednesdayOpen: z.string(),
  wednesdayClose: z.string(),
  thursdayOpen: z.string(),
  thursdayClose: z.string(),
  fridayOpen: z.string(),
  fridayClose: z.string(),
  saturdayOpen: z.string(),
  saturdayClose: z.string(),
  sundayOpen: z.string(),
  sundayClose: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type VendorRegistrationForm = z.infer<typeof vendorRegistrationSchema>;

const VendorRegisterPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<VendorRegistrationForm>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      businessType: 'salon',
      yearsInBusiness: '1',
      numberOfEmployees: '1',
      servicesOffered: [],
      mondayOpen: '09:00',
      mondayClose: '18:00',
      tuesdayOpen: '09:00',
      tuesdayClose: '18:00',
      wednesdayOpen: '09:00',
      wednesdayClose: '18:00',
      thursdayOpen: '09:00',
      thursdayClose: '18:00',
      fridayOpen: '09:00',
      fridayClose: '18:00',
      saturdayOpen: '09:00',
      saturdayClose: '17:00',
      sundayOpen: '10:00',
      sundayClose: '16:00',
    }
  });

  useEffect(() => {
    const prefills: Array<{ key: keyof VendorRegistrationForm; param: string }> = [
      { key: 'firstName', param: 'firstName' },
      { key: 'lastName', param: 'lastName' },
      { key: 'email', param: 'email' },
      { key: 'phone', param: 'phone' },
    ];

    prefills.forEach(({ key, param }) => {
      const value = searchParams.get(param);
      if (value) {
        setValue(key, value);
      }
    });
  }, [searchParams, setValue]);

  const availableServices = [
    'Hair Styling',
    'Hair Coloring',
    'Hair Cutting',
    'Facial Treatments',
    'Makeup',
    'Nail Care',
    'Manicure',
    'Pedicure',
    'Massage',
    'Spa Treatments',
    'Eyebrow Shaping',
    'Eyelash Extensions',
    'Waxing',
    'Skincare',
    'Bridal Services'
  ];

  const businessTypes = [
    { value: 'salon', label: 'Beauty Salon' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'beauty_center', label: 'Beauty Center' },
    { value: 'nail_salon', label: 'Nail Salon' },
    { value: 'barbershop', label: 'Barbershop' }
  ];

  const yearsOptions = [
    { value: '1', label: 'Less than 1 year' },
    { value: '2', label: '1-2 years' },
    { value: '5', label: '3-5 years' },
    { value: '10', label: '6-10 years' },
    { value: '15', label: '11-15 years' },
    { value: '20', label: 'More than 15 years' }
  ];

  const handleServiceToggle = (service: string) => {
    const currentServices = watch('servicesOffered');
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    setValue('servicesOffered', updatedServices);
  };

  const { registerVendorAccount } = useSupabaseAuth();

  // Check for rate limiting before submission
  const checkRateLimit = (email: string): string | null => {
    try {
      const rateLimitKey = `supabase_rate_limit_${email.toLowerCase().trim()}`;
      const rateLimitInfo = localStorage.getItem(rateLimitKey);

      if (rateLimitInfo) {
        const { timestamp, duration } = JSON.parse(rateLimitInfo);
        const now = Date.now();
        const timeRemaining = (timestamp + duration) - now;

        if (timeRemaining > 0) {
          const minutesRemaining = Math.ceil(timeRemaining / 60000);
          const secondsRemaining = Math.ceil((timeRemaining % 60000) / 1000);
          return minutesRemaining > 0
            ? `Too many registration attempts. Please wait ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} before trying again.`
            : `Too many registration attempts. Please wait ${secondsRemaining} second${secondsRemaining > 1 ? 's' : ''} before trying again.`;
        } else {
          // Rate limit expired, clear it
          localStorage.removeItem(rateLimitKey);
        }
      }
    } catch (e) {
      // If we can't check, allow submission (error will be caught by registerVendorAccount)
    }
    return null;
  };

  const onSubmit = async (data: VendorRegistrationForm) => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    // Check for rate limiting before attempting submission
    const rateLimitError = checkRateLimit(data.email);
    if (rateLimitError) {
      // Show error message to user and prevent API call
      toast.error(rateLimitError);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerVendorAccount({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        shopName: data.shopname,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        latitude: 0,
        longitude: 0,
        servicesOffered: data.servicesOffered,
        businessType: data.businessType,
        yearsInBusiness: data.yearsInBusiness,
        numberOfEmployees: data.numberOfEmployees,
        operatingHours: {
          monday: { open: data.mondayOpen, close: data.mondayClose },
          tuesday: { open: data.tuesdayOpen, close: data.tuesdayClose },
          wednesday: { open: data.wednesdayOpen, close: data.wednesdayClose },
          thursday: { open: data.thursdayOpen, close: data.thursdayClose },
          friday: { open: data.fridayOpen, close: data.fridayClose },
          saturday: { open: data.saturdayOpen, close: data.saturdayClose },
          sunday: { open: data.sundayOpen, close: data.sundayClose },
        },
      });
    } catch (error: any) {
      console.error('Vendor registration error:', error);
      // Error is already handled by registerVendorAccount (shows toast)
      // If it's a rate limit error from our check, show it here too
      if (error?.message && error.message.includes('Too many registration attempts')) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 pb-12 bg-gradient-to-br from-[#fdf6f0] to-[#f8d7da]/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            {...fadeInUp}
          >
            <div className="flex items-center space-x-4 mb-8">
              {!hasSubmitted && (
                <Link to="/register">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
              )}
              <h1 className="text-3xl font-serif font-bold text-[#4e342e]">
                {hasSubmitted ? "Application Received" : "Vendor Registration"}
              </h1>
            </div>

            {hasSubmitted ? (
              <Card className="border-0 bg-white shadow-2xl rounded-3xl overflow-hidden p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-serif font-bold text-[#4e342e]">Successfully Submitted!</h2>
                  <p className="text-xl text-[#6d4c41]">
                    We've sent a verification link to your email address.
                    Please check your inbox and click the link to activate your account.
                  </p>
                  <p className="text-[#6d4c41] max-w-md mx-auto">
                    Note: After verifying your email, your account will be reviewed by our administration team.
                    You will receive another update once your vendor profile is approved.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => window.location.href = '/login'}
                    className="bg-[#4e342e] text-white px-8 py-3 rounded-xl text-lg"
                  >
                    Go to Login
                  </Button>
                </div>
              </Card>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isSubmitting || hasSubmitted) return;

                  handleSubmit(onSubmit)(e).then(() => {
                    setHasSubmitted(true);
                  });
                }}
                className="space-y-8"
              >
                {/* Personal Information */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-[#4e342e] font-medium">First Name</Label>
                        <Input
                          id="firstName"
                          {...register('firstName')}
                          className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-[#4e342e] font-medium">Last Name</Label>
                        <Input
                          id="lastName"
                          {...register('lastName')}
                          className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-[#4e342e] font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password" className="text-[#4e342e] font-medium">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...register('password')}
                          className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-[#4e342e] font-medium">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...register('confirmPassword')}
                          className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        />
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-[#4e342e] font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Business Information */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="shopname" className="text-[#4e342e] font-medium">Shop/Salon Name</Label>
                      <Input
                        id="shopname"
                        {...register('shopname')}
                        className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                      />
                      {errors.shopname && <p className="text-red-500 text-sm mt-1">{errors.shopname.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-[#4e342e] font-medium">Business Description</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        rows={4}
                        className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        placeholder="Describe your salon, services, and what makes you unique..."
                      />
                      {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="businessType" className="text-[#4e342e] font-medium">Business Type</Label>
                        <select
                          id="businessType"
                          {...register('businessType')}
                          className="mt-2 w-full px-3 py-2 border border-[#f8d7da] rounded-md focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        >
                          {businessTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="yearsInBusiness" className="text-[#4e342e] font-medium">Years in Business</Label>
                        <select
                          id="yearsInBusiness"
                          {...register('yearsInBusiness')}
                          className="mt-2 w-full px-3 py-2 border border-[#f8d7da] rounded-md focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        >
                          {yearsOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="numberOfEmployees" className="text-[#4e342e] font-medium">Number of Employees</Label>
                        <Input
                          id="numberOfEmployees"
                          type="number"
                          min="1"
                          {...register('numberOfEmployees')}
                          className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        />
                        {errors.numberOfEmployees && <p className="text-red-500 text-sm mt-1">{errors.numberOfEmployees.message}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="text-[#4e342e] font-medium">Street Address</Label>
                      <Input
                        id="address"
                        {...register('address')}
                        className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-[#4e342e] font-medium">City</Label>
                        <Input
                          id="city"
                          {...register('city')}
                          className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        />
                        {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-[#4e342e] font-medium">State/Province</Label>
                        <Input
                          id="state"
                          {...register('state')}
                          className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        />
                        {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="zipCode" className="text-[#4e342e] font-medium">Zip/Postal Code</Label>
                        <Input
                          id="zipCode"
                          {...register('zipCode')}
                          className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        />
                        {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Services Offered */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e]">Services Offered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableServices.map(service => (
                        <label
                          key={service}
                          className="flex items-center space-x-2 p-3 border border-[#f8d7da] rounded-lg hover:bg-[#f8d7da]/20 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={watch('servicesOffered').includes(service)}
                            onChange={() => handleServiceToggle(service)}
                            className="w-4 h-4 text-[#4e342e] border-[#f8d7da] rounded focus:ring-[#4e342e]/20"
                          />
                          <span className="text-sm text-[#4e342e]">{service}</span>
                        </label>
                      ))}
                    </div>
                    {errors.servicesOffered && <p className="text-red-500 text-sm mt-2">{errors.servicesOffered.message}</p>}
                  </CardContent>
                </Card>

                {/* Operating Hours */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e]">Operating Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <div key={day} className="grid grid-cols-3 gap-4 items-center">
                          <div className="capitalize font-medium text-[#4e342e]">{day}</div>
                          <div>
                            <Input
                              type="time"
                              {...register(`${day}Open` as keyof VendorRegistrationForm)}
                              className="border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                            />
                          </div>
                          <div>
                            <Input
                              type="time"
                              {...register(`${day}Close` as keyof VendorRegistrationForm)}
                              className="border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#4e342e] hover:bg-[#3b2c26] text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Register as Vendor
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegisterPage;
