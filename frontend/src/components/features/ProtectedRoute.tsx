'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: 'user' | 'customer' | 'any';
    redirectTo?: string;
}

export default function ProtectedRoute({
    children,
    requireAuth = 'any',
    redirectTo = '/login',
}: ProtectedRouteProps) {
    const router = useRouter();
    const isHydrated = useAuthStore((state) => state.isHydrated);
    const isUserAuthenticated = useAuthStore((state) => state.isUserAuthenticated());
    const isCustomerAuthenticated = useAuthStore((state) => state.isCustomerAuthenticated());

    useEffect(() => {
        if (!isHydrated) return;

        let isAuthorized = false;

        switch (requireAuth) {
            case 'user':
                isAuthorized = isUserAuthenticated;
                break;
            case 'customer':
                isAuthorized = isCustomerAuthenticated;
                break;
            case 'any':
                isAuthorized = isUserAuthenticated || isCustomerAuthenticated;
                break;
        }

        if (!isAuthorized) {
            router.push(redirectTo);
        }
    }, [isHydrated, isUserAuthenticated, isCustomerAuthenticated, requireAuth, redirectTo, router]);

    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    const isAuthorized =
        requireAuth === 'user'
            ? isUserAuthenticated
            : requireAuth === 'customer'
                ? isCustomerAuthenticated
                : isUserAuthenticated || isCustomerAuthenticated;

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}
