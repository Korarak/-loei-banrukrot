import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface ProductVariant {
    _id: string;
    sku: string;
    price: number;
    stock: number;
}

export interface ProductImage {
    _id: string;
    imagePath: string;
    isPrimary: boolean;
    sortOrder: number;
}

export interface Product {
    _id: string;
    productName: string;
    description: string;
    categoryId: number;
    brand?: string;
    imageUrl?: string;
    shippingSize?: 'small' | 'large';
    isActive: boolean;
    isOnline?: boolean;
    isPos?: boolean;
    variants: ProductVariant[];
    images?: ProductImage[];
    dateCreated?: string;
}

export interface CreateProductData {
    productName: string;
    description: string;
    categoryId: number;
    brand?: string;
    shippingSize?: 'small' | 'large';
    isOnline?: boolean;
    isPos?: boolean;
    variants: Omit<ProductVariant, '_id'>[];
}

export interface ProductStats {
    total: number;
    pos: number;
    online: number;
}
export type ProductWithStats = Product[] & { stats?: ProductStats };

// Fetch all products
export function useProducts(filters?: { categoryId?: number; search?: string; channel?: 'all' | 'pos' | 'online' }) {
    return useQuery({
        queryKey: ['products', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
            if (filters?.search) params.append('search', filters.search);
            if (filters?.channel && filters.channel !== 'all') params.append('channel', filters.channel);
            // Admin always requests admin scope to see all products including POS-only
            params.append('scope', 'admin');

            const response = await api.get(`/products?${params.toString()}`);
            const data = response.data.data as ProductWithStats;
            data.stats = response.data.stats;
            return data;
        },
    });
}

// Fetch single product
export function useProduct(id: string) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const response = await api.get(`/products/${id}`);
            return response.data.data as Product;
        },
        enabled: !!id,
    });
}

// Create product
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateProductData) => {
            const response = await api.post('/products', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product created successfully!');
        },
        onError: (error: any) => {
            toast.error('Failed to create product', {
                description: error.response?.data?.message || 'Please try again',
            });
        },
    });
}

// Update product
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProductData> }) => {
            const response = await api.put(`/products/${id}`, data);
            return response.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
            toast.success('Product updated successfully!');
        },
        onError: (error: any) => {
            toast.error('Failed to update product', {
                description: error.response?.data?.message || 'Please try again',
            });
        },
    });
}

// Delete product
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/products/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Product deleted successfully!');
        },
        onError: (error: any) => {
            toast.error('Failed to delete product', {
                description: error.response?.data?.message || 'Please try again',
            });
        },
    });
}

// Update variant stock
export function useUpdateVariantStock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ variantId, stock }: { variantId: string; stock: number }) => {
            const response = await api.patch(`/products/variants/${variantId}/stock`, { stock });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Stock updated successfully!');
        },
        onError: (error: any) => {
            toast.error('Failed to update stock', {
                description: error.response?.data?.message || 'Please try again',
            });
        },
    });
}
