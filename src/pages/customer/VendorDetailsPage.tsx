import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api'; // Added import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import {
    MapPin,
    Star,
    Clock,
    Users,
    Phone,
    Mail,
    Calendar,
    Scissors,
    Palette,
    Sparkles,
    Award,
    ShoppingCart,
    Plus,
    Minus,
    ArrowLeft,
    Building,
    Heart,
    Share2,
    CheckCircle
} from 'lucide-react';

interface Vendor {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    rating: number;
    reviewCount: number;
    distance: number;
    categories: string[];
    images: string[];
    isOpen: boolean;
    nextAvailableSlot: string;
    phone: string;
    email: string;
    workingHours: {
        [key: string]: string;
    };
}

interface Beautician {
    id: string;
    name: string;
    specialization: string[];
    rating: number;
    experience: number;
    avatar: string;
    isAvailable: boolean;
    nextAvailableSlot: string;
}

interface Service {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    category: string;
    beauticianId?: string;
    image?: string;
    isAvailable?: boolean;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    inStock: boolean;
    category: string;
}

const VendorDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [beauticians, setBeauticians] = useState<Beautician[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchVendorDetails();
        }
    }, [id]);

    const isValidImage = (url: any): boolean => {
        if (!url || typeof url !== 'string') return false;
        return !url.includes('api/placeholder');
    };

    const fetchVendorDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching vendor details for ID:', id);

            // Use the unified backend endpoint
            const response = await api.get(`/vendors/${id}`);
            const data: any = response.data;
            console.log('Vendor data received:', data);

            if (data.vendor) {
                // Transform Vendor - STRICT: No fake defaults
                const transformedVendor: Vendor = {
                    id: data.vendor.id,
                    name: data.vendor.name || 'Unknown Salon', // Fallback only for crucial UI text
                    description: data.vendor.description || 'No description available.',
                    address: data.vendor.address || 'Address not provided',
                    city: data.vendor.city || '',
                    rating: data.vendor.rating, // Allow null
                    reviewCount: data.vendor.reviewCount || 0,
                    distance: data.vendor.distance || null,
                    categories: data.vendor.categories || [],

                    // Filter out placeholder images from array
                    images: (data.vendor.images && Array.isArray(data.vendor.images))
                        ? data.vendor.images.filter(isValidImage)
                        : [],

                    isOpen: data.vendor.isOpen !== undefined ? data.vendor.isOpen : false, // Default closed if unknown
                    nextAvailableSlot: data.vendor.nextAvailableSlot || null, // No fake slot
                    phone: data.vendor.phone || 'No phone provided',
                    email: data.vendor.email || '',
                    workingHours: data.vendor.workingHours || {}
                };
                setVendor(transformedVendor);

                // Transform Services - STRICT
                const transformedServices: Service[] = (data.services || []).map((service: any) => ({
                    id: service.id,
                    name: service.name,
                    description: service.description || '',
                    price: service.price,
                    duration: service.duration,
                    category: service.category || 'General',

                    // Validate image URL
                    image: isValidImage(service.image) ? service.image : null,

                    isAvailable: service.is_active !== undefined ? service.is_active : (service.isAvailable !== undefined ? service.isAvailable : true)
                }));
                // ...

                setServices(transformedServices);

                // Transform Products - STRICT
                const transformedProducts: Product[] = (data.products || []).map((p: any) => ({
                    id: p.id,
                    name: p.name || p.product_name,
                    description: p.description || '',
                    price: p.price || p.price_cdf,

                    // Validate image URL
                    image: isValidImage(p.image || p.image_url) ? (p.image || p.image_url) : null,

                    inStock: p.inStock !== undefined ? p.inStock : ((p.stock_quantity || 0) > 0),
                    category: p.category || p.category_id || 'General'
                }));
                console.log('Products loaded:', transformedProducts.length);
                setProducts(transformedProducts);

                // Transform Beauticians - STRICT
                setBeauticians((data.beauticians || []).map((b: any) => ({
                    ...b,
                    avatar: isValidImage(b.avatar || b.avatar_url) ? (b.avatar || b.avatar_url) : null
                })));
            }
        } catch (error) {
            console.error('Failed to fetch vendor details:', error);
            // setVendor(null); // Keep null to show error state
        } finally {
            setLoading(false);
        }
    };

    const addService = (service: Service) => {
        setSelectedServices(prev => [...prev, service]);
    };

    const removeService = (serviceId: string) => {
        setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
    };

    const updateProductQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            const newProducts = { ...selectedProducts };
            delete newProducts[productId];
            setSelectedProducts(newProducts);
        } else {
            setSelectedProducts(prev => ({ ...prev, [productId]: quantity }));
        }
    };

    const getTotalPrice = () => {
        const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
        const productsTotal = Object.entries(selectedProducts).reduce((sum, [productId, quantity]) => {
            const product = products.find(p => p.id === productId);
            return sum + (product ? product.price * quantity : 0);
        }, 0);
        return servicesTotal + productsTotal;
    };

    const proceedToCheckout = () => {
        const statePayload = {
            vendor,
            services: selectedServices,
            products: Object.entries(selectedProducts).map(([id, qty]) => {
                const product = products.find(p => p.id === id);
                return product ? { ...product, quantity: qty } : null;
            }).filter(Boolean)
        } as any;

        navigate('/booking/checkout', { state: statePayload });
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="pt-20 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4e342e] mx-auto mb-4"></div>
                        <p className="text-[#6d4c41]">Loading vendor details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="pt-20 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Building className="w-16 h-16 text-[#6d4c41] opacity-50 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-[#4e342e] mb-2">Vendor not found</h2>
                        <p className="text-[#6d4c41] mb-6">The salon you're looking for doesn't exist.</p>
                        <Link to="/salon-visit">
                            <Button variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Salons
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Determine Hero Image - Fallback to gradient if no specific image
    const heroImageStyle = vendor.images.length > 0
        ? { backgroundImage: `url(${vendor.images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : {}; // If empty, the gradient class will take over

    return (
        <div className="min-h-screen bg-[#fcfbf9] font-sans">
            <Navigation />

            {/* HERO SECTION */}
            <div className="relative">
                <div
                    className={`h-[400px] w-full bg-gradient-to-br from-[#4e342e] via-[#6d4c41] to-[#4e342e] relative`}
                    style={heroImageStyle}
                >
                    {/* Overlay for readability if image exists */}
                    {vendor.images.length > 0 && <div className="absolute inset-0 bg-black/40"></div>}

                    <div className="container mx-auto h-full px-4 py-8 flex flex-col relative z-10">
                        {/* Top Bar: Back Button */}
                        <div className="flex justify-between items-start mb-6">
                            <Link to="/salon-visit">
                                <Button variant="outline" size="sm" className="border-white/40 bg-black/20 text-white hover:bg-white hover:text-[#4e342e] backdrop-blur-sm transition-all border-0">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Salons
                                </Button>
                            </Link>
                            <div className="hidden md:flex items-center gap-2">
                                <Button variant="outline" size="sm" className="border-white/40 bg-black/20 text-white hover:bg-white hover:text-[#4e342e] border-0 backdrop-blur-sm">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Middle: Shop Name - Explicit Visibility as requested */}
                        <div className="mt-2 mb-auto">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white drop-shadow-lg tracking-tight mb-2">
                                {vendor.name}
                            </h1>
                            <div className="flex items-center gap-2 text-white/90">
                                <MapPin className="w-4 h-4" />
                                <span className="text-lg">{vendor.city || 'Location N/A'}</span>
                            </div>
                        </div>

                        {/* Bottom Bar: Badges & Stats */}
                        <div className="flex items-end justify-between pb-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Badge variant="secondary" className="bg-white/90 text-[#4e342e] font-medium backdrop-blur-md">
                                        <CheckCircle className="w-3 h-3 mr-1 text-[#4e342e]" />
                                        Verified Vendor
                                    </Badge>
                                    <div className={"px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 " + (vendor.isOpen ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white')}>
                                        {vendor.isOpen ? 'Open Now' : 'Closed'}
                                    </div>
                                </div>

                                <div className="flex items-center mb-2 gap-4 text-white/90 text-sm font-medium">
                                    {vendor.rating ? (
                                        <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            {vendor.rating} <span className="opacity-70 font-normal">({vendor.reviewCount} reviews)</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm text-white/70 italic border border-white/10">
                                            No ratings yet
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="container mx-auto px-4 -mt-12 relative z-10">
                <div className="mb-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: MAIN */}
                    <div className="lg:col-span-2">
                        {/* ABOUT + INFO */}
                        <motion.div {...fadeInUp}>
                            <Card className="border-0 bg-white shadow-xl mb-8 overflow-hidden rounded-xl">
                                <CardContent className="p-8">
                                    <div className="mb-6">
                                        <h2 className="text-xl font-serif font-bold text-[#4e342e] mb-3">About {vendor.name}</h2>
                                        <p className="text-[#6d4c41] leading-relaxed text-[15px]">{vendor.description}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-[#fcfbf9] rounded-xl border border-[#efebe9]">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <MapPin className="w-5 h-5 text-[#8d6e63]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#4e342e] text-sm">Address</p>
                                                <p className="text-[#6d4c41] text-sm mt-0.5">{vendor.address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-4">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Phone className="w-5 h-5 text-[#8d6e63]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#4e342e] text-sm">Phone</p>
                                                <p className="text-[#6d4c41] text-sm mt-0.5">{vendor.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-4">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Mail className="w-5 h-5 text-[#8d6e63]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#4e342e] text-sm">Email</p>
                                                <p className="text-[#6d4c41] text-sm mt-0.5">{vendor.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-4">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Clock className="w-5 h-5 text-[#8d6e63]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#4e342e] text-sm">Next Available</p>
                                                <p className="text-[#6d4c41] text-sm mt-0.5">{vendor.nextAvailableSlot}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-8 p-5 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-4">
                                        <div className="p-1.5 bg-orange-100 rounded-full mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-orange-700" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#4e342e] mb-1">What happens after you book?</p>
                                            <p className="text-sm text-[#6d4c41] leading-relaxed">Your appointment is saved to this vendor’s booking dashboard instantly. They can confirm, assign staff, and prepare for your visit.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Services Section */}
                        <div className="mt-10">
                            <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-6 flex items-center">
                                <Scissors className="w-5 h-5 mr-2" />
                                Services
                            </h2>
                            {services.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-[#d7ccc8]">
                                    <div className="bg-[#efebe9] p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <Scissors className="w-8 h-8 text-[#8d6e63]" />
                                    </div>
                                    <h3 className="text-lg font-medium text-[#4e342e] mb-1">No services yet</h3>
                                    <p className="text-[#8d6e63]">This vendor hasn't listed any services.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {services.map((service) => (
                                        <Card key={service.id} className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-row h-full rounded-xl">
                                            {service.image && (
                                                <div className="w-1/3 min-w-[110px] max-w-[130px] relative">
                                                    <img src={service.image} alt={service.name} className="h-full w-full object-cover absolute inset-0" />
                                                </div>
                                            )}
                                            <CardContent className="p-4 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-semibold text-[#4e342e] line-clamp-1" title={service.name}>{service.name}</h3>
                                                    <span className="font-bold text-[#4e342e] whitespace-nowrap ml-2">${service.price}</span>
                                                </div>
                                                <p className="text-[#6d4c41] text-xs mb-3 line-clamp-2 flex-grow">{service.description}</p>
                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                                    <div className="flex items-center text-xs text-[#8d6e63] font-medium">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {service.duration} min
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addService(service)}
                                                        className="h-8 px-3 bg-[#4e342e] hover:bg-[#6d4c41] text-white text-xs rounded-full"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Add
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Summary */}
                    <div className="lg:col-span-1">
                        <motion.div {...fadeInUp}>
                            <Card className="border-0 bg-white shadow-xl sticky top-24 rounded-xl overflow-hidden">
                                <CardHeader className="bg-[#fcfbf9] border-b border-[#efebe9] pb-4">
                                    <CardTitle className="text-[#4e342e] flex items-center text-lg">
                                        <ShoppingCart className="w-5 h-5 mr-3 text-[#8d6e63]" />
                                        Booking Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedServices.length === 0 && Object.keys(selectedProducts).length === 0 ? (
                                        <p className="text-[#6d4c41] text-center py-8">No items selected</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedServices.map((service) => (
                                                <div key={service.id} className="flex justify-between items-center p-3 bg-[#f8d7da] bg-opacity-20 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-[#4e342e]">{service.name}</p>
                                                        <p className="text-sm text-[#6d4c41]">{service.duration} min</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold text-[#4e342e]">$ {service.price}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => removeService(service.id)}
                                                            className="text-red-500 hover:bg-red-50"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            {Object.entries(selectedProducts).map(([productId, quantity]) => {
                                                const product = products.find(p => p.id === productId);
                                                if (!product) return null;
                                                return (
                                                    <div key={productId} className="flex justify-between items-center p-3 bg-[#f8d7da] bg-opacity-20 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-[#4e342e]">{product.name}</p>
                                                            <p className="text-sm text-[#6d4c41]">Qty: {quantity}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-semibold text-[#4e342e]">$ {product.price * quantity}</span>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateProductQuantity(productId, quantity - 1)}
                                                                className="text-red-500 hover:bg-red-50"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className="border-t pt-4">
                                                <div className="flex justify-between items-center text-lg font-bold text-[#4e342e]">
                                                    <span>Total</span>
                                                    <span>$ {getTotalPrice()}</span>
                                                </div>
                                            </div>

                                            <Button className="w-full bg-[#4e342e] hover:bg-[#6d4c41] text-white py-3" onClick={proceedToCheckout}>
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Proceed to Booking
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default VendorDetailsPage;