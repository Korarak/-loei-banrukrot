'use client';

import { useState } from 'react';
import { MailWarning, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * แบนเนอร์เตือนยืนยันอีเมลแบบ soft — ไม่บล็อกการสั่งซื้อหรือการใช้งานใดๆ ทั้งสิ้น
 * ตั้งใจให้ปิดได้ ถ้าบังคับให้ยืนยันก่อนใช้งาน ยอดสมัครจะตกโดยไม่ได้อะไรกลับมา
 *
 * เช็ค `=== false` ไม่ใช่ falsy: ลูกค้าที่ล็อกอินค้างไว้ตั้งแต่ก่อนมีฟีเจอร์นี้จะไม่มีค่า
 * emailVerified ใน store เลย (undefined) — คนกลุ่มนี้ไม่ควรโดนเตือนทั้งที่เรายังไม่รู้สถานะจริง
 * จะได้ค่าที่ถูกต้องตอนเข้าสู่ระบบครั้งถัดไป
 */
export default function EmailVerificationBanner() {
    const customer = useAuthStore((state) => state.customer);
    const [dismissed, setDismissed] = useState(false);
    const [isSending, setIsSending] = useState(false);

    if (dismissed || customer?.emailVerified !== false) return null;

    const resend = async () => {
        setIsSending(true);
        try {
            const res = await api.post('/auth/resend-verification');
            toast.success('ส่งอีเมลยืนยันแล้ว', {
                description: res.data?.message || 'กรุณาตรวจสอบกล่องจดหมาย (และโฟลเดอร์ Spam)',
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'ส่งอีเมลยืนยันไม่สำเร็จ');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex items-center justify-center gap-3 bg-amber-50 border-y border-amber-200 text-amber-900 text-sm font-medium px-4 py-2.5">
            <MailWarning className="h-4 w-4 shrink-0" />
            <span className="text-center">
                ยังไม่ได้ยืนยันอีเมล — ยืนยันไว้เพื่อกู้บัญชีเองได้ถ้าลืมรหัสผ่าน
            </span>
            <button
                onClick={resend}
                disabled={isSending}
                className="font-bold underline underline-offset-4 hover:text-amber-950 disabled:opacity-50 shrink-0"
            >
                {isSending ? 'กำลังส่ง...' : 'ส่งอีเมลอีกครั้ง'}
            </button>
            <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-amber-100 shrink-0"
                aria-label="ปิดแจ้งเตือน"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
