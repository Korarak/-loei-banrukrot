'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, X, Package, Layers, ChevronLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useAddToCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { getImageUrl, getPrimaryImage } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import RelatedProducts from '@/components/features/RelatedProducts';

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

    // Escape ปิด modal ที่เปิดอยู่ (custom modal ไม่ใช่ Radix จึงต้องจัดการเอง)
    useEffect(() => {
        if (!fullScreenImage && !isDescriptionOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setFullScreenImage(null);
                setIsDescriptionOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [fullScreenImage, isDescriptionOpen]);

    if (isProductLoading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-foreground border-t-transparent"></div>
                    <p className="text-gray-600 animate-pulse font-medium">กำลังโหลดสินค้า...</p>
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
                <h2 className="text-3xl font-black text-gray-900 mb-2">ไม่พบสินค้า</h2>
                <p className="text-gray-600 mb-8 max-w-md">สินค้าที่คุณค้นหาอาจถูกลบออกไปแล้ว หรืออยู่ระหว่างพักขาย</p>
                <Button asChild size="lg" className="px-8">
                    <Link href="/products">กลับไปยังสินค้า</Link>
                </Button>
            </div>
        );
    }

    const primaryImage = getPrimaryImage(product.images, product.imageUrl);
    const displayImage = activeImage || primaryImage?.imagePath || product.imageUrl;
    const displayImageObj = product.images?.find((img: any) => img.imagePath === displayImage) || primaryImage;
    const variants = product.variants || [];
    const selectedVariant = selectedVariantId
        ? variants.find((v: any) => v._id === selectedVariantId)
        : variants[0];
    const category = categories?.find(c => c.categoryId === product.categoryId);
    const categoryName = category?.name || '-';
    const shippingSizeLabel = product.shippingSize === 'large' ? 'Large Item' : 'Standard Item';
    const getVariantLabel = (v: any) => {
        const parts = [v.option1Value, v.option2Value].filter(Boolean);
        return parts.length > 0 ? parts.join(' / ') : v.sku;
    };
    const getVariantStock = (v: any) => v?.stock ?? v?.stockAvailable ?? 0;
    const isVariantOOS = (v: any) => getVariantStock(v) <= 0;
    const selectedStock = getVariantStock(selectedVariant);

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        if (!isCustomerAuthenticated()) {
            toast.error("กรุณาเข้าสู่ระบบเพื่อเพิ่มสินค้าลงตะกร้า");
            router.push('/customer-login');
            return;
        }

        try {
            await addToCart.mutateAsync({
                productId: product._id,
                variantId: selectedVariant._id,
                quantity
            });
            toast.success('เพิ่มลงรถเข็นแล้ว!', {
                description: `${product.productName} x${quantity}`,
                id: 'add-to-cart-success',
                className: 'bg-green-50 border-green-200'
            });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'ไม่สามารถเพิ่มสินค้าลงรถเข็นได้';
            toast.error(message);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: product.productName,
            text: `Check out ${product.productName} - Loei Banrakrod`,
            url: window.location.href,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('คัดลอกลิงก์แล้ว!', {
                    description: 'สามารถนำไปแบ่งปันได้เลย',
                    icon: <Share2 className="h-4 w-4" />,
                    className: 'bg-white border-gray-200'
                });
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Error sharing:', error);
                toast.error('ไม่สามารถแชร์ลิงก์ได้');
            }
        }
    };

    return (
        <div className="font-sans pb-24 md:pb-0 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb / Back */}
            <div className="mb-6 flex items-center justify-between">
                <Button variant="ghost" asChild className="group -ml-4 text-gray-600 hover:text-gray-900 hover:bg-transparent">
                    <Link href="/products" className="flex items-center gap-1">
                        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">กลับไปยังสินค้า</span>
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-gray-100"
                    onClick={handleShare}
                    aria-label="แชร์สินค้านี้"
                >
                    <Share2 className="h-5 w-5 text-gray-600" />
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                {/* Image Gallery - STICKY ON DESKTOP */}
                <div className="lg:sticky lg:top-8 space-y-6">
                    <motion.div
                        layoutId={`product-image-${product._id}`}
                        className="aspect-square bg-white overflow-hidden relative border border-border group cursor-zoom-in"
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
                                placeholder={displayImageObj?.blurDataURL ? 'blur' : 'empty'}
                                blurDataURL={displayImageObj?.blurDataURL}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <span className="text-sm font-bold tracking-widest text-gray-500">ไม่มีรูปภาพ</span>
                            </div>
                        )}
                        {shippingSizeLabel && (
                            <div className="absolute top-4 right-4 bg-foreground px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-wider">
                                {shippingSizeLabel}
                            </div>
                        )}
                    </motion.div>

                    {product.images && product.images.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {product.images.map((img: any, index: number) => (displayImage === img.imagePath) ? (
                                <div key={index} className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 border-2 border-foreground p-1 bg-white">
                                    <div className="relative w-full h-full overflow-hidden">
                                        <Image
                                            src={getImageUrl(img.imagePath)}
                                            alt={`View ${index + 1}`}
                                            fill
                                            className="object-contain p-1"
                                            sizes="96px"
                                            placeholder={img.blurDataURL ? 'blur' : 'empty'}
                                            blurDataURL={img.blurDataURL}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    key={index}
                                    onClick={() => setActiveImage(img.imagePath)}
                                    className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 border border-border hover:border-foreground transition-colors bg-white p-1"
                                >
                                    <div className="relative w-full h-full overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                                        <Image
                                            src={getImageUrl(img.imagePath)}
                                            alt={`View ${index + 1}`}
                                            fill
                                            className="object-contain p-1"
                                            sizes="96px"
                                            placeholder={img.blurDataURL ? 'blur' : 'empty'}
                                            blurDataURL={img.blurDataURL}
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
                            {product.brand && (
                                <>
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-900">
                                        {product.brand}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                </>
                            )}
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                {categoryName}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-[1.15] font-mitr">
                            {product.productName}
                        </h1>

                        <div className="flex items-baseline gap-4 mb-8">
                            <div className="text-4xl md:text-5xl font-bold text-brand font-mitr">
                                ฿{selectedVariant?.price.toLocaleString()}
                            </div>
                            {selectedStock > 0 ? (
                                <span className="text-xs font-bold text-gray-900 border border-border px-2.5 py-1 uppercase tracking-wider">
                                    มีสินค้า {selectedStock} ชิ้น
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-brand-foreground bg-brand px-2.5 py-1 uppercase tracking-wider">
                                    สินค้าหมด
                                </span>
                            )}
                        </div>

                    </div>

                    {/* Variants */}
                    {variants.length > 1 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">รูปแบบสินค้า</h3>
                                {selectedVariant && (
                                    <span className="text-xs font-bold text-gray-600">{getVariantLabel(selectedVariant)}</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {variants.map((variant: any) => {
                                    const oos = isVariantOOS(variant);
                                    return (
                                        <button
                                            key={variant._id}
                                            onClick={() => {
                                                if (oos) return;
                                                setSelectedVariantId(variant._id);
                                                // จำนวนที่เลือกไว้ต้องไม่เกินสต็อกของ variant ใหม่
                                                setQuantity(q => Math.min(q, variant.stock ?? variant.stockAvailable ?? 1));
                                            }}
                                            disabled={oos}
                                            aria-pressed={selectedVariant?._id === variant._id}
                                            className={`px-5 py-2.5 border text-xs font-bold transition-colors ${selectedVariant?._id === variant._id
                                                ? 'border-foreground bg-foreground text-white'
                                                : oos
                                                    ? 'border-border bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                                    : 'border-border bg-white text-gray-600 hover:border-foreground'
                                                }`}
                                        >
                                            {getVariantLabel(variant)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Add to Cart */}
                    <div className="space-y-4 hidden lg:block">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">จำนวน</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border border-border p-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="ลดจำนวน"
                                    className="h-10 w-10"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 text-center font-bold text-gray-900" aria-live="polite">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="เพิ่มจำนวน"
                                    className="h-10 w-10 disabled:opacity-30"
                                    onClick={() => setQuantity(Math.min(selectedStock || 1, quantity + 1))}
                                    disabled={quantity >= (selectedStock || 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button
                                size="lg"
                                className="flex-1 h-14 text-base uppercase tracking-wide"
                                onClick={handleAddToCart}
                                disabled={!selectedVariant || selectedStock <= 0 || addToCart.isPending}
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {addToCart.isPending ? 'กำลังเพิ่ม...' : 'เพิ่มลงรถเข็น'}
                            </Button>
                        </div>
                    </div>

                    {/* Key Attributes */}
                    <div className="mt-10 border border-border overflow-hidden divide-y divide-border">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/50">
                            <Layers className="h-4 w-4 text-foreground flex-shrink-0" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-1">ขนาดพัสดุ</span>
                            <span className="text-xs font-black text-gray-900">{shippingSizeLabel}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL WIDTH DESCRIPTION SECTION */}
            <div className="mt-20 border-t border-border pt-16">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-3">Product Details</h2>
                        <h3 className="text-3xl font-bold text-gray-900 font-mitr">รายละเอียดสินค้า</h3>
                    </div>

                    <div className="prose prose-lg prose-gray max-w-none">
                        <div className="bg-white p-8 md:p-12 border border-border relative overflow-hidden group">
                            <div className="text-gray-600 leading-[1.8] font-medium text-base line-clamp-4 overflow-hidden">
                                {product.description || 'ไม่มีข้อมูลรายละเอียดสำหรับสินค้านี้'}
                            </div>
                            <div className="mt-12 flex justify-center">
                                <Button
                                    variant="outline"
                                    className="px-8 border-foreground text-gray-900 hover:bg-foreground hover:text-white transition-colors uppercase tracking-widest text-xs h-12"
                                    onClick={() => setIsDescriptionOpen(true)}
                                >
                                    รายละเอียดทั้งหมด
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related products — same category */}
            <RelatedProducts
                categoryId={product.categoryId}
                currentProductId={product._id}
                categorySlug={category?.slug}
                categoryName={category?.name}
            />

                {/* Mobile Sticky Action Bar - REFINED */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border lg:hidden z-40 safe-area-bottom">
                    <div className="flex gap-3 max-w-lg mx-auto">
                        <div className="flex items-center border border-border px-1 py-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="ลดจำนวน"
                                className="h-10 w-10"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-gray-900" aria-live="polite">{quantity}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="เพิ่มจำนวน"
                                className="h-10 w-10 disabled:opacity-30"
                                onClick={() => setQuantity(Math.min(selectedStock || 1, quantity + 1))}
                                disabled={quantity >= (selectedStock || 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            className="flex-1 h-12 text-sm uppercase tracking-wide"
                            onClick={handleAddToCart}
                            disabled={!selectedVariant || selectedStock <= 0 || addToCart.isPending}
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
                            role="dialog"
                            aria-modal="true"
                            aria-label="ดูรูปสินค้าแบบเต็มจอ"
                        >
                            <button
                                className="absolute top-6 right-6 text-gray-900/50 hover:text-gray-900 transition-colors bg-gray-100 p-3 z-10"
                                onClick={() => setFullScreenImage(null)}
                                aria-label="ปิดรูปเต็มจอ"
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
                            role="dialog"
                            aria-modal="true"
                            aria-label="รายละเอียดสินค้าทั้งหมด"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 24 }}
                                className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 border-b border-border flex items-center justify-between bg-gray-50/50">
                                    <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">รายละเอียดสินค้า</h3>
                                    <Button variant="ghost" size="icon" onClick={() => setIsDescriptionOpen(false)} aria-label="ปิดรายละเอียดสินค้า">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                                    <div className="prose prose-lg text-gray-700 max-w-none leading-relaxed whitespace-pre-wrap font-medium">
                                        {product.description || 'ไม่มีข้อมูลรายละเอียดสำหรับสินค้านี้'}
                                    </div>
                                </div>
                                <div className="p-6 border-t border-border bg-gray-50/50 text-center">
                                    <Button onClick={() => setIsDescriptionOpen(false)} className="px-8">
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
