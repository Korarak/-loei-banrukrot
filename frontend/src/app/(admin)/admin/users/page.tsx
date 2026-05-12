'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search, Edit, Trash2, UserPlus, Shield, ShieldAlert,
    Users, UserCheck, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import UserDialog from '@/components/features/UserDialog';
import DeleteConfirmDialog from '@/components/features/DeleteConfirmDialog';

type RoleFilter = 'all' | 'owner' | 'staff';

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: users, isLoading, isError, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users');
            return res.data.data;
        },
    });

    const deleteUser = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('ลบผู้ใช้งานสำเร็จแล้ว');
            setDeleteId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'ล้มเหลวในการลบผู้ใช้งาน');
        },
    });

    const toggleActive = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            await api.put(`/users/${id}`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('อัปเดตสถานะสำเร็จแล้ว');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'ล้มเหลวในการอัปเดตสถานะ');
        },
    });

    const filteredUsers = users?.filter((user: any) => {
        const matchesSearch =
            user.username.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const stats = {
        total: users?.length ?? 0,
        active: users?.filter((u: any) => u.isActive).length ?? 0,
        owners: users?.filter((u: any) => u.role === 'owner').length ?? 0,
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">ผู้ใช้งาน</h1>
                    <p className="text-gray-500 mt-2">จัดการบัญชีพนักงานและผู้ดูแลระบบ</p>
                </div>
                <Button onClick={handleCreate}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    เพิ่มผู้ใช้งาน
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">ผู้ใช้งานทั้งหมด</p>
                        <p className="text-2xl font-bold">{isLoading ? '-' : stats.total}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-lg">
                        <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">เปิดใช้งาน</p>
                        <p className="text-2xl font-bold">{isLoading ? '-' : stats.active}</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="bg-red-50 p-2 rounded-lg">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">เจ้าของร้าน</p>
                        <p className="text-2xl font-bold">{isLoading ? '-' : stats.owners}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="ค้นหาผู้ใช้งาน..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-gray-200"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'owner', 'staff'] as RoleFilter[]).map((role) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    roleFilter === role
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {role === 'all' ? 'ทั้งหมด' : role === 'owner' ? 'เจ้าของ' : 'พนักงาน'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                <TableHead>ผู้ใช้งาน</TableHead>
                                <TableHead>อีเมล</TableHead>
                                <TableHead>สิทธิ์</TableHead>
                                <TableHead>สถานะ</TableHead>
                                <TableHead className="text-right">การดำเนินการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-red-500">
                                        ล้มเหลวในการโหลดข้อมูล — {(error as any)?.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง'}
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                        ไม่พบผู้ใช้งาน
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers?.map((user: any) => (
                                    <TableRow key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell className="text-gray-500">{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.role === 'owner' ? (
                                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                                ) : (
                                                    <Shield className="h-4 w-4 text-blue-500" />
                                                )}
                                                <span className="text-sm">
                                                    {user.role === 'owner' ? 'เจ้าของร้าน' : 'พนักงาน'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={() => toggleActive.mutate({ id: user._id, isActive: !user.isActive })}
                                                disabled={toggleActive.isPending}
                                                className="flex items-center gap-1.5 group disabled:opacity-50"
                                            >
                                                {user.isActive ? (
                                                    <ToggleRight className="h-5 w-5 text-green-600 group-hover:text-green-700" />
                                                ) : (
                                                    <ToggleLeft className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                                )}
                                                <Badge
                                                    variant="secondary"
                                                    className={user.isActive
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}
                                                >
                                                    {user.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                                </Badge>
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                                    onClick={() => setDeleteId(user._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                user={selectedUser}
            />

            <DeleteConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={() => deleteId && deleteUser.mutate(deleteId)}
                title="ลบผู้ใช้งาน"
                description="คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                isLoading={deleteUser.isPending}
            />
        </div>
    );
}
