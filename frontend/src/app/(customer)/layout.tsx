'use client';
// Customer Layout Component

import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ShoppingCart, User, LogOut, Package, Heart, Menu, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCart } from '@/hooks/useCart';
import { useCustomerOrders } from '@/hooks/useOrders';
import { usePublicSettings } from '@/hooks/useSettings';
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
import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { siteConfig } from '@/config/site';
import { ChatSocketProvider } from '@/hooks/useChatSocket';
import ChatLauncherButton from '@/components/chat/ChatLauncherButton';


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
    const [scroll, setScroll] = useState({ scrolled: false, progress: 0 });
    const scrolled = scroll.scrolled;
    const scrollProgress = scroll.progress;

    const { data: cart } = useCart();
    const { data: orders } = useCustomerOrders();
    const { data: publicSettings } = usePublicSettings();
    const storeClosed = publicSettings?.store_order_acceptance === 'closed';
    const totalItems = useMemo(
        () => (cart?.items || []).reduce((sum, item) => sum + item.quantity, 0),
        [cart?.items]
    );
    const pendingSlipCount = useMemo(
        () => customer
            ? (orders || []).filter(o => o.orderStatus === 'pending' && o.paymentMethod !== 'Cash' && !o.hasSlip).length
            : 0,
        [customer, orders]
    );

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
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
            setScroll({ scrolled: window.scrollY > 20, progress: Math.min(progress, 100) });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logoutCustomer();
        router.push('/');
    };

    return (
        <ChatSocketProvider tokenType="customer">
        <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-white pb-20 md:pb-0">
            {/* Scroll Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent">
                <div
                    className="h-full scroll-progress-bar"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>
            {/* Desktop Header */}
            <motion.nav
                className={`fixed top-[3px] left-0 right-0 z-50 bg-white transition-all duration-300 hidden md:block ${scrolled ? 'border-b border-border py-2' : 'py-4'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-10 px-2.5 bg-foreground flex items-center justify-center shrink-0">
                                <span className="text-white font-black text-[10px] tracking-tight leading-none">VESPA</span>
                            </div>
                            <div>
                                <div className="text-xl font-black tracking-tighter text-gray-900">
                                    {siteConfig.brand.name}
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                    {siteConfig.brand.englishName}
                                </div>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-1">
                                <Link
                                    href="/products"
                                    className="relative px-1 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-foreground after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
                                >
                                    สินค้าทั้งหมด
                                </Link>
                            </div>

                            <div className="flex items-center gap-2 pl-6 border-l-2 border-gray-100 min-w-[200px] justify-end">
                                <Link
                                    href="/cart"
                                    className="relative p-3 text-gray-600 hover:text-gray-900 transition-colors group hover:bg-accent"
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
                                                className="absolute top-1 right-1 bg-brand text-brand-foreground text-[10px] min-w-[1.2rem] h-[1.2rem] px-1 flex items-center justify-center font-bold border-2 border-white"
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
                                                <Button variant="ghost" className="gap-3 pl-1 pr-4 border border-transparent hover:border-border transition-all h-11">
                                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-border relative">
                                                        {customer.profilePicture ? (
                                                            <Image
                                                                src={getImageUrl(customer.profilePicture)}
                                                                alt={customer.firstName}
                                                                fill
                                                                className="object-cover"
                                                                sizes="32px"
                                                            />
                                                        ) : (
                                                            <User className="h-4 w-4 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="text-left hidden lg:block">
                                                        <div className="text-xs font-bold text-gray-900">{customer.firstName}</div>
                                                        <div className="text-[10px] text-gray-600 font-medium">สมาชิก</div>
                                                    </div>
                                                    <Menu className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-none p-2 shadow-lg border-border bg-white z-[60]">
                                                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-black text-gray-500 uppercase tracking-wider">บัญชีของฉัน</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-gray-100" />
                                                <DropdownMenuItem asChild className="rounded-none cursor-pointer focus:bg-accent focus:text-foreground">
                                                    <Link href="/profile" className="w-full flex items-center gap-2 font-bold text-gray-600">
                                                        <User className="h-4 w-4" />
                                                        <span>โปรไฟล์</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="rounded-none cursor-pointer focus:bg-accent focus:text-foreground">
                                                    <Link href="/wishlist" className="w-full flex items-center gap-2 font-bold text-gray-600">
                                                        <Heart className="h-4 w-4" />
                                                        <span>รายการโปรด</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="rounded-none cursor-pointer focus:bg-accent focus:text-foreground">
                                                    <Link href="/orders" className="w-full flex items-center gap-2 font-bold text-gray-600">
                                                        <Package className="h-4 w-4" />
                                                        <span>คำสั่งซื้อ</span>
                                                        {pendingSlipCount > 0 && (
                                                            <span className="ml-auto bg-brand text-brand-foreground text-[10px] font-black min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center">
                                                                {pendingSlipCount}
                                                            </span>
                                                        )}
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-gray-100" />
                                                <DropdownMenuItem
                                                    onSelect={(e) => { e.preventDefault(); setShowLogoutConfirm(true); }}
                                                    className="text-brand rounded-none cursor-pointer focus:text-brand focus:bg-brand/5 font-bold"
                                                >
                                                    <LogOut className="h-4 w-4 mr-2" />
                                                    ออกจากระบบ
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" asChild className="text-gray-600 font-bold px-5">
                                                <Link href="/customer-login">เข้าสู่ระบบ</Link>
                                            </Button>
                                            <Button asChild className="px-6 font-bold">
                                                <Link href="/customer-register">สมัครสมาชิก</Link>
                                            </Button>
                                        </div>
                                    )
                                ) : (
                                    <div className="w-24 h-10 bg-gray-100 animate-pulse"></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Header */}
            <nav className={`sticky top-0 z-50 bg-white transition-all duration-300 md:hidden ${scrolled ? 'border-b border-border' : ''}`}>
                <div className="px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 px-2 bg-foreground flex items-center justify-center shrink-0">
                            <span className="text-white font-black text-[9px] tracking-tight leading-none">VESPA</span>
                        </div>
                        <span className="font-black text-lg text-gray-900 tracking-tight">{siteConfig.brand.name}</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link href="/cart" className="relative p-2">
                            <ShoppingCart className="h-6 w-6 text-gray-800" />
                            {mounted && isHydrated && totalItems > 0 && (
                                <span className="absolute top-0 right-0 bg-brand text-brand-foreground text-[10px] h-4 w-4 flex items-center justify-center border border-white">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                        {mounted && isHydrated ? (
                            customer ? (
                                <div className="flex items-center gap-1">
                                    <Link href="/profile" className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200 relative block">
                                        {customer.profilePicture ? (
                                            <Image src={getImageUrl(customer.profilePicture)} alt="Profile" fill className="object-cover" sizes="32px" />
                                        ) : (
                                            <User className="h-full w-full p-1.5 text-gray-500" />
                                        )}
                                    </Link>
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="p-2 text-gray-500 hover:text-brand hover:bg-accent transition-colors"
                                        aria-label="ออกจากระบบ"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <Button size="sm" asChild className="h-8 px-4 text-xs font-bold">
                                    <Link href="/customer-login">เข้าสู่ระบบ</Link>
                                </Button>
                            )
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse"></div>
                        )}
                    </div>
                </div>
            </nav >

            {/* Global pending-slip banner — sits below sticky mobile nav; on desktop offset by
                fixed nav height (3px progress bar + py-4 + h-16 when unscrolled ≈ 100px) */}
            <div className="md:pt-[100px]">
                <AnimatePresence>
                    {mounted && storeClosed && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-2.5">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>ขณะนี้ร้านปิดรับคำสั่งซื้อออนไลน์ชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                                className="flex items-center justify-center gap-2 bg-foreground text-white text-sm font-bold px-4 py-2.5 border-l-4 border-brand hover:bg-black transition-colors"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0 text-brand" />
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

            {/* Always visible (even to guests) — clicking it while logged out prompts login, matching cart's add-to-cart pattern */}
            {mounted && isHydrated && <ChatLauncherButton />}

            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ออกจากระบบ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการออกจากระบบใช่หรือไม่ ต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อกลับมาใช้งาน
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
                            ออกจากระบบ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
        </ChatSocketProvider>
    );
}
