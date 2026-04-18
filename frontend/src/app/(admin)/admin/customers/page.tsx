'use client';

import { useState } from 'react';
import { useCustomers, useDeleteCustomer, useUpdateCustomer, type Customer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Loader2, Users, UserCheck, UserPlus, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import CustomerDialog from '@/components/features/CustomerDialog';
import { toast } from 'sonner';

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' } | null>(null);

    const { data: customers, isLoading } = useCustomers();
    const deleteCustomer = useDeleteCustomer();
    const updateCustomer = useUpdateCustomer();

    const handleToggleStatus = async (customer: Customer, checked: boolean) => {
        try {
            await updateCustomer.mutateAsync({
                id: customer._id,
                data: { ...customer, isActive: checked }
            });
        } catch (error) {
            toast.error('ไม่สามารถอัปเดตสถานะได้');
        }
    };

    // Filter
    const filteredCustomers = customers?.filter(customer =>
        customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Sort
    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        const aValue = a[key] ?? '';
        const bValue = b[key] ?? '';

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof Customer) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (deletingCustomerId) {
            try {
                await deleteCustomer.mutateAsync(deletingCustomerId);
                toast.success('ลบข้อมูลลูกค้าเรียบร้อยแล้ว');
                setDeletingCustomerId(null);
            } catch (error) {
                toast.error('ไม่สามารถลบข้อมูลลูกค้าได้');
            }
        }
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setEditingCustomer(null);
    };

    // Stats
    const totalCustomers = customers?.length || 0;
    const activeCustomers = customers?.filter(c => c.isActive).length || 0;
    const newCustomers = customers?.filter(c => {
        const date = new Date(c.dateRegistered);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return date >= thirtyDaysAgo;
    }).length || 0;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ลูกค้า</h1>
                    <p className="text-gray-500 mt-1 text-sm">จัดการฐานข้อมูลลูกค้าและบัญชีผู้ใช้</p>
                </div>
                <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="rounded-xl px-6 shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    <span className="font-medium">เพิ่มลูกค้า</span>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">ลูกค้าทั้งหมด</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{totalCustomers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">บัญชีที่ใช้งานอยู่</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{activeCustomers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">ลูกค้าใหม่ (30 วัน)</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{newCustomers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                        placeholder="ค้นหาลูกค้าด้วยชื่อหรืออีเมล..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 border-none shadow-none bg-transparent text-base h-12 focus-visible:ring-0 placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            ) : sortedCustomers.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-gray-100">
                                    <TableHead
                                        className="pl-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600"
                                        onClick={() => handleSort('firstName')}
                                    >
                                        <div className="flex items-center gap-2">
                                            ลูกค้า
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="py-6 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center gap-2">
                                            ข้อมูลติดต่อ
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="py-6 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600"
                                        onClick={() => handleSort('isActive')}
                                    >
                                        <div className="flex items-center gap-2">
                                            สถานะ
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="py-6 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600"
                                        onClick={() => handleSort('dateRegistered')}
                                    >
                                        <div className="flex items-center gap-2">
                                            วันที่สมัคร
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right pr-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-wider">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedCustomers.map((customer) => (
                                    <TableRow key={customer._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                                                    {customer.firstName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-base">{customer.firstName} {customer.lastName}</p>
                                                    <p className="text-xs text-gray-400">ID: {customer._id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 text-gray-600 font-medium">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    {customer.email}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <Phone className="h-3 w-3" />
                                                            {customer.phone}
                                                        </div>
                                                    )}
                                                    {customer.provider && customer.provider !== 'local' && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 bg-gray-100 text-gray-600 px-1.5 font-normal">
                                                            ผ่าน {customer.provider === 'google' ? 'Google' : customer.provider}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                                                <button
                                                    onClick={() => handleToggleStatus(customer, true)}
                                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${customer.isActive
                                                        ? 'bg-white text-green-600 shadow-sm'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                >
                                                    ใช้งาน
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(customer, false)}
                                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!customer.isActive
                                                        ? 'bg-white text-gray-700 shadow-sm'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                >
                                                    ระงับ
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 text-gray-500 font-medium">
                                            {new Date(customer.dateRegistered).toLocaleDateString('th-TH')}
                                        </TableCell>
                                        <TableCell className="text-right pr-8 py-6">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(customer)}
                                                    className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingCustomerId(customer._id)}
                                                    className="h-9 w-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 border-dashed">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">ไม่พบข้อมูลลูกค้า</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                        {searchQuery ? 'ลองปรับคำค้นหาของคุณ' : 'เริ่มต้นด้วยการเพิ่มลูกค้าคนแรกของคุณ'}
                    </p>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        variant="outline"
                        className="mt-6 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-black"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {searchQuery ? 'ล้างคำค้นหา' : 'เพิ่มลูกค้า'}
                    </Button>
                </div>
            )}

            <CustomerDialog
                open={isDialogOpen}
                onOpenChange={handleDialogClose}
                customer={editingCustomer}
            />

            <AlertDialog open={!!deletingCustomerId} onOpenChange={() => setDeletingCustomerId(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8 bg-white">
                    <AlertDialogHeader>
                        <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">ลบข้อมูลลูกค้า?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 text-base mt-2">
                            การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลบัญชีลูกค้าจะถูกลบออกจากระบบอย่างถาวร
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-black py-6">ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 rounded-xl py-6 shadow-lg shadow-red-100"
                            disabled={deleteCustomer.isPending}
                        >
                            {deleteCustomer.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังลบ...
                                </>
                            ) : (
                                'ลบข้อมูลลูกค้า'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
