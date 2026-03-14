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
            toast.success('สร้างผู้ใช้งานสำเร็จแล้ว');
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'ล้มเหลวในการสร้างผู้ใช้งาน');
        },
    });

    const updateUser = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.put(`/users/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('อัปเดตข้อมูลผู้ใช้งานสำเร็จแล้ว');
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'ล้มเหลวในการอัปเดตข้อมูลผู้ใช้งาน');
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
                    <DialogTitle>{user ? 'แก้ไขผู้ใช้งาน' : 'สร้างผู้ใช้งานใหม่'}</DialogTitle>
                    <DialogDescription>
                        {user
                            ? 'อัปเดตรายละเอียดและสิทธิ์ของผู้ใช้งาน'
                            : 'เพิ่มพนักงานหรือผู้ดูแลระบบคนใหม่'}
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
