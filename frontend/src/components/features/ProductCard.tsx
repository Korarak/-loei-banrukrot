import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAddToCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';
import { Heart } from 'lucide-react';
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

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    // Gloss effect movement
    const glossX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glossY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Get primary image or first image
    const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];

    // Get default variant (first one)
    const defaultVariant = product.variants?.[0];

    // Calculate price range or display single price
    const prices = product.variants?.map((v: any) => v.price) || [];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const priceDisplay = prices.length > 0
        ? minPrice === maxPrice
            ? `฿${minPrice.toLocaleString()}`
            : `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`
        : 'Price N/A';

    const isOutOfStock = product.variants?.every((v: any) => v.stockAvailable <= 0);
    const firstAvailableVariant = product.variants?.find((v: any) => v.stockAvailable > 0);
    const hasInStock = !isOutOfStock;

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (inWishlist) {
            removeFromWishlist(product._id);
            toast.success('ลบออกจากรายการโปรดแล้ว');
        } else {
            addToWishlist({
                _id: product._id,
                productName: product.productName,
                imageUrl: primaryImage?.imagePath,
                price: minPrice,
                slug: product._id
            });
            toast.success('เพิ่มในรายการโปรดแล้ว');
        }
    };

    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiParticles, setConfettiParticles] = useState<any[]>([]);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation

        const targetVariant = firstAvailableVariant || defaultVariant;
        if (!targetVariant) return;

        // Generate confetti particles here
        const particles = [...Array(12)].map(() => ({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            rotate: Math.random() * 360,
            color: ['#FFC107', '#FF5722', '#4CAF50', '#2196F3', '#E91E63'][Math.floor(Math.random() * 5)]
        }));
        setConfettiParticles(particles);

        // Trigger visual confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);

        try {
            await addToCart.mutateAsync({
                productId: product._id,
                variantId: targetVariant._id,
                quantity: 1
            });
            toast.success('เพิ่มลงตะกร้าเรียบร้อย', {
                description: `${product.productName} ถูกเพิ่มลงในตะกร้าแล้ว`,
                id: 'add-to-cart-success' // Prevent stack
            });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'ไม่สามารถเพิ่มสินค้าได้';
            toast.error(message, {
                id: 'add-to-cart-error' // Prevent stack
            });
        }
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="group h-full perspective-1000 relative"
        >
            <Link href={`/products/${product._id}`} className="block h-full">
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 h-full flex flex-col relative shadow-sm group-hover:shadow-2xl transition-shadow duration-500">

                    {/* Gloss Overlay */}
                    <motion.div
                        style={{
                            background: `radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
                            left: glossX,
                            top: glossY,
                            x: "-50%",
                            y: "-50%",
                            pointerEvents: "none"
                        }}
                        className="absolute w-[150%] h-[150%] z-20 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full blur-3xl mix-blend-overlay"
                    />

                    <div className="relative aspect-square w-full bg-gray-50 overflow-hidden transform-gpu border-b border-gray-50">
                        {/* Wishlist Button */}
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={handleWishlistToggle}
                            className={`absolute top-3 right-3 z-30 p-2 rounded-full backdrop-blur-sm transition-all duration-200 shadow-sm ${(inWishlist && mounted)
                                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                : 'bg-white/80 text-gray-400 hover:bg-white hover:text-red-500'
                                }`}
                        >
                            <Heart className={`h-4 w-4 ${(inWishlist && mounted) ? 'fill-current' : ''}`} />
                        </motion.button>

                        {primaryImage ? (
                            <Image
                                src={getImageUrl(primaryImage.imagePath)}
                                alt={product.productName}
                                fill
                                className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out z-10"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                            </div>
                        )}

                        <div className="absolute inset-x-4 bottom-4 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-500 ease-out z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-2">
                            <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    className="w-full bg-white text-primary hover:bg-emerald-50 shadow-lg border border-emerald-100 font-bold rounded-xl h-10 text-[10px] uppercase tracking-wider"
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || addToCart.isPending}
                                >
                                    {addToCart.isPending ? '...' : (hasInStock ? 'ใส่ตะกร้า' : 'สินค้าหมด')}
                                </Button>
                            </motion.div>
                        </div>

                        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                            {isOutOfStock && (
                                <Badge variant="destructive" className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
                                    หมด
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Confetti Particles */}
                    {showConfetti && (
                        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                            {confettiParticles.map((particle, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
                                    animate={{
                                        x: particle.x,
                                        y: particle.y,
                                        rotate: particle.rotate,
                                        scale: 0,
                                        opacity: 0
                                    }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{
                                        backgroundColor: particle.color
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <div className="p-5 flex flex-col flex-1 bg-white relative z-10">
                        <div className="mb-2 flex items-center justify-between h-5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[100px]">{product.brand}</span>
                            {hasInStock && (
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-medium text-emerald-600">In Stock</span>
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 truncate mb-3 group-hover:text-primary transition-colors duration-300 leading-tight h-5">
                            {product.productName}
                        </h3>
                        <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                            <div className="flex flex-row items-baseline gap-2">
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Price</span>
                                <div className="font-black text-lg text-primary tracking-tight font-kanit gradient-text-primary truncate">
                                    {priceDisplay}
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md whitespace-nowrap">
                                {product.variants.length} options
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
