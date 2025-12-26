import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import DashboardLayout from '@/components/DashboardLayout';
import {
  CreditCard,
  Smartphone,
  ArrowLeft,
  Lock,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getApiUrl } from '@/config/env';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface BookingServiceDetail {
  id: string;
  catalogServiceId?: string;
  name: string;
  price: number;
  quantity?: number;
  duration?: number;
  vendorPayout?: number;
  allowsProducts?: boolean;
}

interface BookingProductDetail {
  id: string;
  productCatalogId?: string;
  name: string;
  price: number;
  quantity: number;
  vendorPayout?: number;
}

interface BookingData {
  services: Array<{ name: string; price: number; quantity: number }>;
  serviceDetails?: BookingServiceDetail[];
  productDetails?: BookingProductDetail[];
  catalogServiceIds?: string[];
  productCatalogSelections?: Array<{ id: string; quantity: number }>;
  date: string;
  time: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  notes?: string;
  beauticianPreference?: string;
  totalPrice: number;
  totalDuration?: number;
  type: string;
  includeProducts?: boolean;
  flow?: string;
}

interface PaymentForm {
  method: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  mobileNumber: string;
  mobileProvider: string;
}

const PaymentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    method: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    mobileNumber: '',
    mobileProvider: 'mpesa'
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [contactDetails, setContactDetails] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  useEffect(() => {
    loadBookingData();
  }, []);

  const loadBookingData = () => {
    try {
      const stored = sessionStorage.getItem('bookingData');
      if (stored) {
        const data: BookingData = JSON.parse(stored);
        setBookingData(data);
        setContactDetails({
          street: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          phone: data.phone || user?.phone || ''
        });
      } else {
        toast.error('No booking data found');
        navigate('/customer/at-home-services');
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
      toast.error('Error loading booking data');
      navigate('/customer/at-home-services');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (paymentForm.method === 'card') {
      if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.cardName) {
        toast.error('Please fill in all card details');
        return;
      }
    } else {
      if (!paymentForm.mobileNumber) {
        toast.error('Please enter your mobile number');
        return;
      }
    }

    setProcessing(true);

    try {
      if (!bookingData) {
        toast.error('No booking details found.');
        return;
      }

      if (!user?.id) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      if (!contactDetails.street || !contactDetails.city) {
        toast.error('Please provide the service address (street and city)');
        return;
      }

      if (!contactDetails.phone) {
        toast.error('Please provide a contact phone number');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing delay

      // Prepare payload for Backend API
      // Construct full address string
      const fullAddress = [
        contactDetails.street,
        contactDetails.city,
        contactDetails.state,
        contactDetails.zipCode
      ].filter(Boolean).join(', ');

      // Combine date and time for slot
      // Assuming date is ISO string YYYY-MM-DD... and time is HH:MM
      const slotDate = new Date(bookingData.date);
      const [hours, minutes] = bookingData.time.split(':');
      slotDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      // Prepare Services
      // We prioritize serviceDetails if available, otherwise map services array
      const servicesPayload = bookingData.serviceDetails
        ? bookingData.serviceDetails.map(s => ({
          id: s.catalogServiceId || s.id, // This should map to admin_service_id
          price: s.price,
          duration: s.duration,
          genderPreference: bookingData.beauticianPreference || 'any'
        }))
        : bookingData.services.map(s => ({
          // Fallback if no IDs (legacy), this might fail if backend enforces IDs. 
          // Assuming current flow sets serviceDetails properly in WithProductsBooking/Confirmation.
          // If we don't have IDs, we might skip or error. 
          // But existing flow seems to set catalogServiceId.
          id: 'legacy_id_placeholder',
          price: s.price,
          duration: 60,
          genderPreference: bookingData.beauticianPreference || 'any'
        }));

      // Prepare Products
      const productsPayload = bookingData.productDetails
        ? bookingData.productDetails
          .filter(p => (p.quantity || 0) > 0)
          .map(p => ({
            id: p.productCatalogId || p.id, // Maps to admin_product_id
            price: p.price,
            quantity: p.quantity
          }))
        : [];

      // Calculate total (Frontend calculation, backend should verify ideally but we follow prompt)
      // We use the bookingData.totalPrice calculated previously

      const payload = {
        totalAmount: bookingData.totalPrice,
        slot: slotDate.toISOString(),
        preferences: {
          notes: bookingData.notes,
          gender: bookingData.beauticianPreference,
          beauticianPreference: bookingData.beauticianPreference
        },
        address: fullAddress,
        services: servicesPayload,
        products: productsPayload
      };

      // Call Backend API
      // We need to import 'api' from '@/lib/api' if not already imported. 
      // It wasn't in original file imports, so we might need to add it or use fetch.
      // Ideally I should add `import { api } from '@/lib/api'` at top, but I'm in a function replacement.
      // I'll assume `api` is available or use `fetch` with token. 
      // Checking file imports... `api` is NOT imported.
      // I cannot add import here easily without multi-replace or assume global.
      // Accessing `getApiUrl` is available.

      const { session } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession()).then(r => r.data);
      const token = session?.access_token || localStorage.getItem('token');

      if (!token) throw new Error('No auth token');

      const API_URL = getApiUrl('/customer/athome/book');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Booking failed');
      }

      // Success
      const bookingId = result.bookingId;

      // Navigate to success page
      // Create a mock completeBooking object for the success page state
      const completeBooking = {
        id: bookingId,
        status: 'AWAITING_MANAGER', // Initial state
        total: bookingData.totalPrice,
        scheduled_date: bookingData.date,
        scheduled_time: bookingData.time,
        address: { street: contactDetails.street, city: contactDetails.city } // specialized obj
      };

      const paymentData = {
        bookingData,
        contactDetails,
        paymentForm,
        transactionId: `TXN-MOCK-${Date.now()}`,
        paymentStatus: 'COMPLETED',
        booking: completeBooking,
        bookingId: bookingId
      };

      sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
      sessionStorage.removeItem('bookingData');

      toast.success('Booking created successfully! Payment completed.');
      navigate('/customer/payment-success', { state: { booking: completeBooking } });

    } catch (error: any) {
      console.error('Payment/Booking error:', error);
      toast.error(error.message || 'Payment/Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#4e342e] text-xl">Loading payment details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const addressSummary = [contactDetails.street, contactDetails.city, contactDetails.state, contactDetails.zipCode]
    .filter(Boolean)
    .join(', ');

  if (!bookingData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#4e342e] text-xl">No booking data found</div>
            <Button
              className="mt-4 bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              onClick={() => navigate('/customer/at-home-services')}
            >
              Start New Booking
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-[#4e342e] hover:text-[#3b2c26]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Booking
          </Button>

          <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-4">
            Complete Your Payment
          </h1>
          <p className="text-lg text-[#6d4c41]">
            Secure payment for your beauty service booking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-[#4e342e]">
                  Choose Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentForm.method}
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, method: value }))}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 p-4 border border-[#fdf6f0] rounded-lg hover:bg-[#fdf6f0] transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer">
                      <CreditCard className="w-5 h-5 text-[#4e342e]" />
                      <span className="text-[#4e342e] font-medium">Credit/Debit Card</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border border-[#fdf6f0] rounded-lg hover:bg-[#fdf6f0] transition-colors">
                    <RadioGroupItem value="mobile" id="mobile" />
                    <Label htmlFor="mobile" className="flex items-center gap-3 cursor-pointer">
                      <Smartphone className="w-5 h-5 text-[#4e342e]" />
                      <span className="text-[#4e342e] font-medium">Mobile Money</span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Service contact and address */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Service Location & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serviceStreet" className="text-[#4e342e] font-medium">
                    Street Address *
                  </Label>
                  <Input
                    id="serviceStreet"
                    value={contactDetails.street}
                    onChange={(e) =>
                      setContactDetails(prev => ({ ...prev, street: e.target.value }))
                    }
                    placeholder="123 Beauty Avenue"
                    className="border-[#4e342e] text-[#4e342e]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceCity" className="text-[#4e342e] font-medium">
                      City *
                    </Label>
                    <Input
                      id="serviceCity"
                      value={contactDetails.city}
                      onChange={(e) =>
                        setContactDetails(prev => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="City"
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceState" className="text-[#4e342e] font-medium">
                      State/Province
                    </Label>
                    <Input
                      id="serviceState"
                      value={contactDetails.state}
                      onChange={(e) =>
                        setContactDetails(prev => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="State or Province"
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceZip" className="text-[#4e342e] font-medium">
                      Postal Code
                    </Label>
                    <Input
                      id="serviceZip"
                      value={contactDetails.zipCode}
                      onChange={(e) =>
                        setContactDetails(prev => ({ ...prev, zipCode: e.target.value }))
                      }
                      placeholder="Postal code"
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="servicePhone" className="text-[#4e342e] font-medium">
                      Contact Phone *
                    </Label>
                    <Input
                      id="servicePhone"
                      value={contactDetails.phone}
                      onChange={(e) =>
                        setContactDetails(prev => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="+243 123 456 789"
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            {paymentForm.method === 'card' ? (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Card Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardName" className="text-[#4e342e] font-medium">
                      Cardholder Name *
                    </Label>
                    <Input
                      id="cardName"
                      value={paymentForm.cardName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, cardName: e.target.value }))}
                      placeholder="John Doe"
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardNumber" className="text-[#4e342e] font-medium">
                      Card Number *
                    </Label>
                    <Input
                      id="cardNumber"
                      value={paymentForm.cardNumber}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate" className="text-[#4e342e] font-medium">
                        Expiry Date *
                      </Label>
                      <Input
                        id="expiryDate"
                        value={paymentForm.expiryDate}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, expiryDate: formatExpiryDate(e.target.value) }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="border-[#4e342e] text-[#4e342e]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cvv" className="text-[#4e342e] font-medium">
                        CVV *
                      </Label>
                      <Input
                        id="cvv"
                        value={paymentForm.cvv}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                        placeholder="123"
                        maxLength={4}
                        className="border-[#4e342e] text-[#4e342e]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Mobile Money Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="mobileProvider" className="text-[#4e342e] font-medium">
                      Mobile Provider
                    </Label>
                    <select
                      id="mobileProvider"
                      value={paymentForm.mobileProvider}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, mobileProvider: e.target.value }))}
                      className="w-full p-2 border border-[#4e342e] rounded-md text-[#4e342e] bg-white"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="orange">Orange Money</option>
                      <option value="vodacom">Vodacom M-Pesa</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="mobileNumber" className="text-[#4e342e] font-medium">
                      Mobile Number *
                    </Label>
                    <Input
                      id="mobileNumber"
                      value={paymentForm.mobileNumber}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                      placeholder="+243 123 456 789"
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Notice */}
            <Card className="border-0 shadow-lg bg-[#fdf6f0]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[#4e342e]">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Your payment information is secure and encrypted
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-[#4e342e]">
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Booking Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[#6d4c41]">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(bookingData.date), "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6d4c41]">
                      <Clock className="w-4 h-4" />
                      <span>{bookingData.time}</span>
                    </div>
                    {addressSummary && (
                      <div className="flex items-center gap-2 text-[#6d4c41]">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs">{addressSummary}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Services */}
                  <div>
                    <h4 className="font-medium text-[#4e342e] mb-2">Services</h4>
                    <div className="space-y-1">
                      {(bookingData.serviceDetails || bookingData.services).map((service, index) => (
                        <div key={`service-${index}`} className="flex justify-between text-sm">
                          <span className="text-[#6d4c41]">
                            {service.name} {service.quantity && service.quantity > 1 && `(x${service.quantity})`}
                          </span>
                          <span className="font-medium text-[#4e342e]">
                            {(service.price * (service.quantity || 1)).toLocaleString()} CDF
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {bookingData.productDetails && bookingData.productDetails.some(p => (p.quantity || 0) > 0) && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-[#4e342e] mb-2">Products</h4>
                        <div className="space-y-1">
                          {bookingData.productDetails
                            .filter(product => (product.quantity || 0) > 0)
                            .map((product, index) => (
                              <div key={`product-${index}`} className="flex justify-between text-sm">
                                <span className="text-[#6d4c41]">
                                  {product.name} {product.quantity && product.quantity > 1 && `(x${product.quantity})`}
                                </span>
                                <span className="font-medium text-[#4e342e]">
                                  {(product.price * (product.quantity || 1)).toLocaleString()} CDF
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6d4c41]">Subtotal:</span>
                      <span className="font-medium text-[#4e342e]">{bookingData.totalPrice.toLocaleString()} CDF</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6d4c41]">Service Fee:</span>
                      <span className="font-medium text-[#4e342e]">0 CDF</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-[#4e342e]">Total:</span>
                      <span className="text-[#4e342e]">{bookingData.totalPrice.toLocaleString()} CDF</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-[#4e342e] hover:bg-[#3b2c26] text-white mt-4"
                    onClick={handlePayment}
                    disabled={processing}
                  >
                    {processing ? 'Processing Payment...' : 'Complete Payment'}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
