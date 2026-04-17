import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '@/stores/useWishlistStore';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface ProductCardProps {
    product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
    const addToCart = useAddToCart();
    const customer = useAuthStore((state) => state.customer);
    const { addToWishlist, removeFromWishlist } = useWishlistStore();
    const inWishlist = useWishlistStore((state) => state.items.some((item) => item._id === product._id));
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 3D Motion Values
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleMouseLeave = () => { x.set(0); y.set(0); };

    const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
    const prices = product.variants?.map((v: any) => v.price) || [];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceDisplay = prices.length > 0
        ? minPrice === maxPrice
            ? `฿${minPrice.toLocaleString()}`
            : `฿${minPrice.toLocaleString()} – ฿${maxPrice.toLocaleString()}`
        : 'N/A';

    const isOutOfStock = product.variants?.every((v: any) => v.stockAvailable <= 0);
    const firstAvailableVariant = product.variants?.find((v: any) => v.stockAvailable > 0);
    const defaultVariant = product.variants?.[0];

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (inWishlist) {
            removeFromWishlist(product._id);
            toast.success('ลบออกจากรายการโปรดแล้ว');
        } else {
            addToWishlist({ _id: product._id, productName: product.productName, imageUrl: primaryImage?.imagePath, price: minPrice, slug: product._id });
            toast.success('เพิ่มในรายการโปรดแล้ว');
        }
    };

    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiParticles, setConfettiParticles] = useState<any[]>([]);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        const targetVariant = firstAvailableVariant || defaultVariant;
        if (!targetVariant) return;

        const particles = [...Array(12)].map(() => ({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            rotate: Math.random() * 360,
            color: ['#FFC107', '#FF5722', '#4CAF50', '#2196F3', '#E91E63'][Math.floor(Math.random() * 5)]
        }));
        setConfettiParticles(particles);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);

        try {
            await addToCart.mutateAsync({ productId: product._id, variantId: targetVariant._id, quantity: 1 });
            toast.success('เพิ่มลงตะกร้าเรียบร้อย', { description: product.productName, id: 'add-to-cart-success' });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'ไม่สามารถเพิ่มสินค้าได้', { id: 'add-to-cart-error' });
        }
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
            className="group perspective-1000 relative"
        >
            <Link href={`/products/${product._id}`} className="block">
                {/* Single card — no double nesting */}
                <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-md group-hover:shadow-xl group-hover:border-gray-200 transition-all duration-300">

                    {/* ── Image ── */}
                    <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden">
                        {primaryImage ? (
                            <Image
                                src={getImageUrl(primaryImage.imagePath)}
                                alt={product.productName}
                                fill
                                className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                                <span className="text-xs font-semibold uppercase tracking-widest">No Image</span>
                            </div>
                        )}

                        {/* Gradient overlay — always visible, stronger on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Out of stock badge */}
                        {isOutOfStock && (
                            <div className="absolute top-3 left-3 z-20">
                                <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                                    สินค้าหมด
                                </span>
                            </div>
                        )}

                        {/* Wishlist button */}
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={handleWishlistToggle}
                            className={`absolute top-3 right-3 z-30 p-2 rounded-full backdrop-blur-sm shadow transition-all duration-200 ${(inWishlist && mounted)
                                ? 'bg-red-500 text-white'
                                : 'bg-white/80 text-gray-400 hover:bg-white hover:text-red-500'
                            }`}
                        >
                            <Heart className={`h-4 w-4 ${(inWishlist && mounted) ? 'fill-current' : ''}`} />
                        </motion.button>

                        {/* Add to cart — slides up on hover */}
                        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20">
                            <Button
                                className="w-full bg-white/95 text-gray-900 hover:bg-white shadow-lg font-bold rounded-xl h-10 text-xs uppercase tracking-wider backdrop-blur-sm border-0"
                                onClick={handleAddToCart}
                                disabled={isOutOfStock || addToCart.isPending}
                            >
                                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                                {addToCart.isPending ? '...' : isOutOfStock ? 'สินค้าหมด' : 'ใส่ตะกร้า'}
                            </Button>
                        </div>
                    </div>

                    {/* ── Info ── */}
                    <div className="px-4 py-3">
                        {/* Brand + stock indicator */}
                        <div className="flex items-center justify-between mb-1.5">
                            {product.brand ? (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    {product.brand}
                                </span>
                            ) : <span />}
                            {!isOutOfStock && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                    In Stock
                                </span>
                            )}
                        </div>

                        {/* Product name */}
                        <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200 mb-2 min-h-[2.5rem]">
                            {product.productName}
                        </h3>

                        {/* Price row */}
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

            {/* Confetti */}
            {showConfetti && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                    {confettiParticles.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
                            animate={{ x: p.x, y: p.y, rotate: p.rotate, scale: 0, opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}
