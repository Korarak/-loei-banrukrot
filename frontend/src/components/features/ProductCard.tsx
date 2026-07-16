import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { getImageUrl, getPrimaryImage, parseBrands } from '@/lib/utils';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { motion } from 'framer-motion';
import { useState, useCallback, useMemo, useEffect } from 'react';

interface ProductCardProps {
    product: any;
    priority?: boolean;
    // Callers render this card in grids of very different real widths (4-col
    // wide container, 3-col with a sidebar, fixed-width carousels, ...). The
    // default below assumes the widest common case (a 4-col grid inside a
    // ~1536px-capped container) — pass a tighter value when the card renders
    // narrower, otherwise the browser fetches a needlessly large image on
    // wide/high-DPR monitors (unbounded `vw` keeps growing past the point the
    // container itself stops growing).
    sizes?: string;
}

export default function ProductCard({ product, priority = false, sizes = '(max-width: 640px) 240px, (max-width: 1024px) 300px, 400px' }: ProductCardProps) {
    const addToCart = useAddToCart();
    const customer = useAuthStore((state) => state.customer);
    const { addToWishlist, removeFromWishlist } = useWishlistStore();
    const inWishlist = useWishlistStore((state) => state.items.some((item) => item._id === product._id));
    // Wishlist store is persisted in localStorage — server HTML always renders
    // "not in wishlist", so gate on mount to avoid a hydration mismatch.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const showInWishlist = mounted && inWishlist;

    const primaryImage = getPrimaryImage(product.images);

    const { priceDisplay, isOutOfStock, firstAvailableVariant, defaultVariant } = useMemo(() => {
        const prices = product.variants?.map((v: any) => v.price) || [];
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;
        return {
            priceDisplay: prices.length === 0
                ? 'ไม่ระบุราคา'
                : minPrice === maxPrice
                    ? `฿${minPrice.toLocaleString()}`
                    : `฿${minPrice.toLocaleString()} – ฿${maxPrice.toLocaleString()}`,
            isOutOfStock: product.variants?.every((v: any) => v.stockAvailable <= 0),
            firstAvailableVariant: product.variants?.find((v: any) => v.stockAvailable > 0),
            defaultVariant: product.variants?.[0],
            minPrice,
        };
    }, [product.variants]);

    const handleWishlistToggle = useCallback(() => {
        if (inWishlist) {
            removeFromWishlist(product._id);
            toast.success('ลบออกจากรายการโปรดแล้ว');
        } else {
            const prices = product.variants?.map((v: any) => v.price) || [];
            addToWishlist({
                _id: product._id,
                productName: product.productName,
                imageUrl: primaryImage?.imagePath,
                price: prices.length ? Math.min(...prices) : 0,
                slug: product._id,
            });
            toast.success('เพิ่มในรายการโปรดแล้ว');
        }
    }, [inWishlist, product, primaryImage, addToWishlist, removeFromWishlist]);

    const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        const targetVariant = firstAvailableVariant || defaultVariant;
        if (!targetVariant) return;
        try {
            await addToCart.mutateAsync({ productId: product._id, variantId: targetVariant._id, quantity: 1 });
            toast.success('เพิ่มลงตะกร้าเรียบร้อย', { description: product.productName, id: 'add-to-cart-success' });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'ไม่สามารถเพิ่มสินค้าได้', { id: 'add-to-cart-error' });
        }
    }, [firstAvailableVariant, defaultVariant, addToCart, product]);

    return (
        <div className="group relative">
            <Link href={`/products/${product._id}`} className="block">
                <div className="relative overflow-hidden bg-white border border-border group-hover:border-foreground transition-colors duration-300">

                    {/* Image */}
                    <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden">
                        {primaryImage ? (
                            <Image
                                src={getImageUrl(primaryImage.imagePath)}
                                alt={product.productName}
                                fill
                                className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                                sizes={sizes}
                                placeholder={primaryImage.blurDataURL ? 'blur' : 'empty'}
                                blurDataURL={primaryImage.blurDataURL}
                                {...(priority ? { priority: true } : { loading: 'lazy' as const })}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                <span className="text-xs font-semibold tracking-widest">ไม่มีรูปภาพ</span>
                            </div>
                        )}

                        {isOutOfStock && (
                            <div className="absolute top-3 left-3 z-20">
                                <span className="bg-brand text-brand-foreground text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                                    สินค้าหมด
                                </span>
                            </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 transition-all duration-300 ease-out z-20">
                            <Button
                                className="w-full h-10 text-xs uppercase tracking-wider"
                                onClick={handleAddToCart}
                                disabled={isOutOfStock || addToCart.isPending}
                                aria-label={isOutOfStock ? `${product.productName} — สินค้าหมด` : `เพิ่ม ${product.productName} ลงตะกร้า`}
                            >
                                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                                {addToCart.isPending ? 'กำลังเพิ่ม...' : isOutOfStock ? 'สินค้าหมด' : 'ใส่ตะกร้า'}
                            </Button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                            {parseBrands(product.brand).length > 0 ? (
                                <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                                    {parseBrands(product.brand).map((b) => (
                                        <span key={b} className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            ) : <span />}
                            {!isOutOfStock && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block" />
                                    มีสินค้า
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">
                            {product.productName}
                        </h3>

                        <div className="flex items-baseline justify-between">
                            <span className="text-base font-bold text-brand tracking-tight font-mitr">
                                {priceDisplay}
                            </span>
                            {product.variants?.length > 1 && (
                                <span className="text-[10px] text-gray-500 font-medium">
                                    {product.variants.length} ตัวเลือก
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Wishlist button */}
            <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={handleWishlistToggle}
                aria-label={showInWishlist ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                className={`absolute top-3 right-3 z-30 p-2 rounded-full transition-colors duration-200 ${
                    showInWishlist
                        ? 'bg-brand text-white'
                        : 'bg-white/90 text-gray-500 hover:bg-white hover:text-brand'
                }`}
            >
                <Heart className={`h-4 w-4 ${showInWishlist ? 'fill-current' : ''}`} />
            </motion.button>
        </div>
    );
}
