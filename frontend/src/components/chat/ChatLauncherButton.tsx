'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyConversation } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/useAuthStore';
import ChatPanel from './ChatPanel';

const POSITION_STORAGE_KEY = 'chat-launcher-position';
const HINT_SEEN_STORAGE_KEY = 'chat-launcher-hint-seen';
const BUTTON_SIZE = 56; // h-14 w-14
const LONG_PRESS_MS = 350;
const DRAG_THRESHOLD_PX = 6;
const VIEWPORT_MARGIN = 8;

interface Position { x: number; y: number; }

function clampPosition(pos: Position): Position {
    const maxX = window.innerWidth - BUTTON_SIZE - VIEWPORT_MARGIN;
    const maxY = window.innerHeight - BUTTON_SIZE - VIEWPORT_MARGIN;
    return {
        x: Math.min(Math.max(pos.x, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, maxX)),
        y: Math.min(Math.max(pos.y, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, maxY)),
    };
}

export default function ChatLauncherButton() {
    const router = useRouter();
    const isCustomerAuthenticated = useAuthStore((state) => state.isCustomerAuthenticated);
    const [open, setOpen] = useState(false);
    const { data: conversation } = useMyConversation();
    const unreadCount = conversation?.unreadCount || 0;

    // Draggable position — null means "use the default bottom-right CSS spot".
    // Once the customer drags it once, we switch to explicit left/top and
    // remember it, since the default spot sometimes covers page content.
    const [position, setPosition] = useState<Position | null>(null);
    const [dragging, setDragging] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dragStartRef = useRef<{ pointerX: number; pointerY: number; posX: number; posY: number } | null>(null);
    const movedRef = useRef(false);
    const justDraggedRef = useRef(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(POSITION_STORAGE_KEY);
            if (saved) setPosition(clampPosition(JSON.parse(saved)));
        } catch {
            // malformed/old storage value — fall back to the default spot
        }
    }, []);

    // Re-clamp on resize/rotate so a previously-dragged button can't end up off-screen.
    useEffect(() => {
        if (!position) return;
        const handleResize = () => setPosition((p) => (p ? clampPosition(p) : p));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [position]);

    const dismissHint = useCallback(() => {
        setShowHint(false);
        localStorage.setItem(HINT_SEEN_STORAGE_KEY, '1');
    }, []);

    // One-time "there's a chat here" hint for first-time visitors — shown once,
    // auto-dismissed after a few seconds, then never shown again on this device.
    useEffect(() => {
        if (localStorage.getItem(HINT_SEEN_STORAGE_KEY)) return;
        const showTimer = setTimeout(() => setShowHint(true), 1200);
        return () => clearTimeout(showTimer);
    }, []);

    useEffect(() => {
        if (!showHint) return;
        const hideTimer = setTimeout(dismissHint, 6000);
        return () => clearTimeout(hideTimer);
    }, [showHint, dismissHint]);

    const handleClick = () => {
        if (justDraggedRef.current) {
            justDraggedRef.current = false;
            return;
        }
        dismissHint();
        if (!isCustomerAuthenticated()) {
            toast.error('กรุณาเข้าสู่ระบบเพื่อแชทกับร้านค้า');
            router.push('/customer-login');
            return;
        }
        setOpen(true);
    };

    const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        movedRef.current = false;
        const rect = buttonRef.current!.getBoundingClientRect();
        dragStartRef.current = { pointerX: e.clientX, pointerY: e.clientY, posX: rect.left, posY: rect.top };
        longPressTimer.current = setTimeout(() => {
            setDragging(true);
            setShowHint(false);
            buttonRef.current?.setPointerCapture(e.pointerId);
        }, LONG_PRESS_MS);
    };

    const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (!dragStartRef.current) return;
        const dx = e.clientX - dragStartRef.current.pointerX;
        const dy = e.clientY - dragStartRef.current.pointerY;

        if (!dragging) {
            // Finger/cursor moved before the long-press fired — treat as an
            // accidental brush rather than a drag, and don't start one.
            if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX && longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
                dragStartRef.current = null;
            }
            return;
        }

        movedRef.current = true;
        setPosition(clampPosition({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy }));
    };

    const endDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (dragging) {
            setDragging(false);
            if (movedRef.current) {
                justDraggedRef.current = true; // suppress the click that follows this pointerup
                setPosition((p) => {
                    if (p) localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(p));
                    return p;
                });
            }
            buttonRef.current?.releasePointerCapture(e.pointerId);
        }
        dragStartRef.current = null;
    };

    return (
        <>
            {showHint && !open && (
                <div
                    role="status"
                    onClick={dismissHint}
                    style={position ? { left: position.x - 140, top: position.y + 4 } : undefined}
                    className={cn(
                        'fixed z-40 flex items-center gap-1.5 rounded-full bg-foreground text-white text-xs font-medium pl-3 pr-2 py-2 shadow-lg shadow-black/20 cursor-pointer animate-in fade-in slide-in-from-bottom-1',
                        !position && 'bottom-[5.75rem] right-[4.75rem] md:bottom-[1.75rem] md:right-[4.75rem]'
                    )}
                >
                    แชทกับร้านค้าได้ที่นี่
                    <X className="h-3.5 w-3.5 opacity-70" />
                </div>
            )}

            <button
                ref={buttonRef}
                onClick={handleClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                aria-label={unreadCount > 0 ? `เปิดแชท มีข้อความใหม่ ${unreadCount} รายการ (แตะค้างเพื่อย้ายตำแหน่ง)` : 'เปิดแชท (แตะค้างเพื่อย้ายตำแหน่ง)'}
                style={position ? { left: position.x, top: position.y } : undefined}
                className={cn(
                    'fixed z-40 h-14 w-14 rounded-full bg-foreground text-white shadow-lg shadow-black/20 flex items-center justify-center transition-transform touch-none select-none',
                    !position && 'bottom-20 right-4 md:bottom-6 md:right-6',
                    dragging ? 'scale-110 shadow-xl' : 'hover:scale-105 active:scale-95'
                )}
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
