import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  fetchCatalogServices,
  fetchCatalogProducts,
  createCatalogService,
  updateCatalogService,
  deleteCatalogService,
  createCatalogProduct,
  updateCatalogProduct,
  deleteCatalogProduct,
  type CatalogService,
  type CatalogProduct,
} from "@/lib/catalogApi";

const CATALOG_SERVICES_KEY = ["catalog-services"];
const CATALOG_PRODUCTS_KEY = ["catalog-products"];

export const useCatalogServices = (
  params: Parameters<typeof fetchCatalogServices>[0] = {},
  options?: UseQueryOptions<CatalogService[], Error>
) => {
  return useQuery<CatalogService[], Error>({
    queryKey: [...CATALOG_SERVICES_KEY, params],
    queryFn: ({ signal }) => fetchCatalogServices(params, { signal }),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useCatalogProducts = (
  params: Parameters<typeof fetchCatalogProducts>[0] = {},
  options?: UseQueryOptions<CatalogProduct[], Error>
) => {
  return useQuery<CatalogProduct[], Error>({
    queryKey: [...CATALOG_PRODUCTS_KEY, params],
    queryFn: ({ signal }) => fetchCatalogProducts(params, { signal }),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useCatalogServiceMutations = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createCatalogService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_SERVICES_KEY });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCatalogService>[1] }) =>
      updateCatalogService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_SERVICES_KEY });
    },
  });

  const remove = useMutation({
    mutationFn: deleteCatalogService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_SERVICES_KEY });
    },
  });

  return {
    create,
    update,
    remove,
  };
};

export const useCatalogProductMutations = () => {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createCatalogProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_KEY });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCatalogProduct>[1] }) =>
      updateCatalogProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_KEY });
    },
  });

  const remove = useMutation({
    mutationFn: deleteCatalogProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_KEY });
    },
  });

  return {
    create,
    update,
    remove,
  };
};


