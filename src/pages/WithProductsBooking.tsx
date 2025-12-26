import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import {
  Package,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Home,
  ArrowLeft
} from 'lucide-react';
import {
  CatalogProduct,
  CatalogService,
  fetchCatalogProducts,
  fetchCatalogServices
} from '@/lib/catalogApi';
interface ServiceCategory {
  category: string;
  services: string[];
}

// Fallback products to ensure the page is never empty if API returns none
const DEFAULT_PRODUCTS: Array<{ id: string; name: string; price: number; stock?: number; category?: string; image?: string }> = [
  { id: 'seed-hair-shampoo', name: 'Professional Hair Shampoo', price: 15.99, stock: 100, category: 'Hair', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-hair-conditioner', name: 'Hair Conditioner Deep Moisture', price: 16.99, stock: 100, category: 'Hair', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-hair-color-kit', name: 'Hair Color Kit Professional', price: 45.99, stock: 50, category: 'Hair', image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-skin-cleanser', name: 'Facial Cleanser Gentle', price: 19.99, stock: 100, category: 'Skin', image: 'https://images.unsplash.com/photo-1522335789203-9d8aa9f4eebf?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-skin-serum', name: 'Facial Serum Vitamin C', price: 32.99, stock: 80, category: 'Skin', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-makeup-foundation', name: 'Foundation Liquid', price: 28.99, stock: 80, category: 'Makeup', image: 'https://images.unsplash.com/photo-1512203492609-8f5fa3f5c1ee?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-makeup-mascara', name: 'Mascara Volume', price: 18.99, stock: 90, category: 'Makeup', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-nail-base', name: 'Nail Polish Base Coat', price: 8.99, stock: 100, category: 'Nail', image: 'https://images.unsplash.com/photo-1512207846876-c59e0a4c7d87?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-nail-kit', name: 'Nail Art Kit', price: 24.99, stock: 70, category: 'Nail', image: 'https://images.unsplash.com/photo-1502389614483-e475fc3440d0?q=80&w=800&auto=format&fit=crop' },
  { id: 'seed-tool-brushes', name: 'Makeup Brushes Set', price: 29.99, stock: 70, category: 'General', image: 'https://images.unsplash.com/photo-1512207846876-c59e0a4c7d87?q=80&w=800&auto=format&fit=crop' }
];

const DEFAULT_SERVICES: Array<{
  id: string;
  name: string;
  price: number;
  category: string;
  duration?: number;
  vendorPayout?: number;
  allowsProducts?: boolean;
}> = [
    {
      id: 'default-hair-styling',
      name: 'Hair Styling & Cuts',
      price: 49.99,
      category: 'Hair',
      duration: 60,
      vendorPayout: 30,
      allowsProducts: true
    },
    {
      id: 'default-hair-coloring',
      name: 'Hair Coloring & Highlights',
      price: 79.99,
      category: 'Hair',
      duration: 90,
      vendorPayout: 50,
      allowsProducts: true
    },
    {
      id: 'default-skin-facial',
      name: 'Radiance Facial Treatment',
      price: 64.99,
      category: 'Skin',
      duration: 75,
      vendorPayout: 38,
      allowsProducts: true
    },
    {
      id: 'default-makeup-session',
      name: 'Professional Makeup Session',
      price: 89.99,
      category: 'Makeup',
      duration: 70,
      vendorPayout: 55,
      allowsProducts: true
    },
    {
      id: 'default-nail-art',
      name: 'Signature Nail Art & Gel Finish',
      price: 54.99,
      category: 'Nail',
      duration: 60,
      vendorPayout: 32,
      allowsProducts: true
    },
    {
      id: 'default-spa-massage',
      name: 'Relaxing Spa Massage',
      price: 74.99,
      category: 'Skin',
      duration: 80,
      vendorPayout: 42,
      allowsProducts: false
    }
  ];

const WithProductsBooking: React.FC = () => {
  const navigate = useNavigate();
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [servicesDetailed, setServicesDetailed] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      category: string;
      duration?: number;
      vendorPayout?: number;
      allowsProducts?: boolean;
    }>
  >([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; stock?: number; category?: string; image?: string }>>([]);
  const [filteredProducts, setFilteredProducts] = useState<Array<{ id: string; name: string; price: number; stock?: number; category?: string; image?: string }>>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [productSearch, setProductSearch] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(true); // Show all products by default
  const [servicesPage, setServicesPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [catalogAvailable, setCatalogAvailable] = useState(true);
  const pageSize = 6;

  useEffect(() => {
    const controller = new AbortController();
    const buildCategoriesFromServices = (
      services: Array<{ category: string; name: string }>
    ): ServiceCategory[] => {
      const grouped: Record<string, Set<string>> = {};
      services.forEach((svc) => {
        const category = (svc.category || 'General').trim() || 'General';
        if (!grouped[category]) {
          grouped[category] = new Set();
        }
        grouped[category].add(svc.name);
      });
      return Object.entries(grouped).map(([category, servicesSet]) => ({
        category,
        services: Array.from(servicesSet)
      }));
    };

    const fetchServices = async () => {
      try {
        setLoadError(null);
        setLoading(true);
        console.log('🔄 Fetching active services and products from Supabase...');

        // Fetch only active services and products from Supabase
        const [serviceData, productData] = await Promise.all([
          fetchCatalogServices({ includeProducts: true, showInactive: false, isAtHome: true }, { signal: controller.signal }),
          fetchCatalogProducts({ showInactive: false }, { signal: controller.signal })
        ]);

        console.log(`✅ Fetched ${serviceData.length} active services and ${productData.length} active products`);

        setCatalogServices(serviceData);
        setCatalogProducts(productData);

        // Use real data only - no defaults
        if (serviceData.length > 0) {
          const servicesToUse = serviceData.map((svc) => ({
            id: svc.id,
            name: svc.name,
            price: svc.customerPrice,
            category: svc.category || inferServiceCategory(svc.name, svc.description || ''),
            duration: svc.duration,
            vendorPayout: svc.vendorPayout,
            allowsProducts: svc.allowsProducts
          }));

          setServicesDetailed(servicesToUse);
          setServiceCategories(
            buildCategoriesFromServices(
              serviceData.map((svc) => ({
                category: svc.category || inferServiceCategory(svc.name, svc.description || ''),
                name: svc.name
              }))
            )
          );
          setCatalogAvailable(true);
        } else {
          // No services - show empty state
          setServicesDetailed([]);
          setServiceCategories([]);
          setCatalogAvailable(false);
          setLoadError('No services are currently available. Please contact support or check back later.');
        }

        // Use real products only - no defaults
        if (productData.length > 0) {
          const catalogProductList = productData.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.customerPrice,
            stock: undefined,
            category: mapProductCategory(product.category, product.name),
            image: product.image || getPlaceholderImage(product.category, product.name),
            vendorPayout: product.vendorPayout
          }));

          setProducts(catalogProductList);
          setFilteredProducts(catalogProductList);
        } else {
          // No products - show empty state
          setProducts([]);
          setFilteredProducts([]);
          if (!loadError) {
            setLoadError('No products are currently available. Services can still be booked without products.');
          }
        }
      } catch (error) {
        const err = error as { name?: string; message?: string };
        if (err?.name === 'AbortError') {
          return;
        }
        console.error('❌ Failed to load catalog data:', error);
        console.error('Error details:', err?.message || 'Unknown error');
        setLoadError('Failed to load services and products. Please check your connection and try again. If the problem persists, contact support.');
        // Show empty state - no defaults
        setServiceCategories([]);
        setServicesDetailed([]);
        setProducts([]);
        setFilteredProducts([]);
        setCatalogServices([]);
        setCatalogProducts([]);
        setCatalogAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    return () => controller.abort();
  }, []);

  // Helpers to infer categories
  const inferServiceCategory = (name?: string, description?: string): string => {
    const text = `${name || ''} ${description || ''}`.toLowerCase();
    if (/hair|cut|braid|style|color|shampoo|keratin/.test(text)) return 'Hair';
    if (/skin|facial|glow|clean|spa|massage|peel|acne/.test(text)) return 'Skin';
    if (/makeup|bridal|party|lip|eye|foundation|cosmetic/.test(text)) return 'Makeup';
    if (/nail|manicure|pedicure|polish|gel|acrylic/.test(text)) return 'Nail';
    return 'Other';
  };

  // Map database category to frontend category
  const mapProductCategory = (dbCategory?: string, name?: string): string => {
    // First try to use database category if available
    if (dbCategory) {
      const cat = dbCategory.toLowerCase();
      if (cat === 'hair_care' || cat.includes('hair')) return 'Hair';
      if (cat === 'skincare' || cat.includes('skin')) return 'Skin';
      if (cat === 'makeup' || cat.includes('makeup')) return 'Makeup';
      if (cat === 'nail_care' || cat.includes('nail')) return 'Nail';
      if (cat === 'tools' || cat === 'accessories') return 'General';
    }

    // Fallback to name-based inference
    const text = `${name || ''}`.toLowerCase();
    if (/shampoo|conditioner|hair|keratin|oil|spray/.test(text)) return 'Hair';
    if (/skin|cream|serum|mask|lotion|toner/.test(text)) return 'Skin';
    if (/makeup|lip|eye|foundation|blush|palette/.test(text)) return 'Makeup';
    if (/nail|polish|manicure|pedicure|gel|acrylic/.test(text)) return 'Nail';
    return 'General';
  };

  const inferProductCategory = (name?: string): string => {
    return mapProductCategory(undefined, name);
  };

  const getPlaceholderImage = (category?: string, name?: string): string => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('hair')) return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop';
    if (cat.includes('skin')) return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop';
    if (cat.includes('makeup')) return 'https://images.unsplash.com/photo-1512203492609-8f5fa3f5c1ee?q=80&w=800&auto=format&fit=crop';
    if (cat.includes('nail')) return 'https://images.unsplash.com/photo-1502389614483-e475fc3440d0?q=80&w=800&auto=format&fit=crop';
    // Fallback based on name keywords
    const text = `${name || ''}`.toLowerCase();
    if (/shampoo|hair|conditioner|keratin/.test(text)) return 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop';
    if (/serum|cream|skin|facial|lotion/.test(text)) return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop';
    if (/lip|foundation|palette|mascara|makeup/.test(text)) return 'https://images.unsplash.com/photo-1512203492609-8f5fa3f5c1ee?q=80&w=800&auto=format&fit=crop';
    if (/nail|polish|manicure|pedicure/.test(text)) return 'https://images.unsplash.com/photo-1502389614483-e475fc3440d0?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1490111718993-d98654ce6cf7?q=80&w=800&auto=format&fit=crop';
  };

  // Filter products by selected services and search
  useEffect(() => {
    const q = productSearch.toLowerCase();
    if (showAllProducts || selectedServiceIds.size === 0) {
      setFilteredProducts(products.filter(p => !q || p.name.toLowerCase().includes(q)));
      return;
    }
    const selected = servicesDetailed.filter(s => selectedServiceIds.has(s.id));
    const cats = new Set(selected.map(s => (s.category || '').toLowerCase()).filter(Boolean));
    const list = products.filter(p => {
      const pc = (p.category || '').toLowerCase();
      if (!pc) return false;
      return cats.has(pc);
    }).filter(p => !q || p.name.toLowerCase().includes(q));
    setFilteredProducts(list);
  }, [products, servicesDetailed, selectedServiceIds, productSearch, showAllProducts]);

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      if (prev.has(id)) {
        return new Set();
      }
      const next = new Set<string>();
      next.add(id);
      return next;
    });
  };

  const incQty = (id: string) => setProductQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const decQty = (id: string) => setProductQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));

  const selectedCatalogServices = catalogServices.filter(s => selectedServiceIds.has(s.id));
  const selectedServices = servicesDetailed.filter(s => selectedServiceIds.has(s.id));
  const selectedCatalogProducts = catalogProducts.filter(p => (productQuantities[p.id] || 0) > 0);
  const selectedProducts = filteredProducts.filter(p => (productQuantities[p.id] || 0) > 0);
  const servicesTotal =
    selectedCatalogServices.length > 0
      ? selectedCatalogServices.reduce((sum, s) => sum + (s.customerPrice || 0), 0)
      : selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const productsTotal =
    selectedCatalogProducts.length > 0
      ? selectedCatalogProducts.reduce(
        (sum, p) => sum + p.customerPrice * (productQuantities[p.id] || 0),
        0
      )
      : selectedProducts.reduce((sum, p) => sum + p.price * (productQuantities[p.id] || 0), 0);
  const grandTotal = servicesTotal + productsTotal;

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Build flat services for pagination
  const flatServices: Array<{ id: string; name: string; price: number; category: string }> = (
    servicesDetailed.length > 0
      ? servicesDetailed.map(s => ({ id: s.id, name: s.name, price: s.price || 0, category: s.category || 'Other' }))
      : serviceCategories.flatMap(cat => (cat.services || []).map(name => ({ id: name, name, price: 0, category: cat.category })))
  );
  const totalServicePages = Math.max(1, Math.ceil(flatServices.length / pageSize));
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedServices = flatServices.slice((servicesPage - 1) * pageSize, servicesPage * pageSize);
  const paginatedProducts = filteredProducts.slice((productsPage - 1) * pageSize, productsPage * pageSize);

  const Pagination = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => {
    if (total <= 1) return null;
    const pages = Array.from({ length: total }, (_, i) => i + 1);
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button variant="outline" className="border-[#4e342e] text-[#4e342e]" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</Button>
        {pages.map(p => (
          <button key={p} className={`px-3 py-1 rounded-md text-sm ${p === page ? 'bg-[#4e342e] text-white' : 'bg-white text-[#4e342e] border border-[#d7ccc8]'}`} onClick={() => onChange(p)}>{p}</button>
        ))}
        <Button variant="outline" className="border-[#4e342e] text-[#4e342e]" disabled={page === total} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf6f0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#4e342e] text-xl">Loading services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf6f0]">
      <Navigation />
      {/* Hero Section */}
      <section className="pt-40 pb-16 bg-gradient-to-br from-[#4e342e] to-[#3b2c26] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-lg border border-white/30">
                <Package className="w-5 h-5 text-white mr-3" />
                <span className="text-sm font-bold text-white uppercase tracking-wide">WITH PRODUCTS</span>
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl lg:text-5xl font-serif font-bold mb-6 leading-tight"
              variants={fadeInUp}
            >
              Services with Professional Products
            </motion.h1>

            <motion.p
              className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Our beauticians bring all necessary professional products and tools for a complete service experience
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Services + Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8">
            {/* Main column: Services and Products stacked */}
            <div className="space-y-12">
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl lg:text-3xl font-serif font-bold text-[#4e342e] mb-2">Select Service</h2>
                <p className="text-[#6d4c41]">
                  {catalogAvailable
                    ? 'Choose the service you would like at home'
                    : 'No at-home services are currently available. Please contact an administrator to configure the catalog.'}
                </p>
                {loadError && (
                  <p className="text-sm text-red-700 mt-2">{loadError}</p>
                )}
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalogAvailable ? (
                  paginatedServices.map((svc) => {
                    const selected = selectedServiceIds.has(svc.id);
                    return (
                      <Card key={svc.id} className={`border ${selected ? 'border-[#4e342e]' : 'border-[#d7ccc8]'} hover:shadow-md`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-[#4e342e] text-white">Service</Badge>
                                <span className="text-xs text-[#6d4c41]">{svc.category}</span>
                              </div>
                              <div className="text-[#4e342e] font-semibold">{svc.name}</div>
                              <div className="text-sm text-[#6d4c41]">Professional service</div>
                              <div className="text-sm text-[#4e342e] font-medium mt-1">${(svc.price || 0).toFixed(2)}</div>
                            </div>
                            <Button
                              variant={selected ? 'outline' : 'default'}
                              className={selected ? 'border-[#4e342e] text-[#4e342e]' : 'bg-[#4e342e] hover:bg-[#3b2c26] text-white'}
                              onClick={() => toggleService(svc.id)}
                            >
                              {selected ? 'Remove' : 'Select'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="p-6 border border-dashed border-[#d7ccc8] rounded-lg text-center text-[#6d4c41] bg-[#fef9f5]">
                    Our team is updating the at-home catalog. Please check back later or contact support for assistance.
                  </div>
                )}
              </div>
              <Pagination page={servicesPage} total={catalogAvailable ? totalServicePages : 1} onChange={(p) => setServicesPage(p)} />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-serif font-bold text-[#4e342e]">Products Available from Vendors</h2>
                    <p className="text-[#6d4c41] text-sm">
                      {showAllProducts
                        ? `Showing all ${filteredProducts.length} products from all vendors`
                        : 'Filtered by selected service categories. Toggle to view all products.'}
                    </p>
                  </div>
                  <label className="text-sm text-[#4e342e] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllProducts}
                      onChange={(e) => setShowAllProducts(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span>Show all products ({products.length})</span>
                  </label>
                </div>

                <div className="mb-4">
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="bg-white"
                  />
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {paginatedProducts.map((p) => {
                      const qty = productQuantities[p.id] || 0;
                      const outOfStock = p.stock !== undefined && p.stock <= 0;
                      return (
                        <div key={p.id} className="border rounded-lg p-3 shadow-md bg-white">
                          <img
                            src={p.image || getPlaceholderImage(p.category, p.name)}
                            alt={p.name}
                            className="w-full h-32 object-cover rounded-md bg-[#fdf6f0]"
                            loading="lazy"
                          />
                          <h3 className="text-lg font-semibold mt-2 text-[#4e342e]">{p.name}</h3>
                          <p className="text-sm text-[#6d4c41]">{p.category || 'General'}</p>
                          <p className="font-medium mt-1 text-[#4e342e]">${p.price.toFixed(2)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Button variant="outline" className="border-[#4e342e] text-[#4e342e]" disabled={qty === 0} onClick={() => decQty(p.id)}>-</Button>
                            <div className="w-8 text-center text-[#4e342e]">{qty}</div>
                            <Button className="bg-[#4e342e] hover:bg-[#3b2c26] text-white" disabled={outOfStock} onClick={() => incQty(p.id)}>Add</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#6d4c41] mb-2">
                      {products.length === 0
                        ? 'No products available from vendors yet.'
                        : showAllProducts
                          ? 'No products match your search.'
                          : 'No products found for the selected services. Try selecting different services or enable "Show all products".'}
                    </p>
                    {products.length === 0 && (
                      <p className="text-sm text-[#6d4c41] mt-2">
                        Vendors can add products through their dashboard at /vendor/products
                      </p>
                    )}
                  </div>
                )}

                <Pagination page={productsPage} total={totalProductPages} onChange={(p) => setProductsPage(p)} />
              </div>
            </div>
            {/* Right column: Sticky Summary */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="p-4 bg-[#fdf6f0] rounded-lg border border-[#d7ccc8] shadow-sm">
                  <div className="flex items-center justify-between text-[#4e342e] font-semibold">
                    <span>Services</span>
                    <span>${servicesTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#4e342e] font-semibold mt-1">
                    <span>Products</span>
                    <span>${productsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#4e342e] font-bold mt-2 border-t border-[#d7ccc8] pt-2">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-3">
                    <Button
                      className="w-full bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                      onClick={() => {
                        const services = (selectedCatalogServices.length > 0 ? selectedCatalogServices : selectedServices).map((svc: any) => ({
                          id: svc.id,
                          catalogServiceId: svc.id,
                          name: svc.name,
                          price: 'customerPrice' in svc ? svc.customerPrice : svc.price || 0,
                          duration: 'duration' in svc ? svc.duration : undefined,
                          vendorPayout: 'vendorPayout' in svc ? svc.vendorPayout : undefined,
                          allowsProducts: 'allowsProducts' in svc ? svc.allowsProducts : undefined
                        }));
                        const products = (selectedCatalogProducts.length > 0 ? selectedCatalogProducts : selectedProducts).map((product: any) => ({
                          id: product.id,
                          productCatalogId: product.id,
                          name: product.name,
                          price: 'customerPrice' in product ? product.customerPrice : product.price,
                          quantity: productQuantities[product.id] || 0,
                          vendorPayout: 'vendorPayout' in product ? product.vendorPayout : undefined
                        }));
                        const totalPrice =
                          services.reduce((sum, s) => sum + (s.price || 0), 0) +
                          products.reduce((sum, p) => sum + p.price * (p.quantity || 0), 0);
                        const totalDuration =
                          selectedCatalogServices.length > 0
                            ? selectedCatalogServices.reduce((sum, svc) => sum + (svc.duration || 0), 0)
                            : 0;
                        const bookingData = {
                          services: services.map(s => ({ name: s.name, price: s.price, quantity: 1 })),
                          catalogServiceIds: selectedCatalogServices.map(svc => svc.id),
                          productCatalogSelections: selectedCatalogProducts.map(prod => ({
                            id: prod.id,
                            quantity: productQuantities[prod.id] || 0
                          })),
                          serviceDetails: services,
                          productDetails: products,
                          date: new Date().toISOString(),
                          time: '10:00',
                          address: '',
                          phone: '',
                          notes: 'At-home with products',
                          beauticianPreference: 'any',
                          totalPrice,
                          totalDuration,
                          type: 'AT_HOME',
                          includeProducts: products.some(p => (p.quantity || 0) > 0),
                          flow: 'AT_HOME'
                        };
                        try { sessionStorage.setItem('bookingData', JSON.stringify(bookingData)); } catch { }
                        navigate('/customer/booking-confirmation');
                      }}
                      disabled={selectedServiceIds.size === 0 || !catalogAvailable}
                    >
                      {catalogAvailable ? 'Proceed to Payment' : 'Catalog Unavailable'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-[#fdf6f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-[#4e342e] mb-6">
              Why Choose Services with Products?
            </h2>
            <p className="text-xl text-[#6d4c41] max-w-3xl mx-auto">
              Professional products ensure the best results for your beauty service
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Package,
                title: 'Professional Products',
                description: 'High-quality products used by salon professionals'
              },
              {
                icon: Star,
                title: 'Best Results',
                description: 'Optimal results with professional-grade materials'
              },
              {
                icon: Home,
                title: 'Convenience',
                description: 'No need to purchase or prepare anything yourself'
              }
            ].map((benefit, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 bg-white rounded-2xl">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-[#4e342e] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <benefit.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-serif font-bold mb-4 text-[#4e342e]">
                      {benefit.title}
                    </h3>
                    <p className="text-[#6d4c41] leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Back Button */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Button
            variant="outline"
            className="border-2 border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
            onClick={() => navigate('/customer/at-home-services/select-option')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Service Options
          </Button>
        </div>
      </section>
    </div>
  );
};

export default WithProductsBooking;
