'use client';

import Link from 'next/link';
import { Package, Wrench, Settings, ShoppingCart, Zap, Star, ShieldCheck, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

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

const testimonials = [
    { name: 'คุณชาตรี', role: 'Vespa GTS Owner', text: 'อะไหล่คุณภาพดีมาก ได้ของแท้ราคายุติธรรม สั่งปุ๊บได้ปั๊บ ประทับใจครับ', rating: 5 },
    { name: 'คุณสมหญิง', role: 'Vespa Sprint Owner', text: 'ทีมงานให้คำปรึกษาดีมาก แนะนำอะไหล่ที่เหมาะกับรถเราเลย ขอบคุณค่ะ', rating: 5 },
    { name: 'คุณวิทยา', role: 'Vespa PX Owner', text: 'หาอะไหล่เวสป้ารุ่นเก่ายากมาก แต่ที่นี่มีครบ! จัดส่งเร็ว แพ็คอย่างดี', rating: 5 },
];

export default function Home() {
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
                            The Ultimate Vespa Experience
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[1.1] drop-shadow-lg">
                            DRIVE YOUR <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-500 italic pr-4">PASSION</span>
                            FURTHER
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-xl md:text-2xl mb-12 text-gray-200 font-medium max-w-2xl leading-relaxed">
                            ศูนย์รวมอะไหล่และของแต่งเวสป้า <span className="text-accent font-bold">ที่ครบเครื่องที่สุด</span> ในจังหวัดเลย
                            ยกระดับการขับขี่ของคุณด้วยสินค้าคุณภาพระดับโลก
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
                    className="flex items-end justify-between mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeInUp}
                >
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">SHOP BY <span className="gradient-text-primary">CATEGORY</span></h2>
                        <div className="h-2 w-24 bg-accent rounded-full"></div>
                    </div>
                    <Link href="/products" className="hidden md:flex items-center text-lg font-bold text-gray-500 hover:text-accent transition-colors group">
                        View All Categories
                        <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                >
                    {[
                        { href: '/products?category=Engine Parts', icon: Settings, title: 'ENGINE', desc: 'Performance kits, pistons, and power upgrades for speed lovers.', color: 'primary', hoverColor: 'group-hover:text-primary', bgHover: 'group-hover:bg-primary/20', bg: 'bg-primary/10', iconColor: 'text-primary', rotate: 'group-hover:rotate-6' },
                        { href: '/products?category=Body & Frame', icon: Package, title: 'BODY', desc: 'Frames, panels, fenders and accessories to style your ride.', color: 'blue-600', hoverColor: 'group-hover:text-blue-600', bgHover: 'group-hover:bg-blue-500/20', bg: 'bg-blue-500/10', iconColor: 'text-blue-600', rotate: 'group-hover:-rotate-6' },
                        { href: '/products?category=Maintenance', icon: Wrench, title: 'SERVICE', desc: 'Oils, filters, and tools to keep your Vespa running smooth.', color: 'accent', hoverColor: 'group-hover:text-accent', bgHover: 'group-hover:bg-accent/20', bg: 'bg-accent/10', iconColor: 'text-accent', rotate: 'group-hover:rotate-12' },
                    ].map((cat, i) => (
                        <motion.div key={i} variants={fadeInUp}>
                            <Link href={cat.href} className="group block">
                                <Card className="h-full border-0 bg-gray-50 hover:bg-white shadow-none hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden relative card-hover-lift">
                                    <div className={`absolute top-0 right-0 w-32 h-32 ${cat.bg} rounded-bl-[4rem] transition-all ${cat.bgHover}`}></div>
                                    <CardHeader className="p-10 relative z-10">
                                        <div className={`h-20 w-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-md group-hover:scale-110 ${cat.rotate} transition-all duration-500`}>
                                            <cat.icon className={`h-10 w-10 ${cat.iconColor}`} />
                                        </div>
                                        <CardTitle className={`text-3xl font-black mb-2 text-gray-800 ${cat.hoverColor} transition-colors`}>{cat.title}</CardTitle>
                                        <CardDescription className="text-lg text-gray-500 font-medium group-hover:text-gray-700">
                                            {cat.desc}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

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

            {/* Testimonials Section - NEW */}
            <section className="container mx-auto px-4 mt-24">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={staggerContainer}
                >
                    <motion.div variants={fadeInUp} className="text-center mb-16">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold uppercase tracking-widest mb-6">
                            Customer Reviews
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900">
                            WHAT OUR <span className="gradient-text-accent">RIDERS</span> SAY
                        </h2>
                    </motion.div>

                    <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" variants={staggerContainer}>
                        {testimonials.map((t, i) => (
                            <motion.div key={i} variants={fadeInUp}>
                                <Card className="h-full border-0 bg-gray-50 hover:bg-white shadow-none hover:shadow-xl transition-all duration-500 rounded-[2rem] p-8 relative card-hover-lift">
                                    <Quote className="h-10 w-10 text-primary/20 mb-4" />
                                    <p className="text-gray-600 text-lg leading-relaxed mb-6 font-medium">
                                        &ldquo;{t.text}&rdquo;
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                                            {t.name.charAt(3)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{t.name}</p>
                                            <p className="text-sm text-gray-500">{t.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 mt-4">
                                        {Array.from({ length: t.rating }).map((_, j) => (
                                            <Star key={j} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
}
