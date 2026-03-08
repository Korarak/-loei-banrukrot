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
import { Loader2 } from 'lucide-react';

const categorySchema = z.object({
    name: z.string().min(1, 'กรุณาระบุชื่อหมวดหมู่'),
    description: z.string().optional(),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    category?: Category;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
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
            },
    });

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
                                    <Input placeholder="เช่น อะไหล่เครื่องยนต์" {...field} className="h-11" />
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
                                        placeholder="คำอธิบายสั้นๆ เกี่ยวกับหมวดหมู่นี้..."
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
                            <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm bg-gray-50/50">
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
                            Cancel
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
