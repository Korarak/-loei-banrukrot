// utils/webPush.js
const webpush = require('web-push');
const { PushSubscription } = require('../models');

let configured = false;
function ensureConfigured() {
    if (configured) return true;
    const { WEB_PUSH_VAPID_PUBLIC_KEY, WEB_PUSH_VAPID_PRIVATE_KEY, WEB_PUSH_VAPID_SUBJECT } = process.env;
    if (!WEB_PUSH_VAPID_PUBLIC_KEY || !WEB_PUSH_VAPID_PRIVATE_KEY || !WEB_PUSH_VAPID_SUBJECT) {
        return false; // push notifications simply don't fire until VAPID keys are configured
    }
    webpush.setVapidDetails(WEB_PUSH_VAPID_SUBJECT, WEB_PUSH_VAPID_PUBLIC_KEY, WEB_PUSH_VAPID_PRIVATE_KEY);
    configured = true;
    return true;
}

// Sends a push notification to every device an owner (User or Customer) has
// subscribed from. Prunes subscriptions the push service reports as gone
// (404/410) rather than letting them accumulate as permanently dead rows.
async function notifyOwner(ownerType, ownerId, payload) {
    if (!ensureConfigured()) return;

    const subscriptions = await PushSubscription.find({ ownerType, ownerId });
    if (subscriptions.length === 0) return;

    await Promise.allSettled(subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: sub.keys },
                JSON.stringify(payload)
            );
        } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
                await PushSubscription.deleteOne({ _id: sub._id });
            } else {
                console.error('web-push send failed:', err.statusCode, err.message);
            }
        }
    }));
}

module.exports = { notifyOwner };
