'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreateCategory, useUpdateCategory, type Category } from '@/hooks/useCategories';
import { Loader2, Upload, ImageIcon, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { useState, useRef } from 'react';

// Constants for Thai Strings to avoid compiler bugs
const CATEGORY_NAME_PLACEHOLDER = "เช่น อะไหล่เครื่องยนต์";
const CATEGORY_DESCRIPTION_PLACEHOLDER = "คำอธิบายสั้นๆ เกี่ยวกับหมวดหมู่นี้...";

const categorySchema = z.object({
    name: z.string().min(1, 'กรุณาระบุชื่อหมวดหมู่'),
    description: z.string().optional(),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0),
    imageUrl: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    category?: Category;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();

    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: category
            ? {
                name: category.name,
                description: category.description || '',
                isActive: category.isActive,
                sortOrder: category.sortOrder,
            }
            : {
                name: '',
                description: '',
                isActive: true,
                sortOrder: 0,
                imageUrl: '',
            },
    });

    const cropImageToSquare = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new (window as any).Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = Math.min(img.width, img.height);
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;
                ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas toBlob failed'));
                }, 'image/webp', 0.9);
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0];
        if (!originalFile) return;

        if (!originalFile.type.startsWith('image/')) {
            toast.error('กรุณาอัปโหลดไฟล์รูปภาพ');
            return;
        }

        if (originalFile.size > 2 * 1024 * 1024) {
            toast.error('ขนาดไฟล์หมวดหมู่ต้องไม่เกิน 2MB');
            return;
        }

        setIsUploading(true);
        try {
            const squareBlob = await cropImageToSquare(originalFile);
            const file = new File([squareBlob], originalFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });

            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                form.setValue('imageUrl', response.data.data.imagePath);
                toast.success('อัปโหลดรูปภาพหมวดหมู่สำเร็จ');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('อัปโหลดรูปภาพไม่สำเร็จ');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data: CategoryFormData) => {
        try {
            if (category) {
                await updateCategory.mutateAsync({
                    id: category._id,
                    data
                });
            } else {
                await createCategory.mutateAsync(data);
            }
            onSuccess?.();
        } catch (error) {
            // Error handled by mutation
        }
    };

    const isLoading = createCategory.isPending || updateCategory.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ชื่อหมวดหมู่</FormLabel>
                                <FormControl>
                                    <Input placeholder={CATEGORY_NAME_PLACEHOLDER} {...field} className="h-11" />
                                </FormControl>
                                <FormDescription>
                                    ชื่อหมวดหมู่ที่จะแสดงให้ลูกค้าเห็น
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>รายละเอียด (ไม่บังคับ)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder={CATEGORY_DESCRIPTION_PLACEHOLDER}
                                        className="min-h-[100px] resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="sortOrder"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ลำดับการแสดงผล</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            className="h-11"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        ตัวเลขน้อยจะแสดงก่อน
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm bg-gray-100">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base font-medium">เปิดใช้งาน</FormLabel>
                                    <FormDescription>
                                        เมื่อเปิดใช้งาน หมวดหมู่นี้จะแสดงให้ลูกค้าเห็น
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-green-600"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {/* Image Upload for Category */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <ImageIcon className="h-5 w-5 text-gray-500" />
                            รูปภาพหมวดหมู่
                        </div>
                        
                        <div className="flex items-start gap-6">
                            <div className="relative w-32 h-32 bg-gray-100 rounded-xl overflow-hidden border border-dashed border-gray-300 flex items-center justify-center">
                                {form.watch('imageUrl') ? (
                                    <>
                                        <Image
                                            src={getImageUrl(form.watch('imageUrl')!)}
                                            alt="Category"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => form.setValue('imageUrl', '')}
                                            className="absolute top-1 right-1 p-1.5 bg-white text-red-600 rounded-full hover:bg-red-50 shadow-md border border-gray-100 transition-all hover:scale-110 active:scale-95"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-gray-300">
                                        <ImageIcon className="h-10 w-10" />
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 text-black animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-3 pt-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="h-10 border-gray-300 hover:bg-gray-50"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {form.watch('imageUrl') ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ'}
                                </Button>
                                <p className="text-xs text-gray-500">
                                    แนะนำรูปภาพขนาด 1:1 (จัตุรัส)<br />
                                    ไฟล์ SVG, PNG, JPG (สูงสุด 2MB)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="h-11 px-6"
                        >
                            ยกเลิก
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-black hover:bg-gray-800 text-white h-11 px-6 min-w-[140px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            category ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
