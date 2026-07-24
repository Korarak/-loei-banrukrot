import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface RemoteArea {
    _id: string;
    province: string;
    extraCost: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const useRemoteAreas = () => {
    return useQuery<RemoteArea[]>({
        queryKey: ['remote-areas'],
        queryFn: async () => {
            const response = await api.get('/remote-areas');
            return response.data.data;
        },
        staleTime: 5 * 60_000,
    });
};

export const useAdminRemoteAreas = () => {
    return useQuery<RemoteArea[]>({
        queryKey: ['admin-remote-areas'],
        queryFn: async () => {
            const response = await api.get('/remote-areas/admin');
            return response.data.data;
        },
        staleTime: 5 * 60_000,
    });
};

export const useCreateRemoteArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<RemoteArea>) => {
            const response = await api.post('/remote-areas/admin', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-remote-areas'] });
            queryClient.invalidateQueries({ queryKey: ['remote-areas'] });
        },
    });
};

export const useUpdateRemoteArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<RemoteArea> }) => {
            const response = await api.put(`/remote-areas/admin/${id}`, data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-remote-areas'] });
            queryClient.invalidateQueries({ queryKey: ['remote-areas'] });
        },
    });
};

export const useDeleteRemoteArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/remote-areas/admin/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-remote-areas'] });
            queryClient.invalidateQueries({ queryKey: ['remote-areas'] });
        },
    });
};
