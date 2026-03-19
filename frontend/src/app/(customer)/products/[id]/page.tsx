'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { Minus, Plus, ShoppingCart, X, Package, Tag, Layers, ChevronLeft, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useAddToCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProductDetailPage() {
    const params = useParams();
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

    const { data: product, isLoading: isProductLoading } = useProduct(params.id as string);
    const { data: categories } = useCategories();
    const addToCart = useAddToCart();
    const router = useRouter();
    const isCustomerAuthenticated = useAuthStore((state) => state.isCustomerAuthenticated);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

    if (isProductLoading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    <p className="text-gray-400 animate-pulse font-medium">Loading Product...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">PRODUCT NOT FOUND</h2>
                <p className="text-gray-500 mb-8 max-w-md">The product you are looking for might have been removed or is temporarily unavailable.</p>
                <Button asChild size="lg" className="rounded-full font-bold px-8">
                    <Link href="/products">Back to Shop</Link>
                </Button>
            </div>
        );
    }

    const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
    const displayImage = activeImage || primaryImage?.imagePath || product.imageUrl;
    const variants = product.variants || [];
    const selectedVariant = selectedVariantId
        ? variants.find((v: any) => v._id === selectedVariantId)
        : variants[0];
    const categoryName = categories?.find(c => c.categoryId === product.categoryId)?.name || '-';
    const shippingSizeLabel = product.shippingSize === 'large' ? 'Large Item' : 'Standard Item';

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        if (!isCustomerAuthenticated()) {
            toast.error("Please login to add items to cart");
            router.push('/customer-login');
            return;
        }

        try {
            await addToCart.mutateAsync({
                productId: product._id,
                variantId: selectedVariant._id,
                quantity
            });
            toast.success('Added to Cart!', {
                description: `${product.productName} x${quantity}`,
                id: 'add-to-cart-success',
                className: 'bg-green-50 border-green-200'
            });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to add to cart';
            toast.error(message);
        }
    };

    return (
        <div className="font-sans pb-24 md:pb-0 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb / Back */}
            <div className="mb-6 flex items-center justify-between">
                <Button variant="ghost" asChild className="group -ml-4 text-gray-500 hover:text-gray-900 hover:bg-transparent">
                    <Link href="/products" className="flex items-center gap-1">
                        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Back to Products</span>
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Share2 className="h-5 w-5 text-gray-600" />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                {/* Image Gallery - STICKY ON DESKTOP */}
                <div className="lg:sticky lg:top-8 space-y-6">
                    <motion.div
                        layoutId={`product-image-${product._id}`}
                        className="aspect-square bg-white rounded-3xl overflow-hidden relative border border-gray-100 shadow-sm group cursor-zoom-in"
                        onClick={() => displayImage && setFullScreenImage(displayImage)}
                    >
                        {displayImage ? (
                            <Image
                                src={getImageUrl(displayImage)}
                                alt={product.productName}
                                fill
                                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">No Image Available</span>
                            </div>
                        )}
                        {shippingSizeLabel && (
                            <div className="absolute top-4 right-4 bg-gray-900/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-gray-900 uppercase tracking-wider">
                                {shippingSizeLabel}
                            </div>
                        )}
                    </motion.div>

                    {product.images && product.images.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {product.images.map((img: any, index: number) => (displayImage === img.imagePath) ? (
                                <div key={index} className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-2xl border-2 border-gray-900 p-1 bg-white shadow-sm">
                                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                                        <Image
                                            src={getImageUrl(img.imagePath)}
                                            alt={`View ${index + 1}`}
                                            fill
                                            className="object-contain p-1"
                                            sizes="96px"
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    key={index}
                                    onClick={() => setActiveImage(img.imagePath)}
                                    className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-2xl border border-gray-100 hover:border-gray-300 transition-all bg-white p-1"
                                >
                                    <div className="relative w-full h-full rounded-xl overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
                                        <Image
                                            src={getImageUrl(img.imagePath)}
                                            alt={`View ${index + 1}`}
                                            fill
                                            className="object-contain p-1"
                                            sizes="96px"
                                            unoptimized
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info - PREMIUM HIERARCHY */}
                <div className="flex flex-col pt-2">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">
                                {product.brand || 'Premium Brand'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                {categoryName}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-[1.15] font-kanit">
                            {product.productName}
                        </h1>

                        <div className="flex items-baseline gap-4 mb-8">
                            <div className="text-4xl md:text-5xl font-black text-gray-900 font-kanit">
                                ฿{selectedVariant?.price.toLocaleString()}
                            </div>
                            {(selectedVariant?.stock ?? 0) > 0 ? (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                    In Stock
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                    Out of Stock
                                </span>
                            )}
                        </div>

                        {/* Quick Highlights - 425degree style */}
                        <div className="grid grid-cols-1 gap-4 py-6 border-y border-gray-100 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                <p className="text-sm font-medium text-gray-600">สินค้านำเข้าของแท้ 100% จากแบรนด์โดยตรง</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                <p className="text-sm font-medium text-gray-600">ดีไซน์ทันสมัย วัสดุพรีเมียม แข็งแรงทนทาน</p>
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    {variants.length > 1 && (
                        <div className="mb-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">รูปแบบสินค้า</h3>
                            <div className="flex flex-wrap gap-2.5">
                                {variants.map((variant: any) => (
                                    <button
                                        key={variant._id}
                                        onClick={() => setSelectedVariantId(variant._id)}
                                        className={`px-5 py-2.5 rounded-full border-2 text-xs font-bold transition-all ${selectedVariant?._id === variant._id
                                            ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                                            : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {variant.sku}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Add to Cart */}
                    <div className="space-y-4 hidden lg:block">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">จำนวน</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full hover:bg-white hover:shadow-sm"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full hover:bg-white hover:shadow-sm"
                                    onClick={() => setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button
                                size="lg"
                                className="flex-1 h-14 rounded-full text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0"
                                onClick={handleAddToCart}
                                disabled={!selectedVariant || (selectedVariant?.stock ?? 0) <= 0 || addToCart.isPending}
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {addToCart.isPending ? 'กำลังเพิ่ม...' : 'เพิ่มลงรถเข็น'}
                            </Button>
                        </div>
                    </div>

                    {/* Key Attributes */}
                    <div className="grid grid-cols-3 gap-4 mt-10">
                        <div className="flex flex-col items-center p-4 bg-gray-50/50 rounded-2xl text-center">
                            <Package className="h-5 w-5 text-primary mb-2" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">จัดส่งด่วน</span>
                            <span className="text-xs font-black text-gray-900 mt-1">1-3 วัน</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50/50 rounded-2xl text-center">
                            <Tag className="h-5 w-5 text-primary mb-2" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">รับประกัน</span>
                            <span className="text-xs font-black text-gray-900 mt-1">ของแท้</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-gray-50/50 rounded-2xl text-center">
                            <Layers className="h-5 w-5 text-primary mb-2" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ขนาด</span>
                            <span className="text-xs font-black text-gray-900 mt-1">{shippingSizeLabel}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL WIDTH DESCRIPTION SECTION */}
            <div className="mt-20 border-t border-gray-100 pt-16">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-3">Product Details</h2>
                        <h3 className="text-3xl font-black text-gray-900 font-kanit">รายละเอียดสินค้า</h3>
                    </div>
                    
                    <div className="prose prose-lg prose-gray max-w-none">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="text-gray-600 leading-[1.8] whitespace-pre-wrap font-medium font-kanit italic text-lg">
                                {product.description || 'ไม่มีข้อมูลรายละเอียดสำหรับสินค้านี้'}
                            </div>
                            <div className="mt-12 flex justify-center">
                                <Button 
                                    variant="outline" 
                                    className="rounded-full px-8 font-black border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all uppercase tracking-widest text-xs h-12"
                                    onClick={() => setIsDescriptionOpen(true)}
                                >
                                    รายละเอียดทั้งหมด
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

                {/* Mobile Sticky Action Bar - REFINED */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 lg:hidden z-40 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3 max-w-lg mx-auto">
                        <div className="flex items-center bg-gray-100 rounded-2xl px-1 py-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl"
                                onClick={() => setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            className="flex-1 h-12 rounded-2xl font-black text-sm shadow-lg bg-primary hover:bg-primary/90 text-white shadow-primary/20 active:scale-95 transition-transform"
                            onClick={handleAddToCart}
                            disabled={!selectedVariant || (selectedVariant?.stock ?? 0) <= 0 || addToCart.isPending}
                        >
                            {addToCart.isPending ? 'กำลังเพิ่ม...' : 'เพิ่มลงรถเข็น'}
                        </Button>
                    </div>
                </div>

                {/* Full Screen Modal */}
                <AnimatePresence>
                    {fullScreenImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-white/95 flex items-center justify-center p-4 backdrop-blur-md"
                            onClick={() => setFullScreenImage(null)}
                        >
                            <button
                                className="absolute top-6 right-6 text-gray-900/50 hover:text-gray-900 transition-colors bg-gray-100 p-3 rounded-full z-10"
                                onClick={() => setFullScreenImage(null)}
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <div className="relative w-full h-full max-w-6xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                                <Image
                                    src={getImageUrl(fullScreenImage)}
                                    alt="Full screen view"
                                    fill
                                    className="object-contain"
                                    sizes="100vw"
                                    priority
                                    unoptimized
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Description Full Screen Modal */}
                <AnimatePresence>
                    {isDescriptionOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setIsDescriptionOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">รายละเอียดสินค้า</h3>
                                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsDescriptionOpen(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                    <div className="prose prose-lg text-gray-700 max-w-none leading-relaxed whitespace-pre-wrap font-medium">
                                        {product.description || 'ไม่มีข้อมูลรายละเอียดสำหรับสินค้านี้'}
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-100 bg-gray-50/50 text-center">
                                    <Button onClick={() => setIsDescriptionOpen(false)} className="rounded-full px-8 font-bold">
                                        ปิดหน้าต่าง
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
    );
}
