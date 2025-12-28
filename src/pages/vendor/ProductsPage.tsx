import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Star,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  product_name?: string; // Support for new schema column
  category: string;
  category_id?: string; // Support for new schema column
  price: number;
  price_cdf?: number; // Support for new schema column
  stock: number;
  stock_quantity?: number; // Support for new schema column
  sku: string;
  sku_code?: string; // Support for new schema column
  description: string;
  isActive: boolean;
  rating: number;
  totalSales: number;
  image_url?: string;
  imageUrl?: string;
}

interface ProductForm {
  name: string;
  category: string;
  price: string;
  stock: string;
  sku: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
}

const ProductsPage = () => {
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    category: '',
    price: '',
    stock: '',
    sku: '',
    description: '',
    image: null,
    imagePreview: null
  });

  const categories = [
    { value: 'hair_care', label: 'Hair Care Products' },
    { value: 'skincare', label: 'Skincare Products' },
    { value: 'nail_care', label: 'Nail Care Products' },
    { value: 'makeup', label: 'Makeup Products' },
    { value: 'tools', label: 'Professional Tools' },
    { value: 'accessories', label: 'Accessories' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }

      const response = await api.get<{ products: Product[] }>(`/vendor/${user.id}/products`);
      const data = response.data;

      if (data.products) {
        setProducts(data.products);
        console.log(`✅ Loaded ${data.products.length} products from database`);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      category: '',
      price: '',
      stock: '',
      sku: '',

      description: '',
      image: null,
      imagePreview: null
    });
    setEditingProduct(null);
  };

  const handleAddProduct = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setForm({
      name: product.name || product.product_name || '',
      category: product.category || product.category_id || '',
      price: (product.price || product.price_cdf || 0).toString(),
      stock: (product.stock || product.stock_quantity || 0).toString(),
      sku: product.sku || product.sku_code || '',
      description: product.description || '',
      image: null,
      imagePreview: product.imageUrl || product.image_url || null
    });
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size must be less than 10MB');
        return;
      }

      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PNG, JPEG, and WebP images are allowed');
        return;
      }

      setForm(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSaveProduct = async () => {
    try {
      if (!form.name || !form.category || !form.price || !form.stock) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('product_name', form.name);
      formData.append('category_id', form.category);
      formData.append('price_cdf', form.price);
      formData.append('stock_quantity', form.stock);
      formData.append('sku_code', form.sku);
      formData.append('description', form.description);

      if (form.image) {
        formData.append('image', form.image);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingProduct) {
        // Update existing product
        // Note: Image update is not supported in this PUT endpoint yet as per backend code
        await api.put(`/vendor/${user.id}/products/${editingProduct.id}`, {
          product_name: form.name,
          category_id: form.category,
          price_cdf: parseFloat(form.price),
          stock_quantity: parseInt(form.stock),
          sku_code: form.sku,
          description: form.description,
          isActive: editingProduct.isActive
        });
        toast.success('Product updated successfully');
      } else {
        // Add new product via Backend API
        // 1. Prepare FormData with Keys matching Backend Schema EXACTLY
        const formData = new FormData();
        formData.append('product_name', form.name);
        formData.append('category_id', form.category);
        formData.append('price_cdf', form.price);
        formData.append('stock_quantity', form.stock);
        formData.append('sku_code', form.sku);
        formData.append('description', form.description);

        if (form.image) {
          formData.append('image', form.image);
        }

        console.log('📤 Sending Product Data:', Object.fromEntries(formData));

        await api.post(`/vendor/${user.id}/products`, formData, config);
        toast.success('Product added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      // Refresh the product list
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.response) {
        console.error('Server Error Data:', error.response.data);
        console.error('Server Error Status:', error.response.status);

        let errorMessage = 'Server Error';
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data; // Capture HTML/text response
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }

        // Truncate if too long (e.g. HTML dump)
        if (errorMessage.length > 200) errorMessage = errorMessage.substring(0, 200) + '...';

        toast.error(`Failed to save product: ${errorMessage}`);
      } else {
        toast.error('Failed to save product. Network error?');
      }
    }


  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await api.delete(`/vendor/${user.id}/products/${productId}`);
      toast.success('Product deleted successfully');
      // Refresh the product list
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleToggleProduct = async (productId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await api.patch(`/vendor/${user.id}/products/${productId}/toggle`);
      toast.success('Product status updated');
      // Refresh the product list
      fetchProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData?.label || category;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#4e342e] text-xl">Loading products...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">
                Products
              </h1>
              <p className="text-lg text-[#6d4c41]">
                Manage your salon products and inventory
              </p>
            </div>
            <Button
              className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              onClick={handleAddProduct}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-[#4e342e] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      {product.imageUrl || product.image_url ? (
                        <img
                          src={product.imageUrl || product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-serif text-[#4e342e]">
                        {product.name || product.product_name || 'Unnamed Product'}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-[#fdf6f0] text-[#4e342e] text-xs mt-1">
                        {getCategoryLabel(product.category || product.category_id || '')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleProduct(product.id)}
                      className={product.isActive ? "text-green-600" : "text-gray-400"}
                    >
                      {product.isActive ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      className="text-[#4e342e] hover:text-[#3b2c26]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[#6d4c41] text-sm mb-4 line-clamp-2">{product.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#6d4c41]">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-lg">${product.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#6d4c41]">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-sm">{product.stock} in stock</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f8d7da]">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-[#6d4c41] text-sm font-medium">{product.rating}</span>
                    </div>
                    <span className="text-xs text-[#6d4c41]">
                      {product.totalSales} sales
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                      className={product.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                      }
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-[#6d4c41] font-mono">
                      SKU: {product.sku}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-[#6d4c41] mx-auto mb-4" />
            <p className="text-xl font-semibold text-[#4e342e] mb-2">No products yet</p>
            <p className="text-[#6d4c41] mb-4">Add your first product to start managing your inventory</p>
            <Button
              className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
              onClick={handleAddProduct}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </div>
        )}

        {/* Add/Edit Product Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif text-[#4e342e]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription className="text-[#6d4c41]">
                {editingProduct
                  ? 'Update the details of your product below.'
                  : 'Fill in the details to add a new product to your inventory.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[#4e342e] font-medium">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  className="border-[#4e342e] text-[#4e342e] mt-2"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-[#4e342e] font-medium">
                  Category *
                </Label>
                <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="border-[#4e342e] text-[#4e342e] mt-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-[#4e342e] font-medium">
                    Price ($) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0"
                    className="border-[#4e342e] text-[#4e342e] mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="stock" className="text-[#4e342e] font-medium">
                    Stock Quantity *
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="0"
                    className="border-[#4e342e] text-[#4e342e] mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sku" className="text-[#4e342e] font-medium">
                  SKU Code
                </Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Product SKU"
                  className="border-[#4e342e] text-[#4e342e] mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-[#4e342e] font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Product description..."
                  className="border-[#4e342e] text-[#4e342e] mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image" className="text-[#4e342e] font-medium">
                  Product Image
                </Label>
                <div className="mt-2 flex items-center gap-4">
                  {form.imagePreview ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#4e342e]">
                      <img
                        src={form.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6 rounded-none rounded-bl-lg"
                        onClick={() => setForm(prev => ({ ...prev, image: null, imagePreview: null }))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-[#4e342e] flex items-center justify-center bg-[#fdf6f0]">
                      <ImageIcon className="h-8 w-8 text-[#4e342e] opacity-50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="image"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                      className="border-[#4e342e] text-[#4e342e] file:text-[#4e342e]"
                    />
                    <p className="text-xs text-[#6d4c41] mt-1">
                      Max 10MB. PNG, JPEG, WebP only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProduct}
                  className="bg-[#4e342e] hover:bg-[#3b2c26] text-white"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ProductsPage;

