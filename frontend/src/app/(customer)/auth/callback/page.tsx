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

        // Clear token from URL immediately to prevent it leaking via history/referrer
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (error) {
            toast.error('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
            router.push('/customer-login');
            return;
        }

        if (token) {
            fetch(`${getServerUrl()}/api/customer/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch profile');
                    return res.json();
                })
                .then(response => {
                    const customer = response.data;
                    useAuthStore.getState().loginCustomer(customer, token);
                    toast.success('เข้าสู่ระบบสำเร็จ');

                    if (!customer.phone) {
                        router.push('/profile?action=complete_profile');
                    } else {
                        router.push('/');
                    }
                })
                .catch(err => {
                    console.error(err);
                    toast.error('ไม่สามารถยืนยันตัวตนได้ กรุณาเข้าสู่ระบบอีกครั้ง');
                    router.push('/customer-login');
                });
        }
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" role="status" aria-live="polite" />
                <p className="text-gray-500 font-medium">กำลังตรวจสอบสิทธิ์เข้าใช้งาน...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" role="status" aria-live="polite" />
                    <p className="text-gray-500 font-medium">กำลังโหลด...</p>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}