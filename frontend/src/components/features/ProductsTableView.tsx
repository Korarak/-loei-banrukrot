'use client';

import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Store, Globe, Package } from 'lucide-react';
import { getImageUrl, getPrimaryImage, cn, parseBrands } from '@/lib/utils';
import type { Product } from '@/hooks/useProducts';

interface ProductsTableViewProps {
    products: Product[];
    categoryMap: Map<number, string>;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    allVisibleSelected: boolean;
    onToggleSelectAll: () => void;
    onEditProduct: (product: Product) => void;
    onDeleteProduct: (id: string) => void;
}

export default function ProductsTableView({
    products,
    categoryMap,
    selectedIds,
    onToggleSelect,
    allVisibleSelected,
    onToggleSelectAll,
    onEditProduct,
    onDeleteProduct,
}: ProductsTableViewProps) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-gray-100">
                        <TableHead className="pl-6 py-4 w-10">
                            <Checkbox
                                checked={products.length > 0 && allVisibleSelected}
                                onCheckedChange={onToggleSelectAll}
                                aria-label="เลือกทั้งหมด"
                            />
                        </TableHead>
                        <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">สินค้า</TableHead>
                        <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">หมวดหมู่</TableHead>
                        <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ราคา</TableHead>
                        <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">สต๊อกรวม</TableHead>
                        <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ช่องทาง</TableHead>
                        <TableHead className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">สถานะ</TableHead>
                        <TableHead className="text-right pr-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">การดำเนินการ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product, index) => {
                        const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                        const prices = product.variants?.map((v) => v.price).filter((p) => p != null) || [];
                        const effectivePrices = product.variants?.map((v) => v.effectivePrice ?? v.price).filter((p) => p != null) || [];
                        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                        const minEffective = effectivePrices.length > 0 ? Math.min(...effectivePrices) : 0;
                        const maxEffective = effectivePrices.length > 0 ? Math.max(...effectivePrices) : 0;
                        const hasDiscount = !!product.discountPercent && minEffective < minPrice;
                        const categoryName = categoryMap.get(product.categoryId) || 'ไม่มีหมวดหมู่';
                        const primaryImage = getPrimaryImage(product.images, product.imageUrl);
                        const stockColor = totalStock === 0 ? 'text-red-600' : totalStock <= 10 ? 'text-orange-600' : 'text-green-600';

                        return (
                            <TableRow
                                key={product._id}
                                className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none cursor-pointer"
                                onClick={() => onEditProduct(product)}
                            >
                                <TableCell className="pl-6 py-3" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.has(product._id)}
                                        onCheckedChange={() => onToggleSelect(product._id)}
                                        aria-label={`เลือก ${product.productName}`}
                                    />
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 relative overflow-hidden flex-shrink-0">
                                            {primaryImage ? (
                                                <Image
                                                    src={getImageUrl(primaryImage.imagePath)}
                                                    alt={product.productName}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                    priority={index < 6}
                                                    placeholder={primaryImage.blurDataURL ? 'blur' : 'empty'}
                                                    blurDataURL={primaryImage.blurDataURL}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full w-full text-gray-300">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 text-sm line-clamp-1">{product.productName}</p>
                                            <p className="text-xs text-gray-400">{parseBrands(product.brand).join(', ') || '-'} · {product.variants?.length || 0} ตัวเลือก</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200">
                                        {categoryName}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-3 font-bold text-gray-900 text-sm whitespace-nowrap">
                                    {prices.length === 0 ? 'ไม่มี' : minEffective === maxEffective ? `฿${minEffective.toLocaleString()}` : `฿${minEffective.toLocaleString()}-${maxEffective.toLocaleString()}`}
                                    {hasDiscount && (
                                        <span className="ml-1.5 font-normal text-xs text-gray-400 line-through">
                                            ฿{minPrice.toLocaleString()}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className={cn('py-3 font-bold text-sm', stockColor)}>
                                    {totalStock}
                                </TableCell>
                                <TableCell className="py-3">
                                    <div className="flex gap-1">
                                        {product.isPos && <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] h-5 px-1.5"><Store className="h-3 w-3 mr-1" />POS</Badge>}
                                        {product.isOnline && <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] h-5 px-1.5"><Globe className="h-3 w-3 mr-1" />ออนไลน์</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell className="py-3">
                                    {product.isActive ? (
                                        <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100 text-[10px]">เปิดใช้งาน</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200 text-[10px]">ปิดใช้งาน</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-6 py-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEditProduct(product)}
                                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteProduct(product._id)}
                                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {products.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                ไม่พบสินค้า
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
