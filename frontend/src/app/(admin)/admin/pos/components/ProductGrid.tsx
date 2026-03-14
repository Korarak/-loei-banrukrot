'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface Product {
    _id: string;
    productName: string;
    images: { imagePath: string }[];
    variants: {
        _id: string;
        sku: string;
        price: number;
        stockAvailable: number;
    }[];
}

interface ProductGridProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
    isLoading: boolean;
}

export function ProductGrid({ products, onAddToCart, isLoading }: ProductGridProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px]" role="status" aria-label="Loading products">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true"></div>
                    <p className="text-gray-400 text-sm">กำลังโหลดสินค้า...</p>
                </div>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400" role="alert" aria-label="No products found">
                <Package className="h-16 w-16 mb-4 opacity-20" aria-hidden="true" />
                <p className="text-lg font-medium">ไม่พบสินค้า</p>
                <p className="text-sm">ลองปรับการค้นหาหรือเลือกหมวดหมู่ใหม่</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-32 md:pb-0" role="grid" aria-label="Product list">
            {products.map((product) => (
                <POSProductCard
                    key={product._id}
                    product={product}
                    onAdd={() => onAddToCart(product)}
                />
            ))}
        </div>
    );
}

function POSProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
    const variant = product.variants?.[0];
    const hasStock = variant && (variant.stockAvailable || 0) > 0;
    const imageUrl = product.images?.[0]?.imagePath ? getImageUrl(product.images[0].imagePath) : null;

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 border-gray-100 overflow-hidden group relative bg-white flex flex-col h-full",
                !hasStock ? "opacity-60 grayscale" : "hover:shadow-xl hover:-translate-y-1 hover:border-primary/20"
            )}
            onClick={hasStock ? onAdd : undefined}
            role="article"
            aria-label={`${product.productName} - ${hasStock ? `ราคา ${variant?.price} บาท` : 'สินค้าหมด'}`}
            tabIndex={0}
            onKeyDown={(e) => {
                if (hasStock && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onAdd();
                }
            }}
        >
            <div className="aspect-[3/2] bg-gray-50 relative overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={product.productName}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="h-10 w-10 opacity-20" aria-hidden="true" />
                    </div>
                )}

                {/* Stock Badge */}
                {hasStock ? (
                    <div
                        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-700 shadow-sm border border-gray-100"
                        aria-label={`${variant.stockAvailable} items left`}
                    >
                        เหลือ {variant.stockAvailable}
                    </div>
                ) : (
                    <div
                        className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]"
                        aria-label="Out of stock overlay"
                    >
                        <Badge variant="destructive" className="text-xs px-2 py-1 font-bold shadow-lg">สินค้าหมด</Badge>
                    </div>
                )}
            </div>

            <div className="p-2 flex flex-col flex-1 justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-xs leading-tight mb-0.5" title={product.productName}>
                        {product.productName}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono truncate">
                        {variant?.sku || 'ไม่มี SKU'}
                    </p>
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-bold text-sm text-primary">
                        ฿{variant?.price.toLocaleString() || '0'}
                    </span>
                    {hasStock && (
                        <div
                            className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm"
                            aria-hidden="true"
                        >
                            <span className="text-lg leading-none mb-0.5">+</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

