import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ShippingMethod {
    _id: string;
    name: string;
    price: number;
    description?: string;
    supportedSizes: ('small' | 'large')[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const useShippingMethods = () => {
    return useQuery<ShippingMethod[]>({
        queryKey: ['shipping-methods'],
        queryFn: async () => {
            const response = await api.get('/shipping-methods');
            return response.data.data;
        },
    });
};

export const useAdminShippingMethods = () => {
    return useQuery<ShippingMethod[]>({
        queryKey: ['admin-shipping-methods'],
        queryFn: async () => {
            const response = await api.get('/shipping-methods/admin');
            return response.data.data;
        },
    });
};

export const useCreateShippingMethod = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<ShippingMethod>) => {
            const response = await api.post('/shipping-methods/admin', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-shipping-methods'] });
            queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
        },
    });
};

export const useUpdateShippingMethod = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<ShippingMethod> }) => {
            const response = await api.put(`/shipping-methods/admin/${id}`, data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-shipping-methods'] });
            queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
        },
    });
};

export const useDeleteShippingMethod = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/shipping-methods/admin/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-shipping-methods'] });
            queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
        },
    });
};
