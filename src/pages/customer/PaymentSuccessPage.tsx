import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/DashboardLayout';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Download,
  Home,
  Building,
  CreditCard,
  Smartphone,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface PaymentData {
  bookingData: {
    services: Array<{ id?: string; name: string; price: number; quantity: number; duration?: number; category?: string }>;
    serviceDetails?: Array<{ id?: string; name: string; price: number; quantity?: number; duration?: number; category?: string }>;
    date: string;
    time: string;
    notes?: string;
    beauticianPreference?: string;
    totalPrice: number;
    totalDuration?: number;
    type: string;
  };
  contactDetails?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
  };
  // New Structure
  cardDetails?: {
    number: string;
    name: string;
  };
  walletDetails?: {
    provider: string;
    phone: string;
  };
  // Keeping paymentForm optional for backward compatibility cleanup or just ignore
  paymentForm?: {
    method: string;
    cardNumber?: string;
    mobileNumber?: string;
    mobileProvider?: string;
  };
  transactionId: string;
  paymentStatus: string;
  booking?: any;
  bookingId?: string;
}

const PaymentSuccessPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = () => {
    try {
      const stored = sessionStorage.getItem('paymentData');
      if (stored) {
        const data = JSON.parse(stored);
        setPaymentData(data);
      } else {
        toast.error('No payment data found');
        navigate('/customer');
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Error loading payment data');
      navigate('/customer');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodDisplay = () => {
    if (!paymentData) return 'Unknown';
    if (paymentData.cardDetails) return 'Credit/Debit Card';
    if (paymentData.walletDetails) return 'Digital Wallet';
    if (paymentData.paymentForm?.method === 'card') return 'Credit/Debit Card';
    if (paymentData.paymentForm?.method === 'mobile') return 'Mobile Money';
    return 'Unknown';
  };

  const downloadInvoice = () => {
    if (!paymentData) return;

    const servicesForInvoice =
      paymentData.bookingData.serviceDetails && paymentData.bookingData.serviceDetails.length > 0
        ? paymentData.bookingData.serviceDetails
        : paymentData.bookingData.services;

    const addressLine = [
      paymentData.contactDetails?.street,
      paymentData.contactDetails?.city,
      paymentData.contactDetails?.state,
      paymentData.contactDetails?.zipCode
    ]
      .filter(Boolean)
      .join(', ');

    const invoiceContent = `
HOME BONZENGA - INVOICE
========================

Transaction ID: ${paymentData.transactionId}
Date: ${format(new Date(), "PPP")}
Payment Method: ${getPaymentMethodDisplay()}

BOOKING DETAILS:
- Service Type: ${paymentData.bookingData.type}
- Date: ${format(new Date(paymentData.bookingData.date), "PPP")}
- Time: ${paymentData.bookingData.time}
- Duration: ${(paymentData.bookingData.totalDuration || 0)} minutes
- Address: ${addressLine || 'Not provided'}

SERVICES:
${servicesForInvoice
        .map(service => `- ${service.name} (x${service.quantity || 1}) - ${(service.price * (service.quantity || 1)).toLocaleString()} CDF`)
        .join('\n')}

TOTAL: ${paymentData.bookingData.totalPrice.toLocaleString()} CDF

Payment Status: ${paymentData.paymentStatus.toUpperCase()}

Thank you for choosing Home Bonzenga!
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${paymentData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Invoice downloaded successfully!');
  };

  const clearSessionData = () => {
    sessionStorage.removeItem('selectedServices');
    sessionStorage.removeItem('bookingData');
    sessionStorage.removeItem('paymentData');
  };

  useEffect(() => {
    if (!paymentData || !user?.id) return;
    try {
      const key = `hb_dashboard_${user.id}`;
      const existingRaw = localStorage.getItem(key);
      let existing = existingRaw ? JSON.parse(existingRaw) : { bookings: [] };

      // Avoid duplicates if reloading page
      if (existing.bookings.some((b: any) => b.id === paymentData.booking?.id)) {
        return;
      }

      const newBookingId = paymentData.bookingId || `BK-${Date.now()}`;
      const primaryService =
        paymentData.bookingData.serviceDetails && paymentData.bookingData.serviceDetails.length > 0
          ? paymentData.bookingData.serviceDetails[0]
          : paymentData.bookingData.services[0];

      const newBooking = {
        id: newBookingId,
        bookingNumber: newBookingId,
        type: paymentData.bookingData.type,
        category: primaryService?.category || 'general',
        status: 'confirmed',
        paymentStatus: 'paid',
        scheduledDate: paymentData.bookingData.date,
        scheduledTime: paymentData.bookingData.time,
        total: paymentData.bookingData.totalPrice,
        beautician: undefined,
        services: (paymentData.bookingData.serviceDetails || paymentData.bookingData.services).map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration
        })),
        createdAt: new Date().toISOString(),
      };
      existing.bookings = [newBooking, ...(existing.bookings || [])];
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {
      // ignore
    }
  }, [paymentData, user?.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#4e342e] text-xl">Loading payment confirmation...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!paymentData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#4e342e] text-xl">No payment data found</div>
            <Button
              className="mt-4 bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              onClick={() => navigate('/customer')}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const addressLine = [
    paymentData.contactDetails?.street,
    paymentData.contactDetails?.city,
    paymentData.contactDetails?.state,
    paymentData.contactDetails?.zipCode
  ]
    .filter(Boolean)
    .join(', ');

  const isCard = !!paymentData.cardDetails || paymentData.paymentForm?.method === 'card';
  const isWallet = !!paymentData.walletDetails || paymentData.paymentForm?.method === 'mobile';

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-[#6d4c41] mb-2">
            Your booking has been confirmed and payment processed successfully.
          </p>
          <p className="text-sm text-[#6d4c41]">
            Transaction ID: <span className="font-mono font-medium">{paymentData.transactionId}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {paymentData.bookingData.type === 'At-Home Service' ? (
                    <Home className="w-5 h-5 text-[#4e342e]" />
                  ) : (
                    <Building className="w-5 h-5 text-[#4e342e]" />
                  )}
                  <div>
                    <p className="font-medium text-[#4e342e]">{paymentData.bookingData.type}</p>
                    <p className="text-sm text-[#6d4c41]">Service Type</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#4e342e]" />
                  <div>
                    <p className="font-medium text-[#4e342e]">
                      {format(new Date(paymentData.bookingData.date), "PPP")}
                    </p>
                    <p className="text-sm text-[#6d4c41]">Scheduled Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#4e342e]" />
                  <div>
                    <p className="font-medium text-[#4e342e]">{paymentData.bookingData.time}</p>
                    <p className="text-sm text-[#6d4c41]">Scheduled Time</p>
                  </div>
                </div>

                {addressLine && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#4e342e]" />
                    <div>
                      <p className="font-medium text-[#4e342e]">At-Home Service</p>
                      <p className="text-sm text-[#6d4c41]">{addressLine}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#4e342e]" />
                  <div>
                    <p className="font-medium text-[#4e342e]">
                      {paymentData.contactDetails?.phone || 'Not provided'}
                    </p>
                    <p className="text-sm text-[#6d4c41]">Contact Number</p>
                  </div>
                </div>

                {paymentData.bookingData.beauticianPreference && paymentData.bookingData.beauticianPreference !== 'any' && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#4e342e]" />
                    <div>
                      <p className="font-medium text-[#4e342e] capitalize">
                        {paymentData.bookingData.beauticianPreference.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-[#6d4c41]">Beautician Preference</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-serif text-[#4e342e] flex items-center gap-2">
                {isCard ? (
                  <CreditCard className="w-5 h-5" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-[#4e342e]">
                    {getPaymentMethodDisplay()}
                  </p>
                  <p className="text-sm text-[#6d4c41]">Payment Method</p>
                </div>

                {isCard && (
                  <div>
                    <p className="font-medium text-[#4e342e]">
                      {paymentData.cardDetails?.number
                        ? `**** **** **** ${paymentData.cardDetails.number.slice(-4)}`
                        : paymentData.paymentForm?.cardNumber
                          ? `**** **** **** ${paymentData.paymentForm.cardNumber.slice(-4)}`
                          : '****'}
                    </p>
                    <p className="text-sm text-[#6d4c41]">Card Number</p>
                  </div>
                )}

                {isWallet && (
                  <>
                    <div>
                      <p className="font-medium text-[#4e342e]">
                        {paymentData.walletDetails?.provider || paymentData.paymentForm?.mobileProvider || 'Wallet'}
                      </p>
                      <p className="text-sm text-[#6d4c41]">Provider</p>
                    </div>
                    <div>
                      <p className="font-medium text-[#4e342e]">
                        {paymentData.walletDetails?.phone || paymentData.paymentForm?.mobileNumber}
                      </p>
                      <p className="text-sm text-[#6d4c41]">Mobile Number</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="font-medium text-[#4e342e]">{paymentData.transactionId}</p>
                  <p className="text-sm text-[#6d4c41]">Transaction ID</p>
                </div>

                <div>
                  <p className="font-medium text-[#4e342e]">
                    {paymentData.bookingData.totalPrice.toLocaleString()} CDF
                  </p>
                  <p className="text-sm text-[#6d4c41]">Amount Paid</p>
                </div>

                <div>
                  <p className="font-medium text-green-600">PAID</p>
                  <p className="text-sm text-[#6d4c41]">Payment Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Summary */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-[#4e342e]">
              Services Booked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentData.bookingData.services.map((service, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-[#fdf6f0] rounded-lg">
                  <div>
                    <p className="font-medium text-[#4e342e]">{service.name}</p>
                    <p className="text-sm text-[#6d4c41]">
                      {service.quantity > 1 && `Quantity: ${service.quantity} • `}
                      Duration: {service.duration || 60} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#4e342e]">
                      {(service.price * service.quantity).toLocaleString()} CDF
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-[#4e342e]">Total Amount</span>
                <span className="text-[#4e342e]">
                  {paymentData.bookingData.totalPrice.toLocaleString()} CDF
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-0 shadow-lg mt-8 bg-[#fdf6f0]">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-[#4e342e]">
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-[#6d4c41]">
              <p>• You will receive a confirmation email shortly</p>
              <p>• Our team will assign a beautician to your booking</p>
              <p>• You'll receive a notification with beautician details</p>
              <p>• The beautician will arrive at the scheduled time</p>
              {paymentData.bookingData.notes && (
                <p>• Your special notes: "{paymentData.bookingData.notes}"</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            className="flex-1 bg-[#4e342e] hover:bg-[#3b2c26] text-white"
            onClick={() => {
              clearSessionData();
              navigate('/customer');
            }}
          >
            Go to Dashboard
          </Button>

          <Button
            variant="outline"
            className="flex-1 border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
            onClick={downloadInvoice}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </Button>

          <Button
            variant="outline"
            className="flex-1 border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
            onClick={() => {
              clearSessionData();
              navigate('/customer/at-home-services');
            }}
          >
            Book Another Service
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentSuccessPage;
