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
import { useCategories, useDeleteCategory, useReorderCategories, type Category } from '@/hooks/useCategories';
import CategoryDialog from '@/components/features/CategoryDialog';
import DeleteConfirmDialog from '@/components/features/DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useEffect } from 'react';

// Sortable Row Component
function SortableCategoryRow({
    category,
    handleEditCategory,
    handleDeleteClick
}: {
    category: Category;
    handleEditCategory: (cat: Category) => void;
    handleDeleteClick: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                "hover:bg-gray-100 transition-colors group relative bg-white",
                isDragging && "shadow-xl border border-primary/20 bg-gray-100 scale-[1.01]"
            )}
        >
            <td className="px-3 py-4 w-10">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
                    title="ลากเพื่อย้ายตำแหน่ง"
                >
                    <GripVertical className="h-5 w-5" />
                </button>
            </td>
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
                    {category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </Badge>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 transition-opacity">
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
    );
}

export default function AdminCategoriesPage() {
    const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const { data: categories, isLoading } = useCategories();
    const deleteCategory = useDeleteCategory();
    const reorderCategories = useReorderCategories();

    // Local state for optimistic drag-and-drop updates
    const [localCategories, setLocalCategories] = useState<Category[]>([]);

    useEffect(() => {
        if (categories) {
            setLocalCategories(categories);
        }
    }, [categories]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag intent to prevent accidental clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setLocalCategories((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Recalculate sortOrders (e.g., 1, 2, 3...)
                const updatedItemsWithSortOrder = newItems.map((item, index) => ({
                    ...item,
                    sortOrder: index + 1
                }));

                // Call backend API
                reorderCategories.mutate(
                    updatedItemsWithSortOrder.map(item => ({
                        id: item._id,
                        sortOrder: item.sortOrder
                    }))
                );

                return updatedItemsWithSortOrder;
            });
        }
    };

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

    const filteredCategories = localCategories?.filter(category =>
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
                    className="rounded-xl px-6 shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-3 py-4 w-10"></th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">ลำดับ</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">หมวดหมู่</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Slug</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">สถานะ</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <SortableContext
                                        items={filteredCategories.map(c => c._id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {filteredCategories.map((category) => (
                                            <SortableCategoryRow
                                                key={category._id}
                                                category={category}
                                                handleEditCategory={handleEditCategory}
                                                handleDeleteClick={handleDeleteClick}
                                            />
                                        ))}
                                    </SortableContext>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </DndContext>
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
