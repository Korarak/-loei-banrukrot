'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        // Wait for store to hydrate before making redirect decisions
        if (isHydrated && !user) {
            router.push('/login');
        }
    }, [user, isHydrated, router]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isHydrated || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-primary/20 rounded-xl animate-pulse flex items-center justify-center">
                        <div className="h-6 w-6 bg-primary rounded-lg animate-bounce" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-widest">กำลังตรวจสอบสิทธิ์...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex font-sans text-gray-900">
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className={cn(
                "flex-1 xl:ml-72 w-full transition-all duration-300 min-h-screen flex flex-col overflow-x-hidden",
                pathname.startsWith('/admin/pos')
                    ? "p-0 max-w-full"
                    : "pt-4 px-4 pb-24 md:pt-6 md:px-6 md:pb-24 lg:pt-8 lg:px-8 lg:pb-24 xl:pb-8 max-w-7xl mx-auto"
            )}>
                {children}
            </main>

            <AdminBottomNav onMenuClick={() => setIsSidebarOpen(true)} />
        </div>
    );
}
