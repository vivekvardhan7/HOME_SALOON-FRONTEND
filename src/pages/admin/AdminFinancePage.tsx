
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';
import {
    DollarSign,
    CreditCard,
    RefreshCcw,
    Calendar,
    ArrowUpRight,
    Lock,
    Unlock,
    Activity,
    History
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// Unified Type Definition
interface FinanceEntity {
    id: string;
    name: string;
    type: 'VENDOR' | 'BEAUTICIAN';
    financials: {
        total_services: number;
        gross: number;
        commission: number;
        net_payable: number;
        paid: number;
        balance: number;
    };
    subscription: {
        status: 'PAID' | 'UNPAID';
        amount: number;
    };
    status: {
        is_active: boolean;
        frozen_reason?: string;
    };
}

interface FinanceSummary {
    month: string;
    revenue: {
        gross: number;
        commission: number;
        subscriptions: number;
    };
    breakdown?: {
        vendor: { gross: number; commission: number; subscriptions: number; net_payable: number; paid: number; pending: number };
        beautician: { gross: number; commission: number; subscriptions: number; net_payable: number; paid: number; pending: number };
    };
    pending_payouts: number;
    subscription_stats: {
        unpaid_count: number;
    };
}

interface AnalyticsData {
    monthly_trend: {
        month: string;
        revenue: number;
        vendor_commission: number;
        beautician_commission: number;
    }[];
    distribution: { name: string; value: number }[];
    subscriptions: { name: string; value: number }[];
}

interface HistoryItem {
    id: string;
    date: string;
    customer: string;
    amount: number;
    type: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminFinancePage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [vendors, setVendors] = useState<FinanceEntity[]>([]);
    const [beauticians, setBeauticians] = useState<FinanceEntity[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [generating, setGenerating] = useState(false);

    // Modal State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<FinanceEntity | null>(null);
    const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, analyticsRes, vendorsRes, beauticiansRes] = await Promise.all([
                api.get(`/admin/finance/summary?month=${selectedMonth}`),
                api.get(`/admin/finance/analytics?month=${selectedMonth}`),
                api.get(`/admin/finance/vendors?month=${selectedMonth}`),
                api.get(`/admin/finance/beauticians?month=${selectedMonth}`)
            ]);

            if ((summaryRes.data as any).success) setSummary((summaryRes.data as any).data);
            if ((analyticsRes.data as any).success) setAnalytics((analyticsRes.data as any).data);
            if ((vendorsRes.data as any).success) setVendors((vendorsRes.data as any).data);
            if ((beauticiansRes.data as any).success) setBeauticians((beauticiansRes.data as any).data);

        } catch (error: any) {
            console.error(error);
            toast.error("Failed to load financial data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const handleGenerateStatements = async () => {
        if (!confirm("Generate financial statements for current month? This will calculate commissions and subscriptions for ALL entities.")) return;
        setGenerating(true);
        try {
            const res = await api.post('/admin/finance/generate-statements', { month: selectedMonth });
            if ((res.data as any).success) {
                toast.success('Statements generated successfully');
                fetchData();
            } else {
                toast.error((res.data as any).message || 'Failed to generate');
            }
        } catch (error) {
            toast.error('Error generating statements');
        } finally {
            setGenerating(false);
        }
    };

    const handlePayout = async (entity: FinanceEntity) => {
        const amountToPay = entity.financials.balance;

        if (amountToPay <= 0) {
            toast.error('No pending balance to pay');
            return;
        }

        if (!confirm(`Confirm payout of $${amountToPay.toFixed(2)} to ${entity.name}?`)) return;

        try {
            const res = await api.post('/admin/finance/payout', {
                entityType: entity.type,
                entityId: entity.id,
                month: selectedMonth,
                amount: amountToPay,
                notes: 'Manual Payout via Admin Dashboard'
            });
            if ((res.data as any).success) {
                toast.success(`Payout of $${amountToPay.toFixed(2)} processed successfully.`);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Payment failed');
        }
    };

    const handleUnpay = async (entity: FinanceEntity) => {
        if (!confirm('Are you sure you want to rollback payouts for this month? This will delete all payout records for this entity.')) return;

        try {
            const res = await api.post('/admin/finance/unpay', {
                entityId: entity.id,
                entityType: entity.type,
                month: selectedMonth
            });

            if ((res.data as any).success) {
                toast.success(`Payouts rolled back.`);
                fetchData(); // Refresh table
            } else {
                toast.error((res.data as any).message || 'Rollback failed');
            }
        } catch (error: any) {
            console.error('Unpay failed', error);
            toast.error(error.response?.data?.message || 'Unpay failed. See console.');
        }
    };

    const handlePaySubscription = async (entity: FinanceEntity) => {
        if (!confirm(`Mark $${entity.subscription.amount} subscription as PAID for ${entity.name}?`)) return;
        try {
            const res = await api.post('/admin/finance/subscription/pay', {
                entity_type: entity.type,
                entity_id: entity.id,
                month: selectedMonth
            });
            if ((res.data as any).success) {
                toast.success('Subscription updated');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to update subscription');
        }
    };

    const handleToggleFreeze = async (entity: FinanceEntity) => {
        const newStatus = !entity.status.is_active;
        let reason = '';
        if (!newStatus) {
            reason = prompt("Enter reason for freezing this account (e.g. Unpaid Subscription):", "Unpaid Subscription") || '';
            if (!reason) return;
        }

        try {
            const res = await api.post('/admin/finance/toggle-freeze', {
                entity_type: entity.type,
                entity_id: entity.id,
                is_active: newStatus,
                reason: reason
            });
            if ((res.data as any).success) {
                toast.success(newStatus ? 'Account Activated' : 'Account Frozen');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleViewHistory = async (entity: FinanceEntity) => {
        setSelectedEntity(entity);
        setIsHistoryOpen(true);
        setLoadingHistory(true);
        setHistoryData([]);

        try {
            const res = await api.get(`/admin/finance/history/${entity.type}/${entity.id}?month=${selectedMonth}`);
            if ((res.data as any).success) {
                setHistoryData((res.data as any).data);
            }
        } catch (error) {
            toast.error('Failed to load history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const renderEntityTable = (entities: FinanceEntity[]) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                    <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Services</th>
                        <th className="p-3 text-right">Gross</th>
                        <th className="p-3 text-right">Comm (15%)</th>
                        <th className="p-3 text-right">Net Payable</th>
                        <th className="p-3 text-right">Paid</th>
                        <th className="p-3 text-right">Balance</th>
                        <th className="p-3 text-center">Sub ($10)</th>
                        <th className="p-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {entities.length === 0 ? (
                        <tr><td colSpan={10} className="p-4 text-center text-muted-foreground">No data. Click "Generate Statements".</td></tr>
                    ) : entities.map((e) => (
                        <tr key={e.id} className={!e.status.is_active ? "bg-red-50" : ""}>
                            <td className="p-3 font-medium">
                                {e.name}
                                {!e.status.is_active && <div className="text-xs text-red-600 font-normal">{e.status.frozen_reason}</div>}
                            </td>
                            <td className="p-3 text-center">
                                {e.status.is_active ?
                                    <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
                                    :
                                    <Badge variant="destructive">FROZEN</Badge>
                                }
                            </td>
                            <td className="p-3 text-right">{e.financials.total_services}</td>
                            <td className="p-3 text-right">${e.financials.gross.toFixed(2)}</td>
                            <td className="p-3 text-right text-red-500">-${e.financials.commission.toFixed(2)}</td>
                            <td className="p-3 text-right font-bold">${e.financials.net_payable.toFixed(2)}</td>
                            <td className="p-3 text-right text-green-600">${e.financials.paid.toFixed(2)}</td>
                            <td className="p-3 text-right font-bold text-orange-600">${e.financials.balance.toFixed(2)}</td>
                            <td className="p-3 text-center">
                                {e.subscription.status === 'PAID' ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">PAID</Badge>
                                ) : (
                                    <Button variant="outline" size="sm" className="h-6 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => handlePaySubscription(e)}>
                                        Collect $10
                                    </Button>
                                )}
                            </td>
                            <td className="p-3 text-center flex gap-2 justify-center">
                                {e.financials.balance > 0 && (
                                    <Button
                                        size="sm"
                                        className="h-8 shadow-sm bg-[#e4d5c7] text-[#4e342e] hover:bg-[#d7ccc8]"
                                        onClick={() => handlePayout(e)}
                                    >
                                        Pay
                                    </Button>
                                )}
                                {e.financials.paid > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 border-red-200 text-red-700 hover:bg-red-50"
                                        onClick={() => handleUnpay(e)}
                                    >
                                        Unpay
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleViewHistory(e)}
                                    title="View Service History"
                                >
                                    <History className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleToggleFreeze(e)}
                                    title={e.status.is_active ? "Freeze Account" : "Unfreeze Account"}
                                >
                                    {e.status.is_active ? <Lock className="h-4 w-4 text-gray-500" /> : <Unlock className="h-4 w-4 text-green-600" />}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    if (loading && !summary) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading financial dashboard...</div>;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance & Payouts</h1>
                    <p className="text-muted-foreground">Manage platform revenue, commissions, and provider payouts (Strict Model).</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-2 shadow-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <input
                            type="month"
                            className="text-sm outline-none bg-transparent"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerateStatements} disabled={generating}>
                        {generating ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                        Generate Statements
                    </Button>
                </div>
            </div>

            {/* Financial Overview (At Home) */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">Financial Overview (At Home)</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">${summary?.breakdown?.beautician.commission.toFixed(2) || '0.00'}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Beautician Payouts</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">${summary?.breakdown?.beautician.net_payable.toFixed(2) || '0.00'}</div>
                            <p className="text-xs text-muted-foreground">Total Payable Amount</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">${summary?.breakdown?.beautician.paid.toFixed(2) || '0.00'}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">${summary?.breakdown?.beautician.pending.toFixed(2) || '0.00'}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Financial Overview (At Salon) */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">Financial Overview (At Salon)</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">${summary?.breakdown?.vendor.commission.toFixed(2) || '0.00'}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vendor Payouts</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">${summary?.breakdown?.vendor.net_payable.toFixed(2) || '0.00'}</div>
                            <p className="text-xs text-muted-foreground">Total Payable Amount</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">${summary?.breakdown?.vendor.paid.toFixed(2) || '0.00'}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">${summary?.breakdown?.vendor.pending.toFixed(2) || '0.00'}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Charts Section */}
            {analytics && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Revenue Trend</CardTitle>
                            <CardDescription>Commission Income (Vendor vs Beautician)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.monthly_trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="vendor_commission" name="Vendor Comm" stackId="a" fill="#8884d8" />
                                    <Bar dataKey="beautician_commission" name="Beautician Comm" stackId="a" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Distribution</CardTitle>
                            <CardDescription>Active Entities Breakdown</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {analytics.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="vendors" className="w-full">
                <TabsList>
                    <TabsTrigger value="vendors">Vendor Payouts</TabsTrigger>
                    <TabsTrigger value="beauticians">Beautician Payouts</TabsTrigger>
                </TabsList>

                <TabsContent value="vendors" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vendor Financials ({selectedMonth})</CardTitle>
                            <CardDescription>Commission: 15%. Subscription: $10/mo. Frozen if Unpaid.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderEntityTable(vendors)}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="beauticians" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Beautician Financials ({selectedMonth})</CardTitle>
                            <CardDescription>Commission: 15%. Subscription: $10/mo. Frozen if Unpaid.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderEntityTable(beauticians)}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* History Modal */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Service History: {selectedEntity?.name}</DialogTitle>
                        <DialogDescription>
                            Showing completed services for {selectedMonth} which contributed to earnings.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 max-h-[400px] overflow-y-auto">
                        {loadingHistory ? (
                            <div className="text-center p-4">Loading history...</div>
                        ) : historyData.length === 0 ? (
                            <div className="text-center p-4 text-muted-foreground">No completed services found for this month.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2 text-left">Date</th>
                                        <th className="p-2 text-left">Type</th>
                                        <th className="p-2 text-left">Customer</th>
                                        <th className="p-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {historyData.map((item) => (
                                        <tr key={item.id}>
                                            <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="p-2 text-muted-foreground text-xs">{item.type}</td>
                                            <td className="p-2 font-medium">{item.customer}</td>
                                            <td className="p-2 text-right font-bold">${Number(item.amount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
