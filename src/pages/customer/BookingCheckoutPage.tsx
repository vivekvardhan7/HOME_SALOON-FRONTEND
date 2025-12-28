import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/env';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  CreditCard,
  Smartphone,
  Wallet,
  ArrowLeft,
  CheckCircle,
  User,
  Building,
  ShoppingCart,
  Shield
} from 'lucide-react';
import {
  MESSAGES,
  formatCardNumber,
  formatExpiryDate,
  formatCVV,
  formatName,
  formatUPI,
  formatPhoneNumber,
  validateCustomerInfo,
  validateCard,
  validateUPI,
  validateWallet
} from '@/utils/paymentValidation';

interface BookingData {
  vendor: any;
  services: any[];
  products: any[];
}

const BookingCheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Payment States
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [walletDetails, setWalletDetails] = useState({ provider: '', phone: '' });

  // Customer Info State
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const availableTimeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  useEffect(() => {
    if (location.state) {
      setBookingData(location.state as BookingData);
    } else {
      navigate('/salon-visit');
    }
  }, [location.state, navigate]);

  const getTotalPrice = () => {
    if (!bookingData) return 0;
    const servicesTotal = bookingData.services.reduce((sum, service) => sum + service.price, 0);
    const productsTotal = bookingData.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    return servicesTotal + productsTotal;
  };

  const validateCurrentSection = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate Customer Info
    const infoErrors = validateCustomerInfo(customerInfo.name, customerInfo.phone, customerInfo.email);
    Object.assign(newErrors, infoErrors);
    if (customerInfo.address.length > 250) newErrors.address = MESSAGES.ADDRESS_LENGTH;

    // Validate Payment
    if (paymentMethod === 'card') {
      const cardErrors = validateCard(cardDetails.number, cardDetails.expiry, cardDetails.cvv, cardDetails.name);
      Object.assign(newErrors, cardErrors);
    } else if (paymentMethod === 'upi') {
      const upiErrors = validateUPI(upiId);
      Object.assign(newErrors, upiErrors);
    } else if (paymentMethod === 'wallet') {
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

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    setErrors({});
    if (value === 'card') {
      setUpiId('');
      setWalletDetails({ provider: '', phone: '' });
    } else if (value === 'upi') {
      setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
      setWalletDetails({ provider: '', phone: '' });
    } else {
      setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
      setUpiId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCurrentSection()) {
      setShowPaymentModal(true);
    }
  };

  const confirmBooking = async () => {
    setLoading(true);
    setShowPaymentModal(false);

    try {
      const token = localStorage.getItem('token');
      // const currentUser = user || { id: 'guest', email: customerInfo.email }; // Unused

      const transformedServices = (bookingData?.services || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration
      }));

      const bookingPayload = {
        vendorId: bookingData?.vendor?.id,
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email
        },
        appointment: {
          date: selectedDate,
          time: selectedTime,
          notes: customerInfo.notes || ''
        },
        services: transformedServices,
        totalAmount: getTotalPrice()
      };

      console.log('Sending At-Salon Booking Payload:', bookingPayload);

      const response = await fetch(getApiUrl('at-salon-booking'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(bookingPayload)
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (response.ok) {
          const bookingId = result.bookingId;
          toast.success('Booking confirmed successfully!');
          navigate('/booking/success', {
            state: {
              bookingId,
              vendor: bookingData?.vendor,
              total: getTotalPrice(),
              date: selectedDate,
              time: selectedTime,
              services: bookingData?.services
            }
          });
          return;
        } else {
          throw new Error(result.error || 'Booking failed');
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Booking failed:', error);
      toast.error(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Input Handlers
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

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4e342e] mx-auto mb-4"></div>
            <p className="text-[#6d4c41]">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 pb-12 bg-gradient-to-br from-[#fdf6f0] to-[#f8d7da]/20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp}>
            <div className="flex items-center space-x-4 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e]">Complete Your Booking</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Booking Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Vendor Info */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      Booking Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                        <Building className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#4e342e]">{bookingData.vendor.name}</h3>
                        <div className="flex items-center space-x-2 text-[#6d4c41]">
                          <MapPin className="w-4 h-4" />
                          <span>{bookingData.vendor.address}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Date & Time Selection */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Select Date & Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="date" className="text-[#4e342e] font-medium">Select Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-[#4e342e] font-medium">Available Time Slots</Label>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-3">
                        {availableTimeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? "default" : "outline"}
                            onClick={() => setSelectedTime(time)}
                            className={`${selectedTime === time
                              ? 'bg-[#4e342e] text-white'
                              : 'border-[#f8d7da] text-[#4e342e] hover:bg-[#f8d7da]/20'
                              }`}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Your Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-[#4e342e] font-medium">Full Name</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: formatName(e.target.value) }))}
                          className={`mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20 ${errors.name ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-[#4e342e] font-medium">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                          maxLength={10}
                          inputMode="numeric"
                          className={`mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20 ${errors.phone ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-[#4e342e] font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        className={`mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20 ${errors.email ? 'border-red-500' : ''}`}
                        required
                      />
                      {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-[#4e342e] font-medium">Address</Label>
                      <Textarea
                        id="address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value.slice(0, 250) }))}
                        className={`mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20 ${errors.address ? 'border-red-500' : ''}`}
                        rows={3}
                        required
                      />
                      {errors.address && <span className="text-xs text-red-500">{errors.address}</span>}
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-[#4e342e] font-medium">Special Instructions (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value.slice(0, 200) }))}
                        className="mt-2 border-[#f8d7da] focus:border-[#4e342e] focus:ring-[#4e342e]/20"
                        rows={3}
                        placeholder="Any special requests or notes for your appointment..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                      <div className="space-y-4">
                        <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-[#4e342e] bg-[#4e342e]/5' : 'border-[#f8d7da] hover:bg-[#f8d7da]/10'}`}>
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <CreditCard className="w-5 h-5 text-[#4e342e]" />
                            <span className="text-[#4e342e] font-medium">Credit/Debit Card</span>
                          </Label>
                        </div>

                        <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-[#4e342e] bg-[#4e342e]/5' : 'border-[#f8d7da] hover:bg-[#f8d7da]/10'}`}>
                          <RadioGroupItem value="upi" id="upi" />
                          <Label htmlFor="upi" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <Smartphone className="w-5 h-5 text-[#4e342e]" />
                            <span className="text-[#4e342e] font-medium">UPI Payment</span>
                          </Label>
                        </div>

                        <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'wallet' ? 'border-[#4e342e] bg-[#4e342e]/5' : 'border-[#f8d7da] hover:bg-[#f8d7da]/10'}`}>
                          <RadioGroupItem value="wallet" id="wallet" />
                          <Label htmlFor="wallet" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <Wallet className="w-5 h-5 text-[#4e342e]" />
                            <span className="text-[#4e342e] font-medium">Digital Wallet</span>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    <div className="mt-6 p-4 bg-[#fdf6f0] rounded-lg border border-[#f8d7da]">
                      {paymentMethod === 'card' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[#6d4c41] text-sm font-medium">
                            <Shield className='w-4 h-4' />
                            Demo Payment - No real transaction
                          </div>
                          <div className="space-y-2">
                            <Label>Card Number</Label>
                            <Input
                              placeholder="XXXX XXXX XXXX XXXX"
                              value={cardDetails.number}
                              onChange={e => handleCardChange('number', e.target.value)}
                              maxLength={19}
                              inputMode="numeric"
                              className={errors.cardNumber ? 'border-red-500' : 'border-[#f8d7da] focus:border-[#4e342e]'}
                            />
                            {errors.cardNumber && <span className="text-xs text-red-500">{errors.cardNumber}</span>}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Expiry Date</Label>
                              <Input
                                placeholder="MM/YY"
                                value={cardDetails.expiry}
                                onChange={e => handleCardChange('expiry', e.target.value)}
                                maxLength={5}
                                className={errors.expiryDate ? 'border-red-500' : 'border-[#f8d7da] focus:border-[#4e342e]'}
                              />
                              {errors.expiryDate && <span className="text-xs text-red-500">{errors.expiryDate}</span>}
                            </div>
                            <div className="space-y-2">
                              <Label>CVV</Label>
                              <Input
                                placeholder="•••"
                                type="password"
                                value={cardDetails.cvv}
                                onChange={e => handleCardChange('cvv', e.target.value)}
                                maxLength={3}
                                inputMode="numeric"
                                className={errors.cvv ? 'border-red-500' : 'border-[#f8d7da] focus:border-[#4e342e]'}
                              />
                              {errors.cvv && <span className="text-xs text-red-500">{errors.cvv}</span>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Cardholder Name</Label>
                            <Input
                              placeholder="Name on card"
                              value={cardDetails.name}
                              onChange={e => handleCardChange('name', e.target.value)}
                              className={errors.cardName ? 'border-red-500' : 'border-[#f8d7da] focus:border-[#4e342e]'}
                            />
                            {errors.cardName && <span className="text-xs text-red-500">{errors.cardName}</span>}
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'upi' && (
                        <div className="space-y-4">
                          <Label>UPI ID</Label>
                          <Input
                            placeholder="username@bank"
                            value={upiId}
                            onChange={e => setUpiId(formatUPI(e.target.value))}
                            className={errors.upiId ? 'border-red-500' : 'border-[#f8d7da] focus:border-[#4e342e]'}
                          />
                          {errors.upiId && <span className="text-xs text-red-500">{errors.upiId}</span>}
                          <p className="text-xs text-[#6d4c41]">Example: yourname@oksbi</p>
                        </div>
                      )}

                      {paymentMethod === 'wallet' && (
                        <div className="space-y-4">
                          <Label>Select Wallet</Label>
                          <div className="flex gap-4">
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
                          {errors.walletProvider && <span className="text-xs text-red-500">{errors.walletProvider}</span>}

                          <div className="space-y-2">
                            <Label>Wallet Mobile Number</Label>
                            <Input
                              placeholder="10-digit number"
                              value={walletDetails.phone}
                              onChange={e => setWalletDetails(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                              maxLength={10}
                              inputMode="numeric"
                              className={errors.walletPhone ? 'border-red-500' : 'border-[#f8d7da] focus:border-[#4e342e]'}
                            />
                            {errors.walletPhone && <span className="text-xs text-red-500">{errors.walletPhone}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="border-0 bg-white shadow-lg sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Services */}
                      {bookingData.services.map((service) => (
                        <div key={service.id} className="flex justify-between items-center p-3 bg-[#f8d7da]/20 rounded-lg">
                          <div>
                            <p className="font-medium text-[#4e342e]">{service.name}</p>
                            <p className="text-sm text-[#6d4c41]">{service.duration} min</p>
                          </div>
                          <span className="font-semibold text-[#4e342e]">${service.price}</span>
                        </div>
                      ))}

                      {/* Products */}
                      {bookingData.products.map((product) => (
                        <div key={product.id} className="flex justify-between items-center p-3 bg-[#f8d7da]/20 rounded-lg">
                          <div>
                            <p className="font-medium text-[#4e342e]">{product.name}</p>
                            <p className="text-sm text-[#6d4c41]">Qty: {product.quantity}</p>
                          </div>
                          <span className="font-semibold text-[#4e342e]">${product.price * product.quantity}</span>
                        </div>
                      ))}

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-bold text-[#4e342e]">
                          <span>Total</span>
                          <span>${getTotalPrice()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-[#6d4c41]">
                        <Shield className="w-4 h-4" />
                        <span>Secure payment processing</span>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#4e342e] hover:bg-[#6d4c41] text-white py-3"
                        disabled={loading || !selectedDate || !selectedTime}
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Booking
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-serif font-bold text-[#4e342e] mb-4">
              Confirm Payment
            </h3>
            <p className="text-[#6d4c41] mb-6">
              You will be charged <span className="font-bold text-[#4e342e]">${getTotalPrice()}</span> for this booking.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="flex-1 border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                onClick={() => setShowPaymentModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                onClick={confirmBooking}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm & Pay'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BookingCheckoutPage;
