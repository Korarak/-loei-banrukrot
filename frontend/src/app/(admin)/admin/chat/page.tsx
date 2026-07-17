'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConversations, useChatMessages, useSendChatMessage, useMarkChatRead, useChatTyping, type Conversation, type ChatAttachment, type ChatMessage } from '@/hooks/useChat';
import { useChatSocket } from '@/hooks/useChatSocket';
import { playNotificationSound } from '@/lib/notificationSound';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatComposer from '@/components/chat/ChatComposer';
import ChatTypingIndicator from '@/components/chat/ChatTypingIndicator';
import PushToggleButton from '@/components/chat/PushToggleButton';

function customerName(conversation: Conversation) {
    if (typeof conversation.customerId === 'string') return 'ลูกค้า';
    return `${conversation.customerId.firstName} ${conversation.customerId.lastName}`.trim();
}

export default function AdminChatPage() {
    const { data: conversations, isLoading: isLoadingList } = useConversations();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { socket } = useChatSocket();
    const { data: messages, isLoading: isLoadingMessages } = useChatMessages(selectedId || undefined);
    const sendMessage = useSendChatMessage();
    const markRead = useMarkChatRead();
    const { isOtherTyping, emitTyping } = useChatTyping(selectedId || undefined);

    const selectedConversation = conversations?.find((c) => c._id === selectedId);
    // Read inside the listener without re-subscribing on every selection change
    const selectedIdRef = useRef(selectedId);
    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    // Auto-select the first (most recent) conversation once the list loads
    useEffect(() => {
        if (!selectedId && conversations && conversations.length > 0) {
            setSelectedId(conversations[0]._id);
        }
    }, [conversations, selectedId]);

    // Join/leave the conversation's socket room as the staff member opens/closes a thread
    useEffect(() => {
        if (!socket || !selectedId) return;
        socket.emit('chat:thread:open', { conversationId: selectedId });
        if ((selectedConversation?.unreadCount || 0) > 0) {
            markRead.mutate(selectedId);
        }
        return () => {
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
        <div className="h-[calc(100vh-8rem)] xl:h-[calc(100vh-4rem)] flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Conversation list */}
            <div className="w-full sm:w-80 border-r border-gray-100 flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
                    <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        แชท
                    </h1>
                    <PushToggleButton />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoadingList ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
                        </div>
                    ) : conversations?.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-8 px-4">ยังไม่มีการสนทนา</p>
                    ) : (
                        conversations?.map((c) => (
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
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessagePreview || '—'}</p>
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

            {/* Active thread */}
            <div className="hidden sm:flex flex-1 flex-col min-w-0">
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b border-gray-100 shrink-0">
                            <h2 className="font-bold text-gray-900">{customerName(selectedConversation)}</h2>
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
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                        <MessageCircle className="h-12 w-12 opacity-30" />
                        <p className="text-sm">เลือกการสนทนาเพื่อเริ่มตอบกลับ</p>
                    </div>
                )}
            </div>
        </div>
    );
}
