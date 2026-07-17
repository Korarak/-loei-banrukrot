'use client';

import { useEffect } from 'react';

// Mounted once in the root layout — present on both the customer storefront
// and the admin app, since push subscriptions and the service worker itself
// are per-origin, not per route-group.
export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('Service worker registration failed:', err);
            });
        }
    }, []);

    return null;
}
