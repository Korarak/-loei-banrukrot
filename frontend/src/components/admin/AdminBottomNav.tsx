'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Store, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminBottomNavProps {
    onMenuClick?: () => void;
}

export function AdminBottomNav({ onMenuClick }: AdminBottomNavProps) {
    const pathname = usePathname();

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
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] xl:hidden">
                <div className="flex items-center justify-around h-16 w-full px-2">
                    {/* Menu Toggle Button */}
                    <button
                        onClick={onMenuClick}
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                        <span className="text-[10px] font-medium">เมนู</span>
                    </button>

                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={linkClass(item.href)}
                        >
                            <item.icon className={cn("h-6 w-6", isActive(item.href) && "fill-current/10")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {isActive(item.href) && (
                                <span className="absolute top-0 w-8 h-1 bg-primary rounded-b-full" />
                            )}
                        </Link>
                    ))}
                </div>
            </div>
            {/* Spacer for bottom nav */}
            <div className="h-16 xl:hidden shrink-0 pb-[env(safe-area-inset-bottom)]" />
        </>
    );
}
