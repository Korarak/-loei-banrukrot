'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';
import { useMyConversation } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/useAuthStore';
import ChatPanel from './ChatPanel';

export default function ChatLauncherButton() {
    const router = useRouter();
    const isCustomerAuthenticated = useAuthStore((state) => state.isCustomerAuthenticated);
    const [open, setOpen] = useState(false);
    const { data: conversation } = useMyConversation();
    const unreadCount = conversation?.unreadCount || 0;

    const handleClick = () => {
        if (!isCustomerAuthenticated()) {
            toast.error('กรุณาเข้าสู่ระบบเพื่อแชทกับร้านค้า');
            router.push('/customer-login');
            return;
        }
        setOpen(true);
    };

    return (
        <>
            <button
                onClick={handleClick}
                aria-label={unreadCount > 0 ? `เปิดแชท มีข้อความใหม่ ${unreadCount} รายการ` : 'เปิดแชท'}
                className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full bg-foreground text-white shadow-lg shadow-black/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
                <MessageCircle className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand text-brand-foreground text-[10px] font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <ChatPanel open={open} onOpenChange={setOpen} />
        </>
    );
}
