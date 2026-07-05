import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';

interface ProductCardProps {
    product: any;
}

const CONFETTI_COLORS = ['#FFC107', '#FF5722', '#4CAF50', '#2196F3', '#E91E63'];

export default function ProductCard({ product }: ProductCardProps) {
    const addToCart = useAddToCart();
    const customer = useAuthStore((state) => state.customer);
    const { addToWishlist, removeFromWishlist } = useWishlistStore();
    const inWishlist = useWishlistStore((state) => state.items.some((item) => item._id === product._id));
    const prefersReducedMotion = useReducedMotion();
    // Wishlist store is persisted in localStorage — server HTML always renders
    // "not in wishlist", so gate on mount to avoid a hydration mismatch.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const showInWishlist = mounted && inWishlist;
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiParticles, setConfettiParticles] = useState<{ x: number; y: number; rotate: number; color: string }[]>([]);

    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current || prefersReducedMotion) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    }, [prefersReducedMotion, x, y]);

    const handleMouseLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

    const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];

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
        if (!prefersReducedMotion) {
            const particles = Array.from({ length: 8 }, () => ({
                x: (Math.random() - 0.5) * 160,
                y: (Math.random() - 0.5) * 160,
                rotate: Math.random() * 360,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            }));
            setConfettiParticles(particles);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 800);
        }
        try {
            await addToCart.mutateAsync({ productId: product._id, variantId: targetVariant._id, quantity: 1 });
            toast.success('เพิ่มลงตะกร้าเรียบร้อย', { description: product.productName, id: 'add-to-cart-success' });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'ไม่สามารถเพิ่มสินค้าได้', { id: 'add-to-cart-error' });
        }
    }, [firstAvailableVariant, defaultVariant, prefersReducedMotion, addToCart, product]);

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative"
        >
            <motion.div
                whileHover={prefersReducedMotion ? {} : { y: -6 }}
                transition={{ duration: 0.2 }}
                style={prefersReducedMotion ? {} : { rotateY, rotateX, transformStyle: 'preserve-3d' }}
                className="perspective-1000"
            >
                <Link href={`/products/${product._id}`} className="block">
                    <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-md group-hover:shadow-xl group-hover:border-gray-200 transition-all duration-300">

                        {/* Image */}
                        <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden">
                            {primaryImage ? (
                                <Image
                                    src={getImageUrl(primaryImage.imagePath)}
                                    alt={product.productName}
                                    fill
                                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                                    sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 25vw"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                                    <span className="text-xs font-semibold tracking-widest">ไม่มีรูปภาพ</span>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {isOutOfStock && (
                                <div className="absolute top-3 left-3 z-20">
                                    <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                                        สินค้าหมด
                                    </span>
                                </div>
                            )}

                            <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 transition-all duration-300 ease-out z-20">
                                <Button
                                    className="w-full bg-white/95 text-gray-900 hover:bg-white shadow-lg font-bold rounded-xl h-10 text-xs uppercase tracking-wider backdrop-blur-sm border-0"
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
                                {product.brand ? (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        {product.brand}
                                    </span>
                                ) : <span />}
                                {!isOutOfStock && (
                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                        มีสินค้า
                                    </span>
                                )}
                            </div>

                            <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200 mb-2 min-h-[2.5rem]">
                                {product.productName}
                            </h3>

                            <div className="flex items-baseline justify-between">
                                <span className="text-base font-black text-primary tracking-tight font-kanit">
                                    {priceDisplay}
                                </span>
                                {product.variants?.length > 1 && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {product.variants.length} ตัวเลือก
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* Wishlist button */}
            <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={handleWishlistToggle}
                aria-label={showInWishlist ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                className={`absolute top-3 right-3 z-30 p-2 rounded-full backdrop-blur-sm shadow transition-all duration-200 ${
                    showInWishlist
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-gray-400 hover:bg-white hover:text-red-500'
                }`}
            >
                <Heart className={`h-4 w-4 ${showInWishlist ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Confetti — only 8 particles, only when motion is OK */}
            {showConfetti && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                    {confettiParticles.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
                            animate={{ x: p.x, y: p.y, rotate: p.rotate, scale: 0, opacity: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="absolute w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
