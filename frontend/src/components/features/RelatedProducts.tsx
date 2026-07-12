'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import ProductCard from '@/components/features/ProductCard';

interface RelatedProductsProps {
    categoryId: number;
    currentProductId: string;
    categorySlug?: string;
    categoryName?: string;
}

const MAX_ITEMS = 8;

const hasStock = (p: any) => p.variants?.some((v: any) => (v.stockAvailable ?? v.stock ?? 0) > 0);

export default function RelatedProducts({ categoryId, currentProductId, categorySlug, categoryName }: RelatedProductsProps) {
    const { data: products } = useQuery({
        queryKey: ['related-products', categoryId, currentProductId],
        queryFn: async () => {
            // ขอเผื่อ 1 ชิ้นเพราะตัวที่กำลังดูอยู่จะถูกตัดออก
            const response = await api.get('/products', { params: { categoryId, limit: MAX_ITEMS + 1 } });
            const items = (response.data.data || []).filter((p: any) => p._id !== currentProductId);
            // ของมีสต็อกขึ้นก่อน (sort เป็น stable — ลำดับเดิมภายในกลุ่มคงไว้)
            items.sort((a: any, b: any) => Number(hasStock(b)) - Number(hasStock(a)));
            return items.slice(0, MAX_ITEMS);
        },
        enabled: !!categoryId,
        staleTime: 5 * 60_000,
    });

    if (!products || products.length === 0) return null;

    return (
        <section className="mt-20 border-t border-gray-100 pt-16" aria-label="สินค้าที่คุณอาจสนใจ">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-3">You May Also Like</h2>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-mitr">
                        สินค้าที่คุณอาจสนใจ
                        {categoryName && (
                            <span className="ml-3 text-sm font-bold text-gray-400 align-middle">ในหมวด {categoryName}</span>
                        )}
                    </h3>
                </div>
                <Link
                    href={categorySlug ? `/products?category=${categorySlug}` : '/products'}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-primary transition-colors group flex-shrink-0 pb-1"
                >
                    ดูทั้งหมด
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* แถบเลื่อนแนวนอน: -mx-4 px-4 ให้การ์ดขอบจอไม่โดนตัดเงา และเลื่อนชนขอบ container พอดี */}
            <div className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-4">
                {products.map((product: any) => (
                    <div key={product._id} className="w-[220px] sm:w-[250px] flex-shrink-0 snap-start">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>

            <div className="mt-2 flex justify-center sm:hidden">
                <Link
                    href={categorySlug ? `/products?category=${categorySlug}` : '/products'}
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-600"
                >
                    ดูทั้งหมด
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </section>
    );
}
