import { supabase } from './supabase';
import { handleSupabaseError, handleSupabaseSuccess } from './supabase';

export interface CatalogService {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration: number;
  customerPrice: number;
  vendorPayout: number;
  category: string | null;
  icon: string | null;
  allowsProducts: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  image: string | null;
  customerPrice: number;
  vendorPayout: number;
  sku: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Supabase Catalog Service - Direct Supabase operations for At-Home Services & Products
 */
export class SupabaseCatalogService {
  // ==================== SERVICES ====================

  /**
   * Fetch all catalog services
   */
  async getServices(options: {
    showInactive?: boolean;
    search?: string;
  } = {}): Promise<{ success: boolean; data?: CatalogService[]; error?: string }> {
    try {
      let query = supabase
        .from('service_catalog')
        .select('*')
        .order('name', { ascending: true });

      if (!options.showInactive) {
        query = query.eq('is_active', true);
      }

      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const services: CatalogService[] = (data || []).map((item: any) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        duration: item.duration,
        customerPrice: item.customer_price,
        vendorPayout: item.vendor_payout,
        category: item.category,
        icon: item.icon,
        allowsProducts: item.allows_products,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return handleSupabaseSuccess(services);
    } catch (error: any) {
      return handleSupabaseError(error);
    }
  }

  /**
   * Create a new catalog service
   */
  async createService(serviceData: {
    name: string;
    description?: string;
    duration?: number;
    customerPrice: number;
    vendorPayout: number;
    category?: string;
    icon?: string;
    allowsProducts?: boolean;
    isActive?: boolean;
    slug?: string;
  }): Promise<{ success: boolean; data?: CatalogService; error?: string }> {
    try {
      // Generate slug from name if not provided
      const slug = serviceData.slug || 
        serviceData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + 
        '-' + Math.random().toString(36).slice(2, 7);

      const { data, error } = await supabase
        .from('service_catalog')
        .insert({
          slug,
          name: serviceData.name,
          description: serviceData.description || null,
          duration: serviceData.duration || 60,
          customer_price: serviceData.customerPrice,
          vendor_payout: serviceData.vendorPayout,
          category: serviceData.category || null,
          icon: serviceData.icon || null,
          allows_products: serviceData.allowsProducts || false,
          is_active: serviceData.isActive !== false,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const service: CatalogService = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        duration: data.duration,
        customerPrice: data.customer_price,
        vendorPayout: data.vendor_payout,
        category: data.category,
        icon: data.icon,
        allowsProducts: data.allows_products,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return handleSupabaseSuccess(service);
    } catch (error: any) {
      return handleSupabaseError(error);
    }
  }

  /**
   * Update a catalog service
   */
  async updateService(
    id: string,
    updates: Partial<{
      name: string;
      description: string | null;
      duration: number;
      customerPrice: number;
      vendorPayout: number;
      category: string | null;
      icon: string | null;
      allowsProducts: boolean;
      isActive: boolean;
      slug: string;
    }>
  ): Promise<{ success: boolean; data?: CatalogService; error?: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.customerPrice !== undefined) updateData.customer_price = updates.customerPrice;
      if (updates.vendorPayout !== undefined) updateData.vendor_payout = updates.vendorPayout;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.allowsProducts !== undefined) updateData.allows_products = updates.allowsProducts;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.slug !== undefined) updateData.slug = updates.slug;

      const { data, error } = await supabase
        .from('service_catalog')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const service: CatalogService = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        duration: data.duration,
        customerPrice: data.customer_price,
        vendorPayout: data.vendor_payout,
        category: data.category,
        icon: data.icon,
        allowsProducts: data.allows_products,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return handleSupabaseSuccess(service);
    } catch (error: any) {
      return handleSupabaseError(error);
    }
  }

  /**
   * Delete a catalog service
   */
  async deleteService(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('service_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return handleSupabaseSuccess(null);
    } catch (error: any) {
      return handleSupabaseError(error);
    }
  }

  // ==================== PRODUCTS ====================

  /**
   * Fetch all catalog products
   */
  async getProducts(options: {
    showInactive?: boolean;
    search?: string;
    category?: string;
  } = {}): Promise<{ success: boolean; data?: CatalogProduct[]; error?: string }> {
    try {
      let query = supabase
        .from('product_catalog')
        .select('*')
        .order('name', { ascending: true });

      if (!options.showInactive) {
        query = query.eq('is_active', true);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const products: CatalogProduct[] = (data || []).map((item: any) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        category: item.category,
        image: item.image,
        customerPrice: item.customer_price,
        vendorPayout: item.vendor_payout,
        sku: item.sku,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return handleSupabaseSuccess(products);
    } catch (error: any) {
      return handleSupabaseError(error);
    }
  }

  /**
   * Create a new catalog product
   */
  async createProduct(productData: {
    name: string;
    description?: string;
    category?: string;
    image?: string;
    customerPrice: number;
    vendorPayout: number;
    sku?: string;
    isActive?: boolean;
    slug?: string;
  }): Promise<{ success: boolean; data?: CatalogProduct; error?: string }> {
    try {
      // Generate slug from name if not provided
      const slug = productData.slug || 
        productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + 
        '-' + Math.random().toString(36).slice(2, 7);

      const { data, error } = await supabase
        .from('product_catalog')
        .insert({
          slug,
          name: productData.name,
          description: productData.description || null,
          category: productData.category || null,
          image: productData.image || null,
          customer_price: productData.customerPrice,
          vendor_payout: productData.vendorPayout,
          sku: productData.sku || null,
          is_active: productData.isActive !== false,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const product: CatalogProduct = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        category: data.category,
        image: data.image,
        customerPrice: data.customer_price,
        vendorPayout: data.vendor_payout,
        sku: data.sku,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return handleSupabaseSuccess(product);
    } catch (error: any) {
      return handleSupabaseError(error);
    }
  }

  /**
   * Update a catalog product
   */
  async updateProduct(
    id: string,
    updates: Partial<{
      name: string;
      description: string | null;
      category: string | null;
      image: string | null;
      customerPrice: number;
      vendorPayout: number;
      sku: string | null;
      isActive: boolean;
      slug: string;
    }>
  ): Promise<{ success: boolean; data?: CatalogProduct; error?: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.customerPrice !== undefined) updateData.customer_price = updates.customerPrice;
      if (updates.vendorPayout !== undefined) updateData.vendor_payout = updates.vendorPayout;
      if (updates.sku !== undefined) updateData.sku = updates.sku;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.slug !== undefined) updateData.slug = updates.slug;

      const { data, error } = await supabase
        .from('product_catalog')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const product: CatalogProduct = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        category: data.category,
        image: data.image,
        customerPrice: data.customer_price,
        vendorPayout: data.vendor_payout,
        sku: data.sku,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return handleSupabaseSuccess(product);
    } catch (error: any) {
      return handleSupabaseError(error);
    }
  }

  /**
   * Delete a catalog product
   */
  async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('product_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return handleSupabaseSuccess(null);
    } catch (error: any) {
      return handleSupabaseError(error);
    }
  }
}

// Export singleton instance
export const supabaseCatalog = new SupabaseCatalogService();

