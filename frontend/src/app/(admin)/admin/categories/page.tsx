'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Layers,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowUpDown
} from 'lucide-react';
import { useCategories, useDeleteCategory, type Category } from '@/hooks/useCategories';
import CategoryDialog from '@/components/features/CategoryDialog';
import DeleteConfirmDialog from '@/components/features/DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function AdminCategoriesPage() {
    const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const { data: categories, isLoading } = useCategories();
    const deleteCategory = useDeleteCategory();

    const handleCreateCategory = () => {
        setSelectedCategoryId(null);
        setCategoryDialogOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setSelectedCategoryId(category._id);
        setCategoryDialogOpen(true);
    };

    const handleDeleteClick = (categoryId: string) => {
        setCategoryToDelete(categoryId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (categoryToDelete) {
            await deleteCategory.mutateAsync(categoryToDelete);
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    const filteredCategories = categories?.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.slug.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">หมวดหมู่สินค้า</h1>
                    <p className="text-gray-500 text-sm mt-1">จัดการหมวดหมู่สินค้าของคุณ เพื่อช่วยให้ลูกค้าค้นหาสินค้าได้ง่ายขึ้น</p>
                </div>
                <Button
                    onClick={handleCreateCategory}
                    className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-6 shadow-lg shadow-gray-200 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    <span className="font-medium">เพิ่มหมวดหมู่</span>
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Layers className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">ทั้งหมด</p>
                        <p className="text-2xl font-bold">{categories?.length || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">เปิดใช้งาน</p>
                        <p className="text-2xl font-bold">{categories?.filter(c => c.isActive).length || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                        <XCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">ปิดใช้งาน</p>
                        <p className="text-2xl font-bold">{categories?.filter(c => !c.isActive).length || 0}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="ค้นหาชื่อหมวดหมู่, slug..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 bg-white border-gray-200 focus:bg-white transition-colors rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Categories List */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                </div>
            ) : filteredCategories.length > 0 ? (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">ลำดับ</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">หมวดหมู่</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Slug</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">สถานะ</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCategories.map((category) => (
                                    <tr key={category._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                                {category.sortOrder}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{category.name}</p>
                                                {category.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{category.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs bg-gray-50 px-2 py-1 rounded-lg text-gray-600 border border-gray-100">
                                                {category.slug}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={cn(
                                                "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none",
                                                category.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                            )}>
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md hover:text-black border border-transparent hover:border-gray-100 transition-all"
                                                    onClick={() => handleEditCategory(category)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-red-50 hover:shadow-md hover:text-red-600 border border-transparent hover:border-red-100 transition-all"
                                                    onClick={() => handleDeleteClick(category._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-200 border-dashed">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-in fade-in zoom-in duration-300">
                        <Layers className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">ไม่พบหมวดหมู่</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto mb-6">
                        {search ? `ไม่พบผลลัพธ์ที่ตรงกับ "${search}"` : 'เริ่มต้นด้วยการสร้างหมวดหมู่สินค้าชิ้นแรกของคุณ'}
                    </p>
                    <Button
                        onClick={handleCreateCategory}
                        className="rounded-xl shadow-lg shadow-black/10 px-6"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {search ? 'ล้างการค้นหาและสร้างหมวดหมู่ใหม่' : 'สร้างหมวดหมู่สินค้า'}
                    </Button>
                </div>
            )}

            <CategoryDialog
                categoryId={selectedCategoryId}
                open={categoryDialogOpen}
                onOpenChange={setCategoryDialogOpen}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                isLoading={deleteCategory.isPending}
                title="ลบหมวดหมู่"
                description="คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? การดำเนินการนี้จะเปลี่ยนสถานะเป็นปิดใช้งาน (Soft Delete) และอาจส่งผลต่อการแสดงผลของสินค้าในหมวดหมู่นี้"
            />
        </div>
    );
}
