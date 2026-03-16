'use client';

import Link from 'next/link';
import { Package, Wrench, Settings, ShoppingCart, Zap, Star, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { getImageUrl, cn } from '@/lib/utils';
import ProductCard from '@/components/features/ProductCard';
import { siteConfig } from '@/config/site';
import { Skeleton } from '@/components/ui/skeleton';

// Animated Counter Hook
function useCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const hasStarted = useRef(false);

    useEffect(() => {
        if (startOnView && !isInView) return;
        if (hasStarted.current) return;
        hasStarted.current = true;

        const startTime = performance.now();
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isInView, end, duration, startOnView]);

    return { count, ref };
}

// Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" as const } }
};


export default function Home() {
    const { data: products, isLoading: productsLoading } = useProducts();
    const { data: categories, isLoading: categoriesLoading } = useCategories(true);

    // Get 4 newest active products for the homepage
    const featuredProducts = (products || [])
        .filter(p => p.isActive && p.isOnline)
        .slice(0, 8); // Increased to 8 for a better carousel feel

    const scrollRef = useRef<HTMLDivElement>(null);
    const catScrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const firstCard = container.querySelector(':scope > div') as HTMLElement;
        if (!firstCard) return;

        const cardWidth = firstCard.offsetWidth;
        const gap = 24; // gap-6 = 24px
        const scrollAmount = cardWidth + gap;

        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const scrollCat = (direction: 'left' | 'right') => {
        if (!catScrollRef.current) return;
        const container = catScrollRef.current;
        const firstCard = container.querySelector(':scope > div') as HTMLElement;
        if (!firstCard) return;

        const cardWidth = firstCard.offsetWidth;
        const gap = 24;
        const scrollAmount = cardWidth + gap;

        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    return (
        <div className="space-y-0 pb-10 overflow-hidden">
            {/* Hero Section - POWERFUL & BOLD with Floating Shapes */}
            <section className="relative bg-gradient-to-br from-primary via-emerald-900 to-black text-white rounded-[2rem] overflow-hidden shadow-2xl min-h-[600px] flex items-center">
                {/* Floating Abstract Shapes */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-breathe"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-breathe" style={{ animationDelay: '2s' }}></div>

                {/* Floating geometric shapes */}
                <div className="absolute top-20 right-20 w-24 h-24 border-2 border-white/10 rounded-2xl animate-float rotate-12"></div>
                <div className="absolute bottom-32 right-40 w-16 h-16 border-2 border-accent/20 rounded-full animate-float-reverse"></div>
                <div className="absolute top-40 left-[60%] w-8 h-8 bg-accent/10 rounded-lg animate-float-slow rotate-45"></div>
                <div className="absolute bottom-20 left-20 w-20 h-20 border border-white/5 rounded-3xl animate-spin-slow"></div>

                <div className="relative container mx-auto px-8 md:px-12 py-20">
                    <motion.div
                        className="max-w-4xl relative z-10"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent font-bold text-sm uppercase tracking-widest mb-8 shadow-glow transition-all hover:bg-white/20 hover:scale-105 cursor-default">
                            <Zap className="h-4 w-4 fill-accent" />
                            Vespa Specialist & Oat Engineering
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[1.1] drop-shadow-lg">
                            {siteConfig.brand.name} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-500 italic pr-4">{siteConfig.brand.englishName}</span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-xl md:text-2xl mb-12 text-gray-200 font-medium max-w-2xl leading-relaxed">
                            ศูนย์รวมอะไหล่และบริการ Vespa ครบวงจร โดย <span className="text-accent font-bold">ช่างโอ๊ต (Oat Engineering)</span> สำหรับคนรักเวสป้าเมืองเลย
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-wrap gap-6">
                            <Button size="lg" asChild className="bg-accent text-white hover:bg-accent/90 border-0 rounded-full px-10 h-16 text-xl font-bold shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)] transition-all hover:scale-105 active:scale-95">
                                <Link href="/products">
                                    <ShoppingCart className="mr-3 h-6 w-6" />
                                    ช้อปเลย (Shop Now)
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="bg-black/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-black rounded-full px-10 h-16 text-xl font-bold transition-all hover:scale-105">
                                <Link href="/products">
                                    ดูสินค้าทั้งหมด
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Counter Section */}
            <section className="container mx-auto px-4 -mt-12 relative z-20">
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                >
                    {[
                        { label: 'สินค้าพร้อมส่ง', end: 500, suffix: '+' },
                        { label: 'ลูกค้าไว้ใจ', end: 1200, suffix: '+' },
                        { label: 'ปีที่เริ่มดำเนินการ', end: 2020, suffix: '', isYear: true },
                        { label: 'ความพึงพอใจ', end: 99, suffix: '%' },
                    ].map((stat, i) => {
                        const { count, ref } = useCounter(stat.end, stat.isYear ? 1500 : 2000);
                        return (
                            <motion.div key={i} ref={ref} variants={scaleIn}
                                className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100 text-center card-hover-lift"
                            >
                                <div className="text-3xl md:text-4xl font-black gradient-text-primary mb-1">
                                    {stat.isYear ? count : count.toLocaleString()}{stat.suffix}
                                </div>
                                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </section>

            {/* Categories Section - Clean & Modern */}
            <section className="container mx-auto px-4 mt-24">
                <motion.div
                    className="flex items-end justify-between mb-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeInUp}
                >
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">หมวดหมู่ <span className="gradient-text-primary">สินค้า</span></h2>
                        <div className="h-2 w-24 bg-accent rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Scroll Arrows - Mobile Only */}
                        <div className="flex md:hidden gap-2">
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => scrollCat('left')}
                                className="h-10 w-10 rounded-lg border-2 border-gray-100 bg-white/80 backdrop-blur-sm -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-sm"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                size="icon"
                                onClick={() => scrollCat('right')}
                                className="h-10 w-10 rounded-lg bg-gradient-to-r from-accent to-pink-500 text-white border-none -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-lg shadow-accent/20"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                        <Link href="/products" className="hidden md:flex items-center text-lg font-bold text-gray-500 hover:text-accent transition-colors group">
                            ดูทุกหมวดหมู่ (View All)
                            <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    ref={catScrollRef}
                    className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide"
                    initial="hidden"
                    animate={categoriesLoading ? "hidden" : "visible"}
                    variants={staggerContainer}
                >
                    {categoriesLoading ? (
                        // Skeleton Grid
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={`cat-skeleton-${i}`} className="h-[280px] w-[240px] md:w-auto flex-shrink-0 snap-start rounded-[2rem] bg-gray-50 border-0 overflow-hidden relative p-8">
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <Skeleton className="h-20 w-20 rounded-[1.5rem]" />
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))
                    ) : (
                        (categories || []).slice(0, 4).map((category, i) => {
                            const catImage = category.imageUrl || category.sampleImage;
                            return (
                                <motion.div key={category._id} variants={fadeInUp} className="w-[240px] md:w-auto flex-shrink-0 md:flex-shrink snap-start">
                                    <Link href={`/products?categoryId=${category.categoryId}`} className="group block h-full">
                                        <Card className="h-full border-0 bg-gray-50 hover:bg-white shadow-none hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden relative card-hover-lift group">
                                            {/* Image Background for Category */}
                                            {catImage && (
                                                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 scale-110 group-hover:scale-125">
                                                    <img
                                                        src={getImageUrl(catImage)}
                                                        alt={category.name}
                                                        className="w-full h-full object-cover grayscale"
                                                    />
                                                </div>
                                            )}

                                            <div className="p-8 text-center pt-10 relative z-10 flex flex-col h-full">
                                                <div className="h-20 w-20 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-glow transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 border border-gray-50">
                                                    {catImage ? (
                                                        <img
                                                            src={getImageUrl(catImage)}
                                                            alt={category.name}
                                                            className="w-14 h-14 object-cover rounded-xl"
                                                        />
                                                    ) : (
                                                        <Package className="h-10 w-10 text-primary" />
                                                    )}
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
                    )}
                </motion.div>
            </section>

            {/* New Arrivals Section - REAL DATA */}
            {(featuredProducts.length > 0 || productsLoading) && (
                <section className="container mx-auto px-4 mt-24">
                    <motion.div
                        className="flex items-end justify-between mb-12"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={fadeInUp}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900">สินค้า <span className="gradient-text-accent">มาใหม่</span></h2>
                            {/* Desktop Spacer */}
                            <div className="hidden md:block h-2 w-24 bg-primary rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Racing Style Navigation Buttons - Mobile Only */}
                            <div className="flex md:hidden gap-2 mr-2">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => scroll('left')}
                                    className="h-10 w-10 rounded-lg border-2 border-gray-100 bg-white/80 backdrop-blur-sm -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-sm"
                                >
                                    <ChevronRight className="h-5 w-5 rotate-180" />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={() => scroll('right')}
                                    className="h-10 w-10 rounded-lg bg-gradient-to-r from-accent to-pink-500 text-white border-none -skew-x-12 hover:skew-x-0 transition-transform active:scale-95 shadow-lg shadow-accent/20"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                            <Link href="/products" className="hidden md:flex items-center text-lg font-bold text-gray-500 hover:text-primary transition-colors group">
                                ดูสินค้าทั้งหมด
                                <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        ref={scrollRef}
                        className="flex lg:grid lg:grid-cols-4 gap-6 items-stretch overflow-x-auto lg:overflow-visible pb-10 lg:pb-0 snap-x snap-mandatory scrollbar-hide px-4 md:px-0"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerContainer}
                    >
                        {productsLoading ? (
                            // Skeleton Items
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={`prod-skeleton-${i}`} className="relative w-[240px] sm:w-[300px] lg:w-auto flex-shrink-0 snap-start h-[400px]">
                                    <Skeleton className="w-full h-full rounded-[2rem]" />
                                </div>
                            ))
                        ) : (
                            featuredProducts.map((product) => (
                                <motion.div
                                    key={product._id}
                                    variants={fadeInUp}
                                    className="relative w-[240px] sm:w-[300px] lg:w-auto lg:min-w-0 snap-start flex-shrink-0 lg:flex-shrink h-full"
                                >
                                    <div className="absolute -top-2 -left-2 z-30 pointer-events-none">
                                        <div className="bg-accent text-white text-[10px] font-black px-3 py-1 rounded-sm -skew-x-12 shadow-glow animate-pulse uppercase tracking-widest border border-white/20">
                                            New Arrival
                                        </div>
                                    </div>
                                    <ProductCard product={product} />
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </section>
            )}

            {/* Features Section - Dark Mode Power */}
            <section className="bg-zinc-950 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden mx-4 mt-24">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] animate-breathe"></div>

                <motion.div
                    className="relative z-10 container mx-auto"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp} className="inline-block px-4 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-gray-300 text-sm font-bold uppercase tracking-widest mb-6">
                        Why Choose Banrakrod Loei
                    </motion.div>
                    <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-black mb-16 text-white">WORLD CLASS <span className="text-primary italic">STANDARD</span></motion.h2>

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

        </div>
    );
}
