
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Clock, MapPin, Phone, User, CheckCircle, Circle, Cross, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface LiveUpdate {
    id: string;
    status: string; // 'PAYMENT_SUCCESS', 'BEAUTICIAN_ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED', 'COMPLETED'
    message: string;
    created_at: string;
}

interface BookingDetails {
    id: string;
    status: string;
    slot: string;
    address: any;
    total_amount: number;
    beautician?: {
        name: string;
        phone: string;
        avatar?: string;
    };
    services: {
        master: { name: string; duration: number; duration_minutes?: number; price: number };
    }[];
    products: {
        master: { name: string; price: number; image_url?: string };
        quantity: number;
    }[];
    live_updates: LiveUpdate[];
    created_at: string;
}

const AtHomeBookingDetailsPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    const steps = [
        { key: 'PAYMENT_SUCCESS', label: t('bookings.details.steps.paymentSuccess') },
        { key: 'BEAUTICIAN_ASSIGNED', label: t('bookings.details.steps.beauticianAssigned') },
        { key: 'COMPLETED', label: t('bookings.details.steps.serviceCompleted') }
    ];

    useEffect(() => {
        if (id) fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/customer/athome-bookings/${id}`);
            const data = response.data as any;
            if (data?.success) {
                setBooking(data.data);
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            toast.error(t('bookings.details.failedToLoadDetails'));
            navigate('/customer/bookings');
        } finally {
            setLoading(false);
        }
    };

    const isStepCompleted = (stepKey: string) => {
        if (!booking?.live_updates) return false;

        // Manual mapping for simplified steps
        if (stepKey === 'BEAUTICIAN_ASSIGNED') {
            return booking.live_updates.some(u => ['BEAUTICIAN_ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'SERVICE_STARTED', 'COMPLETED'].includes(u.status));
        }
        if (stepKey === 'COMPLETED') {
            return booking.live_updates.some(u => u.status === 'COMPLETED');
        }

        return booking.live_updates?.some(u => u.status === stepKey) || false;
    };

    const getStepTime = (stepKey: string) => {
        // Find exact match first
        let update = booking?.live_updates?.find(u => u.status === stepKey);

        // Fallback for combined steps
        if (!update && stepKey === 'BEAUTICIAN_ASSIGNED') {
            update = booking?.live_updates?.find(u => u.status === 'BEAUTICIAN_ASSIGNED');
        }

        return update ? new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    };

    const getCurrentStepIndex = () => {
        if (!booking?.live_updates) return 0;
        let maxIndex = 0;
        // Simple logic based on isStepCompleted
        steps.forEach((step, idx) => {
            if (isStepCompleted(step.key)) maxIndex = idx;
        });
        return maxIndex;
    };

    const handleDownloadInvoice = async () => {
        try {
            toast.loading(t('bookings.details.generatingInvoice'));
            const genRes = await api.post(`/invoices/generate/${id}`);
            const data = genRes.data as any;
            if (data.success) {
                toast.dismiss();
                toast.success(t('bookings.details.invoiceReady'));
                // Trigger download
                window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/invoices/download/${id}`, '_blank');
            } else {
                toast.dismiss();
                toast.error(data.message || t('bookings.details.failedToGenerateInvoice'));
            }
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error(t('bookings.details.errorDownloadingInvoice'));
        }
    };

    const handleCompleteService = async () => {
        if (!confirm(t('bookings.details.confirmCompletion'))) return;
        setCompleting(true);
        try {
            toast.loading(t('bookings.details.updatingStatus'));
            const response = await api.post(`/customer/athome-bookings/${id}/complete`);
            const data = response.data as any;
            if (data.success) {
                toast.dismiss();
                toast.success(t('bookings.details.serviceMarkedCompleted'));
                fetchBookingDetails(); // Refresh
            } else {
                toast.dismiss();
                toast.error(data.message || t('bookings.details.failedToUpdateStatus'));
                setCompleting(false);
            }
        } catch (error: any) {
            console.error('Completion Error:', error);
            toast.dismiss();
            const errorMessage = error.response?.data?.message || t('bookings.details.failedToUpdateStatus');
            toast.error(errorMessage);
            setCompleting(false);
        }
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl text-[#4e342e]">{t('bookings.details.bookingId')}{booking.id.slice(0, 8)}</CardTitle>
                                        <CardDescription>
                                            {t('bookings.details.bookedOn')} {new Date(booking.created_at).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-[#4e342e]">{booking.status}</Badge>
                                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={handleDownloadInvoice}>
                                            {t('bookings.details.downloadInvoice')}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Beautician Info */}
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" /> {t('bookings.details.assignedBeautician')}
                                    </h3>
                                    {booking.beautician ? (
                                        <div className="flex items-center gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                                            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                                                {booking.beautician.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{booking.beautician.name}</div>
                                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {booking.beautician.phone}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800 text-sm">
                                            {t('bookings.details.beauticianAssignedDesc')}
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Time & Location */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">{t('bookings.details.scheduledTime')}</h4>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Clock className="w-4 h-4 text-[#4e342e]" />
                                            <span>
                                                {new Date(booking.slot).toLocaleDateString()} at {new Date(booking.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">{t('bookings.details.location')}</h4>
                                        <div className="flex items-start gap-2 text-gray-900">
                                            <MapPin className="w-4 h-4 text-[#4e342e] mt-1" />
                                            <span className="text-sm">
                                                {typeof booking.address === 'string' ? booking.address : `${booking.address.street || ''}, ${booking.address.city || ''}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Services & Products */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-3">{t('bookings.details.orderSummary')}</h4>
                                    <div className="space-y-3">
                                        {booking.services.map((s, i) => (
                                            <div key={`s-${i}`} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#4e342e]" />
                                                    <span>{s.master?.name}</span>
                                                </div>
                                                <span className="font-medium">{s.master?.duration_minutes || s.master?.duration} min</span>
                                            </div>
                                        ))}
                                        {booking.products.map((p, i) => (
                                            <div key={`p-${i}`} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span>{p.master?.name} (x{p.quantity})</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Customer Completion Button */}
                                {(booking.status === 'ASSIGNED' || booking.status === 'ACCEPTED' || booking.status === 'ON_THE_WAY' || booking.status === 'ARRIVED' || booking.status === 'SERVICE_STARTED') && (
                                    <div className="pt-4 border-t">
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            onClick={handleCompleteService}
                                            disabled={completing}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {t('bookings.details.markServiceCompleted')}
                                        </Button>
                                        <p className="text-xs text-center text-gray-500 mt-2">
                                            {t('bookings.details.completionWarning')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Live Tracking */}
                    <div>
                        <Card className="border-0 shadow-md h-full">
                            <CardHeader>
                                <CardTitle className="text-lg text-[#4e342e]">{t('bookings.details.liveTracking')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative pl-4 border-l-2 border-gray-100 space-y-8 py-2">
                                    {steps.map((step, index) => {
                                        const completed = isStepCompleted(step.key);
                                        const current = index === currentStepIndex && booking.status !== 'CANCELLED';
                                        const time = getStepTime(step.key);

                                        return (
                                            <div key={step.key} className="relative">
                                                {/* Dotted connector */}
                                                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${completed || current
                                                    ? 'bg-[#4e342e] border-[#4e342e]'
                                                    : 'bg-white border-gray-300'
                                                    }`} />

                                                <div className={`${(completed || current) ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    <div className="font-semibold text-sm">{step.label}</div>
                                                    {time && <div className="text-xs text-gray-500 font-mono mt-1">{time}</div>}
                                                    {current && booking.beautician && step.key === 'BEAUTICIAN_ASSIGNED' && (
                                                        <div className="text-xs text-blue-600 mt-1">
                                                            {t('bookings.details.steps.beauticianAssignedSmall')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AtHomeBookingDetailsPage;
