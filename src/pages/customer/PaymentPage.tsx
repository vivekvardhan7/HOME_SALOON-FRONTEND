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

// ... imports ...
import {
  MESSAGES,
  formatCardNumber,
  formatExpiryDate,
  formatCVV,
  formatName,
  formatPhoneNumber,
  validateCard,
  validateWallet,
} from '@/utils/paymentValidation';

// ... interfaces ...

const PaymentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  // Refactored State
  const [method, setMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [walletDetails, setWalletDetails] = useState({ provider: '', phone: '' });

  const [contactDetails, setContactDetails] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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

  const handleMethodChange = (val: string) => {
    setMethod(val);
    setErrors({});
    // Reset inputs if needed, or keep for UX
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate Contact Details
    if (!contactDetails.street) newErrors.street = MESSAGES.REQ_FIELDS;
    if (!contactDetails.city) newErrors.city = MESSAGES.REQ_FIELDS;
    if (contactDetails.street.length > 250) newErrors.street = MESSAGES.ADDRESS_LENGTH;

    // Strict Phone Validation for Contact
    if (!/^[0-9]{10}$/.test(contactDetails.phone.replace(/\D/g, ''))) {
      newErrors.contactPhone = MESSAGES.PHONE;
    }

    // Validate Payment
    if (method === 'card') {
      const cardErrors = validateCard(cardDetails.number, cardDetails.expiry, cardDetails.cvv, cardDetails.name);
      Object.assign(newErrors, cardErrors);
    } else {
      const walletErrors = validateWallet(walletDetails.provider, walletDetails.phone);
      Object.assign(newErrors, walletErrors);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
      toast.error(MESSAGES.REQ_FIELDS);
    } else {
      setErrors({});
    }
    return isValid;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

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

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing delay

      // ... (Rest of payload construction logic remains largely same, just using new state variables)
      const fullAddress = [
        contactDetails.street,
        contactDetails.city,
        contactDetails.state,
        contactDetails.zipCode
      ].filter(Boolean).join(', ');

      const slotDate = new Date(bookingData.date);
      const [hours, minutes] = bookingData.time.split(':');
      slotDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      const servicesPayload = bookingData.serviceDetails
        ? bookingData.serviceDetails.map(s => ({
          id: s.catalogServiceId || s.id,
          price: s.price,
          duration: s.duration,
          genderPreference: bookingData.beauticianPreference || 'any'
        }))
        : bookingData.services.map(s => ({
          id: 'legacy_id_placeholder',
          price: s.price,
          duration: 60,
          genderPreference: bookingData.beauticianPreference || 'any'
        }));

      const productsPayload = bookingData.productDetails
        ? bookingData.productDetails
          .filter(p => (p.quantity || 0) > 0)
          .map(p => ({
            id: p.productCatalogId || p.id,
            price: p.price,
            quantity: p.quantity
          }))
        : [];

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

      const bookingId = result.bookingId;

      const completeBooking = {
        id: bookingId,
        status: 'AWAITING_MANAGER',
        total: bookingData.totalPrice,
        scheduled_date: bookingData.date,
        scheduled_time: bookingData.time,
        address: { street: contactDetails.street, city: contactDetails.city }
      };

      const paymentData = {
        bookingData,
        contactDetails,
        cardDetails: method === 'card' ? cardDetails : undefined, // Store safe details? Maybe just last 4?
        walletDetails: method === 'wallet' ? walletDetails : undefined,
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

  // Handlers
  const handleCardChange = (field: string, value: string) => {
    let formatted = value;
    if (field === 'number') formatted = formatCardNumber(value);
    if (field === 'expiry') formatted = formatExpiryDate(value);
    if (field === 'cvv') formatted = formatCVV(value);
    if (field === 'name') formatted = formatName(value);

    setCardDetails(prev => ({ ...prev, [field]: formatted }));

    // Clear specific error
    const errField = field === 'name' ? 'cardName' : field === 'number' ? 'cardNumber' : field === 'expiry' ? 'expiryDate' : 'cvv';
    if (errors[errField]) {
      setErrors(prev => {
        const newErr = { ...prev };
        delete newErr[errField];
        return newErr;
      });
    }
  };

  if (loading) {
    // ... (Keep existing loading UI)
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
    // ... (Keep existing no data UI)
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
        {/* ... Header ... */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-[#4e342e] hover:text-[#3b2c26]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Booking
          </Button>
          <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-4">Complete Your Payment</h1>
          <p className="text-lg text-[#6d4c41]">Secure payment for your beauty service booking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Method Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-[#4e342e]">Choose Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={method} onValueChange={handleMethodChange} className="space-y-4">
                  <div className={`flex items-center space-x-2 p-4 border rounded-lg transition-colors cursor-pointer ${method === 'card' ? 'border-[#4e342e] bg-[#4e342e]/5' : 'border-[#fdf6f0] hover:bg-[#fdf6f0]'}`}>
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5 text-[#4e342e]" />
                      <span className="text-[#4e342e] font-medium">Credit/Debit Card</span>
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-2 p-4 border rounded-lg transition-colors cursor-pointer ${method === 'wallet' ? 'border-[#4e342e] bg-[#4e342e]/5' : 'border-[#fdf6f0] hover:bg-[#fdf6f0]'}`}>
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Smartphone className="w-5 h-5 text-[#4e342e]" />
                      <span className="text-[#4e342e] font-medium">Digital Wallet / UPI</span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Service Location */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Service Location & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serviceStreet">Street Address *</Label>
                  <Input
                    id="serviceStreet"
                    value={contactDetails.street}
                    onChange={(e) => setContactDetails(prev => ({ ...prev, street: e.target.value.slice(0, 250) }))}
                    className={errors.street ? 'border-red-500' : 'border-[#4e342e] text-[#4e342e]'}
                  />
                  {errors.street && <span className="text-xs text-red-500">{errors.street}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceCity">City *</Label>
                    <Input
                      id="serviceCity"
                      value={contactDetails.city}
                      onChange={(e) => setContactDetails(prev => ({ ...prev, city: e.target.value }))}
                      className={errors.city ? 'border-red-500' : 'border-[#4e342e] text-[#4e342e]'}
                    />
                    {errors.city && <span className="text-xs text-red-500">{errors.city}</span>}
                  </div>
                  <div>
                    <Label htmlFor="serviceState">State/Province</Label>
                    <Input
                      id="serviceState"
                      value={contactDetails.state}
                      onChange={(e) => setContactDetails(prev => ({ ...prev, state: e.target.value }))}
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceZip">Postal Code</Label>
                    <Input
                      id="serviceZip"
                      value={contactDetails.zipCode}
                      onChange={(e) => setContactDetails(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="border-[#4e342e] text-[#4e342e]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="servicePhone">Contact Phone *</Label>
                    <Input
                      id="servicePhone"
                      value={contactDetails.phone}
                      onChange={(e) => setContactDetails(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                      maxLength={10}
                      inputMode="numeric"
                      className={errors.contactPhone ? 'border-red-500' : 'border-[#4e342e] text-[#4e342e]'}
                    />
                    {errors.contactPhone && <span className="text-xs text-red-500">{errors.contactPhone}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            {method === 'card' ? (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Card Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded mb-2">
                    <span className="font-bold">Demo Mode:</span> Use any 16-digit number.
                  </div>
                  <div>
                    <Label htmlFor="cardName">Cardholder Name *</Label>
                    <Input
                      id="cardName"
                      value={cardDetails.name}
                      onChange={(e) => handleCardChange('name', e.target.value)}
                      className={errors.cardName ? 'border-red-500' : 'border-[#4e342e] text-[#4e342e]'}
                    />
                    {errors.cardName && <span className="text-xs text-red-500">{errors.cardName}</span>}
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      value={cardDetails.number}
                      onChange={(e) => handleCardChange('number', e.target.value)}
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength={19}
                      inputMode="numeric"
                      className={errors.cardNumber ? 'border-red-500' : 'border-[#4e342e] text-[#4e342e]'}
                    />
                    {errors.cardNumber && <span className="text-xs text-red-500">{errors.cardNumber}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date *</Label>
                      <Input
                        id="expiryDate"
                        value={cardDetails.expiry}
                        onChange={(e) => handleCardChange('expiry', e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={errors.expiryDate ? 'border-red-500' : 'border-[#4e342e] text-[#4e342e]'}
                      />
                      {errors.expiryDate && <span className="text-xs text-red-500">{errors.expiryDate}</span>}
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        value={cardDetails.cvv}
                        onChange={(e) => handleCardChange('cvv', e.target.value)}
                        placeholder="•••"
                        type="password"
                        maxLength={3}
                        inputMode="numeric"
                        className={errors.cvv ? 'border-red-500' : 'border-[#4e342e] text-[#4e342e]'}
                      />
                      {errors.cvv && <span className="text-xs text-red-500">{errors.cvv}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                    <Smartphone className="w-5 h-5" /> Digital Wallet Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Wallet Provider</Label>
                    <div className="flex gap-4 mt-2">
                      {['PhonePe', 'Google Pay', 'Paytm'].map(provider => (
                        <div
                          key={provider}
                          onClick={() => setWalletDetails(prev => ({ ...prev, provider }))}
                          className={`flex-1 text-center border p-3 rounded-md cursor-pointer text-sm font-medium transition-all ${walletDetails.provider === provider ? 'bg-[#4e342e] text-white border-[#4e342e]' : 'bg-white text-[#4e342e] hover:bg-[#f8d7da]/20'}`}
                        >
                          {provider}
                        </div>
                      ))}
                    </div>
                    {errors.walletProvider && <span className="text-xs text-red-500 mt-1 block">{errors.walletProvider}</span>}
                  </div>

                  <div>
                    <Label htmlFor="walletPhone">Wallet Mobile Number *</Label>
                    <Input
                      id="walletPhone"
                      value={walletDetails.phone}
                      onChange={(e) => setWalletDetails(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                      placeholder="10-digit number"
                      maxLength={10}
                      inputMode="numeric"
                      className={errors.walletPhone ? 'border-red-500' : 'border-[#4e342e] text-[#4e342e]'}
                    />
                    {errors.walletPhone && <span className="text-xs text-red-500">{errors.walletPhone}</span>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security */}
            <Card className="border-0 shadow-lg bg-[#fdf6f0]">
              <CardContent className="p-4 flex items-center gap-2 text-[#4e342e]">
                <Lock className="w-4 h-4" /> <span className="text-sm font-medium">Your payment information is secure and encrypted</span>
              </CardContent>
            </Card>
          </div>

          {/* Dictionary Summary (Right Column) - Keep exactly as is, just ensure variable names match */}
          {/* ... Summary UI ... */}
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
