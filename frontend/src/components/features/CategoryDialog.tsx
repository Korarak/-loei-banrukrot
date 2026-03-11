'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import CategoryForm from './CategoryForm';
import { useCategory } from '@/hooks/useCategories';

interface CategoryDialogProps {
    categoryId?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CategoryDialog({ categoryId, open, onOpenChange }: CategoryDialogProps) {
    // Fetch category data if categoryId is provided
    const { data: category, isLoading: isFetching } = useCategory(categoryId || '');

    const handleSuccess = () => {
        onOpenChange(false);
    };

    const isLoading = !!categoryId && isFetching;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle>{categoryId ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่ใหม่'}</DialogTitle>
                    <DialogDescription>
                        {categoryId
                            ? 'แก้ไขข้อมูลรายละเอียดของหมวดหมู่สินค้า'
                            : 'เพิ่มหมวดหมู่สินค้าใหม่เพื่อจัดระเบียบสินค้าในร้าน'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading && !!categoryId && !category ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <CategoryForm
                        category={category}
                        onSuccess={handleSuccess}
                        onCancel={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
