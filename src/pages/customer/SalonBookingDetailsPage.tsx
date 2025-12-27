
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Clock, MapPin, Phone, User, CheckCircle, CreditCard, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface SalonBookingDetails {
    id: string;
    booking_status: string;
    appointment_date: string;
    appointment_time: string;
    total_amount: number;
    payment_status: string;
    transaction_id?: string;
    services: {
        id?: string;
        name: string;
        price: number;
        duration?: number;
    }[];
    vendor: {
        id: string;
        shopname: string;
        address: string;
        city: string;
        phone?: string;
    };
    created_at: string;
    customer_name: string;
    customer_phone: string;
}

const SalonBookingDetailsPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<SalonBookingDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const steps = [
        { key: 'PAID', label: t('bookings.details.steps.paymentSuccess') },
        { key: 'CONFIRMED', label: t('bookings.details.steps.bookingConfirmed') || 'Booking Confirmed' },
        { key: 'COMPLETED', label: t('bookings.details.steps.serviceCompleted') }
    ];

    useEffect(() => {
        if (id) fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('vendor_orders')
                .select(`
                    *,
                    vendor:vendor!vendor_id(*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setBooking(data as SalonBookingDetails);
            }
        } catch (error) {
            console.error('Error fetching salon booking details:', error);
            toast.error(t('bookings.details.failedToLoadDetails'));
            navigate('/customer/bookings');
        } finally {
            setLoading(false);
        }
    };

    const isStepCompleted = (stepKey: string) => {
        if (!booking) return false;

        if (stepKey === 'PAID') {
            return booking.payment_status === 'PAID' || booking.payment_status === 'COMPLETED';
        }
        if (stepKey === 'CONFIRMED') {
            return ['CONFIRMED', 'COMPLETED'].includes(booking.booking_status?.toUpperCase());
        }
        if (stepKey === 'COMPLETED') {
            return booking.booking_status?.toUpperCase() === 'COMPLETED';
        }

        return false;
    };

    const getCurrentStepIndex = () => {
        if (!booking) return 0;
        let maxIndex = 0;
        steps.forEach((step, idx) => {
            if (isStepCompleted(step.key)) maxIndex = idx;
        });
        return maxIndex;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
                </div>
            </DashboardLayout>
        );
    }

    if (!booking) return null;

    const currentStepIndex = getCurrentStepIndex();

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => navigate('/customer/bookings')} className="pl-0 gap-2">
                    <ArrowLeft className="w-4 h-4" /> {t('bookings.details.backToBookings')}
                </Button>


                <div className="grid grid-cols-1 gap-6">
                    {/* Details */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl text-[#4e342e]">{t('bookings.details.bookingId')} {booking.id.toString().slice(0, 8).toUpperCase()}</CardTitle>
                                        <CardDescription>
                                            {t('bookings.details.bookedOn')} {new Date(booking.created_at).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-[#4e342e]">{booking.booking_status}</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Vendor Info */}
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Scissors className="w-4 h-4" /> {t('bookings.details.salonDetails') || 'Salon Details'}
                                    </h3>
                                    <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-lg border border-amber-100">
                                        <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold text-lg">
                                            {booking.vendor?.shopname?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{booking.vendor?.shopname || 'Salon'}</div>
                                            <div className="text-sm text-gray-600 flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {booking.vendor?.phone || 'Contact via Salon'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Time & Location */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">{t('bookings.details.scheduledTime')}</h4>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Clock className="w-4 h-4 text-[#4e342e]" />
                                            <span>
                                                {new Date(booking.appointment_date).toLocaleDateString()} at {booking.appointment_time}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">{t('bookings.details.location')}</h4>
                                        <div className="flex items-start gap-2 text-gray-900">
                                            <MapPin className="w-4 h-4 text-[#4e342e] mt-1" />
                                            <span className="text-sm">
                                                {booking.vendor?.address}, {booking.vendor?.city}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Services */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-3">{t('bookings.details.orderSummary')}</h4>
                                    <div className="space-y-3">
                                        {Array.isArray(booking.services) && booking.services.map((s, i) => (
                                            <div key={`s-${i}`} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#4e342e]" />
                                                    <span>{s.name}</span>
                                                </div>
                                                <span className="font-medium">₹{s.price}</span>
                                            </div>
                                        ))}
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center font-bold text-base pt-2">
                                            <span>{t('bookings.details.totalAmount') || 'Total Amount'}</span>
                                            <span className="text-[#4e342e]">₹{booking.total_amount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t('bookings.details.customerDetails') || 'Customer Details'}</h4>
                                    <div className="text-sm space-y-1">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span>{booking.customer_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{booking.customer_phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SalonBookingDetailsPage;
