'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/useAuthStore';

export interface ChatAttachment {
    url: string;
    type: string;
}

export interface ChatMessage {
    _id: string;
    conversationId: string;
    senderType: 'customer' | 'staff';
    senderId: string;
    senderName: string;
    body: string;
    attachments?: ChatAttachment[];
    createdAt: string;
}

interface ChatSocketContextValue {
    socket: Socket | null;
    connected: boolean;
}

const ChatSocketContext = createContext<ChatSocketContextValue>({ socket: null, connected: false });

const socketOrigin = (() => {
    try {
        return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : '';
    } catch {
        return '';
    }
})();

export function ChatSocketProvider({ tokenType, children }: { tokenType: 'user' | 'customer'; children: ReactNode }) {
    // Deterministic per route-group, matching how lib/api.ts's interceptor
    // branches on path — avoids ambiguity if a browser happens to hold both
    // a staff and a customer session at once.
    const userToken = useAuthStore((s) => s.userToken);
    const customerToken = useAuthStore((s) => s.customerToken);
    const token = tokenType === 'user' ? userToken : customerToken;

    const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token || !socketOrigin) {
            setSocketInstance(null);
            setConnected(false);
            return;
        }

        const socket = io(socketOrigin, {
            auth: { token },
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on('connect_error', (err) => {
            setConnected(false);
            console.error('Chat socket connection error:', err.message);
        });

        setSocketInstance(socket);

        return () => {
            socket.disconnect();
            setSocketInstance(null);
        };
    }, [token]);

    return (
        <ChatSocketContext.Provider value={{ socket: socketInstance, connected }}>
            {children}
        </ChatSocketContext.Provider>
    );
}

export function useChatSocket() {
    return useContext(ChatSocketContext);
}
