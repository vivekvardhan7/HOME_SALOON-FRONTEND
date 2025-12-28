import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Scissors,
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { supabaseCatalog, type CatalogService, type CatalogProduct } from '@/lib/supabaseCatalog';

const ManageAtHomeCatalog = ({ defaultTab = 'services' }: { defaultTab?: 'services' | 'products' }) => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'services' | 'products'>(defaultTab);

  // Services state
  const [services, setServices] = useState<CatalogService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesSearchTerm, setServicesSearchTerm] = useState('');
  const [servicesStatusFilter, setServicesStatusFilter] = useState('all');
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CatalogService | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    customerPrice: 0,
    vendorPayout: 0,
    category: '',
    icon: '',
    allowsProducts: false,
    isActive: true
  });

  // Products state
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsSearchTerm, setProductsSearchTerm] = useState('');
  const [productsStatusFilter, setProductsStatusFilter] = useState('all');
  const [productsCategoryFilter, setProductsCategoryFilter] = useState('all');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    category: '',
    image: '',
    customerPrice: 0,
    vendorPayout: 0,
    sku: '',
    isActive: true
  });

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
      navigate('/admin');
    }
  }, [user, navigate]);

  // Fetch services
  useEffect(() => {
    if (activeTab === 'services') {
      fetchServices();
    }
  }, [activeTab]);

  // Fetch products
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      console.log('📡 Fetching services from Supabase...');

      const { data, error } = await supabase
        .from('service_catalog')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const mappedServices: CatalogService[] = (data || []).map((item: any) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        duration: item.duration,
        customerPrice: Number(item.customer_price || 0),
        vendorPayout: Number(item.vendor_payout || 0),
        category: item.category,
        icon: item.icon,
        allowsProducts: Boolean(item.allows_products),
        isActive: Boolean(item.is_active),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      setServices(mappedServices);
      console.log(`✅ Fetched ${mappedServices.length} services`);
    } catch (error: any) {
      console.error('❌ Error fetching services:', error);
      toast.error(error.message || 'Failed to load services');
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      console.log('📡 Fetching products from Supabase...');

      const { data, error } = await supabase
        .from('product_catalog')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const mappedProducts: CatalogProduct[] = (data || []).map((item: any) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        category: item.category,
        image: item.image,
        customerPrice: Number(item.customer_price || 0),
        vendorPayout: Number(item.vendor_payout || 0),
        sku: item.sku,
        isActive: Boolean(item.is_active),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      setProducts(mappedProducts);
      console.log(`✅ Fetched ${mappedProducts.length} products`);
    } catch (error: any) {
      console.error('❌ Error fetching products:', error);
      toast.error(error.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // ==================== SERVICES HANDLERS ====================

  const handleAddService = () => {
    setEditingService(null);
    setServiceFormData({
      name: '',
      description: '',
      duration: 60,
      customerPrice: 0,
      vendorPayout: 0,
      category: '',
      icon: '',
      allowsProducts: false,
      isActive: true
    });
    setIsServiceDialogOpen(true);
  };

  const handleEditService = (service: CatalogService) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      customerPrice: service.customerPrice,
      vendorPayout: service.vendorPayout,
      category: service.category || '',
      icon: service.icon || '',
      allowsProducts: service.allowsProducts,
      isActive: service.isActive
    });
    setIsServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceFormData.name || !serviceFormData.customerPrice || !serviceFormData.vendorPayout) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (serviceFormData.vendorPayout > serviceFormData.customerPrice) {
      toast.error('Vendor payout cannot exceed customer price');
      return;
    }

    try {
      if (editingService) {
        const result = await supabaseCatalog.updateService(editingService.id, {
          name: serviceFormData.name,
          description: serviceFormData.description || null,
          duration: serviceFormData.duration,
          customerPrice: serviceFormData.customerPrice,
          vendorPayout: serviceFormData.vendorPayout,
          category: serviceFormData.category || null,
          icon: serviceFormData.icon || null,
          allowsProducts: serviceFormData.allowsProducts,
          isActive: serviceFormData.isActive
        });
        if (result.success) {
          toast.success('Service updated successfully');
          setIsServiceDialogOpen(false);
          fetchServices();
        } else {
          throw new Error(result.error || 'Failed to update service');
        }
      } else {
        const result = await supabaseCatalog.createService(serviceFormData);
        if (result.success) {
          toast.success('Service created successfully');
          setIsServiceDialogOpen(false);
          fetchServices();
        } else {
          throw new Error(result.error || 'Failed to create service');
        }
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message || 'Failed to save service');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await supabaseCatalog.deleteService(id);
      if (result.success) {
        toast.success('Service deleted successfully');
        fetchServices();
      } else {
        throw new Error(result.error || 'Failed to delete service');
      }
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Failed to delete service');
    }
  };

  const handleToggleServiceStatus = async (service: CatalogService) => {
    try {
      const result = await supabaseCatalog.updateService(service.id, { isActive: !service.isActive });
      if (result.success) {
        toast.success(`Service ${!service.isActive ? 'activated' : 'deactivated'}`);
        fetchServices();
      } else {
        throw new Error(result.error || 'Failed to update service status');
      }
    } catch (error: any) {
      console.error('Error updating service status:', error);
      toast.error(error.message || 'Failed to update service status');
    }
  };

  // ==================== PRODUCTS HANDLERS ====================

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      description: '',
      category: '',
      image: '',
      customerPrice: 0,
      vendorPayout: 0,
      sku: '',
      isActive: true
    });
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: CatalogProduct) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      image: product.image || '',
      customerPrice: product.customerPrice,
      vendorPayout: product.vendorPayout,
      sku: product.sku || '',
      isActive: product.isActive
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productFormData.name || !productFormData.customerPrice || !productFormData.vendorPayout) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (productFormData.vendorPayout > productFormData.customerPrice) {
      toast.error('Vendor payout cannot exceed customer price');
      return;
    }

    try {
      if (editingProduct) {
        const result = await supabaseCatalog.updateProduct(editingProduct.id, {
          name: productFormData.name,
          description: productFormData.description || null,
          category: productFormData.category || null,
          image: productFormData.image || null,
          customerPrice: productFormData.customerPrice,
          vendorPayout: productFormData.vendorPayout,
          sku: productFormData.sku || null,
          isActive: productFormData.isActive
        });
        if (result.success) {
          toast.success('Product updated successfully');
          setIsProductDialogOpen(false);
          fetchProducts();
        } else {
          throw new Error(result.error || 'Failed to update product');
        }
      } else {
        const result = await supabaseCatalog.createProduct(productFormData);
        if (result.success) {
          toast.success('Product created successfully');
          setIsProductDialogOpen(false);
          fetchProducts();
        } else {
          throw new Error(result.error || 'Failed to create product');
        }
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await supabaseCatalog.deleteProduct(id);
      if (result.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        throw new Error(result.error || 'Failed to delete product');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleToggleProductStatus = async (product: CatalogProduct) => {
    try {
      const result = await supabaseCatalog.updateProduct(product.id, { isActive: !product.isActive });
      if (result.success) {
        toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
        fetchProducts();
      } else {
        throw new Error(result.error || 'Failed to update product status');
      }
    } catch (error: any) {
      console.error('Error updating product status:', error);
      toast.error(error.message || 'Failed to update product status');
    }
  };

  // ==================== FILTERS ====================

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(servicesSearchTerm.toLowerCase()) ||
      (service.description || '').toLowerCase().includes(servicesSearchTerm.toLowerCase());
    const matchesStatus = servicesStatusFilter === 'all' ||
      (servicesStatusFilter === 'active' && service.isActive) ||
      (servicesStatusFilter === 'inactive' && !service.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productsSearchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(productsSearchTerm.toLowerCase());
    const matchesStatus = productsStatusFilter === 'all' ||
      (productsStatusFilter === 'active' && product.isActive) ||
      (productsStatusFilter === 'inactive' && !product.isActive);
    const matchesCategory = productsCategoryFilter === 'all' || product.category === productsCategoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = ['Hair', 'Skin', 'Makeup', 'Nail', 'General'];
  const uniqueProductCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // ==================== RENDER ====================

  if (user && user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#4e342e] mb-2">Access Denied</h2>
              <p className="text-[#6d4c41]">This page is only accessible to administrators.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">
            🧾 Manage At-Home Services & Products
          </h1>
          <p className="text-[#6d4c41]">Create, update, and manage catalog services and products for at-home bookings</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'services' | 'products')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Services ({services.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products ({products.length})
            </TabsTrigger>
          </TabsList>

          {/* SERVICES TAB */}
          <TabsContent value="services" className="space-y-6">
            {/* Filters and Actions */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-5 h-5" />
                    <Input
                      placeholder="Search services..."
                      value={servicesSearchTerm}
                      onChange={(e) => setServicesSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={servicesStatusFilter} onValueChange={setServicesStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddService}
                    className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    ➕ Add Service
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Services List */}
            {servicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
              </div>
            ) : filteredServices.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Scissors className="w-16 h-16 text-[#6d4c41] mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-semibold text-[#4e342e] mb-2">No services found</p>
                  <p className="text-[#6d4c41]">Create your first at-home service to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-serif text-[#4e342e]">
                          {service.name}
                        </CardTitle>
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {service.category && (
                        <Badge variant="outline" className="mt-2">
                          {service.category}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-[#6d4c41] mb-4 line-clamp-2">
                        {service.description || 'No description'}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                          <DollarSign className="w-4 h-4" />
                          <span>Customer: ${service.customerPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                          <DollarSign className="w-4 h-4" />
                          <span>Vendor: ${service.vendorPayout.toLocaleString()}</span>
                        </div>
                        {service.allowsProducts && (
                          <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                            <Package className="w-4 h-4" />
                            <span>Allows Products</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditService(service)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleServiceStatus(service)}
                          className="flex-1"
                        >
                          {service.isActive ? (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-6">
            {/* Filters and Actions */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-5 h-5" />
                    <Input
                      placeholder="Search products..."
                      value={productsSearchTerm}
                      onChange={(e) => setProductsSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={productsStatusFilter} onValueChange={setProductsStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={productsCategoryFilter} onValueChange={setProductsCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueProductCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddProduct}
                    className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    ➕ Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-[#6d4c41] mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-semibold text-[#4e342e] mb-2">No products found</p>
                  <p className="text-[#6d4c41]">Create your first at-home product to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-serif text-[#4e342e]">
                          {product.name}
                        </CardTitle>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {product.category && (
                        <Badge variant="outline" className="mt-2">
                          {product.category}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      {product.image && (
                        <div className="mb-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <p className="text-sm text-[#6d4c41] mb-4 line-clamp-2">
                        {product.description || 'No description'}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                          <DollarSign className="w-4 h-4" />
                          <span>Customer: ${product.customerPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#6d4c41]">
                          <DollarSign className="w-4 h-4" />
                          <span>Vendor: ${product.vendorPayout.toLocaleString()}</span>
                        </div>
                        {product.sku && (
                          <div className="text-xs text-[#6d4c41]">
                            SKU: {product.sku}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleProductStatus(product)}
                          className="flex-1"
                        >
                          {product.isActive ? (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* SERVICE DIALOG */}
        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-[#4e342e]">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service-name" className="text-[#4e342e]">Service Name *</Label>
                <Input
                  id="service-name"
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                  placeholder="e.g., Professional Hair Styling"
                />
              </div>
              <div>
                <Label htmlFor="service-description" className="text-[#4e342e]">Description</Label>
                <Textarea
                  id="service-description"
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                  placeholder="Service description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-duration" className="text-[#4e342e]">Duration (minutes) *</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    value={serviceFormData.duration}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, duration: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div>
                  <Label htmlFor="service-category" className="text-[#4e342e]">Category</Label>
                  <Select value={serviceFormData.category} onValueChange={(value) => setServiceFormData({ ...serviceFormData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-customer-price" className="text-[#4e342e]">Customer Price ($) *</Label>
                  <Input
                    id="service-customer-price"
                    type="number"
                    step="0.01"
                    value={serviceFormData.customerPrice}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, customerPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="service-vendor-payout" className="text-[#4e342e]">Vendor Payout ($) *</Label>
                  <Input
                    id="service-vendor-payout"
                    type="number"
                    step="0.01"
                    value={serviceFormData.vendorPayout}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, vendorPayout: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="service-icon" className="text-[#4e342e]">Icon (optional)</Label>
                <Input
                  id="service-icon"
                  value={serviceFormData.icon}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, icon: e.target.value })}
                  placeholder="Icon name or URL"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="service-allows-products"
                    checked={serviceFormData.allowsProducts}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, allowsProducts: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="service-allows-products" className="text-[#4e342e]">Allows Products</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="service-is-active"
                    checked={serviceFormData.isActive}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="service-is-active" className="text-[#4e342e]">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveService}
                className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              >
                {editingService ? 'Update' : 'Create'} Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PRODUCT DIALOG */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif text-[#4e342e]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name" className="text-[#4e342e]">Product Name *</Label>
                <Input
                  id="product-name"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  placeholder="e.g., Professional Hair Shampoo"
                />
              </div>
              <div>
                <Label htmlFor="product-description" className="text-[#4e342e]">Description</Label>
                <Textarea
                  id="product-description"
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-category" className="text-[#4e342e]">Category</Label>
                  <Select value={productFormData.category} onValueChange={(value) => setProductFormData({ ...productFormData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product-sku" className="text-[#4e342e]">SKU</Label>
                  <Input
                    id="product-sku"
                    value={productFormData.sku}
                    onChange={(e) => setProductFormData({ ...productFormData, sku: e.target.value })}
                    placeholder="Product SKU"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="product-image" className="text-[#4e342e]">Image URL</Label>
                <Input
                  id="product-image"
                  value={productFormData.image}
                  onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-customer-price" className="text-[#4e342e]">Customer Price ($) *</Label>
                  <Input
                    id="product-customer-price"
                    type="number"
                    step="0.01"
                    value={productFormData.customerPrice}
                    onChange={(e) => setProductFormData({ ...productFormData, customerPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="product-vendor-payout" className="text-[#4e342e]">Vendor Payout ($) *</Label>
                  <Input
                    id="product-vendor-payout"
                    type="number"
                    step="0.01"
                    value={productFormData.vendorPayout}
                    onChange={(e) => setProductFormData({ ...productFormData, vendorPayout: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="product-is-active"
                  checked={productFormData.isActive}
                  onChange={(e) => setProductFormData({ ...productFormData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="product-is-active" className="text-[#4e342e]">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              >
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageAtHomeCatalog;

