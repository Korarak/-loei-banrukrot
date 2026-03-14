'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Package,
    AlertCircle,
    Store,
    Globe,
    Ban,
    SortDesc,
    Minus,
    Layers,
    Box
} from 'lucide-react';
import { useProducts, useDeleteProduct, useUpdateVariantStock, type Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import ProductDialog from '@/components/features/ProductDialog';
import DeleteConfirmDialog from '@/components/features/DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { getImageUrl, cn } from '@/lib/utils';
import ImagePreviewDialog from '@/components/features/ImagePreviewDialog';
import { ProductImage } from '@/hooks/useProducts';

export default function AdminProductsPage() {
    const [search, setSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'dateCreated', direction: 'desc' });
    const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
    const [channelFilter, setChannelFilter] = useState<'all' | 'pos' | 'online'>('all');

    // Image Preview State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImages, setPreviewImages] = useState<ProductImage[]>([]);
    const [previewProductName, setPreviewProductName] = useState('');

    const { data: products, isLoading } = useProducts({ search, channel: channelFilter });
    const { data: categories } = useCategories(true);
    const deleteProduct = useDeleteProduct();
    const updateVariantStock = useUpdateVariantStock();

    const handleCreateProduct = () => {
        setSelectedProductId(null);
        setProductDialogOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProductId(product._id);
        setProductDialogOpen(true);
    };

    const handleDeleteClick = (productId: string) => {
        setProductToDelete(productId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (productToDelete) {
            await deleteProduct.mutateAsync(productToDelete);
            setDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    const handleImageClick = (product: Product) => {
        if (product.images && product.images.length > 0) {
            setPreviewImages(product.images);
            setPreviewProductName(product.productName);
            setPreviewOpen(true);
        } else if (product.imageUrl) {
            setPreviewImages([{
                _id: 'main',
                imagePath: product.imageUrl,
                isPrimary: true,
                sortOrder: 0
            }]);
            setPreviewProductName(product.productName);
            setPreviewOpen(true);
        }
    };

    const handleQuickStockUpdate = async (product: Product, delta: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!product.variants?.[0]) return;

        const variant = product.variants[0];
        const newStock = Math.max(0, (variant.stock || 0) + delta);

        try {
            await updateVariantStock.mutateAsync({ variantId: variant._id, stock: newStock });
        } catch (error) {
            // Error managed by mutation
        }
    };

    // Sorting Logic
    const sortedProducts = [...(products || [])].filter(product => {
        const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
        if (stockFilter === 'all') return true;
        if (stockFilter === 'in_stock') return totalStock > 10;
        if (stockFilter === 'low_stock') return totalStock > 0 && totalStock <= 10;
        if (stockFilter === 'out_of_stock') return totalStock === 0;
        return true;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue: any = a[key as keyof Product];
        let bValue: any = b[key as keyof Product];

        if (key === 'stock') {
            aValue = a.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
            bValue = b.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
        } else if (key === 'price') {
            const aPrices = a.variants?.map(v => v.price).filter(p => p != null) || [];
            const bPrices = b.variants?.map(v => v.price).filter(p => p != null) || [];
            aValue = aPrices.length > 0 ? Math.min(...aPrices) : 0;
            bValue = bPrices.length > 0 ? Math.min(...bPrices) : 0;
        } else if (key === 'dateCreated') {
            aValue = new Date(a.dateCreated || 0).getTime();
            bValue = new Date(b.dateCreated || 0).getTime();
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSortChange = (value: string) => {
        const [key, direction] = value.split('-');
        setSortConfig({ key, direction: direction as 'asc' | 'desc' });
    };

    // Stats
    const totalProducts = products?.length || 0;
    const lowStockCount = products?.filter(p => {
        const stock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
        return stock > 0 && stock <= 10;
    }).length || 0;
    const outStockCount = products?.filter(p => {
        return (p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0) === 0;
    }).length || 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">สินค้า</h1>
                    <p className="text-gray-500 text-sm mt-1">จัดการสต๊อกสินค้า ราคา และรายละเอียดสินค้า</p>
                </div>
                <Button
                    onClick={handleCreateProduct}
                    className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-6 shadow-lg shadow-gray-200 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    <span className="font-medium">เพิ่มสินค้า</span>
                </Button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    {/* Stock Filter */}
                    <Tabs defaultValue="all" value={stockFilter} onValueChange={setStockFilter} className="w-full md:w-auto">
                        <TabsList className="grid w-full md:w-[400px] grid-cols-4 bg-gray-100/50 p-1 rounded-xl">
                            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                ทั้งหมด ({totalProducts})
                            </TabsTrigger>
                            <TabsTrigger value="in_stock" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                มีสินค้า
                            </TabsTrigger>
                            <TabsTrigger value="low_stock" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-orange-600">
                                เหลือน้อย
                            </TabsTrigger>
                            <TabsTrigger value="out_of_stock" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-red-600">
                                สินค้าหมด
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Channel Filter */}
                    <Tabs defaultValue="all" value={channelFilter} onValueChange={(val) => setChannelFilter(val as any)} className="w-full md:w-auto">
                        <TabsList className="grid w-full md:w-[350px] grid-cols-3 bg-gray-100/50 p-1 rounded-xl">
                            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                ทั้งหมด ({products?.stats?.total || 0})
                            </TabsTrigger>
                            <TabsTrigger value="pos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                                <Store className="h-4 w-4" /> หน้าร้าน ({products?.stats?.pos || 0})
                            </TabsTrigger>
                            <TabsTrigger value="online" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2">
                                <Globe className="h-4 w-4" /> ออนไลน์ ({products?.stats?.online || 0})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="relative md:col-span-8 lg:col-span-9">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="ค้นหาชื่อสินค้า, SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 bg-white border-gray-200 focus:bg-white transition-colors rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="md:col-span-4 lg:col-span-3">
                    <Select onValueChange={handleSortChange} defaultValue="dateCreated-desc">
                        <SelectTrigger className="h-11 bg-white border-gray-200 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <SortDesc className="h-4 w-4" />
                                <SelectValue placeholder="จัดเรียงตาม" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dateCreated-desc">ใหม่ล่าสุด</SelectItem>
                            <SelectItem value="dateCreated-asc">เก่าที่สุด</SelectItem>
                            <SelectItem value="price-asc">ราคา: ต่ำไปสูง</SelectItem>
                            <SelectItem value="price-desc">ราคา: สูงไปต่ำ</SelectItem>
                            <SelectItem value="stock-asc">สต๊อก: น้อยไปมาก</SelectItem>
                            <SelectItem value="stock-desc">สต๊อก: มากไปน้อย</SelectItem>
                            <SelectItem value="productName-asc">ชื่อ: A-Z</SelectItem>
                            <SelectItem value="productName-desc">ชื่อ: Z-A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Product List as Cards */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
            ) : sortedProducts.length > 0 ? (
                <div className="space-y-3">
                    {sortedProducts.map((product) => {
                        const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                        const prices = product.variants?.map((v) => v.price).filter(p => p != null) || [];
                        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                        const categoryName = categories?.find(c => c.categoryId === product.categoryId)?.name || 'ไม่มีหมวดหมู่';

                        // Check stock status for border color
                        let stockStatusDetails = { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
                        if (totalStock === 0) stockStatusDetails = { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
                        else if (totalStock <= 10) stockStatusDetails = { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };

                        return (
                            <div
                                key={product._id}
                                className="group bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col sm:flex-row"
                            >
                                {/* Image Section */}
                                <div className="sm:w-32 md:w-40 aspect-square sm:aspect-auto relative bg-gray-50 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer overflow-hidden" onClick={() => handleImageClick(product)}>
                                    {(product.images?.find(img => img.isPrimary)?.imagePath || product.images?.[0]?.imagePath || product.imageUrl) ? (
                                        <Image
                                            src={getImageUrl(product.images?.find(img => img.isPrimary)?.imagePath || product.images?.[0]?.imagePath || product.imageUrl!)}
                                            alt={product.productName}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 640px) 100vw, 160px"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full text-gray-300">
                                            <Package className="h-8 w-8 opacity-50" />
                                        </div>
                                    )}
                                    {/* Badges Overlay */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {product.isPos && <Badge className="bg-orange-500/90 hover:bg-orange-600 text-white shadow-sm backdrop-blur-sm text-[10px] h-5 px-1.5"><Store className="h-3 w-3 mr-1" /> หน้าร้าน</Badge>}
                                        {product.isOnline && <Badge className="bg-blue-500/90 hover:bg-blue-600 text-white shadow-sm backdrop-blur-sm text-[10px] h-5 px-1.5"><Globe className="h-3 w-3 mr-1" /> ออนไลน์</Badge>}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200 h-5">
                                                    {categoryName}
                                                </Badge>
                                                {product.brand && <span className="text-xs text-gray-400 font-medium">{product.brand}</span>}
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                                {product.productName}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                                                <span>{product.variants?.length || 0} ตัวเลือก</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className={product.shippingSize === 'large' ? 'text-orange-600 font-medium' : ''}>
                                                    {product.shippingSize === 'large' ? 'จัดส่งขนาดใหญ่' : 'จัดส่งมาตรฐาน'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-900">
                                                {prices.length === 0 ? 'ไม่มี' : (minPrice === maxPrice ? `฿${minPrice.toLocaleString()}` : `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 border-t border-gray-50 pt-3 mt-1">
                                        {/* Stock Control */}
                                        <div className="flex items-center gap-3 w-full sm:w-auto bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                            <span className={cn("text-xs font-bold px-2 uppercase tracking-wider", stockStatusDetails.color)}>
                                                {totalStock === 0 ? 'สินค้าหมด' : (totalStock <= 10 ? 'สินค้าเหลือน้อย' : 'มีสินค้า')}
                                            </span>
                                            <div className="h-4 w-[1px] bg-gray-200"></div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-md bg-white shadow-sm hover:bg-gray-100"
                                                    disabled={totalStock <= 0 || updateVariantStock.isPending}
                                                    onClick={(e) => handleQuickStockUpdate(product, -1, e)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-sm font-bold w-8 text-center tabular-nums">{totalStock}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-md bg-white shadow-sm hover:bg-gray-100"
                                                    disabled={updateVariantStock.isPending}
                                                    onClick={(e) => handleQuickStockUpdate(product, 1, e)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs font-medium border-gray-200 hover:bg-gray-50 hover:text-black"
                                                onClick={() => handleEditProduct(product)}
                                            >
                                                <Pencil className="h-3.5 w-3.5 mr-1.5" /> แก้ไข
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                onClick={() => handleDeleteClick(product._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-200 border-dashed">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-in fade-in zoom-in duration-300">
                        <Package className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">ไม่พบสินค้า</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto mb-6">
                        {search ? `ไม่พบผลลัพธ์สำหรับ "${search}"` : 'เริ่มต้นด้วยการเพิ่มสินค้าชิ้นแรกของคุณในคลัง'}
                    </p>
                    <Button
                        onClick={handleCreateProduct}
                        className="rounded-xl shadow-lg shadow-primary/20"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {search ? 'ล้างการค้นหาและเพิ่มสินค้า' : 'เพิ่มสินค้าใหม่'}
                    </Button>
                </div>
            )}

            <ProductDialog
                productId={selectedProductId}
                open={productDialogOpen}
                onOpenChange={setProductDialogOpen}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                isLoading={deleteProduct.isPending}
                title="ลบสินค้า"
                description="คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? การดำเนินการนี้ไม่สามารถยกเลิกได้ และจะลบตัวเลือกสินค้าทั้งหมดด้วย"
            />

            <ImagePreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                images={previewImages}
                productName={previewProductName}
            />
        </div>
    );
}
