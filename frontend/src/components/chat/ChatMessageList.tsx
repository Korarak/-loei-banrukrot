'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import type { ChatMessage } from '@/hooks/useChat';

interface ChatMessageListProps {
    messages: ChatMessage[];
    /** senderType that renders as "own" message bubbles (right-aligned, dark) */
    selfSenderType: 'customer' | 'staff';
    isLoading?: boolean;
    emptyLabel?: string;
}

export default function ChatMessageList({ messages, selfSenderType, isLoading, emptyLabel = 'เริ่มต้นการสนทนา' }: ChatMessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 px-6 text-center">
                <MessageCircle className="h-10 w-10 opacity-30" />
                <p className="text-sm">{emptyLabel}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => {
                const isSelf = message.senderType === selfSenderType;
                const images = (message.attachments || []).filter((a) => a.type === 'image');
                return (
                    <div key={message._id} className={cn('flex flex-col', isSelf ? 'items-end' : 'items-start')}>
                        {!isSelf && (
                            <span className="text-[10px] font-bold text-gray-400 mb-0.5 px-1">{message.senderName}</span>
                        )}
                        {images.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-w-[80%] mb-1">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => window.open(getImageUrl(img.url), '_blank', 'noopener,noreferrer')}
                                        className="block h-32 w-32 rounded-xl overflow-hidden border border-gray-200"
                                        aria-label="เปิดรูปภาพขนาดเต็ม"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element -- variable-size chat bubble, not worth Next/Image's layout overhead */}
                                        <img src={getImageUrl(img.url)} alt="รูปที่แนบ" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                        {message.body && (
                            <div
                                className={cn(
                                    'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
                                    isSelf ? 'bg-foreground text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                )}
                            >
                                {message.body}
                            </div>
                        )}
                        <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                            {format(new Date(message.createdAt), 'HH:mm', { locale: th })}
                        </span>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
