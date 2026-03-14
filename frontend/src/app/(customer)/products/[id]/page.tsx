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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                {/* Image Gallery - POWERFUL DISPLAY */}
                <div className="space-y-6">
                    <motion.div
                        layoutId={`product-image-${product._id}`}
                        className="aspect-square bg-gray-50 rounded-[2.5rem] overflow-hidden relative border-2 border-transparent hover:border-gray-200 transition-colors shadow-inner"
                        onClick={() => displayImage && setFullScreenImage(displayImage)}
                    >
                        {displayImage ? (
                            <Image
                                src={getImageUrl(displayImage)}
                                alt={product.productName}
                                fill
                                className="object-cover object-center transition-transform duration-700 ease-out"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <span className="text-sm font-bold uppercase tracking-widest">No Image</span>
                            </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                            {shippingSizeLabel}
                        </div>
                    </motion.div>

                    {product.images && product.images.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pt-4 pb-2 scrollbar-hide px-1 border-t border-gray-50">
                            {product.images.map((img: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveImage(img.imagePath)}
                                    className={`relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${(displayImage === img.imagePath)
                                        ? 'border-primary ring-2 ring-primary/20 bg-white'
                                        : 'border-transparent opacity-60 hover:opacity-100 bg-gray-50'
                                        }`}
                                >
                                    <Image
                                        src={getImageUrl(img.imagePath)}
                                        alt={`View ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                        unoptimized
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info - CLEAN & BOLD */}
                <div className="flex flex-col">
                    <div className="mb-8 border-b border-gray-100 pb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                                {product.brand || 'Brand'}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-widest">
                                {categoryName}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
                            {product.productName}
                        </h1>
                        <div className="flex items-end gap-4">
                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600 font-kanit">
                                ฿{selectedVariant?.price.toLocaleString()}
                            </div>
                            {(selectedVariant?.stock ?? 0) > 0 ? (
                                <div className="mb-2 flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    In Stock
                                </div>
                            ) : (
                                <div className="mb-2 text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full text-sm">
                                    Out of Stock
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Variants */}
                    {variants.length > 1 && (
                        <div className="mb-8">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">Select Option</h3>
                            <div className="flex flex-wrap gap-3">
                                {variants.map((variant: any) => (
                                    <button
                                        key={variant._id}
                                        onClick={() => setSelectedVariantId(variant._id)}
                                        className={`px-6 py-3 rounded-xl border-2 font-bold text-sm transition-all ${selectedVariant?._id === variant._id
                                            ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {variant.sku}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Desktop Actions */}
                    <div className="mb-10 hidden lg:block">
                        <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <div className="flex items-center gap-3 bg-white rounded-full p-1.5 border border-gray-200">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full hover:bg-gray-100"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full hover:bg-gray-100"
                                    onClick={() => setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button
                                size="lg"
                                className="flex-1 h-14 rounded-full text-lg font-bold shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 transition-all hover:-translate-y-1 bg-gray-900 text-white hover:bg-black"
                                onClick={handleAddToCart}
                                disabled={!selectedVariant || (selectedVariant?.stock ?? 0) <= 0 || addToCart.isPending}
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 rounded-3xl p-6 lg:p-8 border border-gray-100 mt-8 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">รายละเอียดสินค้า</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary font-bold hover:bg-primary/5 rounded-full"
                                onClick={() => setIsDescriptionOpen(true)}
                            >
                                ขยายดูทั้งหมด
                            </Button>
                        </div>
                        <div className="prose prose-lg text-gray-600 max-w-none leading-relaxed line-clamp-4 whitespace-pre-wrap italic">
                            {product.description || 'ไม่มีข้อมูลรายละเอียดสำหรับสินค้านี้'}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-50/80 to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Mobile Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 lg:hidden z-40 safe-area-bottom">
                    <div className="flex gap-4 max-w-lg mx-auto">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-lg"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold">{quantity}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-lg"
                                onClick={() => setQuantity(Math.min(selectedVariant?.stock || 1, quantity + 1))}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            className="flex-1 h-12 rounded-xl font-bold text-base shadow-lg bg-gray-900 text-white hover:bg-black shadow-gray-900/20"
                            onClick={handleAddToCart}
                            disabled={!selectedVariant || (selectedVariant?.stock ?? 0) <= 0 || addToCart.isPending}
                        >
                            Add to Cart
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
                            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
                            onClick={() => setFullScreenImage(null)}
                        >
                            <button
                                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 p-3 rounded-full backdrop-blur-md z-10"
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
                                className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
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
        </div>
    );
}
