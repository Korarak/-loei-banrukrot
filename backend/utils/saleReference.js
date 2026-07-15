// utils/saleReference.js
const { Counter } = require('../models');

// Formats "today" as YYYYMMDD in the shop's local business day (Asia/Bangkok),
// regardless of the server/container's system timezone (containers default to
// UTC, which is 7h behind — using toISOString() here would mislabel every
// order placed between 00:00-06:59 Bangkok time as the previous day).
function bangkokDateStr(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = (type) => parts.find(p => p.type === type).value;
    return `${get('year')}${get('month')}${get('day')}`;
}

// Atomically issues the next sale reference for the given prefix ('ORD' | 'POS'),
// e.g. ORD-20260712-0001. findOneAndUpdate's $inc is atomic in MongoDB, so
// concurrent requests on the same day can never receive the same number.
async function generateSaleReference(prefix) {
    const dateStr = bangkokDateStr(new Date());
    const key = `${prefix}-${dateStr}`;

    const counter = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const seqStr = String(counter.seq).padStart(4, '0');
    return `${key}-${seqStr}`;
}

module.exports = { generateSaleReference };
