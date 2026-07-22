'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Package, Zap, ShieldCheck,
    ChevronRight, ChevronLeft,
    Search, MapPin, Facebook,
    ShoppingCart, CheckCircle, Truck, Headphones,
    Wrench, QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';
import ProductCard from '@/components/features/ProductCard';
import { siteConfig } from '@/config/site';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

// ─── TikTok Icon (not in lucide) ────────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.84 1.55V6.8a4.85 4.85 0 0 1-1.07-.11z" />
        </svg>
    );
}

// ─── Facebook Icon (brand-colored badge, not outline) ────────────────────────
function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#1877F2" />
            <path d="M16.55 12.2h-2.2v7.6h-3.1v-7.6H9.65V9.55h1.6V7.98c0-1.62.87-3.13 3.4-3.13.97 0 1.87.11 2.11.16v2.45h-1.32c-.72 0-.94.31-.94.92v1.17h2.36l-.31 2.65z" fill="#fff" />
        </svg>
    );
}

export default function Home() {
    const router = useRouter();
    const [heroSearch, setHeroSearch] = useState('');

    const { data: categories, isLoading: categoriesLoading } = useCategories(true);

    const { data: newProducts, isLoading: newProductsLoading } = useQuery({
        queryKey: ['homepage-new-products'],
        queryFn: async () => {
            const { data } = await api.get('/products?limit=8&sort=newest');
            return data.data as any[];
        },
        staleTime: 5 * 60_000,
    });

    const { data: popularProducts, isLoading: popularLoading } = useQuery({
        queryKey: ['homepage-popular-products'],
        queryFn: async () => {
            const { data } = await api.get('/products/popular?limit=8');
            return data.data as any[];
        },
        staleTime: 5 * 60_000,
    });

    // ── Scroll refs ──────────────────────────────────────────────────────────
    const catScrollRef = useRef<HTMLDivElement>(null);
    const newScrollRef = useRef<HTMLDivElement>(null);
    const popScrollRef = useRef<HTMLDivElement>(null);

    const scroll = (ref: React.RefObject<HTMLDivElement>, dir: 'left' | 'right') => {
        if (!ref.current) return;
        const first = ref.current.querySelector(':scope > div') as HTMLElement;
        if (!first) return;
        ref.current.scrollBy({ left: dir === 'left' ? -(first.offsetWidth + 24) : (first.offsetWidth + 24), behavior: 'smooth' });
    };

    const handleHeroSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = heroSearch.trim();
        router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    };

    const { contact } = siteConfig.footerData;

    return (
        <div className="space-y-0 pb-10">

            {/* ── Hero — flat ink block, display type ───────────────────────── */}
            <section className="relative bg-zinc-950 text-white overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="relative container mx-auto px-6 md:px-12 pt-14 md:pt-20 pb-16 md:pb-24">
                    <motion.div
                        className="relative z-10 max-w-3xl mx-auto text-center"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 text-gray-400 font-bold text-[11px] md:text-xs uppercase tracking-[0.25em] mb-6">
                            <Zap className="h-3.5 w-3.5 text-brand fill-current" />
                            Vespa Specialist &amp; Oat Engineering
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="font-display uppercase leading-[0.95] tracking-tight text-5xl md:text-7xl mb-5">
                            Vespa Parts.
                            <br />
                            <span className="text-brand">Built</span> to Last.
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-base md:text-lg mb-8 text-gray-300 font-medium leading-relaxed">
                            {siteConfig.brand.name} — อะไหล่รถมอเตอร์ไซต์ Vespa, Lambretta, กรองน้ำมันเครื่อง, ชุดของเหลว
                            โดยช่างโอ๊ต (Oat Engineering)
                        </motion.p>

                        {/* Search bar */}
                        <motion.form variants={fadeInUp} onSubmit={handleHeroSearch} className="flex gap-2 mb-8 max-w-lg mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                <Input
                                    value={heroSearch}
                                    onChange={e => setHeroSearch(e.target.value)}
                                    placeholder="ค้นหาอะไหล่ Vespa..."
                                    className="pl-11 h-12 bg-transparent border-white/25 text-white placeholder:text-gray-500 text-base focus-visible:ring-white focus-visible:border-white"
                                />
                            </div>
                            <Button type="submit" className="h-12 px-6 bg-white text-zinc-950 hover:bg-gray-200 shrink-0">
                                ค้นหา
                            </Button>
                        </motion.form>

                        <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center">
                            <Button asChild className="bg-white text-zinc-950 hover:bg-gray-200 px-7 has-[>svg]:px-7 h-12 text-base uppercase">
                                <Link href="/products">
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    ช้อปเลย
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="bg-transparent border border-white/40 text-white hover:bg-white hover:text-zinc-950 px-7 h-12 text-base">
                                <Link href="/products">
                                    ดูสินค้าทั้งหมด
                                    <ChevronRight className="ml-1 h-5 w-5" />
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── Trust bar ─────────────────────────────────────────────────── */}
            <section className="-mx-4 sm:-mx-6 lg:-mx-8 border-b border-border">
                <motion.div
                    className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-border"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    {[
                        { icon: ShieldCheck, title: 'สินค้าแท้ 100% - OEM เกรดพรีเมี่ยม', desc: '' },
                        { icon: Truck, title: 'ส่งไวทั่วไทย', desc: 'รับสินค้าใน 1-3 วันหลังจัดส่ง' },
                        { icon: Wrench, title: 'ปรึกษาช่างโอ๊ต', desc: 'ผู้เชี่ยวชาญ Vespa ตัวจริง' },
                        { icon: QrCode, title: 'จ่ายสะดวก ปลอดภัย', desc: 'ชำระผ่าน QR PromptPay' },
                    ].map((item, i) => (
                        <motion.div key={i} variants={fadeInUp}
                            className="flex flex-col items-center gap-2 text-center px-3 py-6 md:py-8"
                        >
                            <item.icon className="h-6 w-6 text-foreground" />
                            <div>
                                <div className="font-bold text-gray-900 text-xs md:text-sm">{item.title}</div>
                                <div className="hidden md:block text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ── Categories ────────────────────────────────────────────────── */}
            <section className="container mx-auto px-4 mt-20">
                <motion.div
                    className="flex items-end justify-between mb-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeInUp}
                >
                    <div>
                        <h2 className="font-display uppercase text-3xl md:text-4xl text-gray-900 leading-none mb-2">Shop by Category</h2>
                        <p className="text-sm font-bold text-muted-foreground">หมวดหมู่สินค้า</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex md:hidden gap-2">
                            <Button size="icon" variant="outline" onClick={() => scroll(catScrollRef, 'left')} className="h-10 w-10" aria-label="เลื่อนซ้าย">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button size="icon" onClick={() => scroll(catScrollRef, 'right')} className="h-10 w-10" aria-label="เลื่อนขวา">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                        <Link href="/products" className="hidden md:flex items-center text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 transition-colors group">
                            ดูทุกหมวดหมู่
                            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    ref={catScrollRef}
                    className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide"
                    initial="hidden"
                    animate={categoriesLoading ? 'hidden' : 'visible'}
                    variants={staggerContainer}
                >
                    {categoriesLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-[280px] w-[240px] md:w-auto flex-shrink-0 snap-start bg-gray-50 overflow-hidden p-8">
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <Skeleton className="h-20 w-20" />
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))
                        : (categories || []).slice(0, 4).map((category) => {
                            const catImage = category.imageUrl || category.sampleImage;
                            return (
                                <motion.div key={category._id} variants={fadeInUp} className="w-[240px] md:w-auto flex-shrink-0 md:flex-shrink snap-start">
                                    <Link href={`/products?category=${category.slug}`} className="group block h-full">
                                        <Card className="h-[280px] p-0 gap-0 border border-border hover:border-foreground transition-colors duration-300 overflow-hidden relative">
                                            {catImage
                                                ? <Image
                                                    src={getImageUrl(catImage)}
                                                    alt={category.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    sizes="240px"
                                                    priority
                                                    placeholder={category.blurDataURL ? 'blur' : 'empty'}
                                                    blurDataURL={category.blurDataURL}
                                                />
                                                : (
                                                    <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center">
                                                        <Package className="h-16 w-16 text-white/40" />
                                                    </div>
                                                )
                                            }
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                                                <CardTitle className="text-xl font-black mb-1 text-white line-clamp-1 uppercase tracking-tight">{category.name}</CardTitle>
                                                <CardDescription className="text-sm text-gray-200 font-medium line-clamp-1">
                                                    {category.description || 'Premium Specialist Parts'}
                                                </CardDescription>
                                            </div>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })
                    }
                </motion.div>
            </section>

            {/* ── Best Sellers ──────────────────────────────────────────────── */}
            <section className="container mx-auto px-4 mt-20">
                <motion.div
                    className="flex items-end justify-between mb-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeInUp}
                >
                    <div>
                        <h2 className="font-display uppercase text-3xl md:text-4xl text-gray-900 leading-none mb-2">Best Sellers</h2>
                        <p className="text-sm font-bold text-muted-foreground">สินค้าขายดี</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex md:hidden gap-2">
                            <Button size="icon" variant="outline" onClick={() => scroll(popScrollRef, 'left')} className="h-10 w-10" aria-label="เลื่อนซ้าย">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button size="icon" onClick={() => scroll(popScrollRef, 'right')} className="h-10 w-10" aria-label="เลื่อนขวา">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                        <Link href="/products" className="hidden md:flex items-center text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 transition-colors group">
                            ดูสินค้าทั้งหมด
                            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    ref={popScrollRef}
                    className="flex lg:grid lg:grid-cols-4 gap-4 items-stretch overflow-x-auto lg:overflow-visible pb-10 lg:pb-0 snap-x snap-mandatory scrollbar-hide px-4 md:px-0"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    {popularLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="w-[240px] sm:w-[300px] lg:w-auto flex-shrink-0 snap-start h-[400px]">
                                <Skeleton className="w-full h-full" />
                            </div>
                        ))
                        : (popularProducts || []).slice(0, 8).map((product, idx) => (
                            <motion.div
                                key={product._id}
                                variants={fadeInUp}
                                className="relative w-[240px] sm:w-[300px] lg:w-auto lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink h-full"
                            >
                                {idx < 3 && (
                                    <div className="absolute top-3 left-3 z-30 pointer-events-none">
                                        <div className="bg-foreground text-white font-display text-sm px-2.5 py-1 leading-none">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                    </div>
                                )}
                                <ProductCard product={product} priority={idx < 4} />
                            </motion.div>
                        ))
                    }
                </motion.div>
            </section>

            {/* ── New Arrivals ──────────────────────────────────────────────── */}
            {(newProducts && newProducts.length > 0 || newProductsLoading) && (
                <section className="container mx-auto px-4 mt-20">
                    <motion.div
                        className="flex items-end justify-between mb-8"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={fadeInUp}
                    >
                        <div>
                            <h2 className="font-display uppercase text-3xl md:text-4xl text-gray-900 leading-none mb-2">New Arrivals</h2>
                            <p className="text-sm font-bold text-muted-foreground">สินค้ามาใหม่</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex md:hidden gap-2">
                                <Button size="icon" variant="outline" onClick={() => scroll(newScrollRef, 'left')} className="h-10 w-10" aria-label="เลื่อนซ้าย">
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button size="icon" onClick={() => scroll(newScrollRef, 'right')} className="h-10 w-10" aria-label="เลื่อนขวา">
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                            <Link href="/products" className="hidden md:flex items-center text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 transition-colors group">
                                ดูสินค้าทั้งหมด
                                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        ref={newScrollRef}
                        className="flex lg:grid lg:grid-cols-4 gap-4 items-stretch overflow-x-auto lg:overflow-visible pb-10 lg:pb-0 snap-x snap-mandatory scrollbar-hide px-4 md:px-0"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={staggerContainer}
                    >
                        {newProductsLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="w-[240px] sm:w-[300px] lg:w-auto flex-shrink-0 snap-start h-[400px]">
                                    <Skeleton className="w-full h-full" />
                                </div>
                            ))
                            : (newProducts || []).filter(p => p.isActive && p.isOnline).slice(0, 8).map((product, idx) => (
                                <motion.div
                                    key={product._id}
                                    variants={fadeInUp}
                                    className="relative w-[240px] sm:w-[300px] lg:w-auto lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink h-full"
                                >
                                    <div className="absolute top-3 left-3 z-30 pointer-events-none">
                                        <div className="bg-brand text-brand-foreground text-[10px] font-black px-3 py-1 uppercase tracking-widest">
                                            New
                                        </div>
                                    </div>
                                    <ProductCard product={product} priority={idx < 4} />
                                </motion.div>
                            ))
                        }
                    </motion.div>
                </section>
            )}

            {/* ── Why Choose Us ─────────────────────────────────────────────── */}
            <section className="bg-zinc-950 p-10 md:p-20 relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 mt-20">
                <motion.div
                    className="relative z-10 container mx-auto"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp} className="text-center text-gray-400 text-[11px] md:text-xs font-bold uppercase tracking-[0.25em] mb-5">
                        Why Choose Banrakrod Loei
                    </motion.div>
                    <motion.h2 variants={fadeInUp} className="font-display uppercase leading-[0.95] text-4xl md:text-6xl mb-16 text-white text-center">
                        Vespa <span className="text-brand">Specialist</span>
                    </motion.h2>
                    <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" variants={staggerContainer}>
                        {[
                            {
                                num: '01',
                                icon: FacebookIcon,
                                iconColorful: true,
                                title: 'บริการซ่อมหน้าร้าน',
                                desc: 'ไม่ใช่แค่ขาย ทำจริง ใช้จริง นานกว่า 10 ปี',
                                fact: 'บ้านรักรถเมืองเลย',
                                href: siteConfig.footerData.contact.social.facebook,
                            },
                            {
                                num: '02',
                                icon: Wrench,
                                title: 'งานโรงกลึงเฉพาะทาง',
                                desc: 'กลึง ซ่อม ดัดแปลงอะไหล่ที่หาไม่ได้ในท้องตลาด งานเฉพาะทางที่ร้านอะไหล่ทั่วไปทำไม่ได้',
                                fact: 'Oat Engineering',
                            },
                            {
                                num: '03',
                                icon: MapPin,
                                title: 'ร้านจริง ที่จังหวัดเลย',
                                desc: '519/2 หมู่ 5 บ้านหนองผักก้าม ต.เมือง อ.เมือง จ.เลย — ดูของจริง ลองรถได้ก่อนตัดสินใจ',
                                fact: 'ดูแผนที่',
                                href: 'https://goo.gl/maps/Cbas3yCjPz6feeSPA',
                            },
                        ].map((item, i) => (
                            <motion.div key={i} variants={fadeInUp} className="border border-white/10 p-8 transition-colors hover:border-white/30">
                                <div className="flex items-start justify-between mb-6">
                                    <span className="font-display text-6xl leading-none text-white/10">{item.num}</span>
                                    <item.icon className={('iconColorful' in item && item.iconColorful) ? 'h-9 w-9 shadow-lg shadow-black/30' : 'h-6 w-6 text-brand'} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm mb-6">{item.desc}</p>
                                {item.href ? (
                                    <a
                                        href={item.href}
                                        target={item.href.startsWith('http') ? '_blank' : undefined}
                                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        className="inline-flex items-center gap-2 text-white font-bold uppercase tracking-wide text-sm hover:text-brand transition-colors"
                                    >
                                        {item.fact}
                                        <ChevronRight className="h-4 w-4" />
                                    </a>
                                ) : (
                                    <span className="text-white font-bold uppercase tracking-wide text-sm">{item.fact}</span>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ── How to Order ──────────────────────────────────────────────── */}
            <section className="container mx-auto px-4 mt-20">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp} className="text-center mb-12">
                        <h2 className="font-display uppercase text-3xl md:text-4xl text-gray-900 leading-none mb-3">
                            How to Order
                        </h2>
                        <p className="text-muted-foreground text-base max-w-xl mx-auto font-bold">วิธีสั่งซื้อ — ง่าย เร็ว ส่งถึงบ้าน ใน 4 ขั้นตอน</p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { step: '01', icon: Search, title: 'เลือกสินค้า', desc: 'ค้นหาและเลือกอะไหล่ที่ต้องการ กรองตามหมวดหมู่หรือรุ่นรถ' },
                            { step: '02', icon: ShoppingCart, title: 'ใส่ตะกร้า', desc: 'เพิ่มสินค้าลงตะกร้า เลือกตัวเลือกและจำนวนตามต้องการ' },
                            { step: '03', icon: CheckCircle, title: 'ยืนยันคำสั่งซื้อ', desc: 'ระบุที่อยู่จัดส่ง เลือกวิธีส่ง และชำระเงินผ่าน QR Code' },
                            { step: '04', icon: Truck, title: 'รอรับสินค้า', desc: 'ภายใน 1-3 วัน หลังยืนยันการชำระ' },
                        ].map((item, i) => (
                            <motion.div key={i} variants={fadeInUp} className="relative bg-white p-8 border border-border hover:border-foreground transition-colors duration-300 overflow-hidden">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-12 h-12 bg-foreground flex items-center justify-center">
                                        <item.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="font-display text-5xl text-gray-200 leading-none">{item.step}</span>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div variants={fadeInUp} className="text-center mt-10">
                        <Button size="lg" asChild className="px-10 h-14 text-base uppercase">
                            <Link href="/products">
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                เริ่มช้อปเลย
                            </Link>
                        </Button>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── Contact & Social ──────────────────────────────────────────── */}
            <section className="container mx-auto px-4 mt-20 mb-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={staggerContainer}
                    className="border border-border p-10 md:p-16 overflow-hidden relative"
                >
                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        {/* Info */}
                        <motion.div variants={fadeInUp}>
                            <div className="inline-block text-muted-foreground text-[11px] font-bold uppercase tracking-[0.25em] mb-5">
                                Contact Us
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
                                จัดส่งสินค้า<br />
                                จันทร์ - เสาร์
                            </h2>
                            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-brand/10 border border-brand/30 text-brand font-bold text-sm">
                                <Truck className="h-4 w-4" />
                                ตัดรอบส่งของทุกวัน เวลา 10.00 น.
                            </div>

                            <div className="space-y-4 mb-8">
                                {contact.items.filter(i => i.type === 'address').map((item, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-12 h-12 border border-border flex items-center justify-center shrink-0 mt-0.5">
                                            <MapPin className="h-5 w-5 text-foreground" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ที่อยู่ร้าน</div>
                                            <div className="text-sm text-gray-700 leading-relaxed">{item.value}</div>
                                            {contact.items.filter(i => i.type === 'maps').map((m, mi) => (
                                                <a key={mi} href={m.href} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-foreground underline underline-offset-4 mt-1"
                                                >
                                                    <MapPin className="h-3 w-3" />
                                                    ดูแผนที่ Google Maps
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">ติดตามเราได้ที่</p>
                                <div className="flex gap-3 flex-wrap">
                                    {contact.social.facebook && (
                                        <a href={contact.social.facebook} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 border border-border hover:border-foreground text-gray-800 font-bold text-sm transition-colors"
                                        >
                                            <Facebook className="h-5 w-5" />
                                            Facebook
                                        </a>
                                    )}
                                    {contact.social.tiktok && (
                                        <a href={contact.social.tiktok} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 border border-border hover:border-foreground text-gray-800 font-bold text-sm transition-colors"
                                        >
                                            <TikTokIcon className="h-5 w-5" />
                                            TikTok
                                        </a>
                                    )}
                                    {contact.social.youtube && (
                                        <a href={contact.social.youtube} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 border border-border hover:border-foreground text-gray-800 font-bold text-sm transition-colors"
                                        >
                                            <Headphones className="h-5 w-5" />
                                            YouTube
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Map card */}
                        {(() => {
                            const mapsItem = contact.items.find(i => i.type === 'maps');
                            return (
                                <motion.a
                                    variants={scaleIn}
                                    href={mapsItem?.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group overflow-hidden border border-border hover:border-foreground aspect-[4/3] md:aspect-auto md:h-[420px] flex flex-col items-center justify-center bg-gray-50 transition-colors duration-300 relative"
                                >
                                    {/* Road/grid pattern background */}
                                    <div className="absolute inset-0 opacity-10"
                                        style={{ backgroundImage: 'repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#000 0,#000 1px,transparent 0,transparent 50%)', backgroundSize: '40px 40px' }}
                                    />
                                    <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
                                        <div className="w-20 h-20 bg-white border border-border flex items-center justify-center">
                                            <MapPin className="h-10 w-10 text-brand" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xl text-gray-900 mb-1">ร้านบ้านรักรถเมืองเลย</p>
                                            <p className="text-sm text-gray-600 max-w-[240px] leading-relaxed">
                                                {contact.items.find(i => i.type === 'address')?.value}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-white font-bold text-sm uppercase tracking-wide group-hover:bg-black transition-colors">
                                            <MapPin className="h-4 w-4" />
                                            เปิดใน Google Maps
                                        </span>
                                    </div>
                                </motion.a>
                            );
                        })()}
                    </div>
                </motion.div>
            </section>

        </div>
    );
}
