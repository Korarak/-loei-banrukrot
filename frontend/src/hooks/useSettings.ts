import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Setting {
    _id: string;
    key: string;
    value: string;
    description: string;
    updatedAt: string;
}

export interface PublicSettings {
    payment_bank_name?: string;
    payment_bank_account_number?: string;
    payment_bank_account_name?: string;
    store_name?: string;
    store_phone?: string;
}

export function usePublicSettings() {
    return useQuery<PublicSettings>({
        queryKey: ['settings', 'public'],
        queryFn: async () => {
            const res = await api.get('/settings/public');
            return res.data.data as PublicSettings;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useAdminSettings() {
    return useQuery<Setting[]>({
        queryKey: ['settings', 'admin'],
        queryFn: async () => {
            const res = await api.get('/settings');
            return res.data.data as Setting[];
        },
    });
}

export function useUpdateSetting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ key, value }: { key: string; value: string }) => {
            const res = await api.put(`/settings/${key}`, { value });
            return res.data.data as Setting;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
    });
}
