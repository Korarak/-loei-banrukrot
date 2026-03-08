import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profilePicture?: string;
    isActive: boolean;
    provider: 'local' | 'google' | 'line';
    dateRegistered: string;
}

export interface CustomerAddress {
    _id: string;
    customerId: string;
    addressLabel?: string;
    recipientName: string;
    phone?: string;
    streetAddress: string;
    subDistrict?: string;
    district: string;
    province: string;
    zipCode: string;
    isDefault: boolean;
}

export function useCustomers() {
    return useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await api.get('/customer');
            return res.data.data as Customer[];
        },
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Customer> & { password?: string }) => {
            const res = await api.post('/customer', data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> & { password?: string } }) => {
            const res = await api.put(`/customer/${id}`, data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/customer/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

// Address Hooks

export function useCustomerAddresses(customerId: string | undefined) {
    return useQuery({
        queryKey: ['customer-addresses', customerId],
        queryFn: async () => {
            if (!customerId) return [];
            const res = await api.get(`/customer/${customerId}/addresses`);
            return res.data.data as CustomerAddress[];
        },
        enabled: !!customerId,
    });
}

export function useAddAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ customerId, data }: { customerId: string; data: Partial<CustomerAddress> }) => {
            const res = await api.post(`/customer/${customerId}/addresses`, data);
            return res.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customer-addresses', variables.customerId] });
        },
    });
}

export function useUpdateAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ customerId, addressId, data }: { customerId: string; addressId: string; data: Partial<CustomerAddress> }) => {
            const res = await api.put(`/customer/${customerId}/addresses/${addressId}`, data);
            return res.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['customer-addresses', data.customerId] });
        },
    });
}

export function useDeleteAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ addressId, customerId }: { addressId: string; customerId: string }) => {
            await api.delete(`/customer/${customerId}/addresses/${addressId}`);
            return customerId;
        },
        onSuccess: (customerId) => {
            queryClient.invalidateQueries({ queryKey: ['customer-addresses', customerId] });
        },
    });
}
