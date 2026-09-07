'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    useConversations,
    useChatMessages,
    useSendChatMessage,
    useMarkChatRead,
    useChatTyping,
    useCloseConversation,
    useReopenConversation,
    type Conversation,
    type ChatAttachment,
    type ChatMessage,
} from '@/hooks/useChat';
import { useChatSocket } from '@/hooks/useChatSocket';
import { playNotificationSound } from '@/lib/notificationSound';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatComposer from '@/components/chat/ChatComposer';
import ChatTypingIndicator from '@/components/chat/ChatTypingIndicator';
import PushToggleButton from '@/components/chat/PushToggleButton';

function customerName(conversation: Conversation) {
    if (!conversation.customerId || typeof conversation.customerId === 'string') return 'ลูกค้า';
    return `${conversation.customerId.firstName} ${conversation.customerId.lastName}`.trim();
}

function customerEmail(conversation: Conversation) {
    if (!conversation.customerId || typeof conversation.customerId === 'string') return '';
    return conversation.customerId.email || '';
}

const STATUS_TABS = [
    { value: 'open', label: 'เปิดอยู่' },
    { value: 'closed', label: 'ปิดแล้ว' },
    { value: 'all', label: 'ทั้งหมด' },
] as const;

export default function AdminChatPage() {
    const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>('open');
    const [search, setSearch] = useState('');
    const [unreadOnly, setUnreadOnly] = useState(false);
    const { data: conversations, isLoading: isLoadingList } = useConversations(statusFilter);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { socket, connected } = useChatSocket();
    const { data: messages, isLoading: isLoadingMessages } = useChatMessages(selectedId || undefined);
    const sendMessage = useSendChatMessage();
    const markRead = useMarkChatRead();
    const closeConversation = useCloseConversation();
    const reopenConversation = useReopenConversation();
    const { isOtherTyping, emitTyping } = useChatTyping(selectedId || undefined);

    const selectedConversation = conversations?.find((c) => c._id === selectedId);
    // Read inside the listener without re-subscribing on every selection change
    const selectedIdRef = useRef(selectedId);
    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    const hasFilters = search.trim().length > 0 || unreadOnly;
    const filteredConversations = (conversations || []).filter((c) => {
        if (unreadOnly && !(c.unreadCount && c.unreadCount > 0)) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            customerName(c).toLowerCase().includes(q) ||
            customerEmail(c).toLowerCase().includes(q) ||
            (c.lastMessagePreview || '').toLowerCase().includes(q)
        );
    });

    // Auto-select the first (most recent) conversation once the list loads —
    // desktop only. On mobile the list/thread panes are mutually exclusive
    // (see the layout below), so auto-selecting would skip straight past the
    // inbox list to a thread the admin never chose to open.
    useEffect(() => {
        if (!selectedId && conversations && conversations.length > 0) {
            const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches;
            if (isDesktop) setSelectedId(conversations[0]._id);
        }
    }, [conversations, selectedId]);

    // If the selected conversation drops out of the current filter (e.g. it
    // was just closed while viewing the "เปิดอยู่" tab), fall back to the list
    // rather than showing a stale thread the sidebar no longer highlights.
    useEffect(() => {
        if (selectedId && conversations && !conversations.some((c) => c._id === selectedId)) {
            setSelectedId(null);
        }
    }, [conversations, selectedId]);

    // Join/leave the conversation's socket room as the staff member opens/closes a thread.
    // Also re-join on 'connect' — socket.io reconnects the same client instance
    // after a drop, so this effect (keyed on selectedId, not the connection state)
    // never re-runs on its own and the thread room join would otherwise stay lost.
    useEffect(() => {
        if (!socket || !selectedId) return;
        const openThread = () => socket.emit('chat:thread:open', { conversationId: selectedId });
        openThread();
        socket.on('connect', openThread);
        if ((selectedConversation?.unreadCount || 0) > 0) {
            markRead.mutate(selectedId);
        }
        return () => {
            socket.off('connect', openThread);
            socket.emit('chat:thread:close', { conversationId: selectedId });
        };
    }, [socket, selectedId]);

    // Sound + toast for a new customer message in a thread that isn't the one
    // currently open — the open thread already updates live with no extra noise needed.
    useEffect(() => {
        if (!socket) return;
        const handler = (message: ChatMessage) => {
            if (message.senderType !== 'customer') return;
            if (message.conversationId === selectedIdRef.current) return;

            playNotificationSound();
            toast(message.senderName, {
                description: message.body || (message.attachments?.length ? '[รูปภาพ]' : ''),
                action: {
                    label: 'ดู',
                    onClick: () => setSelectedId(message.conversationId),
                },
            });
        };
        socket.on('chat:message:new', handler);
        return () => { socket.off('chat:message:new', handler); };
    }, [socket]);

    const handleSend = (body: string, attachments?: ChatAttachment[]) => {
        if (!selectedId) return;
        sendMessage.mutate({ conversationId: selectedId, body, attachments });
    };

    return (
        <div className="h-[calc(100vh-8rem)] xl:h-[calc(100vh-4rem)] flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {!connected && (
                <div className="shrink-0 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs font-medium px-4 py-1.5 text-center">
                    การเชื่อมต่อขาดหาย กำลังเชื่อมต่อใหม่... ข้อความอาจไม่อัปเดตแบบเรียลไทม์ชั่วคราว
                </div>
            )}
            <div className="flex-1 flex min-h-0">
                {/* Conversation list — full width on mobile until a thread is opened,
                    fixed sidebar width from sm: up where both panes show together. */}
                <div className={cn(
                    'w-full sm:w-80 border-r border-gray-100 flex-col shrink-0',
                    selectedId ? 'hidden sm:flex' : 'flex'
                )}>
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
                        <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            แชท
                        </h1>
                        <PushToggleButton />
                    </div>
                    <div className="p-3 border-b border-gray-100 space-y-2 shrink-0">
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ค้นหาชื่อ, อีเมล, ข้อความ..."
                                className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                                {STATUS_TABS.map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setStatusFilter(tab.value)}
                                        className={cn(
                                            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                                            statusFilter === tab.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={unreadOnly}
                                    onChange={(e) => setUnreadOnly(e.target.checked)}
                                    className="rounded"
                                />
                                ยังไม่อ่าน
                            </label>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingList ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-8 px-4">
                                {hasFilters ? 'ไม่พบการสนทนาที่ตรงกับตัวกรอง' : 'ยังไม่มีการสนทนา'}
                            </p>
                        ) : (
                            filteredConversations.map((c) => (
                                <button
                                    key={c._id}
                                    onClick={() => setSelectedId(c._id)}
                                    className={cn(
                                        'w-full flex items-start gap-3 p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors',
                                        selectedId === c._id && 'bg-gray-100 hover:bg-gray-100'
                                    )}
                                >
                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-sm text-gray-900 truncate">{customerName(c)}</span>
                                            {c.lastMessageAt && (
                                                <span className="text-[10px] text-gray-400 shrink-0">
                                                    {format(new Date(c.lastMessageAt), 'd MMM HH:mm', { locale: th })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {c.status === 'closed' && (
                                                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">ปิดแล้ว</span>
                                            )}
                                            <p className="text-xs text-gray-500 truncate">{c.lastMessagePreview || '—'}</p>
                                        </div>
                                    </div>
                                    {(c.unreadCount || 0) > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center shrink-0">
                                            {c.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Active thread — full width on mobile (in place of the list) once selected */}
                <div className={cn('flex-1 flex-col min-w-0', selectedId ? 'flex' : 'hidden sm:flex')}>
                    {selectedConversation ? (
                        <>
                            <div className="p-4 border-b border-gray-100 shrink-0 flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedId(null)}
                                    aria-label="กลับไปที่รายการสนทนา"
                                    className="sm:hidden -ml-1 p-1 text-gray-500 hover:text-gray-900"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <h2 className="font-bold text-gray-900 flex-1 truncate">{customerName(selectedConversation)}</h2>
                                {selectedConversation.status === 'closed' ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => reopenConversation.mutate(selectedConversation._id)}
                                        disabled={reopenConversation.isPending}
                                    >
                                        เปิดการสนทนาอีกครั้ง
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => closeConversation.mutate(selectedConversation._id)}
                                        disabled={closeConversation.isPending}
                                    >
                                        ปิดการสนทนา
                                    </Button>
                                )}
                            </div>
                            <ChatMessageList
                                messages={messages || []}
                                selfSenderType="staff"
                                isLoading={isLoadingMessages}
                                emptyLabel="ยังไม่มีข้อความในบทสนทนานี้"
                            />
                            {isOtherTyping && <ChatTypingIndicator />}
                            <ChatComposer onSend={handleSend} onTyping={emitTyping} isSending={sendMessage.isPending} />
                        </>
                    ) : (
                        <div className="flex-1 flex-col items-center justify-center text-gray-300 gap-2 hidden sm:flex">
                            <MessageCircle className="h-12 w-12 opacity-30" />
                            <p className="text-sm">เลือกการสนทนาเพื่อเริ่มตอบกลับ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
