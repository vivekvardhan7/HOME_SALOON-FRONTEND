import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardLayout from '@/components/DashboardLayout';
import {
  Scissors,
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Copy,
  Image as ImageIcon,
  DollarSign,
  Clock,
  AlignLeft,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/adminApi';

// Interfaces
interface AdminService {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
}

interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
}

// Interfaces for Vendor Reference
interface VendorServiceReference {
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  vendor_name: string;
}

interface VendorProductReference {
  name: string;
  price: number;
  vendor_name: string;
}

const ManageAtHomeCatalog = ({ defaultTab = 'services' }: { defaultTab?: 'services' | 'products' }) => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'products'>(defaultTab);
  const [subTab, setSubTab] = useState<'master' | 'reference'>('master');

  // Master Data State
  const [services, setServices] = useState<AdminService[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Vendor Reference State
  const [vendorServices, setVendorServices] = useState<VendorServiceReference[]>([]);
  const [vendorProducts, setVendorProducts] = useState<VendorProductReference[]>([]);
  const [referenceLoading, setReferenceLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog State
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [processing, setProcessing] = useState(false);

  // Forms
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    duration_minutes: 60,
    image_url: '',
    is_active: true
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    image_url: '',
    is_active: true
  });

  const serviceCategories = ['Hair Styling', 'Skin Care', 'Makeup', 'Nail Care', 'Massage', 'Other'];
  const productCategories = ['Hair Product', 'Skin Product', 'Makeup Product', 'Nail Product', 'General', 'Other'];

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchMasterData();
    if (subTab === 'reference') {
      fetchReferenceData();
    }
  }, [activeTab, subTab]);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'services') {
        const res = await adminApi.get<{ data: AdminService[] }>('/admin/athome/services');
        // Check for nested data property from backend response wrapper
        if (res.success && res.data?.data) {
          setServices(res.data.data);
        } else if (res.success && Array.isArray(res.data)) {
          setServices(res.data);
        } else {
          setServices([]);
        }
      } else {
        const res = await adminApi.get<{ data: AdminProduct[] }>('/admin/athome/products');
        if (res.success && res.data?.data) {
          setProducts(res.data.data);
        } else if (res.success && Array.isArray(res.data)) {
          setProducts(res.data);
        } else {
          setProducts([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching master data:', error);
      toast.error('Failed to load master catalog');
      setServices([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    setReferenceLoading(true);
    try {
      if (activeTab === 'services') {
        const res = await adminApi.get<VendorServiceReference[]>('/admin/vendor-catalog/services');
        if (res.success && res.data) {
          setVendorServices(res.data);
        }
      } else {
        const res = await adminApi.get<VendorProductReference[]>('/admin/vendor-catalog/products');
        if (res.success && res.data) {
          setVendorProducts(res.data);
        }
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
      toast.error('Failed to load vendor reference');
    } finally {
      setReferenceLoading(false);
    }
  };

  // ==================== SERVICE ACTIONS ====================

  const handleOpenServiceDialog = (service?: AdminService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description || '',
        category: service.category,
        price: service.price,
        duration_minutes: service.duration_minutes,
        image_url: service.image_url || '',
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setServiceForm({
        name: '',
        description: '',
        category: '',
        price: 0,
        duration_minutes: 60,
        image_url: '',
        is_active: true
      });
    }
    setIsServiceDialogOpen(true);
  };

  const handleUseServiceTemplate = (ref: VendorServiceReference) => {
    setEditingService(null);
    setServiceForm({
      name: ref.name,
      description: `Professional ${ref.category} service.`,
      category: ref.category,
      price: ref.price,
      duration_minutes: ref.duration_minutes,
      image_url: '',
      is_active: true
    });
    setSubTab('master');
    setIsServiceDialogOpen(true);
    toast.info('Template loaded. Please review and save.');
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.category || serviceForm.price < 0) {
      toast.error('Please fill in valid name, category, and price.');
      return;
    }

    setProcessing(true);
    try {
      if (editingService) {
        // UPDATE via adminApi (PUT)
        const res = await adminApi.put(`/admin/athome/services/${editingService.id}`, serviceForm);
        if (!res.success) throw new Error(res.message);
        toast.success('Service updated');
      } else {
        // CREATE via adminApi (POST)
        const res = await adminApi.post('/admin/athome/services', serviceForm);
        if (!res.success) throw new Error(res.message);
        toast.success('Service created');
      }
      setIsServiceDialogOpen(false);
      fetchMasterData();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message || 'Failed to save service');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      // DELETE via adminApi
      const res = await adminApi.delete(`/admin/athome/services/${id}`);
      if (!res.success) throw new Error(res.message);
      toast.success('Service deleted');
      fetchMasterData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service');
    }
  };

  // ==================== PRODUCT ACTIONS ====================

  const handleOpenProductDialog = (product?: AdminProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || '',
        category: product.category,
        price: product.price,
        image_url: product.image_url || '',
        is_active: product.is_active
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        category: '',
        price: 0,
        image_url: '',
        is_active: true
      });
    }
    setIsProductDialogOpen(true);
  };

  const handleUseProductTemplate = (ref: VendorProductReference) => {
    setEditingProduct(null);
    setProductForm({
      name: ref.name,
      description: '',
      category: 'General',
      price: ref.price,
      image_url: '',
      is_active: true
    });
    setSubTab('master');
    setIsProductDialogOpen(true);
    toast.info('Template loaded. Please review and save.');
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.category || productForm.price < 0) {
      toast.error('Please fill in valid name, category, and price.');
      return;
    }

    setProcessing(true);
    try {
      if (editingProduct) {
        // UPDATE via adminApi (PUT)
        const res = await adminApi.put(`/admin/athome/products/${editingProduct.id}`, productForm);
        if (!res.success) throw new Error(res.message);
        toast.success('Product updated');
      } else {
        // CREATE via adminApi (POST)
        const res = await adminApi.post('/admin/athome/products', productForm);
        if (!res.success) throw new Error(res.message);
        toast.success('Product created');
      }
      setIsProductDialogOpen(false);
      fetchMasterData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      // DELETE via adminApi
      const res = await adminApi.delete(`/admin/athome/products/${id}`);
      if (!res.success) throw new Error(res.message);
      toast.success('Product deleted');
      fetchMasterData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  // ==================== FILTERING ====================

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRefServices = vendorServices.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRefProducts = vendorProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reusable Image Preview Component
  const ImagePreview = ({ url }: { url: string }) => {
    const [hasError, setHasError] = useState(false);

    // Reset error state if URL changes
    useEffect(() => {
      setHasError(false);
    }, [url]);

    if (!url) {
      return (
        <div className="mt-2 h-40 w-full rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs font-medium">No image preview available</span>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="mt-2 h-40 w-full rounded-lg border-2 border-dashed border-red-200 bg-red-50 flex flex-col items-center justify-center text-red-400">
          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs font-medium">Invalid Image URL</span>
        </div>
      )
    }

    return (
      <div className="mt-2 relative h-40 w-full rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm group">
        <img
          src={url}
          alt="Preview"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setHasError(true)}
        />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2 flex items-center gap-2">
            <Package className="w-8 h-8" />
            Manage At-Home Catalog
          </h1>
          <p className="text-[#6d4c41]">Create, update, and manage catalog items for at-home bookings.</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSubTab('master'); }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-white border">
            <TabsTrigger value="services" className="data-[state=active]:bg-[#4e342e] data-[state=active]:text-white transition-all">
              <Scissors className="w-4 h-4 mr-2" /> Services
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-[#4e342e] data-[state=active]:text-white transition-all">
              <Package className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
          </TabsList>

          {/* Sub Tabs Toggle & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-[#e7e0db]">
            <Tabs value={subTab} onValueChange={(v) => setSubTab(v as any)} className="w-full md:w-auto">
              <TabsList className="bg-gray-100 p-1">
                <TabsTrigger value="master" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Master Catalog</TabsTrigger>
                <TabsTrigger value="reference" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Vendor Reference</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
              {subTab === 'master' && (
                <Button
                  onClick={() => activeTab === 'services' ? handleOpenServiceDialog() : handleOpenProductDialog()}
                  className="bg-[#4e342e] text-white hover:bg-[#3b2c26] shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Add {activeTab === 'services' ? 'Service' : 'Product'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <Card className="border-0 shadow-lg min-h-[400px] bg-white/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* SERVICES CONTENT */}
              <TabsContent value="services" className="m-0">
                {subTab === 'master' ? (
                  <Table>
                    <TableHeader className="bg-[#f8f5f2]">
                      <TableRow className="hover:bg-transparent border-b-[#e7e0db]">
                        <TableHead className="font-serif text-[#4e342e]">Service Name</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Category</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Price</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Duration</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Status</TableHead>
                        <TableHead className="text-right font-serif text-[#4e342e]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4e342e]" /></TableCell></TableRow>
                      ) : filteredServices.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center opacity-70">
                            <Scissors className="w-10 h-10 mb-2 text-[#4e342e]/30" />
                            <p>No services found in Master Catalog.</p>
                          </div>
                        </TableCell></TableRow>
                      ) : (
                        filteredServices.map(service => (
                          <TableRow key={service.id} className="hover:bg-[#faf8f6] group transition-colors">
                            <TableCell className="font-medium text-[#4e342e]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                  {service.image_url ? (
                                    <img src={service.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <Scissors className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div>{service.name}</div>
                                  {service.description && <div className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{service.description}</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="bg-white border-[#e7e0db] text-[#6d4c41] font-normal">{service.category}</Badge></TableCell>
                            <TableCell className="font-bold text-[#4e342e]">${service.price.toLocaleString()}</TableCell>
                            <TableCell className="text-[#6d4c41] text-sm"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration_minutes}m</span></TableCell>
                            <TableCell>
                              {service.is_active
                                ? <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-none font-normal"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                                : <Badge variant="secondary" className="font-normal">Inactive</Badge>
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenServiceDialog(service)} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader className="bg-[#fdf6f0]">
                      <TableRow className="border-b-[#f0e6dd]">
                        <TableHead className="font-serif text-[#4e342e]">Vendor Service</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Category</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Vendor</TableHead>
                        <TableHead className="text-right font-serif text-[#4e342e]">Price</TableHead>
                        <TableHead className="text-right font-serif text-[#4e342e]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referenceLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4e342e]" /></TableCell></TableRow>
                      ) : filteredRefServices.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No vendor services found.</TableCell></TableRow>
                      ) : (
                        filteredRefServices.map((ref, i) => (
                          <TableRow key={i} className="hover:bg-[#fff9f4]">
                            <TableCell className="font-medium text-[#4e342e]">{ref.name}</TableCell>
                            <TableCell><Badge variant="outline" className="bg-white/50">{ref.category}</Badge></TableCell>
                            <TableCell className="text-gray-500 text-sm">{ref.vendor_name}</TableCell>
                            <TableCell className="text-right font-serif font-medium">${ref.price.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => handleUseServiceTemplate(ref)} className="h-8 bg-white border-[#e7e0db] hover:bg-[#4e342e] hover:text-white transition-colors">
                                <Copy className="w-3 h-3 mr-2" /> Use Template
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* PRODUCTS CONTENT */}
              <TabsContent value="products" className="m-0">
                {subTab === 'master' ? (
                  <Table>
                    <TableHeader className="bg-[#f8f5f2]">
                      <TableRow className="hover:bg-transparent border-b-[#e7e0db]">
                        <TableHead className="font-serif text-[#4e342e]">Product Name</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Category</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Price</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Status</TableHead>
                        <TableHead className="text-right font-serif text-[#4e342e]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4e342e]" /></TableCell></TableRow>
                      ) : filteredProducts.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center opacity-70">
                            <Package className="w-10 h-10 mb-2 text-[#4e342e]/30" />
                            <p>No products found in Master Catalog.</p>
                          </div>
                        </TableCell></TableRow>
                      ) : (
                        filteredProducts.map(product => (
                          <TableRow key={product.id} className="hover:bg-[#faf8f6] group transition-colors">
                            <TableCell className="font-medium text-[#4e342e]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div>{product.name}</div>
                                  {product.description && <div className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{product.description}</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="bg-white border-[#e7e0db] text-[#6d4c41] font-normal">{product.category}</Badge></TableCell>
                            <TableCell className="font-bold text-[#4e342e]">${product.price.toLocaleString()}</TableCell>
                            <TableCell>
                              {product.is_active
                                ? <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-none font-normal"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                                : <Badge variant="secondary" className="font-normal">Inactive</Badge>
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenProductDialog(product)} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader className="bg-[#fdf6f0]">
                      <TableRow className="border-b-[#f0e6dd]">
                        <TableHead className="font-serif text-[#4e342e]">Vendor Product</TableHead>
                        <TableHead className="font-serif text-[#4e342e]">Vendor</TableHead>
                        <TableHead className="text-right font-serif text-[#4e342e]">Price</TableHead>
                        <TableHead className="text-right font-serif text-[#4e342e]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referenceLoading ? (
                        <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4e342e]" /></TableCell></TableRow>
                      ) : filteredRefProducts.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No vendor products found.</TableCell></TableRow>
                      ) : (
                        filteredRefProducts.map((ref, i) => (
                          <TableRow key={i} className="hover:bg-[#fff9f4]">
                            <TableCell className="font-medium text-[#4e342e]">{ref.name}</TableCell>
                            <TableCell className="text-gray-500">{ref.vendor_name}</TableCell>
                            <TableCell className="text-right font-serif font-medium">${ref.price.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => handleUseProductTemplate(ref)} className="h-8 bg-white border-[#e7e0db] hover:bg-[#4e342e] hover:text-white transition-colors">
                                <Copy className="w-3 h-3 mr-2" /> Use Template
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        {/* SERVICE DIALOG */}
        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogContent className="max-w-2xl bg-[#faf9f8] border-0 shadow-2xl">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="text-2xl font-serif text-[#4e342e]">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              {/* Left Column: Image & Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Service Image URL</Label>
                  <Input
                    value={serviceForm.image_url}
                    onChange={e => setServiceForm({ ...serviceForm, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="bg-white"
                  />
                  {/* LIVE IMAGE PREVIEW */}
                  <ImagePreview url={serviceForm.image_url} />
                </div>
                <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm mt-4">
                  <input
                    type="checkbox"
                    id="srvActive"
                    checked={serviceForm.is_active}
                    onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 accent-[#4e342e] cursor-pointer"
                  />
                  <Label htmlFor="srvActive" className="cursor-pointer font-medium text-[#4e342e]">Active & Visible in Catalog</Label>
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium">Service Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={serviceForm.name}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="bg-white font-medium"
                    placeholder="e.g. Luxury Facial"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium">Category <span className="text-red-500">*</span></Label>
                  <Select value={serviceForm.category} onValueChange={v => setServiceForm({ ...serviceForm, category: v })}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#6d4c41] font-medium flex items-center gap-1"><DollarSign className="w-3 h-3" /> Price</Label>
                    <Input
                      type="number"
                      value={serviceForm.price}
                      onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                      className="bg-white"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#6d4c41] font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Duration (min)</Label>
                    <Input
                      type="number"
                      value={serviceForm.duration_minutes}
                      onChange={e => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })}
                      className="bg-white"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Description</Label>
                  <Textarea
                    value={serviceForm.description}
                    onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="bg-white min-h-[100px]"
                    placeholder="Describe the service details..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="bg-white border-t border-gray-100 -mx-6 -mb-6 p-4 rounded-b-lg">
              <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)} className="hover:bg-gray-50">Cancel</Button>
              <Button onClick={handleSaveService} disabled={processing} className="bg-[#4e342e] text-white hover:bg-[#3b2c26] shadow-md">
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingService ? 'Save Changes' : 'Create Service'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PRODUCT DIALOG */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="max-w-2xl bg-[#faf9f8] border-0 shadow-2xl">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="text-2xl font-serif text-[#4e342e]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              {/* Left Column: Image & Status */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Product Image URL</Label>
                  <Input
                    value={productForm.image_url}
                    onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/product.jpg"
                    className="bg-white"
                  />
                  {/* LIVE IMAGE PREVIEW */}
                  <ImagePreview url={productForm.image_url} />
                </div>
                <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm mt-4">
                  <input
                    type="checkbox"
                    id="prodActive"
                    checked={productForm.is_active}
                    onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 accent-[#4e342e] cursor-pointer"
                  />
                  <Label htmlFor="prodActive" className="cursor-pointer font-medium text-[#4e342e]">Active & Visible</Label>
                </div>
              </div>

              {/* Right Column: Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium">Product Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    className="bg-white font-medium"
                    placeholder="e.g. Argan Oil Shampoo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium">Category <span className="text-red-500">*</span></Label>
                  <Select value={productForm.category} onValueChange={v => setProductForm({ ...productForm, category: v })}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {productCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium flex items-center gap-1"><DollarSign className="w-3 h-3" /> Price</Label>
                  <Input
                    type="number"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="bg-white"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#6d4c41] font-medium flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Description</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    className="bg-white min-h-[100px]"
                    placeholder="Product details..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="bg-white border-t border-gray-100 -mx-6 -mb-6 p-4 rounded-b-lg">
              <Button variant="outline" onClick={() => setIsProductDialogOpen(false)} className="hover:bg-gray-50">Cancel</Button>
              <Button onClick={handleSaveProduct} disabled={processing} className="bg-[#4e342e] text-white hover:bg-[#3b2c26] shadow-md">
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default ManageAtHomeCatalog;
