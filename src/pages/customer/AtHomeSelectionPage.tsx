import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Loader2,
    Scissors,
    Package,
    Clock,
    DollarSign,
    LayoutGrid,
    Sparkles,
    ArrowRight,
    Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface Service {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    duration_minutes: number;
    image_url: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
}

const AtHomeSelectionPage = () => {
    const [viewType, setViewType] = useState<'services' | 'both'>('services');
    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [viewType]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const servicesRes = await api.get<any>('/customer/athome/services');
            if (servicesRes.data.success) {
                setServices(servicesRes.data.data);
            }

            if (viewType === 'both') {
                const productsRes = await api.get<any>('/customer/athome/products');
                if (productsRes.data.success) {
                    setProducts(productsRes.data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load selection items');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8 px-4">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold text-[#4e342e] mb-4">Select Your Services</h1>
                    <p className="text-[#6d4c41] max-w-xl mx-auto">
                        Customise your at-home beauty experience by selecting the services and optional products you need.
                    </p>
                </div>

                {/* VIEW TOGGLE */}
                <div className="flex justify-center mb-12">
                    <div className="bg-[#f8d7da]/20 p-1 rounded-2xl flex gap-1 border border-[#f8d7da]/30">
                        <button
                            onClick={() => setViewType('services')}
                            className={`px-8 py-3 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ${viewType === 'services'
                                ? 'bg-[#4e342e] text-white shadow-lg'
                                : 'text-[#4e342e] hover:bg-white/50'
                                }`}
                        >
                            <Scissors className="w-4 h-4" />
                            Services Only
                        </button>
                        <button
                            onClick={() => setViewType('both')}
                            className={`px-8 py-3 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ${viewType === 'both'
                                ? 'bg-[#4e342e] text-white shadow-lg'
                                : 'text-[#4e342e] hover:bg-white/50'
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            Services + Products
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#4e342e]" />
                        <p className="text-[#6d4c41] font-medium animate-pulse">Curating available options...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* SERVICES SECTION */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#4e342e] rounded-lg">
                                    <Scissors className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-[#4e342e]">Available Services</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map(s => (
                                    <Card key={s.id} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white/50 backdrop-blur-sm">
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={s.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop'}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                alt={s.name}
                                            />
                                            <div className="absolute top-4 right-4">
                                                <Badge className="bg-white/90 text-[#4e342e] backdrop-blur-sm border-none font-bold uppercase text-[10px]">
                                                    {s.category}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardContent className="p-6">
                                            <h3 className="text-xl font-serif font-bold text-[#4e342e] mb-2">{s.name}</h3>
                                            <p className="text-[#6d4c41] text-sm line-clamp-2 mb-4 h-10">{s.description}</p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-[#8d6e63] font-bold uppercase tracking-wider">Duration</span>
                                                    <span className="flex items-center gap-1 text-[#4e342e] font-serif font-bold">
                                                        <Clock className="w-4 h-4" /> {s.duration_minutes}m
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-[#8d6e63] font-bold uppercase tracking-wider">Price</span>
                                                    <p className="text-xl font-serif font-bold text-[#4e342e]">
                                                        {s.price.toLocaleString()} <span className="text-xs font-sans">CDF</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <Button variant="outline" className="w-full mt-6 border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white cursor-not-allowed" disabled>
                                                <Plus className="w-4 h-4 mr-2" /> Select Service
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* PRODUCTS SECTION (Conditional) */}
                        {viewType === 'both' && (
                            <section className="pt-8 border-t border-[#f8d7da]/20">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-[#6d4c41] rounded-lg">
                                        <Package className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-serif font-bold text-[#4e342e]">Available Products</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {products.map(p => (
                                        <Card key={p.id} className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white/70">
                                            <div className="relative h-40 overflow-hidden bg-[#fdf6f0]">
                                                <img
                                                    src={p.image_url || 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?q=80&w=400&auto=format&fit=crop'}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    alt={p.name}
                                                />
                                            </div>
                                            <CardContent className="p-4">
                                                <h4 className="font-bold text-[#4e342e] mb-1 truncate">{p.name}</h4>
                                                <p className="text-xs text-[#6d4c41] line-clamp-1 mb-3">{p.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <p className="font-serif font-bold text-[#4e342e]">{p.price.toLocaleString()} CDF</p>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full border border-[#f8d7da] cursor-not-allowed" disabled>
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* STICKY BOTTOM BAR FOR PROCEED */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
                    <Card className="bg-[#4e342e] text-white overflow-hidden shadow-2xl border-none rounded-2xl">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-[#f8d7da] font-medium uppercase tracking-[3px]">Booking Preview</p>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-1 text-sm font-bold opacity-50">
                                        <Scissors className="w-4 h-4" /> 0 Selected
                                    </div>
                                    <div className="h-4 w-px bg-white/20" />
                                    <div className="text-lg font-serif">0.00 CDF</div>
                                </div>
                            </div>
                            <Button
                                size="lg"
                                className="bg-white text-[#4e342e] hover:bg-[#f8d7da] transition-colors rounded-xl font-bold px-8 cursor-not-allowed"
                                disabled
                            >
                                Proceed
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AtHomeSelectionPage;

function LocalBadge({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`px-2 py-1 rounded inline-flex items-center text-[10px] font-bold ${className}`}>
            {children}
        </span>
    );
}
