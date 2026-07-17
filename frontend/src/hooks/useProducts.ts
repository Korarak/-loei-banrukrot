import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface ProductVariant {
    _id: string;
    sku: string;
    price: number;
    /** price after the parent product's discountPercent is applied; equals price when there's no discount */
    effectivePrice?: number;
    stock: number;
    option1Value?: string;
    option2Value?: string;
}

export interface ProductImage {
    _id: string;
    imagePath: string;
    blurDataURL?: string;
    isPrimary: boolean;
    sortOrder: number;
}

export interface Product {
    _id: string;
    productName: string;
    description: string;
    categoryId: number;
    /** Comma-separated brand names, e.g. "SIP, PIAGGIO" — parse with `parseBrands()` from `@/lib/utils`. */
    brand?: string;
    imageUrl?: string;
    shippingSize?: 'small' | 'large';
    /** 0-100, percentage discount applied to every variant's price */
    discountPercent?: number;
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
    discountPercent?: number;
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
        staleTime: 60_000,
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
        staleTime: 5 * 60_000,
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

// ─── Bulk actions ───────────────────────────────────────────────────────────

export interface BulkDeleteResult {
    deletedCount: number;
    deletedIds: string[];
    skipped: { productId: string; productName: string; reason: string }[];
}

export function useBulkDeleteProducts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productIds: string[]) => {
            const response = await api.delete('/products/bulk-delete', { data: { productIds } });
            return response.data.data as BulkDeleteResult;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            const skippedNote = data.skipped.length
                ? `, ข้าม ${data.skipped.length} รายการ (มีประวัติการสั่งซื้อ)`
                : '';
            toast.success(`ลบสินค้า ${data.deletedCount} รายการ${skippedNote}`);
        },
        onError: (error: any) => {
            toast.error('ลบสินค้าไม่สำเร็จ', {
                description: error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง',
            });
        },
    });
}

export function useBulkUpdateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productIds, isPos, isOnline }: { productIds: string[]; isPos?: boolean; isOnline?: boolean }) => {
            const response = await api.patch('/products/bulk-channel', { productIds, isPos, isOnline });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('อัปเดตช่องทางขายสำเร็จ');
        },
        onError: (error: any) => {
            toast.error('อัปเดตช่องทางขายไม่สำเร็จ', {
                description: error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง',
            });
        },
    });
}

export function useBulkUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productIds, categoryId }: { productIds: string[]; categoryId: number }) => {
            const response = await api.patch('/products/bulk-category', { productIds, categoryId });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('เปลี่ยนหมวดหมู่สำเร็จ');
        },
        onError: (error: any) => {
            toast.error('เปลี่ยนหมวดหมู่ไม่สำเร็จ', {
                description: error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง',
            });
        },
    });
}

// ─── CSV import/export ──────────────────────────────────────────────────────

export interface CsvImportResult {
    totalRows: number;
    updatedCount: number;
    skippedCount: number;
    updated: string[];
    skipped: { row: number; sku: string; reason: string }[];
}

export function useImportProductsCSV() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            // The shared `api` instance defaults to Content-Type: application/json,
            // which overrides axios's automatic multipart boundary detection for
            // FormData bodies. Unset it here so the browser sets the correct
            // multipart/form-data boundary — otherwise multer silently drops the file.
            const response = await api.post('/products/import/csv', formData, {
                headers: { 'Content-Type': undefined },
            });
            return response.data.data as CsvImportResult;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(`นำเข้าสำเร็จ ${data.updatedCount} รายการ${data.skippedCount ? `, ข้าม ${data.skippedCount} รายการ` : ''}`);
        },
        onError: (error: any) => {
            toast.error('นำเข้า CSV ไม่สำเร็จ', {
                description: error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง',
            });
        },
    });
}

// Plain async function (not a hook) — mirrors useReports.ts's downloadReportCSV blob pattern
export async function exportProductsCSV(ids?: string[]) {
    const params = ids && ids.length ? { ids: ids.join(',') } : undefined;
    const response = await api.get('/products/export/csv', { params, responseType: 'blob' });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `products_export_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
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
