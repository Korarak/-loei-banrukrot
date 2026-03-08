'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { getServerUrl } from '@/lib/utils';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            toast.error('Authentication failed');
            router.push('/customer-login');
            return;
        }

        if (token) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('customerToken', token);
            }

            fetch(`${getServerUrl()}/api/customer/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch profile');
                    return res.json();
                })
                .then(data => {
                    useAuthStore.getState().loginCustomer(data, token);
                    toast.success('Login successful!');

                    if (!data.phone) {
                        router.push('/profile?action=complete_profile');
                    } else {
                        router.push('/');
                    }
                })
                .catch(err => {
                    console.error(err);
                    toast.error('Failed to verify login');
                    router.push('/customer-login');
                });
        }
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-gray-500 font-medium">Authenticating...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}