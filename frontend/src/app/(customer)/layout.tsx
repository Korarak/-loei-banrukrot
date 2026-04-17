'use client';
// Customer Layout Component

import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User, LogOut, Wrench, Package, Heart, Menu, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCart } from '@/hooks/useCart';
import { useCustomerOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from '@/config/site';


export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const customer = useAuthStore((state) => state.customer);
    const logoutCustomer = useAuthStore((state) => state.logoutCustomer);
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const { data: cart } = useCart();
    const { data: orders } = useCustomerOrders();
    const totalItems = (cart?.items || []).reduce((sum, item) => sum + item.quantity, 0);
    const pendingSlipCount = customer
        ? (orders || []).filter(o => o.orderStatus === 'pending' && o.paymentMethod !== 'Cash' && !o.hasSlip).length
        : 0;

    const toastShownRef = useRef(false);
    useEffect(() => {
        if (pendingSlipCount > 0 && !toastShownRef.current) {
            toastShownRef.current = true;
            toast.warning(
                `มี ${pendingSlipCount} คำสั่งซื้อรอการแนบสลิป`,
                {
                    description: 'กรุณาอัปโหลดหลักฐานการโอนเงินเพื่อดำเนินการต่อ',
                    duration: 6000,
                    action: { label: 'ดูคำสั่งซื้อ', onClick: () => router.push('/orders?tab=pending') },
                }
            );
        }
    }, [pendingSlipCount]);

    // Cart Bump Animation
    const [bump, setBump] = useState(false);
    const prevItemsRef = useRef(totalItems);

    useEffect(() => {
        if (totalItems > prevItemsRef.current) {
            setBump(true);
            const timer = setTimeout(() => setBump(false), 300);
            return () => clearTimeout(timer);
        }
        prevItemsRef.current = totalItems;
    }, [totalItems]);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
            // Calculate scroll progress
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
            setScrollProgress(Math.min(progress, 100));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        logoutCustomer();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary selection:text-white pb-20 md:pb-0">
            {/* Scroll Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent">
                <div
                    className="h-full scroll-progress-bar rounded-r-full"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>
            {/* Desktop Header - GLASSMORPHISM POWER */}
            <motion.nav
                className={`fixed top-[3px] left-0 right-0 z-50 transition-all duration-300 hidden md:block ${scrolled ? 'glass-card border-b border-gray-200/30 shadow-lg py-2' : 'bg-transparent py-4'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                {/* <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500" /> */}
                                <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 logo-shimmer-container gold-glow-hover">
                                    <Image
                                        src="/logo.png"
                                        alt={siteConfig.brand.name}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                    <div className="logo-shimmer-effect" />
                                </div>
                            </div>
                            <div>
                                <div className="text-xl font-black tracking-tighter italic text-gray-900 group-hover:text-primary transition-colors">
                                    {siteConfig.brand.name}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] group-hover:text-primary/70 transition-colors">
                                    {siteConfig.brand.englishName}
                                </div>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-1">
                                <Link
                                    href="/products"
                                    className="relative px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors group overflow-hidden rounded-full hover:bg-gray-50"
                                >
                                    <span className="relative z-10">สินค้าทั้งหมด</span>
                                </Link>
                            </div>

                            <div className="flex items-center gap-2 pl-6 border-l-2 border-gray-100 min-w-[200px] justify-end">
                                <Link
                                    href="/cart"
                                    className="relative p-3 text-gray-500 hover:text-gray-900 transition-colors group hover:bg-gray-50 rounded-full"
                                >
                                    <motion.div
                                        animate={bump ? { scale: [1, 1.2, 1], rotate: [0, -15, 15, -15, 15, 0] } : {}}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                    </motion.div>

                                    <AnimatePresence>
                                        {mounted && isHydrated && customer && totalItems > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                key={totalItems}
                                                className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] rounded-full min-w-[1.2rem] h-[1.2rem] px-1 flex items-center justify-center font-bold shadow-md border-2 border-white"
                                            >
                                                {totalItems > 99 ? '99+' : totalItems}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>

                                {mounted && isHydrated ? (
                                    customer ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="gap-3 pl-1 pr-4 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all h-11">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                                                        {customer.profilePicture ? (
                                                            <img
                                                                src={getImageUrl(customer.profilePicture)}
                                                                alt={customer.firstName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-left hidden lg:block">
                                                        <div className="text-xs font-bold text-gray-900">{customer.firstName}</div>
                                                        <div className="text-[10px] text-gray-500 font-medium">สมาชิก</div>
                                                    </div>
                                                    <Menu className="h-4 w-4 text-gray-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 bg-white z-[60]">
                                                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-black text-gray-400 uppercase tracking-wider">บัญชีของฉัน</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-gray-100" />
                                                <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary">
                                                    <Link href="/profile" className="w-full flex items-center gap-2 font-bold text-gray-600">
                                                        <User className="h-4 w-4" />
                                                        <span>โปรไฟล์</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary">
                                                    <Link href="/wishlist" className="w-full flex items-center gap-2 font-bold text-gray-600">
                                                        <Heart className="h-4 w-4" />
                                                        <span>รายการโปรด</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary">
                                                    <Link href="/orders" className="w-full flex items-center gap-2 font-bold text-gray-600">
                                                        <Package className="h-4 w-4" />
                                                        <span>คำสั่งซื้อ</span>
                                                        {pendingSlipCount > 0 && (
                                                            <span className="ml-auto bg-orange-500 text-white text-[10px] font-black rounded-full min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center">
                                                                {pendingSlipCount}
                                                            </span>
                                                        )}
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-gray-100" />
                                                <DropdownMenuItem onClick={handleLogout} className="text-red-500 rounded-xl cursor-pointer focus:text-red-600 focus:bg-red-50 font-bold">
                                                    <LogOut className="h-4 w-4 mr-2" />
                                                    ออกจากระบบ
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" asChild className="text-gray-600 font-bold hover:text-accent hover:bg-accent/5 rounded-full px-5 transition-colors">
                                                <Link href="/customer-login">เข้าสู่ระบบ</Link>
                                            </Button>
                                            <Button asChild className="bg-gradient-to-r from-accent to-pink-500 text-white hover:brightness-110 rounded-full shadow-lg shadow-accent/20 px-6 font-bold transition-all hover:-translate-y-0.5 border-none">
                                                <Link href="/customer-register">สมัครสมาชิก</Link>
                                            </Button>
                                        </div>
                                    )
                                ) : (
                                    <div className="w-24 h-10 bg-gray-100 animate-pulse rounded-full"></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Header */}
            <nav className={`sticky top-0 z-50 transition-all duration-300 md:hidden ${scrolled ? 'glass-card border-b border-gray-100 shadow-sm' : 'bg-white'}`}>
                <div className="px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 relative overflow-hidden rounded-lg shadow-md">
                            <Image
                                src="/logo.png"
                                alt={siteConfig.brand.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-black italic text-lg text-gray-900 tracking-tight">{siteConfig.brand.englishName}</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link href="/cart" className="relative p-2">
                            <ShoppingCart className="h-6 w-6 text-gray-800" />
                            {mounted && isHydrated && totalItems > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center border border-white">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                        {mounted && isHydrated ? (
                            customer ? (
                                <div className="flex items-center gap-1">
                                    <Link href="/profile" className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                                        {customer.profilePicture ? (
                                            <img src={getImageUrl(customer.profilePicture)} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-full w-full p-1.5 text-gray-400" />
                                        )}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors active:scale-95"
                                        aria-label="Logout"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <Button size="sm" asChild className="rounded-full h-8 px-4 text-xs font-bold bg-gradient-to-r from-accent to-pink-500 text-white border-none shadow-md shadow-accent/20">
                                    <Link href="/customer-login">เข้าสู่ระบบ</Link>
                                </Button>
                            )
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse"></div>
                        )}
                    </div>
                </div>
            </nav >

            {/* Global pending-slip banner — sits below sticky mobile nav; on desktop offset by fixed nav height */}
            <div className="md:pt-20">
                <AnimatePresence>
                    {mounted && isHydrated && customer && pendingSlipCount > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <Link
                                href="/orders?tab=pending"
                                className="flex items-center justify-center gap-2 bg-orange-500 text-white text-sm font-bold px-4 py-2.5 hover:bg-orange-600 transition-colors"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>
                                    มี {pendingSlipCount} คำสั่งซื้อรอการแนบสลิปโอนเงิน — แตะที่นี่เพื่อดำเนินการ
                                </span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <main className="pt-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {children}
            </main>

            <BottomNav />
            <Footer />
        </div >
    );
}
