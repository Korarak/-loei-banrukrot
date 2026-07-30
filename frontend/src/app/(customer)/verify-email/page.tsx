'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const updateCustomer = useAuthStore((state) => state.updateCustomer);
    const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');
    const [message, setMessage] = useState('');

    // React StrictMode ใน dev เรียก effect สองรอบ — token ใช้ได้ครั้งเดียว
    // ถ้ายิงซ้ำรอบสองจะเจอ "ลิงก์ถูกใช้ไปแล้ว" ทั้งที่เพิ่งสำเร็จ
    const firedRef = useRef(false);

    useEffect(() => {
        if (firedRef.current) return;
        firedRef.current = true;

        if (!token) {
            setState('error');
            setMessage('ลิงก์ไม่ถูกต้อง กรุณาเปิดจากอีเมลที่เราส่งให้');
            return;
        }

        api.post('/auth/verify-email', { token })
            .then(() => {
                setState('ok');
                updateCustomer({ emailVerified: true });
            })
            .catch((error) => {
                setState('error');
                setMessage(error.response?.data?.message || 'ยืนยันอีเมลไม่สำเร็จ');
            });
    }, [token, updateCustomer]);

    if (state === 'pending') {
        return (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm font-medium">กำลังยืนยันอีเมล...</span>
            </div>
        );
    }

    if (state === 'ok') {
        return (
            <div className="space-y-4 text-center py-6">
                <div className="mx-auto w-14 h-14 bg-gray-100 flex items-center justify-center">
                    <BadgeCheck className="h-6 w-6 text-gray-700" />
                </div>
                <p className="text-base font-bold text-gray-900">ยืนยันอีเมลเรียบร้อยแล้ว</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    ถ้าลืมรหัสผ่านในอนาคต คุณกู้บัญชีเองได้ผ่านอีเมลนี้แล้ว
                </p>
                <Button asChild className="w-full h-12 uppercase tracking-widest">
                    <Link href="/products">เลือกดูสินค้า</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 text-center py-6">
            <div className="mx-auto w-14 h-14 bg-gray-100 flex items-center justify-center">
                <TriangleAlert className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-base font-bold text-gray-900">ยืนยันอีเมลไม่สำเร็จ</p>
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
            <p className="text-xs text-gray-500">
                ขอลิงก์ใหม่ได้จากแบนเนอร์ด้านบนของหน้าร้านหลังเข้าสู่ระบบ
            </p>
            <Button asChild variant="outline" className="w-full h-12 uppercase tracking-widest">
                <Link href="/">กลับหน้าแรก</Link>
            </Button>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-8">
                    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />}>
                        <VerifyEmailContent />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
