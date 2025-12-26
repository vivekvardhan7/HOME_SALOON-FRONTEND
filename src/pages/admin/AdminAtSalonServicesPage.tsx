import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Filter,
    RefreshCw,
    Scissors,
    CheckCircle,
    XCircle,
    Clock,
    ExternalLink,
    Eye,
    MapPin,
    User,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface SalonOrder {
    id: string;
    vendorName: string;
    customerName: string;
    customerEmail: string;
    appointmentDate: string;
    appointmentTime: string;
    services: any[];
    totalAmount: number;
    paymentStatus: string;
    bookingStatus: string;
    createdAt: string;
}

const AdminAtSalonServicesPage = () => {
    const [orders, setOrders] = useState<SalonOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getAtSalonServices();
            if (response.success && response.data) {
                setOrders(response.data.orders || []);
            } else {
                toast.error(response.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching salon orders:', error);
            toast.error('An error occurred while fetching orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
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
        switch (status?.toUpperCase()) {
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

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.bookingStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const [selectedOrder, setSelectedOrder] = useState<SalonOrder | null>(null);

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-[#4e342e] flex items-center gap-3">
                            <Scissors className="w-8 h-8 text-[#6d4c41]" />
                            At-Salon Services
                        </h1>
                        <p className="text-[#6d4c41] mt-1">View all vendor at-salon bookings and appointment history</p>
                    </div>
                    <Button
                        onClick={fetchOrders}
                        variant="outline"
                        className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Refresh Data
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-4 h-4" />
                        <Input
                            placeholder="Search by salon or customer..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset on search
                            }}
                            className="pl-10 border-[#f8d7da] focus:border-[#4e342e]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1); // Reset on filter
                        }}
                        className="w-full h-10 px-3 py-2 bg-white border border-[#f8d7da] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4e342e] focus:border-transparent text-[#4e342e]"
                    >
                        <option value="all">All Booking Status</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <div className="flex items-center justify-end">
                        <Badge variant="outline" className="text-[#6d4c41] border-[#f8d7da]">
                            {filteredOrders.length} Bookings found
                        </Badge>
                    </div>
                </div>

                {/* Orders Table */}
                <Card className="border-0 shadow-lg overflow-hidden bg-white mb-6">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-[#fdf6f0]">
                                    <TableRow className="border-[#f8d7da]">
                                        <TableHead className="font-bold text-[#4e342e]">Salon / Vendor</TableHead>
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
                                    ) : currentItems.length > 0 ? (
                                        currentItems.map((order) => (
                                            <TableRow key={order.id} className="hover:bg-[#f8d7da]/5 border-[#f8d7da]">
                                                <TableCell className="font-medium text-[#4e342e]">
                                                    {order.vendorName}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-[#4e342e]">{order.customerName}</span>
                                                        <span className="text-xs text-[#6d4c41]">{order.customerEmail}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-[#4e342e]">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-[#6d4c41]" />
                                                            {order.appointmentDate}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Clock className="w-3.5 h-3.5 text-[#6d4c41]" />
                                                            {order.appointmentTime}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <div className="flex flex-wrap gap-1">
                                                        {order.services.map((s: any, idx) => (
                                                            <Badge key={idx} variant="secondary" className="bg-[#f8d7da]/20 text-[#4e342e] text-[10px]">
                                                                {s.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-[#4e342e]">
                                                    {order.totalAmount} CDF
                                                </TableCell>
                                                <TableCell>
                                                    {getPaymentBadge(order.paymentStatus)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(order.bookingStatus)}
                                                </TableCell>
                                                <TableCell className="text-xs text-[#6d4c41]">
                                                    {formatDateTime(order.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="hover:bg-[#f8d7da] text-[#4e342e]"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-[#6d4c41]">
                                                    <Calendar className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-lg font-medium">No at-salon bookings found</p>
                                                    <p className="text-sm">When vendors take bookings, they will appear here.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination Controls */}
                {!loading && filteredOrders.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-[#6d4c41]">
                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredOrders.length)}</span> of <span className="font-medium">{filteredOrders.length}</span> results
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
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-[#4e342e]">Booking Details</h2>
                                    <p className="text-sm text-gray-500">ID: {selectedOrder.id}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                                    <XCircle className="w-6 h-6 text-gray-400" />
                                </Button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Status & Amount */}
                                <div className="flex justify-between items-center p-4 bg-[#fdf6f0] rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(selectedOrder.bookingStatus)}
                                        {getPaymentBadge(selectedOrder.paymentStatus)}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Amount Paid</p>
                                        <p className="text-2xl font-bold text-[#4e342e]">{selectedOrder.totalAmount} CDF</p>
                                    </div>
                                </div>

                                {/* Customer & Vendor Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Customer Details
                                        </h3>
                                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                                            <p className="font-medium">{selectedOrder.customerName}</p>
                                            <p className="text-gray-500">{selectedOrder.customerEmail}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Scissors className="w-4 h-4" /> Vendor Details
                                        </h3>
                                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                                            <p className="font-medium text-[#4e342e]">{selectedOrder.vendorName}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Appointment Time
                                        </h3>
                                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                                            <p>{selectedOrder.appointmentDate}</p>
                                            <p>{selectedOrder.appointmentTime}</p>
                                            <p className="text-gray-500 text-xs mt-1">Created: {formatDateTime(selectedOrder.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Service Summary</h3>
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead>Service</TableHead>
                                                    <TableHead>Duration</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedOrder.services?.map((s: any, i: number) => (
                                                    <TableRow key={`s-${i}`}>
                                                        <TableCell>{s.name}</TableCell>
                                                        <TableCell>{s.duration} min</TableCell>
                                                        <TableCell className="text-right font-medium">{s.price} CDF</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-gray-50 font-bold">
                                                    <TableCell colSpan={2}>Total</TableCell>
                                                    <TableCell className="text-right">{selectedOrder.totalAmount} CDF</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex justify-end pt-4 border-t">
                                    <Button onClick={() => setSelectedOrder(null)}>Close</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminAtSalonServicesPage;
