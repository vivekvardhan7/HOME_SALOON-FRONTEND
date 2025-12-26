import { getApiUrl } from '@/config/env';
import { supabase } from '@/lib/supabase';

// Get backend API URL - use explicit API URL or default to localhost:3001
const getBackendApiUrl = (endpoint: string = '') => {
  const explicitApiUrl = import.meta.env.VITE_API_URL;
  const backendUrl = explicitApiUrl
    ? explicitApiUrl.replace(/\/+$/, '')
    : 'http://localhost:3001/api';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${backendUrl}${path}`;
};

export interface CatalogService {
  id: string;
  slug?: string;
  name: string;
  description?: string | null;
  duration: number;
  customerPrice: number;
  vendorPayout: number;
  category?: string | null;
  icon?: string | null;
  allowsProducts: boolean;
  isActive: boolean;
  products?: Array<{
    id: string;
    quantity: number;
    optional: boolean;
    productCatalog: CatalogProduct;
  }>;
}

export interface CatalogProduct {
  id: string;
  slug?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  customerPrice: number;
  vendorPayout: number;
  sku?: string | null;
  isActive: boolean;
}

type FetchOptions = {
  signal?: AbortSignal;
};

const ensureNotAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
};

const mapProductRow = (item: any): CatalogProduct => ({
  id: item.id,
  slug: item.slug ?? undefined,
  name: item.name,
  description: item.description ?? null,
  category: item.category ?? null,
  image: item.image ?? null,
  customerPrice: Number(item.customer_price ?? item.customerPrice ?? 0),
  vendorPayout: Number(item.vendor_payout ?? item.vendorPayout ?? 0),
  sku: item.sku ?? null,
  isActive: Boolean(item.is_active ?? item.isActive ?? false),
});

const fetchLegacyCatalogServices = async (
  params: { includeProducts?: boolean; search?: string; showInactive?: boolean },
  options: FetchOptions
): Promise<CatalogService[]> => {
  ensureNotAborted(options.signal);

  let query = supabase
    .from('services')
    .select(
      [
        'id',
        'name',
        'description',
        'duration',
        'price',
        'is_active',
        'service_category_map(service_categories(name))',
      ].join(', ')
    )
    .order('name', { ascending: true });

  if (!params.showInactive) {
    query = query.eq('is_active', true);
  }

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  const { data, error } = await query;

  ensureNotAborted(options.signal);

  if (error) {
    throw error;
  }

  return (
    data?.map((item: any) => {
      const categories = Array.isArray(item.service_category_map)
        ? item.service_category_map
          .map((entry: any) => entry?.service_categories?.name)
          .filter(Boolean)
        : [];

      return {
        id: item.id,
        slug: undefined,
        name: item.name,
        description: item.description ?? null,
        duration: item.duration ?? 60,
        customerPrice: Number(item.price ?? 0),
        vendorPayout: Number(item.price ?? 0),
        category: categories[0] ?? null,
        icon: null,
        allowsProducts: false,
        isActive: Boolean(item.is_active),
        products: [],
      } as CatalogService;
    }) ?? []
  );
};

const fetchLegacyCatalogProducts = async (
  params: { category?: string; search?: string; showInactive?: boolean },
  options: FetchOptions
): Promise<CatalogProduct[]> => {
  ensureNotAborted(options.signal);

  let query = supabase
    .from('products')
    .select('id, name, description, category, image, price, sku, is_active')
    .order('name', { ascending: true });

  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  if (!params.showInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  ensureNotAborted(options.signal);

  if (error) {
    throw error;
  }

  return (
    data?.map((item: any) => ({
      id: item.id,
      slug: undefined,
      name: item.name,
      description: item.description ?? null,
      category: item.category ?? null,
      image: item.image ?? null,
      customerPrice: Number(item.price ?? 0),
      vendorPayout: Number(item.price ?? 0),
      sku: item.sku ?? null,
      isActive: Boolean(item.is_active),
    })) ?? []
  );
};

export async function fetchCatalogServices(
  params: {
    includeProducts?: boolean;
    search?: string;
    showInactive?: boolean;
    isAtHome?: boolean;
  } = {},
  options: FetchOptions = {}
): Promise<CatalogService[]> {
  ensureNotAborted(options.signal);

  // If it's an at-home service request, use the specific at-home API
  if (params.isAtHome) {
    console.log('🏠 Fetching AT-HOME services from dedicated API...');
    const response = await fetch(getBackendApiUrl('/customer/athome/services'), {
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return result.data.map((item: any) => ({
          id: item.id,
          slug: item.id,
          name: item.name,
          description: item.description ?? null,
          duration: item.duration_minutes ?? 60,
          customerPrice: Number(item.price ?? 0),
          vendorPayout: Number(item.price ?? 0), // Defaulting for now
          category: item.category ?? null,
          icon: null,
          allowsProducts: true, // Master catalog items typically allow products
          isActive: Boolean(item.is_active ?? true),
          products: [],
        }));
      }
    }
  }

  try {
    // Try Supabase first (direct access)
    console.log('📡 Fetching catalog services from Supabase...');

    let query = supabase
      .from('service_catalog')
      .select('*')
      .order('name', { ascending: true });

    if (params.showInactive === false || params.showInactive === undefined) {
      query = query.eq('is_active', true);
    }

    if (params.search) {
      const searchTerm = params.search.trim();
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
    }

    if (params.isAtHome !== undefined) {
      query = query.eq('isAtHome', params.isAtHome);
    }

    const { data, error } = await query;

    ensureNotAborted(options.signal);

    if (error) {
      console.warn('Supabase fetch failed, trying backend API:', error);
      throw error;
    }

    if (data && data.length > 0) {
      // Map Supabase response to CatalogService format
      return data.map((item: any) => ({
        id: item.id,
        slug: item.slug ?? undefined,
        name: item.name,
        description: item.description ?? null,
        duration: item.duration ?? 60,
        customerPrice: Number(item.customer_price ?? 0),
        vendorPayout: Number(item.vendor_payout ?? 0),
        category: item.category ?? null,
        icon: item.icon ?? null,
        allowsProducts: Boolean(item.allows_products ?? false),
        isActive: Boolean(item.is_active ?? true),
        products: [], // Products would need separate query if includeProducts is true
      }));
    }

    // If no data from Supabase, try backend API as fallback
    console.warn('No data from Supabase, trying backend API...');
    return fetchFromBackendAPI(params, options);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    // Fallback to backend API
    console.warn('Supabase error, falling back to backend API:', error);
    return fetchFromBackendAPI(params, options);
  }
}

async function fetchFromBackendAPI(
  params: {
    includeProducts?: boolean;
    search?: string;
    showInactive?: boolean;
    isAtHome?: boolean;
  },
  options: FetchOptions
): Promise<CatalogService[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.includeProducts) {
      queryParams.append('includeProducts', 'true');
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.showInactive) {
      queryParams.append('showInactive', 'true');
    }
    if (params.isAtHome !== undefined) {
      queryParams.append('isAtHome', String(params.isAtHome));
    }

    const queryString = queryParams.toString();
    const url = `${getBackendApiUrl('/catalog/services')}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    ensureNotAborted(options.signal);

    if (!response.ok) {
      return fetchLegacyCatalogServices(params, options);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return fetchLegacyCatalogServices(params, options);
    }

    return result.data.map((item: any) => ({
      id: item.id,
      slug: item.slug ?? undefined,
      name: item.name,
      description: item.description ?? null,
      duration: item.duration ?? 60,
      customerPrice: Number(item.customerPrice ?? item.customer_price ?? 0),
      vendorPayout: Number(item.vendorPayout ?? item.vendor_payout ?? 0),
      category: item.category ?? null,
      icon: item.icon ?? null,
      allowsProducts: Boolean(item.allowsProducts ?? item.allows_products ?? false),
      isActive: Boolean(item.isActive ?? item.is_active ?? true),
      products: item.products
        ?.map((product: any) => {
          const productCatalog = product.productCatalog || product.product_catalog;
          if (!productCatalog) {
            return null;
          }

          return {
            id: product.id,
            quantity: product.quantity ?? 1,
            optional: product.optional ?? true,
            productCatalog: mapProductRow(productCatalog),
          };
        })
        .filter(
          (product): product is NonNullable<typeof product> =>
            product !== null
        ) ?? [],
    }));
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    return fetchLegacyCatalogServices(params, options);
  }
}

export async function fetchCatalogProducts(
  params: {
    category?: string;
    search?: string;
    showInactive?: boolean;
  } = {},
  options: FetchOptions = {}
): Promise<CatalogProduct[]> {
  ensureNotAborted(options.signal);

  try {
    // Check if we should fetch from at-home products API
    const isAtHomeContext = window.location.pathname.includes('at-home');
    if (isAtHomeContext) {
      console.log('🏠 Fetching AT-HOME products from dedicated API...');
      const response = await fetch(getBackendApiUrl('/customer/athome/products'), {
        signal: options.signal,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return result.data.map((item: any) => ({
            id: item.id,
            slug: item.id,
            name: item.name,
            description: item.description ?? null,
            category: item.category ?? null,
            image: item.image_url ?? null,
            customerPrice: Number(item.price ?? 0),
            vendorPayout: Number(item.price ?? 0),
            sku: null,
            isActive: Boolean(item.is_active ?? true),
          }));
        }
      }
    }

    // Try Supabase first (direct access)
    console.log('📡 Fetching catalog products from Supabase...');

    let query = supabase
      .from('product_catalog')
      .select('*')
      .order('name', { ascending: true });

    if (params.showInactive === false || params.showInactive === undefined) {
      query = query.eq('is_active', true);
    }

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.search) {
      const searchTerm = params.search.trim();
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
    }

    const { data, error } = await query;

    ensureNotAborted(options.signal);

    if (error) {
      console.warn('Supabase fetch failed, trying backend API:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} products in Supabase`);
      // Map Supabase response to CatalogProduct format
      return data.map((item: any) => mapProductRow({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        category: item.category,
        image: item.image,
        customer_price: item.customer_price,
        vendor_payout: item.vendor_payout,
        sku: item.sku,
        is_active: item.is_active,
      }));
    } else {
      console.warn('⚠️ No products found in Supabase product_catalog table');
      // Return empty array instead of falling back if explicitly requested
      if (params.showInactive === false) {
        return [];
      }
    }

    // If no data from Supabase, try backend API as fallback
    console.warn('No data from Supabase, trying backend API...');
    return fetchProductsFromBackendAPI(params, options);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    // Fallback to backend API
    console.warn('Supabase error, falling back to backend API:', error);
    return fetchProductsFromBackendAPI(params, options);
  }
}

async function fetchProductsFromBackendAPI(
  params: {
    category?: string;
    search?: string;
    showInactive?: boolean;
  },
  options: FetchOptions
): Promise<CatalogProduct[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.category) {
      queryParams.append('category', params.category);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.showInactive) {
      queryParams.append('showInactive', 'true');
    }

    const queryString = queryParams.toString();
    const url = `${getBackendApiUrl('/catalog/products')}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    ensureNotAborted(options.signal);

    if (!response.ok) {
      return fetchLegacyCatalogProducts(params, options);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return fetchLegacyCatalogProducts(params, options);
    }

    return result.data.map((item: any) => mapProductRow(item));
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    return fetchLegacyCatalogProducts(params, options);
  }
}

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token
    ? {
      Authorization: `Bearer ${token}`,
    }
    : {};
};

export async function createCatalogService(
  payload: {
    name: string;
    description?: string;
    duration?: number;
    customerPrice: number;
    vendorPayout: number;
    category?: string;
    icon?: string;
    allowsProducts?: boolean;
    productIds?: string[];
    slug?: string;
  }
): Promise<CatalogService> {
  const response = await fetch(getApiUrl('/catalog/services'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.data;
}

export async function updateCatalogService(
  id: string,
  payload: Partial<{
    name: string;
    description: string | null;
    duration: number;
    customerPrice: number;
    vendorPayout: number;
    category: string | null;
    icon: string | null;
    allowsProducts: boolean;
    isActive: boolean;
    productIds: string[];
    slug: string;
  }>
): Promise<CatalogService | null> {
  const response = await fetch(getApiUrl(`/catalog/services/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.data ?? null;
}

export async function deleteCatalogService(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/catalog/services/${id}`), {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function createCatalogProduct(
  payload: {
    name: string;
    description?: string;
    category?: string;
    image?: string;
    customerPrice: number;
    vendorPayout: number;
    sku?: string;
    slug?: string;
    isActive?: boolean;
  }
): Promise<CatalogProduct> {
  const response = await fetch(getApiUrl('/catalog/products'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.data;
}

export async function updateCatalogProduct(
  id: string,
  payload: Partial<{
    name: string;
    description: string | null;
    category: string | null;
    image: string | null;
    customerPrice: number;
    vendorPayout: number;
    sku: string | null;
    slug: string;
    isActive: boolean;
  }>
): Promise<CatalogProduct> {
  const response = await fetch(getApiUrl(`/catalog/products/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.data;
}

export async function deleteCatalogProduct(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/catalog/products/${id}`), {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

