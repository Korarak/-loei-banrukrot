import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export type StockMovementType = 'sale_pos' | 'sale_online' | 'cancel_online' | 'stock_in' | 'adjustment' | 'shopee_sale' | 'shopee_sync';

export interface StockMovement {
    _id: string;
    variantId: {
        _id: string;
        sku: string;
        option1Value?: string;
        option2Value?: string;
        stockAvailable: number;
    };
    productId: {
        _id: string;
        productName: string;
        imageUrl?: string;
    };
    type: StockMovementType;
    quantityChange: number;
    stockBefore: number;
    stockAfter: number;
    referenceId?: string;
    note?: string;
    performedBy?: { _id: string; username: string };
    createdAt: string;
}

export interface LowStockItem {
    _id: string;
    sku: string;
    option1Value?: string;
    option2Value?: string;
    stockAvailable: number;
    productId: {
        _id: string;
        productName: string;
        imageUrl?: string;
        isActive: boolean;
    };
}

export interface InventorySummary {
    totalVariants: number;
    outOfStock: number;
    lowStock: number;
    stockInThisMonth: number;
    adjustmentsThisMonth: number;
    stockInVolumeThisMonth: number;
    threshold: number;
}

export interface MovementFilters {
    variantId?: string;
    productId?: string;
    type?: StockMovementType | '';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useStockMovements(filters: MovementFilters = {}) {
    return useQuery({
        queryKey: ['stockMovements', filters],
        queryFn: async () => {
            const params: Record<string, string | number> = {};
            if (filters.variantId) params.variantId = filters.variantId;
            if (filters.productId) params.productId = filters.productId;
            if (filters.type) params.type = filters.type;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.page) params.page = filters.page;
            if (filters.limit) params.limit = filters.limit;

            const res = await api.get('/inventory/movements', { params });
            return res.data as { data: StockMovement[]; pagination: { page: number; limit: number; total: number; pages: number } };
        },
        placeholderData: (prev) => prev,
    });
}

export function useLowStockAlerts() {
    return useQuery({
        queryKey: ['lowStock'],
        queryFn: async () => {
            const res = await api.get('/inventory/low-stock');
            return res.data as { data: LowStockItem[]; threshold: number };
        },
        refetchInterval: 60_000,
    });
}

export function useInventorySummary() {
    return useQuery({
        queryKey: ['inventorySummary'],
        queryFn: async () => {
            const res = await api.get('/inventory/summary');
            return res.data.data as InventorySummary;
        },
        refetchInterval: 60_000,
    });
}

export function useReceiveStock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { variantId: string; quantity: number; note?: string }) =>
            api.post('/inventory/receive', data),
        onSuccess: (res) => {
            toast.success(res.data.message || 'รับสินค้าเข้าคลังสำเร็จ');
            qc.invalidateQueries({ queryKey: ['stockMovements'] });
            qc.invalidateQueries({ queryKey: ['inventorySummary'] });
            qc.invalidateQueries({ queryKey: ['lowStock'] });
            qc.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
    });
}

export function useAdjustStock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { variantId: string; quantity: number; note?: string }) =>
            api.post('/inventory/adjust', data),
        onSuccess: (res) => {
            toast.success(res.data.message || 'ปรับสต็อกสำเร็จ');
            qc.invalidateQueries({ queryKey: ['stockMovements'] });
            qc.invalidateQueries({ queryKey: ['inventorySummary'] });
            qc.invalidateQueries({ queryKey: ['lowStock'] });
            qc.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'เกิดข้อผิดพลาด');
        }
    });
}
