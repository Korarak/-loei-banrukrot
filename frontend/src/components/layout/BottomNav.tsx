'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCart } from '@/hooks/useCart';
import { useCustomerOrders } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';

export default function BottomNav() {
    const pathname = usePathname();
    const customer = useAuthStore((state) => state.customer);
    const { data: cart } = useCart();
    const { data: orders } = useCustomerOrders();

    const totalItems = (cart?.items || []).reduce((sum, item) => sum + item.quantity, 0);
    const pendingSlipCount = customer
        ? (orders || []).filter(o => o.orderStatus === 'pending' && o.paymentMethod !== 'Cash' && !o.hasSlip).length
        : 0;

    const navItems = [
        {
            href: '/',
            label: 'หน้าหลัก',
            icon: Home,
        },
        {
            href: '/products',
            label: 'สินค้า',
            icon: ShoppingBag,
        },
        {
            href: '/cart',
            label: 'ตะกร้า',
            icon: ShoppingCart,
            badge: customer && totalItems > 0 ? totalItems : undefined,
        },
        {
            href: '/orders',
            label: 'คำสั่งซื้อ',
            icon: Package,
            badge: pendingSlipCount > 0 ? pendingSlipCount : undefined,
            badgeColor: 'bg-orange-500',
        },
        {
            href: customer ? '/profile' : '/customer-login',
            label: customer ? 'โปรไฟล์' : 'เข้าสู่ระบบ',
            icon: User,
        },
    ];

    const isProductPage = pathname.startsWith('/products/') && pathname.split('/').length === 3;

    if (isProductPage) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-lg border-t border-gray-200 md:hidden pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive
                                    ? "text-green-600"
                                    : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                                {item.badge !== undefined && (
                                    <span className={`absolute -top-1.5 -right-1.5 ${(item as any).badgeColor || 'bg-red-500'} text-white text-[10px] font-bold rounded-full min-w-[1rem] h-4 px-1 flex items-center justify-center border border-white`}>
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
