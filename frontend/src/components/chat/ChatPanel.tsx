'use client';

import { useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useMyConversation, useChatMessages, useSendChatMessage, useMarkChatRead, useChatTyping, type ChatAttachment } from '@/hooks/useChat';
import ChatMessageList from './ChatMessageList';
import ChatComposer from './ChatComposer';
import ChatPushPrompt from './ChatPushPrompt';
import ChatTypingIndicator from './ChatTypingIndicator';
import { MessageCircle } from 'lucide-react';

interface ChatPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
    const { data: conversation } = useMyConversation();
    const { data: messages, isLoading } = useChatMessages(conversation?._id);
    const sendMessage = useSendChatMessage();
    const markRead = useMarkChatRead();
    const { isOtherTyping, emitTyping } = useChatTyping(conversation?._id);

    useEffect(() => {
        if (open && conversation?._id && (conversation.unreadCount || 0) > 0) {
            markRead.mutate(conversation._id);
        }
    }, [open, conversation?._id]);

    const handleSend = (body: string, attachments?: ChatAttachment[]) => {
        if (!conversation?._id) return;
        sendMessage.mutate({ conversationId: conversation._id, body, attachments });
    };

    // Only offer the notification prompt once the customer has actually engaged
    // in the conversation (sent a message, this session or a past one) — not
    // the instant they open the panel for the first time.
    const hasSentMessage = messages?.some((m) => m.senderType === 'customer') ?? false;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="p-0 flex flex-col w-full sm:max-w-md">
                <SheetHeader className="border-b px-4 py-3 shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <MessageCircle className="h-5 w-5" />
                        แชทกับร้านค้า
                    </SheetTitle>
                </SheetHeader>

                <ChatMessageList
                    messages={messages || []}
                    selfSenderType="customer"
                    isLoading={isLoading}
                    emptyLabel="มีคำถามเกี่ยวกับสินค้า? พิมพ์ข้อความถึงเราได้เลย"
                />

                {isOtherTyping && <ChatTypingIndicator />}
                {hasSentMessage && <ChatPushPrompt />}
                <ChatComposer onSend={handleSend} onTyping={emitTyping} isSending={sendMessage.isPending} />
            </SheetContent>
        </Sheet>
    );
}
