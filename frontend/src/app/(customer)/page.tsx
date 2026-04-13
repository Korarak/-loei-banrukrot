'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Package, Zap, Star, ShieldCheck,
    ChevronRight, ChevronLeft,
    Search, Phone, MapPin, Facebook,
    ShoppingCart, CheckCircle, Truck, Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { getImageUrl } from '@/lib/utils';
import ProductCard from '@/components/features/ProductCard';
import { siteConfig } from '@/config/site';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

// ─── Animated Counter ───────────────────────────────────────────────────────
function useCounter(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const hasStarted = useRef(false);

    useEffect(() => {
        if (end === 0) return; // wait for real data
        if (!isInView) return;
        if (hasStarted.current) return;
        hasStarted.current = true;

        const startTime = performance.now();
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isInView, end, duration]);

    return { count, ref };
}

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

// ─── LINE Icon ───────────────────────────────────────────────────────────────
function LineIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
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
    });

    const { data: popularProducts, isLoading: popularLoading } = useQuery({
        queryKey: ['homepage-popular-products'],
        queryFn: async () => {
            const { data } = await api.get('/products/popular?limit=8');
            return data.data as any[];
        },
    });

    const { data: publicStats } = useQuery({
        queryKey: ['public-stats'],
        queryFn: async () => {
            const { data } = await api.get('/public-stats');
            return data.data as { productCount: number; customerCount: number };
        },
        staleTime: 5 * 60 * 1000, // 5 min cache
    });

    // ── Counters (called at top level — not in a loop) ───────────────────────
    const counter0 = useCounter(publicStats?.productCount ?? 0, 2000);
    const counter1 = useCounter(publicStats?.customerCount ?? 0, 2000);
    const counter2 = useCounter(2020, 1500);
    const counter3 = useCounter(99, 2000);

    const counters = [counter0, counter1, counter2, counter3];
    const statDefs = [
        { label: 'สินค้าพร้อมส่ง', suffix: '+', isYear: false },
        { label: 'ลูกค้าไว้ใจ', suffix: '+', isYear: false },
        { label: 'ปีที่เริ่มดำเนินการ', suffix: '', isYear: true },
        { label: 'ความพึงพอใจ', suffix: '%', isYear: false },
    ];

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

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative bg-gradient-to-br from-primary via-emerald-900 to-black text-white rounded-[2rem] overflow-hidden shadow-2xl min-h-[700px] flex items-center pb-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-breathe" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-breathe" style={{ animationDelay: '2s' }} />
                <div className="absolute top-20 right-20 w-24 h-24 border-2 border-white/10 rounded-2xl animate-float rotate-12" />
                <div className="absolute bottom-32 right-40 w-16 h-16 border-2 border-accent/20 rounded-full animate-float-reverse" />
                <div className="absolute top-40 left-[60%] w-8 h-8 bg-accent/10 rounded-lg animate-float-slow rotate-45" />
                <div className="absolute bottom-20 left-20 w-20 h-20 border border-white/5 rounded-3xl animate-spin-slow" />

                <div className="relative container mx-auto px-8 md:px-12 py-20 flex flex-col md:flex-row items-center gap-12">
                    <motion.div
                        className="flex-1 relative z-10 text-center md:text-left"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent font-bold text-sm uppercase tracking-widest mb-8 shadow-glow">
                            <Zap className="h-4 w-4 fill-accent" />
                            Vespa Specialist & Oat Engineering
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter leading-[1.1] drop-shadow-lg">
                            {siteConfig.brand.name} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-500 italic pr-4">
                                {siteConfig.brand.englishName}
                            </span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-xl md:text-2xl mb-8 text-gray-200 font-medium max-w-2xl leading-relaxed">
                            ศูนย์รวมอะไหล่และบริการ Vespa ครบวงจร โดย{' '}
                            <span className="text-accent font-bold">ช่างโอ๊ต (Oat Engineering)</span>{' '}
                            สำหรับคนรักเวสป้าเมืองเลย
                        </motion.p>

                        {/* Search bar */}
                        <motion.form variants={fadeInUp} onSubmit={handleHeroSearch} className="flex gap-2 mb-8 max-w-lg mx-auto md:mx-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                <Input
                                    value={heroSearch}
                                    onChange={e => setHeroSearch(e.target.value)}
                                    placeholder="ค้นหาอะไหล่ Vespa..."
                                    className="pl-11 h-14 rounded-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-base focus-visible:ring-accent focus-visible:border-accent backdrop-blur-sm"
                                />
                            </div>
                            <Button type="submit" size="lg" className="h-14 px-6 rounded-full bg-accent border-0 hover:bg-accent/90 shadow-[0_0_20px_rgba(236,72,153,0.5)] font-bold shrink-0">
                                ค้นหา
                            </Button>
                        </motion.form>

                        <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <Button size="lg" asChild className="bg-white text-primary hover:bg-gray-100 border-0 rounded-full px-8 h-14 text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-lg">
                                <Link href="/products">
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    ช้อปเลย
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="bg-black/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-black rounded-full px-8 h-14 text-lg font-bold transition-all hover:scale-105">
                                <Link href="/products">
                                    ดูสินค้าทั้งหมด
                                    <ChevronRight className="ml-1 h-5 w-5" />
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Logo */}
                    <motion.div
                        className="flex-1 relative flex justify-center items-center"
                        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    >
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-[100px] animate-breathe" />
                        <div className="relative group perspective-1000">
                            <motion.div
                                className="relative bg-white/5 backdrop-blur-sm p-4 rounded-[3rem] border border-white/10 shadow-3xl card-hover-lift animate-float"
                                whileHover={{ rotateY: 15, rotateX: -5, scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-[450px] lg:h-[450px] rounded-[2.5rem] overflow-hidden gold-glow">
                                    <Image src="/logo.png" alt="Banrakrod Logo" fill className="object-contain p-4 transition-transform duration-700 group-hover:scale-110" priority />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </div>
                            </motion.div>
                            <motion.div
                                className="absolute -top-10 -right-10 w-20 h-20 bg-accent/20 backdrop-blur-md rounded-2xl flex items-center justify-center animate-float-reverse border border-white/20 z-20"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            >
                                <Zap className="h-10 w-10 text-accent animate-pulse" />
                            </motion.div>
                            <motion.div className="absolute -bottom-12 -left-8 w-24 h-24 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center animate-float border border-white/10 z-20">
                                <ShieldCheck className="h-12 w-12 text-primary" />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <section className="container mx-auto px-4 -mt-14 relative z-10">
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    {statDefs.map((stat, i) => (
                        <motion.div key={i} ref={counters[i].ref} variants={scaleIn}
                            className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-200 text-center card-hover-lift"
                        >
                            <div className="text-3xl md:text-4xl font-black text-emerald-600 mb-1">
                                {stat.isYear ? counters[i].count : counters[i].count.toLocaleString()}{stat.suffix}
                            </div>
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ── Categories ────────────────────────────────────────────────── */}
            <section className="container mx-auto px-4 mt-24">
                <motion.div
                    className="flex items-end justify-between mb-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeInUp}
                >
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">หมวดหมู่ <span className="text-primary">สินค้า</span></h2>
                        <div className="h-2 w-24 bg-accent rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex md:hidden gap-2">
                            <Button size="icon" variant="outline" onClick={() => scroll(catScrollRef, 'left')} className="h-10 w-10 rounded-lg border-2 border-gray-100 bg-white/80 backdrop-blur-sm -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-sm" aria-label="เลื่อนซ้าย">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button size="icon" onClick={() => scroll(catScrollRef, 'right')} className="h-10 w-10 rounded-lg bg-gradient-to-r from-accent to-pink-500 text-white border-none -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-lg shadow-accent/20" aria-label="เลื่อนขวา">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                        <Link href="/products" className="flex items-center text-lg font-bold text-gray-500 hover:text-accent transition-colors group">
                            ดูทุกหมวดหมู่
                            <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    ref={catScrollRef}
                    className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide"
                    initial="hidden"
                    animate={categoriesLoading ? 'hidden' : 'visible'}
                    variants={staggerContainer}
                >
                    {categoriesLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-[280px] w-[240px] md:w-auto flex-shrink-0 snap-start rounded-[2rem] bg-gray-50 overflow-hidden p-8">
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <Skeleton className="h-20 w-20 rounded-[1.5rem]" />
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))
                        : (categories || []).slice(0, 4).map((category) => {
                            const catImage = category.imageUrl || category.sampleImage;
                            return (
                                <motion.div key={category._id} variants={fadeInUp} className="w-[240px] md:w-auto flex-shrink-0 md:flex-shrink snap-start">
                                    <Link href={`/products?categoryId=${category.categoryId}`} className="group block h-full">
                                        <Card className="h-full border border-gray-200/60 bg-gray-50 hover:bg-white shadow-none hover:shadow-xl hover:border-gray-200 transition-all duration-500 rounded-[2rem] overflow-hidden relative card-hover-lift">
                                            {catImage && (
                                                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 scale-110 group-hover:scale-125">
                                                    <img src={getImageUrl(catImage)} alt={category.name} className="w-full h-full object-cover grayscale" />
                                                </div>
                                            )}
                                            <div className="p-8 text-center pt-10 relative z-10 flex flex-col h-full">
                                                <div className="h-20 w-20 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-glow transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 border border-gray-50">
                                                    {catImage
                                                        ? <img src={getImageUrl(catImage)} alt={category.name} className="w-14 h-14 object-cover rounded-xl" />
                                                        : <Package className="h-10 w-10 text-primary" />
                                                    }
                                                </div>
                                                <CardTitle className="text-xl font-black mb-3 text-gray-800 group-hover:text-primary transition-colors line-clamp-1 uppercase tracking-tight">{category.name}</CardTitle>
                                                <CardDescription className="text-sm text-gray-400 group-hover:text-gray-600 font-medium italic">
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
            <section className="container mx-auto px-4 mt-24">
                <motion.div
                    className="flex items-end justify-between mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeInUp}
                >
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
                            สินค้า <span className="text-primary">ขายดี</span>
                        </h2>
                        <div className="h-2 w-24 bg-primary rounded-full" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex md:hidden gap-2">
                            <Button size="icon" variant="outline" onClick={() => scroll(popScrollRef, 'left')} className="h-10 w-10 rounded-lg border-2 border-gray-100 bg-white/80 backdrop-blur-sm -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-sm" aria-label="เลื่อนซ้าย">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button size="icon" onClick={() => scroll(popScrollRef, 'right')} className="h-10 w-10 rounded-lg bg-gradient-to-r from-primary to-emerald-600 text-white border-none -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-lg shadow-primary/20" aria-label="เลื่อนขวา">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                        <Link href="/products" className="flex items-center text-lg font-bold text-gray-500 hover:text-primary transition-colors group">
                            ดูสินค้าทั้งหมด
                            <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    ref={popScrollRef}
                    className="flex lg:grid lg:grid-cols-4 gap-6 items-stretch overflow-x-auto lg:overflow-visible pb-10 lg:pb-0 snap-x snap-mandatory scrollbar-hide px-4 md:px-0"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    {popularLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="w-[240px] sm:w-[300px] lg:w-auto flex-shrink-0 snap-start h-[400px]">
                                <Skeleton className="w-full h-full rounded-[2rem]" />
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
                                        <div className={`text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-lg uppercase tracking-widest ${
                                            idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                                        }`}>
                                            #{idx + 1} ขายดี
                                        </div>
                                    </div>
                                )}
                                <ProductCard product={product} />
                            </motion.div>
                        ))
                    }
                </motion.div>
            </section>

            {/* ── New Arrivals ──────────────────────────────────────────────── */}
            {(newProducts && newProducts.length > 0 || newProductsLoading) && (
                <section className="container mx-auto px-4 mt-24">
                    <motion.div
                        className="flex items-end justify-between mb-12"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={fadeInUp}
                    >
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
                                สินค้า <span className="text-rose-500">มาใหม่</span>
                            </h2>
                            <div className="h-2 w-24 bg-accent rounded-full" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex md:hidden gap-2">
                                <Button size="icon" variant="outline" onClick={() => scroll(newScrollRef, 'left')} className="h-10 w-10 rounded-lg border-2 border-gray-100 bg-white/80 backdrop-blur-sm -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-sm" aria-label="เลื่อนซ้าย">
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button size="icon" onClick={() => scroll(newScrollRef, 'right')} className="h-10 w-10 rounded-lg bg-gradient-to-r from-accent to-pink-500 text-white border-none -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-lg shadow-accent/20" aria-label="เลื่อนขวา">
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                            <Link href="/products" className="flex items-center text-lg font-bold text-gray-500 hover:text-accent transition-colors group">
                                ดูสินค้าทั้งหมด
                                <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        ref={newScrollRef}
                        className="flex lg:grid lg:grid-cols-4 gap-6 items-stretch overflow-x-auto lg:overflow-visible pb-10 lg:pb-0 snap-x snap-mandatory scrollbar-hide px-4 md:px-0"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={staggerContainer}
                    >
                        {newProductsLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="w-[240px] sm:w-[300px] lg:w-auto flex-shrink-0 snap-start h-[400px]">
                                    <Skeleton className="w-full h-full rounded-[2rem]" />
                                </div>
                            ))
                            : (newProducts || []).filter(p => p.isActive && p.isOnline).slice(0, 8).map((product) => (
                                <motion.div
                                    key={product._id}
                                    variants={fadeInUp}
                                    className="relative w-[240px] sm:w-[300px] lg:w-auto lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink h-full"
                                >
                                    <div className="absolute top-3 left-3 z-30 pointer-events-none">
                                        <div className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-lg animate-pulse uppercase tracking-widest">
                                            New
                                        </div>
                                    </div>
                                    <ProductCard product={product} />
                                </motion.div>
                            ))
                        }
                    </motion.div>
                </section>
            )}

            {/* ── Why Choose Us ─────────────────────────────────────────────── */}
            <section className="bg-zinc-950 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden mx-4 mt-24">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] animate-breathe" />
                <motion.div
                    className="relative z-10 container mx-auto"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp} className="inline-block px-4 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-gray-300 text-sm font-bold uppercase tracking-widest mb-6">
                        Why Choose Banrakrod Loei
                    </motion.div>
                    <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-black mb-16 text-white">
                        WORLD CLASS <span className="text-primary italic">STANDARD</span>
                    </motion.h2>
                    <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-12" variants={staggerContainer}>
                        {[
                            { icon: ShieldCheck, title: 'Authentic 100%', desc: 'มั่นใจได้ในคุณภาพ สินค้าแท้และเกรดพรีเมียมจากผู้ผลิตชั้นนำเท่านั้น', gradient: 'from-primary to-emerald-600', shadow: 'shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)]' },
                            { icon: Zap, title: 'Fast & Secure', desc: 'จัดส่งรวดเร็วทั่วประเทศ แพ็คสินค้าอย่างดี ปลอดภัยหายห่วง', gradient: 'from-accent to-pink-600', shadow: 'shadow-[0_10px_30px_-10px_rgba(236,72,153,0.5)]' },
                            { icon: Star, title: 'Expert Support', desc: 'ทีมงานมืออาชีพพร้อมให้คำปรึกษา ทุกปัญหาเรื่องเวสป้าเราช่วยได้', gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)]' },
                        ].map((feature, i) => (
                            <motion.div key={i} variants={scaleIn} className="text-center group p-8 rounded-3xl transition-all hover:bg-white/5">
                                <div className={`bg-gradient-to-br ${feature.gradient} rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-8 ${feature.shadow} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                    <feature.icon className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-lg">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ── How to Order ──────────────────────────────────────────────── */}
            <section className="container mx-auto px-4 mt-24">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp} className="text-center mb-14">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
                            วิธี <span className="text-primary">สั่งซื้อ</span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto">ง่าย เร็ว ส่งถึงบ้าน ใน 4 ขั้นตอน</p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { step: '01', icon: Search, title: 'เลือกสินค้า', desc: 'ค้นหาและเลือกอะไหล่ที่ต้องการ กรองตามหมวดหมู่หรือรุ่นรถ', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-100' },
                            { step: '02', icon: ShoppingCart, title: 'ใส่ตะกร้า', desc: 'เพิ่มสินค้าลงตะกร้า เลือกตัวเลือกและจำนวนตามต้องการ', color: 'from-accent to-pink-600', shadow: 'shadow-pink-100' },
                            { step: '03', icon: CheckCircle, title: 'ยืนยันคำสั่งซื้อ', desc: 'ระบุที่อยู่จัดส่ง เลือกวิธีส่ง และชำระเงินผ่าน QR Code', color: 'from-primary to-emerald-600', shadow: 'shadow-emerald-100' },
                            { step: '04', icon: Truck, title: 'รอรับสินค้า', desc: 'เราแพ็คและส่งสินค้าภายใน 1-2 วันทำการหลังยืนยันการชำระ', color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-100' },
                        ].map((item, i) => (
                            <motion.div key={i} variants={fadeInUp} className="relative bg-white rounded-3xl p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 group card-hover-lift overflow-hidden">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                        <item.icon className="h-7 w-7 text-white" />
                                    </div>
                                    <span className="text-5xl font-black text-gray-100 group-hover:text-gray-200 transition-colors leading-none">{item.step}</span>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
                                {i < 3 && (
                                    <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow items-center justify-center">
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <motion.div variants={fadeInUp} className="text-center mt-10">
                        <Button size="lg" asChild className="rounded-full px-10 h-14 text-lg font-bold bg-gradient-to-r from-primary to-emerald-600 border-0 shadow-lg shadow-primary/30 hover:brightness-110 hover:scale-105 transition-all">
                            <Link href="/products">
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                เริ่มช้อปเลย
                            </Link>
                        </Button>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── Contact & Social ──────────────────────────────────────────── */}
            <section className="container mx-auto px-4 mt-24 mb-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={staggerContainer}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-[3rem] p-10 md:p-16 overflow-hidden relative"
                >
                    {/* Background deco */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        {/* Info */}
                        <motion.div variants={fadeInUp}>
                            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest mb-6">
                                ติดต่อเรา
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 leading-tight">
                                พร้อมให้คำปรึกษา<br />
                                <span className="text-primary">ทุกวัน ทุกเวลา</span>
                            </h2>

                            <div className="space-y-4 mb-8">
                                {contact.items.filter(i => i.type === 'phone').map((item, i) => (
                                    <a key={i} href={`tel:${item.value?.replace(/-/g, '')}`}
                                        className="flex items-center gap-4 group hover:text-primary transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                                            <Phone className="h-5 w-5 text-primary group-hover:text-white" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</div>
                                            <div className="text-lg font-black text-gray-800 group-hover:text-primary transition-colors">{item.value}</div>
                                        </div>
                                    </a>
                                ))}

                                {contact.items.filter(i => i.type === 'address').map((item, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <MapPin className="h-5 w-5 text-accent" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ที่อยู่ร้าน</div>
                                            <div className="text-sm text-gray-700 leading-relaxed">{item.value}</div>
                                            {contact.items.filter(i => i.type === 'maps').map((m, mi) => (
                                                <a key={mi} href={m.href} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-1"
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
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">ติดตามเราได้ที่</p>
                                <div className="flex gap-3 flex-wrap">
                                    {contact.social.facebook && (
                                        <a href={contact.social.facebook} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Facebook className="h-5 w-5" />
                                            Facebook
                                        </a>
                                    )}
                                    {contact.social.tiktok && (
                                        <a href={contact.social.tiktok} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                        >
                                            <TikTokIcon className="h-5 w-5" />
                                            TikTok
                                        </a>
                                    )}
                                    {contact.social.line && (
                                        <a href={contact.social.line} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-50 hover:bg-green-100 text-green-600 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                        >
                                            <LineIcon className="h-5 w-5" />
                                            LINE
                                        </a>
                                    )}
                                    {contact.social.youtube && (
                                        <a href={contact.social.youtube} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition-all hover:scale-105 active:scale-95"
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
                                    className="group rounded-3xl overflow-hidden shadow-2xl border border-gray-200 aspect-[4/3] md:aspect-auto md:h-[420px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 hover:from-primary/10 hover:to-emerald-100 transition-all duration-500 relative"
                                >
                                    {/* Road/grid pattern background */}
                                    <div className="absolute inset-0 opacity-10"
                                        style={{ backgroundImage: 'repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#000 0,#000 1px,transparent 0,transparent 50%)', backgroundSize: '40px 40px' }}
                                    />
                                    <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
                                        <div className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                            <MapPin className="h-10 w-10 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xl text-gray-800 mb-1">ร้านบ้านรักรถ</p>
                                            <p className="text-sm text-gray-600 max-w-[240px] leading-relaxed">
                                                {contact.items.find(i => i.type === 'address')?.value}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm group-hover:bg-primary/90 transition-colors shadow-lg">
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
