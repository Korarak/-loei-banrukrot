import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
    dateCreated: string;
    profilePicture?: string;
}

export function useMe() {
    return useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await api.get('/users/me');
            return res.data.data as User;
        },
    });
}

export function useUpdateMe() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<User> & { password?: string }) => {
            const res = await api.put('/users/me', data);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
}

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users');
            return res.data.data as User[];
        },
    });
}
