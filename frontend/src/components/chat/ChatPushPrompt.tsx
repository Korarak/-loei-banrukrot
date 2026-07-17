'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/hooks/usePushSubscription';

const DISMISS_KEY = 'chatPushDismissedAt';
const DISMISS_DAYS = 30;

function isDismissedRecently() {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (Number.isNaN(dismissedAt)) return false;
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
}

export default function ChatPushPrompt() {
    const { permission, isSubscribed, isChecking, subscribe } = usePushSubscription();
    // Default true until mounted (avoids a hydration flash before localStorage can be read)
    const [dismissed, setDismissed] = useState(true);
    const [showIOSHint, setShowIOSHint] = useState(false);

    useEffect(() => {
        setDismissed(isDismissedRecently());
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setDismissed(true);
    };

    const handleEnable = async () => {
        const result = await subscribe();
        if (!result.ok) {
            if (result.reason === 'ios-not-standalone') {
                setShowIOSHint(true);
            } else if (result.reason === 'denied') {
                handleDismiss();
            }
        }
    };

    if (isChecking || dismissed || isSubscribed || permission === 'denied') return null;

    if (showIOSHint) {
        return (
            <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-800">
                <Bell className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="flex-1">
                    เพิ่มเว็บไซต์นี้ลงหน้าจอโฮม (แตะปุ่มแชร์ในซาฟารี แล้วเลือก &quot;เพิ่มไปยังหน้าจอโฮม&quot;) เพื่อรับการแจ้งเตือนแชท
                </p>
                <button onClick={handleDismiss} aria-label="ปิด" className="shrink-0">
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs">
            <Bell className="h-4 w-4 shrink-0 text-gray-500" />
            <p className="flex-1 text-gray-600">รับการแจ้งเตือนเมื่อร้านค้าตอบกลับ</p>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 shrink-0" onClick={handleEnable}>
                เปิดการแจ้งเตือน
            </Button>
            <button onClick={handleDismiss} aria-label="ปิด" className="shrink-0 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
