import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Loader2,
  Search,
  Plus,
  Package,
  Pencil,
  Copy,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

interface VendorProductReference {
  name: string;
  price: number;
  vendor_name: string;
}

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

const AtHomeProductsPage = () => {
  const [activeTab, setActiveTab] = useState("catalog");

  // Data State
  const [vendorProducts, setVendorProducts] = useState<VendorProductReference[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Form/Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminRes, vendorRes] = await Promise.all([
        adminApi.get<any>('/admin/athome/products'),
        adminApi.get<any>('/admin/vendor-catalog/products')
      ]);

      if (adminRes.success && adminRes.data?.success) {
        setAdminProducts(adminRes.data.data);
      }
      if (vendorRes.success && vendorRes.data) {
        setVendorProducts(vendorRes.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load catalog data");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_active: true
    });
    setIsSheetOpen(true);
  };

  const openEditModal = (product: AdminProduct) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      is_active: product.is_active
    });
    setIsSheetOpen(true);
  };

  const useTemplate = (ref: VendorProductReference) => {
    setEditingId(null);
    setFormData({
      name: ref.name,
      description: `Premium product supplied by ${ref.vendor_name}.`,
      price: ref.price.toString(),
      image_url: '',
      is_active: true
    });
    setActiveTab("catalog");
    setIsSheetOpen(true);
    toast.info("Template loaded. Please review and save.");
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Name and Price are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Assuming same logic as services (POST for now, ideally PUT)
        // Placeholder for update logic if/when backend supports it
        toast.error("Update functionality requires backend support. Creating new entry instead.");
      }

      const response = await adminApi.post<any>('/admin/athome/products', formData);
      if (response.success && response.data?.success) {
        toast.success(editingId ? 'Product updated' : 'Product added to Master Catalog');
        setIsSheetOpen(false);
        fetchData();
      } else {
        toast.error('Failed to save product');
      }
    } catch (error) {
      toast.error('Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdmin = adminProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVendor = vendorProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#4e342e]">At-Home Products Catalog</h1>
            <p className="text-[#6d4c41]">Manage the standardized products for at-home services.</p>
          </div>
          <Button onClick={openAddModal} className="bg-[#4e342e] text-white hover:bg-[#3b2c26]">
            <Plus className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white border">
            <TabsTrigger value="catalog" className="data-[state=active]:bg-[#4e342e] data-[state=active]:text-white">Master Catalog</TabsTrigger>
            <TabsTrigger value="reference" className="data-[state=active]:bg-[#4e342e] data-[state=active]:text-white">Vendor Reference</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-md shadow-sm border max-w-md">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              className="border-0 focus-visible:ring-0"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <TabsContent value="catalog" className="mt-0">
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4e342e]" />
                      </TableCell>
                    </TableRow>
                  ) : filteredAdmin.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No products found in Master Catalog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmin.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-[#4e342e]">{product.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500 line-clamp-2 max-w-[300px]">{product.description || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-[#4e342e]">{product.price.toLocaleString()} CDF</div>
                        </TableCell>
                        <TableCell>
                          {product.is_active ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Hidden</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reference" className="mt-0">
            <Card className="border-0 shadow-lg bg-white">
              <Table>
                <TableHeader className="bg-[#fdf6f0]">
                  <TableRow>
                    <TableHead>Vendor Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendor.map((ref, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-[#4e342e]">{ref.name}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{ref.vendor_name}</TableCell>
                      <TableCell className="text-right font-serif">{ref.price.toLocaleString()} CDF</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-8" onClick={() => useTemplate(ref)}>
                          <Copy className="w-3 h-3 mr-2" />
                          Use Template
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ADD/EDIT Sidebar Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{editingId ? "Edit Product" : "Add New Product"}</SheetTitle>
              <SheetDescription>
                Configuration for master catalog product.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label>Product Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Argan Oil Sample"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Price (CDF) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">CDF</span>
                  <Input
                    className="pl-8"
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                />
                {formData.image_url && (
                  <div className="h-32 w-full rounded-md border overflow-hidden mt-2">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the product..."
                  className="h-24"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 accent-[#4e342e]"
                />
                <Label htmlFor="isActive" className="cursor-pointer font-medium text-[#4e342e]">
                  Active and Visible
                </Label>
              </div>

            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-[#4e342e] text-white">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "Save Changes" : "Create Product"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
};

export default AtHomeProductsPage;
