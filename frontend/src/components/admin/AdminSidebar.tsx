'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Store,
    Folder,
    Users,
    LogOut,
    Truck,
    ChevronDown,
    ChevronRight,
    Settings,
    History,
    Menu
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOrders } from '@/hooks/useOrders';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

type MenuGroup = {
    title: string;
    items: {
        href: string;
        label: string;
        icon: React.ElementType;
    }[];
};

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logoutUser = useAuthStore((state) => state.logoutUser);

    // Fetch orders for notification badge
    const { data: orders } = useOrders({ refetchInterval: 30000 });
    const pendingOrdersCount = orders?.filter(o => o.orderStatus === 'pending').length || 0;

    // State for collapsible sections
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        'overview': true,
        'management': true,
        'pos': false
    });

    const toggleGroup = (groupKey: string) => {
        setOpenGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    const handleLogout = () => {
        logoutUser();
        router.push('/login');
    };

    const isActive = (path: string) => {
        return pathname.startsWith(path);
    };

    const linkClass = (path: string) => cn(
        "flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
        isActive(path)
            ? "text-white bg-white/10 shadow-lg shadow-black/20"
            : "text-gray-400 hover:text-white hover:bg-white/5"
    );

    const iconClass = (path: string) => cn(
        "h-5 w-5 transition-colors",
        isActive(path)
            ? "text-primary"
            : "text-gray-500 group-hover:text-primary"
    );

    // Menu Definitions
    const menuGroups: Record<string, MenuGroup> = {
        'overview': {
            title: 'ภาพรวม',
            items: [
                { href: '/admin/dashboard', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
                { href: '/admin/users', label: 'ผู้ใช้งาน', icon: Users },
                { href: '/admin/customers', label: 'ลูกค้า', icon: Users },
            ]
        },
        'management': {
            title: 'การจัดการ',
            items: [
                { href: '/admin/products', label: 'สินค้า', icon: Package },
                { href: '/admin/categories', label: 'หมวดหมู่', icon: Folder },
                { href: '/admin/orders', label: 'คำสั่งซื้อ', icon: ShoppingCart },
                { href: '/admin/shipping', label: 'การจัดส่ง', icon: Truck },
            ]
        },
        'pos': {
            title: 'จุดขายหน้าร้าน',
            items: [
                { href: '/admin/pos', label: 'ระบบขายหน้าร้าน', icon: Store },
                { href: '/admin/pos/history', label: 'ประวัติการขาย', icon: History },
            ]
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 xl:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={cn(
                "w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col fixed h-full z-40 transition-transform duration-300 xl:translate-x-0 shadow-2xl xl:shadow-none text-gray-200",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="p-6 pb-4 flex items-center justify-between xl:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            <Store className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-white italic">VESPA<span className="text-primary not-italic">ADMIN</span></h1>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] relative -top-1">ศูนย์ควบคุม</p>
                        </div>
                    </div>
                    {/* Close button for mobile/tablet */}
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-white xl:hidden"
                    >
                        <ChevronDown className="h-6 w-6 rotate-90" />
                    </button>
                </div>

                {/* Users Profile Card (Dark Mode) */}
                <div className="px-4 mb-2">
                    {user && (
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center text-lg font-bold text-white shadow-inner overflow-hidden shrink-0 border border-white/10">
                                {user.profilePicture ? (
                                    <img
                                        src={getImageUrl(user.profilePicture)}
                                        alt={user.username}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    user.username.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="overflow-hidden min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{user.role}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto py-2 px-4 space-y-1 dark-scrollbar">
                    {/* Render Menu Groups */}
                    {Object.entries(menuGroups).map(([key, group]) => (
                        <div key={key} className="mb-4">
                            <button
                                onClick={() => toggleGroup(key)}
                                className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors mb-1"
                            >
                                <span>{group.title}</span>
                                <motion.div
                                    animate={{ rotate: openGroups[key] ? 0 : -90 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </motion.div>
                            </button>

                            {/* Collapsible Content */}
                            <AnimatePresence initial={false}>
                                {openGroups[key] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="space-y-1 overflow-hidden"
                                    >
                                        {group.items.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => {
                                                    if (window.innerWidth < 1280) {
                                                        onClose();
                                                    }
                                                }}
                                                className={linkClass(item.href)}
                                            >
                                                {isActive(item.href) && (
                                                    <motion.div
                                                        layoutId="active-indicator"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                    />
                                                )}
                                                <item.icon className={iconClass(item.href)} />
                                                <span className="flex-1">{item.label}</span>
                                                {item.label === 'คำสั่งซื้อ' && pendingOrdersCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center shadow-lg shadow-red-500/20 animate-pulse">
                                                        {pendingOrdersCount}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl py-6 transition-all duration-200"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-bold text-xs uppercase tracking-wider">ออกจากระบบ</span>
                    </Button>
                </div>
            </aside>
        </>
    );
}
