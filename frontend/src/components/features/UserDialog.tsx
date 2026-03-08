'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import UserForm from './UserForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

interface UserDialogProps {
    user?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
    const queryClient = useQueryClient();

    const createUser = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/users', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User created successfully');
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create user');
        },
    });

    const updateUser = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.put(`/users/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User updated successfully');
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update user');
        },
    });

    const handleSubmit = (data: any) => {
        if (user) {
            // Remove password if empty to avoid hashing empty string
            if (!data.password) delete data.password;
            updateUser.mutate({ id: user._id, data });
        } else {
            createUser.mutate(data);
        }
    };

    const isLoading = createUser.isPending || updateUser.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
                    <DialogDescription>
                        {user
                            ? 'Update user details and permissions'
                            : 'Add a new staff member or administrator'}
                    </DialogDescription>
                </DialogHeader>

                <UserForm
                    user={user}
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}
