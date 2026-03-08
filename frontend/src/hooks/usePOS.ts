import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface POSSale {
    _id: string;
    saleReference: string;
    items: POSSaleItem[];
    totalAmount: number;
    paymentMethod: string;
    createdBy: {
        _id: string;
        username: string;
    };
    createdAt: string;
}

export interface POSSaleItem {
    product: {
        _id: string;
        productName: string;
    };
    variant: {
        _id: string;
        sku: string;
        price: number;
    };
    quantity: number;
    price: number;
}

export interface CreatePOSSaleData {
    items: {
        variantId: string;
        quantity: number;
    }[];
    paymentMethod: string;
}

// Create POS sale
export function useCreatePOSSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePOSSaleData) => {
            const response = await api.post('/pos/sales', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos-sales'] });
            toast.success('Sale completed successfully!');
        },
        onError: (error: any) => {
            toast.error('Failed to complete sale', {
                description: error.response?.data?.message || 'Please try again',
            });
        },
    });
}

// Fetch POS sales
export function usePOSSales() {
    return useQuery({
        queryKey: ['pos-sales'],
        queryFn: async () => {
            const response = await api.get('/pos/sales');
            return response.data.data as POSSale[];
        },
    });
}

// Fetch sale receipt
export function useSaleReceipt(saleReference: string) {
    return useQuery({
        queryKey: ['pos-receipt', saleReference],
        queryFn: async () => {
            const response = await api.get(`/pos/sales/${saleReference}`);
            return response.data.data as POSSale;
        },
        enabled: !!saleReference,
    });
}
