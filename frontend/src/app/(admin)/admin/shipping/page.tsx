'use client';

import { useState } from 'react';
import { useAdminShippingMethods, useCreateShippingMethod, useUpdateShippingMethod, useDeleteShippingMethod, type ShippingMethod } from '@/hooks/useShippingMethods';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Truck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ShippingPage() {
    const { data: methods, isLoading } = useAdminShippingMethods();
    const createMethod = useCreateShippingMethod();
    const updateMethod = useUpdateShippingMethod();
    const deleteMethod = useDeleteShippingMethod();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        supportedSizes: ['small'] as ('small' | 'large')[],
        isActive: true
    });

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            description: '',
            supportedSizes: ['small'],
            isActive: true
        });
        setEditingMethod(null);
    };

    const handleEdit = (method: ShippingMethod) => {
        setEditingMethod(method);
        setFormData({
            name: method.name,
            price: method.price.toString(),
            description: method.description || '',
            supportedSizes: method.supportedSizes,
            isActive: method.isActive
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0
            };

            if (editingMethod) {
                await updateMethod.mutateAsync({ id: editingMethod._id, data: payload });
                toast.success('อัปเดตวิธีการจัดส่งสำเร็จ');
            } else {
                await createMethod.mutateAsync(payload);
                toast.success('สร้างวิธีการจัดส่งสำเร็จ');
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error('ล้มเหลวในการบันทึกวิธีการจัดส่ง');
        }
    };

    const handleDelete = async () => {
        if (deletingId) {
            try {
                await deleteMethod.mutateAsync(deletingId);
                toast.success('ลบวิธีการจัดส่งสำเร็จ');
                setDeletingId(null);
            } catch (error) {
                toast.error('ล้มเหลวในการลบวิธีการจัดส่ง');
            }
        }
    };

    const toggleSize = (size: 'small' | 'large') => {
        setFormData(prev => {
            const sizes = prev.supportedSizes.includes(size)
                ? prev.supportedSizes.filter(s => s !== size)
                : [...prev.supportedSizes, size];
            return { ...prev, supportedSizes: sizes };
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">วิธีการจัดส่งพัสดุ</h1>
                    <p className="text-gray-500 mt-1 text-sm">จัดการตัวเลือกและค่าธรรมเนียมการจัดส่ง</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                    className="rounded-xl px-6 shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    <span className="font-medium">เพิ่มวิธีการจัดส่ง</span>
                </Button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-gray-100">
                            <TableHead className="pl-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-wider">วิธีการ</TableHead>
                            <TableHead className="py-6 text-xs font-bold text-gray-400 uppercase tracking-wider">ราคา</TableHead>
                            <TableHead className="py-6 text-xs font-bold text-gray-400 uppercase tracking-wider">ขนาดที่รองรับ</TableHead>
                            <TableHead className="py-6 text-xs font-bold text-gray-400 uppercase tracking-wider">สถานะ</TableHead>
                            <TableHead className="text-right pr-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-wider">การดำเนินการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {methods?.map((method) => (
                            <TableRow key={method._id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                                <TableCell className="pl-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Truck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-base">{method.name}</p>
                                            {method.description && (
                                                <p className="text-sm text-gray-400 mt-1">{method.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 font-bold text-gray-900">
                                    ฿{method.price.toLocaleString()}
                                </TableCell>
                                <TableCell className="py-6">
                                    <div className="flex gap-2">
                                        {method.supportedSizes.map(size => (
                                            <Badge key={size} variant="outline" className="capitalize">
                                                {size === 'small' ? 'ขนาดเล็ก' : 'ขนาดใหญ่'}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="py-6">
                                    {method.isActive ? (
                                        <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100 px-3 py-1 rounded-full">
                                            เปิดใช้งาน
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200 px-3 py-1 rounded-full">
                                            ปิดใช้งาน
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-8 py-6">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(method)}
                                            className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingId(method._id)}
                                            className="h-9 w-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {methods?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                    ไม่พบรายการวิธีการจัดส่ง กรุณาสร้างรายการใหม่เพื่อเริ่มต้น
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingMethod ? 'แก้ไขวิธีการจัดส่ง' : 'เพิ่มวิธีการจัดส่งใหม่'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">ชื่อวิธีการจัดส่ง</Label>
                            <Input
                                id="name"
                                placeholder="เช่น จัดส่งมาตรฐาน"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">ราคา (บาท)</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">รายละเอียด (ไม่บังคับ)</Label>
                            <Input
                                id="description"
                                placeholder="เช่น 2-3 วันทำการ"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ขนาดที่รองรับ</Label>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="size-small"
                                        checked={formData.supportedSizes.includes('small')}
                                        onCheckedChange={() => toggleSize('small')}
                                    />
                                    <Label htmlFor="size-small">ขนาดเล็ก</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="size-large"
                                        checked={formData.supportedSizes.includes('large')}
                                        onCheckedChange={() => toggleSize('large')}
                                    />
                                    <Label htmlFor="size-large">ขนาดใหญ่</Label>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                            <Checkbox
                                id="active"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                            />
                            <Label htmlFor="active">เปิดใช้งาน</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSubmit} disabled={createMethod.isPending || updateMethod.isPending} className="text-white">
                            {createMethod.isPending || updateMethod.isPending ? 'กำลังบันทึก...' : 'บันทึกวิธีการ'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ลบวิธีการจัดส่งนี้?</AlertDialogTitle>
                        <AlertDialogDescription>
                            การดำเนินการนี้ไม่สามารถย้อนกลับได้ วิธีการจัดส่งจะถูกลบออกอย่างถาวร
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            ลบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
