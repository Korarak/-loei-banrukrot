import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatSocket, type ChatMessage, type ChatAttachment } from './useChatSocket';

export type { ChatMessage, ChatAttachment };

export interface Conversation {
    _id: string;
    customerId: { _id: string; firstName: string; lastName: string; email: string; profilePicture?: string } | string;
    status: 'open' | 'closed';
    lastMessageAt?: string;
    lastMessagePreview?: string;
    lastMessageSenderType?: 'customer' | 'staff';
    lastReadByCustomerAt?: string;
    lastReadByStaffAt?: string | null;
    unreadCount?: number;
}

// Staff inbox list — polled as a resilience fallback, plus a live socket
// listener below bumps it immediately when a new message arrives.
export function useConversations() {
    const query = useQuery<Conversation[]>({
        queryKey: ['chat', 'conversations'],
        queryFn: async () => (await api.get('/chat/conversations')).data.data,
        refetchInterval: 30_000,
    });

    const { socket } = useChatSocket();
    const queryClient = useQueryClient();
    useEffect(() => {
        if (!socket) return;
        const handler = () => queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        socket.on('chat:message:new', handler);
        return () => { socket.off('chat:message:new', handler); };
    }, [socket, queryClient]);

    return query;
}

// The current customer's own (lazily-created) conversation.
// Gated on auth (mirrors useCart's isAuth pattern) — the launcher button that
// uses this is visible to guests too, and must not fire an authenticated
// request that would trip lib/api.ts's 401 interceptor and bounce them.
export function useMyConversation() {
    const isCustomerAuthenticated = useAuthStore((state) => state.isCustomerAuthenticated);
    const isAuth = isCustomerAuthenticated();

    const query = useQuery<Conversation>({
        queryKey: ['chat', 'my-conversation'],
        queryFn: async () => (await api.get('/chat/conversations/me')).data.data,
        enabled: isAuth,
    });

    const { socket } = useChatSocket();
    const queryClient = useQueryClient();
    useEffect(() => {
        if (!socket) return;
        const handler = () => queryClient.invalidateQueries({ queryKey: ['chat', 'my-conversation'] });
        socket.on('chat:message:new', handler);
        return () => { socket.off('chat:message:new', handler); };
    }, [socket, queryClient]);

    return query;
}

export function useChatMessages(conversationId: string | undefined) {
    const query = useQuery<ChatMessage[]>({
        queryKey: ['chat', 'messages', conversationId],
        queryFn: async () => (await api.get(`/chat/conversations/${conversationId}/messages`)).data.data,
        enabled: !!conversationId,
    });

    // Live updates — append incoming messages straight into this same cache
    // entry, de-duping against the message the sender already appended
    // themselves (via the REST mutation's onSuccess below).
    const { socket } = useChatSocket();
    const queryClient = useQueryClient();
    useEffect(() => {
        if (!socket || !conversationId) return;
        const handler = (message: ChatMessage) => {
            if (message.conversationId !== conversationId) return;
            queryClient.setQueryData<ChatMessage[]>(['chat', 'messages', conversationId], (old) => {
                if (old?.some((m) => m._id === message._id)) return old;
                return old ? [...old, message] : [message];
            });
        };
        socket.on('chat:message:new', handler);
        return () => { socket.off('chat:message:new', handler); };
    }, [socket, conversationId, queryClient]);

    return query;
}

export function useSendChatMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ conversationId, body, attachments }: { conversationId: string; body: string; attachments?: ChatAttachment[] }) =>
            (await api.post(`/chat/conversations/${conversationId}/messages`, { body, attachments })).data.data as ChatMessage,
        onSuccess: (message, variables) => {
            queryClient.setQueryData<ChatMessage[]>(['chat', 'messages', variables.conversationId], (old) => {
                if (old?.some((m) => m._id === message._id)) return old;
                return old ? [...old, message] : [message];
            });
        },
    });
}

export function useMarkChatRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (conversationId: string) => api.post(`/chat/conversations/${conversationId}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'my-conversation'] });
        },
    });
}

// Uploads an image to attach to a chat message. Two-step flow: upload first
// (this hook) to get a URL, then include that URL in the attachments array
// passed to useSendChatMessage — matches how ProductForm's image manager works.
export function useUploadChatImage() {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('chatImage', file);
            const response = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': undefined },
            });
            return response.data.data as { url: string; blurDataURL: string };
        },
    });
}

// Ephemeral typing indicator — no persistence, just a live ping over the
// socket. emitTyping() is throttled client-side so a burst of keystrokes only
// sends one event per ~2s; the recipient's "typing" flag auto-clears if no
// further ping arrives within a few seconds (covers the case where the other
// side stops typing without sending, e.g. closes the tab).
export function useChatTyping(conversationId: string | undefined) {
    const { socket } = useChatSocket();
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSentRef = useRef(0);

    useEffect(() => {
        if (!socket || !conversationId) return;
        const handler = (data: { conversationId: string }) => {
            if (data.conversationId !== conversationId) return;
            setIsOtherTyping(true);
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
            clearTimerRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        };
        socket.on('chat:typing', handler);
        return () => {
            socket.off('chat:typing', handler);
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        };
    }, [socket, conversationId]);

    const emitTyping = useCallback(() => {
        if (!socket || !conversationId) return;
        const now = Date.now();
        if (now - lastSentRef.current < 2000) return;
        lastSentRef.current = now;
        socket.emit('chat:typing', { conversationId });
    }, [socket, conversationId]);

    return { isOtherTyping, emitTyping };
}
