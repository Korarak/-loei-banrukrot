'use client';

import { Bell, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/hooks/usePushSubscription';

export default function PushToggleButton() {
    const { isSubscribed, isChecking, subscribe, unsubscribe } = usePushSubscription();

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
            toast.success('ปิดการแจ้งเตือนแล้ว');
            return;
        }

        const result = await subscribe();
        if (result.ok) {
            toast.success('เปิดการแจ้งเตือนแล้ว');
        } else if (result.reason === 'denied') {
            toast.error('ไม่ได้รับอนุญาตให้แจ้งเตือน', { description: 'กรุณาเปิดสิทธิ์การแจ้งเตือนในตั้งค่าเบราว์เซอร์' });
        } else if (result.reason === 'ios-not-standalone') {
            toast.error('ต้องเพิ่มเว็บไซต์นี้ลงหน้าจอโฮมก่อน', { description: 'แตะปุ่มแชร์ในซาฟารี แล้วเลือก "เพิ่มไปยังหน้าจอโฮม"' });
        } else {
            toast.error('ไม่สามารถเปิดการแจ้งเตือนได้');
        }
    };

    if (isChecking) return null;

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={handleToggle}
            aria-label={isSubscribed ? 'ปิดการแจ้งเตือน' : 'เปิดการแจ้งเตือน'}
            className={isSubscribed ? 'text-primary border-primary/30 bg-primary/5' : ''}
        >
            {isSubscribed ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </Button>
    );
}
