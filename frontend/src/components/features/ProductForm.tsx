'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, Package, Layers, Image as ImageIcon, Store, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import type { Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import ImageManager from './ImageManager';

// Constants for Thai Strings to avoid compiler bugs
const PRODUCT_NAME_PLACEHOLDER = "ระบุชื่อสินค้า";
const CATEGORY_PLACEHOLDER = "เลือกหมวดหมู่";
const BRAND_PLACEHOLDER = "เช่น Piaggio, Vespa";
const SHIPPING_SIZE_PLACEHOLDER = "เลือกขนาดการจัดส่ง";
const DESCRIPTION_PLACEHOLDER = "ระบุรายละเอียดสินค้า...";

const variantSchema = z.object({
    sku: z.string().min(1, 'กรุณาระบุ SKU'),
    price: z.number().min(0, 'ราคาต้องมากกว่าหรือเท่ากับ 0'),
    stock: z.number().int().min(0, 'สต๊อกต้องมากกว่าหรือเท่ากับ 0'),
});

const productSchema = z.object({
    productName: z.string().min(1, 'กรุณาระบุชื่อสินค้า'),
    description: z.string().min(1, 'กรุณาระบุรายละเอียดสินค้า'),
    categoryId: z.number().min(1, 'กรุณาเลือกหมวดหมู่'),
    brand: z.string().optional(),
    shippingSize: z.enum(['small', 'large']),
    isOnline: z.boolean().optional(),
    isPos: z.boolean().optional(),
    variants: z.array(variantSchema).min(1, 'ต้องมีอย่างน้อยหนึ่งตัวเลือก'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
    product?: Product;
    onSubmit: (data: ProductFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
    const { data: categories } = useCategories(true);

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            productName: product?.productName || '',
            description: product?.description || '',
            categoryId: product?.categoryId || 1,
            brand: product?.brand || '',
            shippingSize: (product?.shippingSize as 'small' | 'large') || 'small',
            isOnline: product?.isOnline !== undefined ? product.isOnline : true,
            isPos: product?.isPos !== undefined ? product.isPos : true,
            variants: product?.variants.map((v) => ({
                sku: v.sku,
                price: Number(v.price),
                stock: Number(v.stock),
            })) || [{ sku: '', price: 0, stock: 0 }],
        },
    });

    // Reset form when product changes
    useEffect(() => {
        if (product) {
            form.reset({
                productName: product.productName,
                description: product.description,
                categoryId: product.categoryId,
                brand: product.brand || '',
                shippingSize: (product.shippingSize as 'small' | 'large') || 'small',
                isOnline: product.isOnline !== undefined ? product.isOnline : true,
                isPos: product.isPos !== undefined ? product.isPos : true,
                variants: product.variants.map((v) => ({
                    sku: v.sku,
                    price: Number(v.price),
                    stock: Number(v.stock),
                })),
            });
        }
    }, [product, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'variants',
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Basic Information Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 pb-2 border-b">
                        <Package className="h-5 w-5 text-gray-500" />
                        ข้อมูลพื้นฐาน
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <FormField
                            control={form.control}
                            name="productName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ชื่อสินค้า</FormLabel>
                                    <FormControl>
                                        <Input placeholder={PRODUCT_NAME_PLACEHOLDER} autoComplete="off" {...field} className="h-11" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>หมวดหมู่</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder={CATEGORY_PLACEHOLDER} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories?.map((cat) => (
                                                    <SelectItem key={cat.categoryId} value={cat.categoryId.toString()}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ยี่ห้อ (ไม่บังคับ)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={BRAND_PLACEHOLDER}
                                                autoComplete="off"
                                                {...field}
                                                className="h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="shippingSize"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ขนาดการจัดส่ง</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder={SHIPPING_SIZE_PLACEHOLDER} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="small">ขนาดเล็ก (มาตรฐาน)</SelectItem>
                                            <SelectItem value="large">ขนาดใหญ่ (Bulky)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        กำหนดวิธีการจัดส่งที่ใช้ได้สำหรับสินค้านี้
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Sales Channels - Improved UI */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 pb-2 border-b">
                            <Globe className="h-5 w-5 text-gray-500" />
                            ช่องทางการขาย
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="isOnline"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Card className={`p-4 cursor-pointer transition-all hover:shadow-md ${field.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                                onClick={() => field.onChange(!field.value)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${field.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                            <Globe className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className={`font-semibold ${field.value ? 'text-blue-700' : 'text-gray-600'}`}>ร้านค้าออนไลน์</p>
                                                            <p className="text-xs text-gray-500">เว็บไซต์และแอปมือถือ</p>
                                                        </div>
                                                    </div>
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-blue-600"
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isPos"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Card className={`p-4 cursor-pointer transition-all hover:shadow-md ${field.value ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200'}`}
                                                onClick={() => field.onChange(!field.value)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${field.value ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                                                            <Store className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className={`font-semibold ${field.value ? 'text-orange-700' : 'text-gray-600'}`}>หน้าร้าน (POS)</p>
                                                            <p className="text-xs text-gray-500">สำหรับลูกค้ายื่นหน้าร้าน</p>
                                                        </div>
                                                    </div>
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-orange-600"
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>รายละเอียดสินค้า</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder={DESCRIPTION_PLACEHOLDER}
                                        className="min-h-[120px] resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Variants Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Layers className="h-5 w-5 text-gray-500" />
                            ตัวเลือกสินค้า
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ sku: '', price: 0, stock: 0 })}
                            className="h-9"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มตัวเลือก
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="group relative grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all duration-200">
                                <div className="sm:col-span-5">
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.sku`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-gray-500 uppercase font-bold">SKU</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="SKU-001" autoComplete="off" {...field} className="h-10 bg-white" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="sm:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.price`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-gray-500 uppercase font-bold">ราคา</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={isNaN(field.value ?? 0) ? '' : field.value}
                                                        onChange={(e) => {
                                                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                            field.onChange(isNaN(val) ? 0 : val);
                                                        }}
                                                        className="h-10 bg-white"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="sm:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.stock`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-gray-500 uppercase font-bold">สต๊อก</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={isNaN(field.value ?? 0) ? '' : field.value}
                                                        onChange={(e) => {
                                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                            field.onChange(isNaN(val) ? 0 : val);
                                                        }}
                                                        className="h-10 bg-white"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {fields.length > 1 && (
                                    <div className="sm:col-span-1 flex items-end justify-center pb-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Image Management Section - Only for editing existing products */}
                {product && product._id && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 pb-2 border-b">
                            <ImageIcon className="h-5 w-5 text-gray-500" />
                            รูปภาพสินค้า
                        </div>
                        <div className="bg-gray-50/50 rounded-xl p-6 border border-dashed border-gray-200">
                            <ImageManager
                                productId={product._id}
                                images={product.images || []}
                            />
                        </div>
                    </div>
                )}

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
                        className="bg-black hover:bg-gray-800 text-white h-11 px-8 min-w-[140px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            product ? 'บันทึกการแก้ไข' : 'สร้างสินค้า'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
