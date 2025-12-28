import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Calendar,
    Search,
    RefreshCw,
    Home,
    User,
    MapPin,
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    Eye,
    ShoppingBag,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

const AdminAtHomeBookingsPage = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await adminApi.get<{ data: any[] }>('/admin/athome-bookings');

            if (response.success && response.data?.data) {
                setBookings(response.data.data);
            } else {
                toast.error(response.message || 'Failed to fetch bookings');
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load at-home bookings');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
            case 'ASSIGNED':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Assigned</Badge>;
            case 'IN_PROGRESS':
                return <Badge className="bg-orange-100 text-orange-800 border-orange-200">In Progress</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
            case 'COMPLETED':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentBadge = (status: string) => {
        const paymentStatus = status || 'PENDING';
        switch (paymentStatus?.toUpperCase()) {
            case 'SUCCESS':
            case 'PAID':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Paid</Badge>;
            case 'PENDING':
                return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pending</Badge>;
            case 'FAILED':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
            case 'REFUNDED':
                return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Refunded</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredBookings = bookings.filter(b => {
        const search = searchTerm.toLowerCase();
        const customerName = `${b.customer?.first_name || ''} ${b.customer?.last_name || ''}`.toLowerCase();
        const beauticianName = (b.beautician?.name || '').toLowerCase();
        const matchesSearch = customerName.includes(search) || beauticianName.includes(search);

        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#4e342e] flex items-center gap-3">
                            <Home className="w-8 h-8 text-[#6d4c41]" />
                            At-Home Bookings
                        </h1>
                        <p className="text-[#6d4c41] mt-1">Manage and track all at-home service appointments</p>
                    </div>
                    <Button onClick={fetchBookings} variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-4 h-4" />
                        <Input
                            placeholder="Search by customer or beautician..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to page 1 on search
                            }}
                            className="pl-10 border-[#f8d7da] focus:border-[#4e342e]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1); // Reset to page 1 on filter
                        }}
                        className="w-full h-10 px-3 py-2 bg-white border border-[#f8d7da] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4e342e] focus:border-transparent text-[#4e342e]"
                    >
                        <option value="all">All Booking Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <div className="flex items-center justify-end">
                        <Badge variant="outline" className="text-[#6d4c41] border-[#f8d7da]">
                            {filteredBookings.length} Bookings found
                        </Badge>
                    </div>
                </div>

                <Card className="border-0 shadow-lg overflow-hidden bg-white mb-6">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-[#fdf6f0]">
                                    <TableRow className="border-[#f8d7da]">
                                        <TableHead className="font-bold text-[#4e342e]">Assigned Beautician</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Customer Details</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Appt. Date & Time</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Services</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Total Amount</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Payment</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Status</TableHead>
                                        <TableHead className="font-bold text-[#4e342e]">Created At</TableHead>
                                        <TableHead className="font-bold text-[#4e342e] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i} className="animate-pulse border-[#f8d7da]">
                                                <TableCell colSpan={9} className="py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : currentItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-[#6d4c41]">
                                                    <Calendar className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-lg font-medium">No at-home bookings found</p>
                                                    <p className="text-sm">When customers book services, they will appear here.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        currentItems.map((booking) => (
                                            <TableRow key={booking.id} className="hover:bg-[#f8d7da]/5 border-[#f8d7da]">
                                                <TableCell className="font-medium text-[#4e342e]">
                                                    {booking.beautician ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-green-600" />
                                                            <span>{booking.beautician.name}</span>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-gray-400 border-dashed border-gray-300">
                                                            Pending Assignment
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-[#4e342e]">
                                                            {booking.customer?.first_name} {booking.customer?.last_name}
                                                        </span>
                                                        <span className="text-xs text-[#6d4c41]">{booking.customer?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-[#4e342e]">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-[#6d4c41]" />
                                                            {booking.slot ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Clock className="w-3.5 h-3.5 text-[#6d4c41]" />
                                                            {booking.slot || 'N/A'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <div className="flex flex-wrap gap-1">
                                                        {booking.services?.map((s: any, idx: number) => (
                                                            <Badge key={idx} variant="secondary" className="bg-[#f8d7da]/20 text-[#4e342e] text-[10px]">
                                                                {s.master?.name || 'Service'}
                                                            </Badge>
                                                        ))}
                                                        {booking.products?.length > 0 && (
                                                            <Badge variant="outline" className="text-gray-500 text-[10px]">
                                                                +{booking.products.length} Products
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-[#4e342e]">
                                                    {formatCurrency(booking.total_amount || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    {getPaymentBadge(booking.payment_status)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(booking.status)}
                                                </TableCell>
                                                <TableCell className="text-xs text-[#6d4c41]">
                                                    {formatDateTime(booking.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedBooking(booking)}
                                                        className="hover:bg-[#f8d7da] text-[#4e342e]"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination Controls */}
                {!loading && filteredBookings.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-[#6d4c41]">
                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredBookings.length)}</span> of <span className="font-medium">{filteredBookings.length}</span> results
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="border-[#f8d7da] text-[#4e342e] disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <Button
                                    key={i + 1}
                                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                                    onClick={() => paginate(i + 1)}
                                    className={currentPage === i + 1
                                        ? "bg-[#4e342e] text-white hover:bg-[#6d4c41]"
                                        : "border-[#f8d7da] text-[#4e342e]"
                                    }
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="border-[#f8d7da] text-[#4e342e] disabled:opacity-50"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* VIEW DETAILS DIALOG */}
                {selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-[#4e342e]">Booking Details</h2>
                                    <p className="text-sm text-gray-500">ID: {selectedBooking.id}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(null)}>
                                    <XCircle className="w-6 h-6 text-gray-400" />
                                </Button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Status & Amount */}
                                <div className="flex justify-between items-center p-4 bg-[#fdf6f0] rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(selectedBooking.status)}
                                        {getPaymentBadge(selectedBooking.payment_status)}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Total Amount Paid</p>
                                        <p className="text-2xl font-bold text-[#4e342e]">{formatCurrency(selectedBooking.total_amount || 0)}</p>
                                    </div>
                                </div>

                                {/* Customer & Beautician Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Customer Details
                                        </h3>
                                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                                            <p className="font-medium">{selectedBooking.customer?.first_name} {selectedBooking.customer?.last_name}</p>
                                            <p className="text-gray-500">{selectedBooking.customer?.email}</p>
                                            <p className="text-gray-500">{selectedBooking.customer?.phone}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Assigned Beautician
                                        </h3>
                                        {selectedBooking.beautician ? (
                                            <div className="bg-green-50 p-3 rounded-md text-sm border border-green-100">
                                                <p className="font-medium text-green-900">{selectedBooking.beautician.name}</p>
                                                <p className="text-green-700">ID: {selectedBooking.beautician.id.slice(0, 8)}</p>
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-50 p-3 rounded-md text-sm border border-yellow-100 text-yellow-800">
                                                Pending Assignment
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Date & Location */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Appointment Time
                                        </h3>
                                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                                            <p>Slot: {selectedBooking.slot || 'Not Scheduled'}</p>
                                            <p className="text-gray-500 text-xs mt-1">Created: {formatDateTime(selectedBooking.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> Service Location
                                        </h3>
                                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                                            <p>{selectedBooking.address || 'No address provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedBooking.services?.map((s: any, i: number) => (
                                                    <TableRow key={`s-${i}`}>
                                                        <TableCell>{s.master?.name}</TableCell>
                                                        <TableCell><Badge variant="outline">Service</Badge></TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(s.master?.price || 0)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {selectedBooking.products?.map((p: any, i: number) => (
                                                    <TableRow key={`p-${i}`}>
                                                        <TableCell>{p.master?.name}</TableCell>
                                                        <TableCell><Badge variant="outline">Product</Badge></TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(p.master?.price || 0)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-gray-50 font-bold">
                                                    <TableCell colSpan={2}>Total</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(selectedBooking.total_amount || 0)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex justify-end pt-4 border-t">
                                    <Button onClick={() => setSelectedBooking(null)}>Close</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminAtHomeBookingsPage;
