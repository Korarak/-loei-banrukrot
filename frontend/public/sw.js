// public/sw.js
// Minimal service worker whose only job is receiving Web Push notifications —
// no offline caching, no fetch handler, no precache manifest. This is a
// deliberate scope choice: the app doesn't need offline support, only push
// delivery, so a caching framework (next-pwa/serwist) would be disproportionate.

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: 'บ้านรักรถเมืองเลย', body: event.data.text() };
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'บ้านรักรถเมืองเลย', {
            body: data.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: data.tag,
            data: { url: data.url || '/' },
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
