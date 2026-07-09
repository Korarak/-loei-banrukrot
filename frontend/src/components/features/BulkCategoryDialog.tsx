'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';

interface BulkCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (categoryId: number) => void;
    isLoading?: boolean;
    selectedCount: number;
}

export default function BulkCategoryDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
    selectedCount,
}: BulkCategoryDialogProps) {
    const { data: categories } = useCategories(true);
    const [categoryId, setCategoryId] = useState<string>('');

    const handleConfirm = () => {
        if (!categoryId) return;
        onConfirm(parseInt(categoryId));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white max-w-sm">
                <DialogHeader>
                    <DialogTitle>เปลี่ยนหมวดหมู่</DialogTitle>
                    <DialogDescription>
                        เลือกหมวดหมู่ใหม่สำหรับสินค้าที่เลือก {selectedCount} รายการ
                    </DialogDescription>
                </DialogHeader>

                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories?.map((cat) => (
                            <SelectItem key={cat.categoryId} value={cat.categoryId.toString()}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleConfirm} disabled={!categoryId || isLoading}>
                        {isLoading ? 'กำลังบันทึก...' : 'ยืนยัน'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
