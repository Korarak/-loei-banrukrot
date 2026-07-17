'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { isIOS, isStandalone, urlBase64ToUint8Array } from '@/lib/pwa';

export interface SubscribeResult {
    ok: boolean;
    reason?: 'ios-not-standalone' | 'denied' | 'not-configured' | 'unsupported' | 'error';
}

// Shared by both the customer chat panel and the admin chat header — auth
// (which owner the subscription belongs to) is derived server-side from the
// JWT that lib/api.ts's interceptor already attaches, so this hook doesn't
// need to know whether it's running in the customer or staff context.
export function usePushSubscription() {
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function check() {
            if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
                setIsChecking(false);
                return;
            }
            setPermission(Notification.permission);
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (!cancelled) setIsSubscribed(!!subscription);
            } catch {
                // service worker not ready yet — leave isSubscribed false
            } finally {
                if (!cancelled) setIsChecking(false);
            }
        }
        check();
        return () => { cancelled = true; };
    }, []);

    const subscribe = useCallback(async (): Promise<SubscribeResult> => {
        if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            return { ok: false, reason: 'unsupported' };
        }
        if (isIOS() && !isStandalone()) {
            return { ok: false, reason: 'ios-not-standalone' };
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
            return { ok: false, reason: 'not-configured' };
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') {
            return { ok: false, reason: 'denied' };
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
            });

            await api.post('/push/subscribe', subscription.toJSON());
            setIsSubscribed(true);
            return { ok: true };
        } catch (err) {
            console.error('Push subscribe failed:', err);
            return { ok: false, reason: 'error' };
        }
    }, []);

    const unsubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
                await subscription.unsubscribe();
            }
        } finally {
            setIsSubscribed(false);
        }
    }, []);

    return { permission, isSubscribed, isChecking, subscribe, unsubscribe };
}
