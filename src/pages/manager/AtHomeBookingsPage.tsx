import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, MapPin, User, Package, Scissors, CheckCircle, AlertCircle, UserCheck, Star, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AtHomeBooking {
    id: string;
    created_at: string;
    customer: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    address: string | any; // Supports legacy string or JSON object
    slot: string; // ISO date
    preferences: any;
    total_amount: number;
    payment_status: string;
    status: string; // 'PENDING' | 'ASSIGNED' | 'COMPLETED'
    services: any[];
    products: any[];
    assigned_beautician?: {
        name: string;
        phone: string;
    };
}

interface EligibleVendor {
    id: string;
    shopname: string;
    distance?: number;
    services?: any[];
    user?: {
        first_name: string;
        last_name: string;
    };
    match_reason?: string;
    // Enhanced Fields
    ownerName?: string;
    location?: string;
    inventory?: string;
    matchType?: string;
}

interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
}

const AtHomeBookingsPage = () => {
    const [bookings, setBookings] = useState<AtHomeBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<AtHomeBooking | null>(null);
    const [beauticians, setBeauticians] = useState<any[]>([]); // New state for beauticians
    const [loadingVendors, setLoadingVendors] = useState(false);

    // Selection state
    const [selectedBeautician, setSelectedBeautician] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse<AtHomeBooking[]>>('/manager/athome-bookings');
            if (response.data.success) {
                setBookings(response.data.data);
            } else {
                toast.error('Failed to fetch bookings');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading bookings');
        } finally {
            setLoading(false);
        }
    };

    const openAssignModal = async (booking: AtHomeBooking) => {
        setSelectedBooking(booking);
        setLoadingVendors(true);
        setSelectedBeautician('');
        setBeauticians([]);

        try {
            const response = await api.get<ApiResponse<any>>(`/manager/athome-bookings/${booking.id}/eligible-beauticians`);
            if (response.data.success) {
                setBeauticians(response.data.data || []);
            } else {
                toast.error('Failed to load eligible beauticians');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching beauticians');
        } finally {
            setLoadingVendors(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedBooking) return;

        if (!selectedBeautician) {
            toast.error('Please select a beautician to confirm assignment.');
            return;
        }

        try {
            setIsAssigning(true);
            console.log("ASSIGNING BEAUTICIAN - DEBUG:", selectedBeautician);

            const response = await api.post<ApiResponse>(`/manager/athome-bookings/${selectedBooking.id}/assign`, {
                beautician_id: selectedBeautician
            });

            if (response.data.success) {
                toast.success('Beautician assigned successfully!');
                setSelectedBooking(null);
                fetchBookings(); // Refresh list
            } else {
                toast.error('Failed to assign beautician');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error assigning beautician');
        } finally {
            setIsAssigning(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200'; // Added ACCEPTED
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // PENDING
        }
    };

    // Helper to format address
    const formatAddress = (addr: any) => {
        if (!addr) return 'N/A';
        if (typeof addr === 'string') return addr;
        const parts = [addr.street, addr.city, addr.state].filter(Boolean);
        return parts.join(', ');
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">Assign Vendors</h1>
                <p className="text-[#6d4c41] mb-8">Manage incoming at-home service requests and assign them to eligible vendors.</p>

                {loading ? (
                    <div className="text-center py-12">Loading bookings...</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service Slot</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Requests</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No pending bookings found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell>
                                                <div className="font-medium text-[#4e342e]">{booking.customer?.first_name} {booking.customer?.last_name}</div>
                                                <div className="text-xs text-muted-foreground">{booking.customer?.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-[#4e342e]">
                                                    <Calendar className="w-4 h-4" />
                                                    {booking.slot ? format(new Date(booking.slot), 'MMM d, yyyy') : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Clock className="w-4 h-4" />
                                                    {booking.slot ? format(new Date(booking.slot), 'h:mm a') : 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm max-w-[200px] truncate" title={formatAddress(booking.address)}>
                                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                                    {formatAddress(booking.address)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-[#4e342e]">
                                                    ${booking.total_amount?.toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 max-w-[250px]">
                                                    {booking.services && booking.services.length > 0 ? (
                                                        booking.services.map((s: any, idx: number) => (
                                                            <Badge key={`s-${idx}`} variant="secondary" className="w-fit bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                                <Scissors className="w-3 h-3 mr-1" />
                                                                {s.master_service?.name || 'Service'}
                                                            </Badge>
                                                        ))
                                                    ) : null}
                                                    {booking.products && booking.products.length > 0 ? (
                                                        booking.products.map((p: any, idx: number) => (
                                                            <Badge key={`p-${idx}`} variant="outline" className="w-fit bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200">
                                                                <Package className="w-3 h-3 mr-1" />
                                                                {p.master_product?.name || 'Product'}
                                                            </Badge>
                                                        ))
                                                    ) : null}
                                                    {(!booking.services?.length && !booking.products?.length) && (
                                                        <span className="text-muted-foreground text-xs italic">No items</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadgeColor(booking.status)}>
                                                    {booking.status || 'PENDING'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(booking.status === 'ASSIGNED' || booking.status === 'ACCEPTED') ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-1 text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded">
                                                            <CheckCircle className="w-3 h-3" />
                                                            {booking.assigned_beautician?.name || 'Assigned'}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openAssignModal(booking)}
                                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-6 text-xs"
                                                        >
                                                            Change / Reassign
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => openAssignModal(booking)}
                                                        className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                                                        size="sm"
                                                    >
                                                        Assign Beautician
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Assignment Modal */}
                <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Assign Beautician</DialogTitle>
                            <DialogDescription>
                                Select the best fit beautician for this booking based on skills and availability.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedBooking && (
                            <div className="space-y-6">
                                {/* Booking Summary Section */}
                                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm text-[#4e342e]">Booking Details</h4>
                                        <div className="text-sm text-muted-foreground grid grid-cols-1 gap-1">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                {selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name} ({selectedBooking.customer?.phone})
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {selectedBooking.slot ? new Date(selectedBooking.slot).toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3" />
                                                {formatAddress(selectedBooking.address)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Beautician Selection */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-primary" />
                                        Assign Beautician
                                    </h3>

                                    {loadingVendors ? (
                                        <div className="py-8 text-center text-muted-foreground">Finding matching beauticians...</div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {beauticians.map((b) => (
                                                <div
                                                    key={b.id}
                                                    className={`
                                                        relative flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                                                        ${selectedBeautician === b.id ? 'border-[#4e342e] bg-[#4e342e]/5' : 'border-transparent bg-white shadow-sm hover:border-[#4e342e]/30'}
                                                    `}
                                                    onClick={() => setSelectedBeautician(b.id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${b.score > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                                            {b.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-[#4e342e] flex items-center gap-2">
                                                                {b.name}
                                                                <Badge variant={b.score > 0 ? 'default' : 'secondary'} className={b.score > 0 ? 'bg-green-600' : ''}>
                                                                    {b.matchType}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                                                                <span className="flex items-center gap-1">
                                                                    <Star className="w-3 h-3" /> {b.expert_level}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> {b.skills || 'General'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedBeautician === b.id && (
                                                        <div className="text-[#4e342e] font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">Selected</div>
                                                    )}
                                                </div>
                                            ))}

                                            {beauticians.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                                                    No eligible beauticians found active.
                                                    <br />
                                                    <span className="text-xs">Please check "Admin &gt; Beauticians" to ensure you have active staff.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedBooking(null)}>Cancel</Button>
                            <Button
                                onClick={handleAssign}
                                disabled={isAssigning || !selectedBeautician}
                                className="bg-[#4e342e] text-white"
                            >
                                {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default AtHomeBookingsPage;
