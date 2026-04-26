import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface ShopeeStatus {
    configured: boolean;
    partnerId: string | null;
    shopId: string | null;
}

export interface ShopeeVariantMapping {
    _id: string;
    sku: string;
    option1Value?: string;
    option2Value?: string;
    stockAvailable: number;
    shopeeItemId: string | null;
    shopeeModelId: string | null;
    productId: {
        _id: string;
        productName: string;
        imageUrl?: string;
    };
}

export type ShopeeMappingFilter = 'all' | 'mapped' | 'unmapped';

export function useShopeeStatus() {
    return useQuery({
        queryKey: ['shopeeStatus'],
        queryFn: async () => {
            const res = await api.get('/shopee/status');
            return res.data.data as ShopeeStatus;
        },
    });
}

export function useShopeeMapping(params: { page?: number; limit?: number; filter?: ShopeeMappingFilter }) {
    return useQuery({
        queryKey: ['shopeeMapping', params],
        queryFn: async () => {
            const p: Record<string, string | number> = {
                page: params.page ?? 1,
                limit: params.limit ?? 30,
            };
            if (params.filter === 'mapped') p.mapped = 'true';
            if (params.filter === 'unmapped') p.mapped = 'false';
            const res = await api.get('/shopee/mapping', { params: p });
            return res.data as {
                data: ShopeeVariantMapping[];
                pagination: { page: number; limit: number; total: number; pages: number };
            };
        },
        placeholderData: (prev) => prev,
    });
}

export function useUpdateShopeeMapping() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ variantId, shopeeItemId, shopeeModelId }: {
            variantId: string;
            shopeeItemId: string;
            shopeeModelId?: string;
        }) => api.patch(`/shopee/mapping/${variantId}`, { shopeeItemId, shopeeModelId }),
        onSuccess: () => {
            toast.success('บันทึก Shopee mapping สำเร็จ');
            qc.invalidateQueries({ queryKey: ['shopeeMapping'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'เกิดข้อผิดพลาด');
        },
    });
}

export function useRemoveShopeeMapping() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variantId: string) => api.delete(`/shopee/mapping/${variantId}`),
        onSuccess: () => {
            toast.success('ลบ Shopee mapping สำเร็จ');
            qc.invalidateQueries({ queryKey: ['shopeeMapping'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'เกิดข้อผิดพลาด');
        },
    });
}
