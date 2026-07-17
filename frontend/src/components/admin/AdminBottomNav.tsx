'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Store, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useOrders, Order } from '@/hooks/useOrders';

interface AdminBottomNavProps {
    onMenuClick?: () => void;
}

export function AdminBottomNav({ onMenuClick }: AdminBottomNavProps) {
    const pathname = usePathname();

    // Same pending-orders signal as the desktop sidebar — mobile only ever sees
    // this bar (the sidebar itself is hidden behind the menu drawer), so without
    // this the badge was invisible on mobile.
    const { data: allOrders } = useOrders({ refetchInterval: 30000 });
    const pendingOrdersCount = (allOrders as Order[] | undefined)?.filter(o => o.orderStatus === 'pending').length ?? 0;

    const isActive = (path: string) => pathname.startsWith(path);

    const navItems = [
        {
            href: '/admin/dashboard',
            label: 'แผงควบคุม',
            icon: LayoutDashboard,
        },
        {
            href: '/admin/orders',
            label: 'คำสั่งซื้อ',
            icon: ShoppingCart,
            badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
        },
        {
            href: '/admin/products',
            label: 'สินค้า',
            icon: Package,
        },
        {
            href: '/admin/pos',
            label: 'ขายหน้าร้าน',
            icon: Store,
        }
    ];

    const linkClass = (path: string) => cn(
        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
        isActive(path)
            ? "text-primary"
            : "text-gray-400 hover:text-gray-600"
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] xl:hidden">
            <div className="flex items-center justify-around h-16 w-full">
                {/* Menu Toggle Button */}
                <button
                    onClick={onMenuClick}
                    aria-label="เปิดเมนูหลัก"
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Menu className="h-6 w-6" />
                    <span className="text-[10px] font-medium">เมนู</span>
                </button>

                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-label={item.label}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={linkClass(item.href)}
                    >
                        <span className="relative">
                            <item.icon className="h-6 w-6" />
                            {!!item.badge && (
                                <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold min-w-[1.1rem] h-[1.1rem] px-1 rounded-full flex items-center justify-center shadow-sm shadow-red-500/30">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </span>
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {isActive(item.href) && (
                            <span className="absolute top-0 w-8 h-1 bg-primary rounded-b-full" />
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
