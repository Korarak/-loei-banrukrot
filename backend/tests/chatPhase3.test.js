process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { UPLOADS_BASE } = require('../middleware/upload');

const writtenFiles = [];

beforeAll(async () => await connect());
afterEach(async () => {
    await clearDatabase();
    while (writtenFiles.length) {
        const file = writtenFiles.pop();
        try { fs.unlinkSync(file); } catch { /* already gone */ }
    }
});
afterAll(async () => await closeDatabase());

async function registerOwner() {
    const res = await request(app).post('/api/auth/register').send({
        username: 'owner1', email: 'owner@example.com', password: 'secret123'
    });
    return res.body.data.token;
}

async function registerCustomer(email = 'cust1@example.com') {
    const res = await request(app).post('/api/auth/register-customer').send({
        firstName: 'Test', lastName: 'Customer', email, password: 'secret123'
    });
    return res.body.data.token;
}

async function makeSyntheticJpeg(width, height) {
    return sharp({
        create: { width, height, channels: 3, background: { r: 200, g: 100, b: 50 } }
    }).jpeg().toBuffer();
}

describe('POST /api/chat/upload', () => {
    test('customer can upload a chat image and gets back a resized webp + blur placeholder', async () => {
        const customerToken = await registerCustomer();
        const large = await makeSyntheticJpeg(3000, 2000);

        const res = await request(app)
            .post('/api/chat/upload')
            .set('Authorization', `Bearer ${customerToken}`)
            .attach('chatImage', large, 'photo.jpg');

        expect(res.status).toBe(200);
        expect(res.body.data.url).toMatch(/^\/uploads\/chat\/chat-.*\.webp$/);
        expect(res.body.data.blurDataURL).toMatch(/^data:image\/webp;base64,/);

        const diskPath = path.join(UPLOADS_BASE, res.body.data.url.replace('/uploads/', ''));
        writtenFiles.push(diskPath);
        expect(fs.existsSync(diskPath)).toBe(true);

        const meta = await sharp(fs.readFileSync(diskPath)).metadata();
        expect(meta.width).toBeLessThanOrEqual(1280);
        expect(meta.height).toBeLessThanOrEqual(1280);
    });

    test('staff can also upload a chat image (not staff-only, unlike POST /api/upload)', async () => {
        const ownerToken = await registerOwner();
        const img = await makeSyntheticJpeg(500, 500);

        const res = await request(app)
            .post('/api/chat/upload')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('chatImage', img, 'photo.jpg');

        expect(res.status).toBe(200);
        const diskPath = path.join(UPLOADS_BASE, res.body.data.url.replace('/uploads/', ''));
        writtenFiles.push(diskPath);
    });

    test('rejects unauthenticated requests', async () => {
        const img = await makeSyntheticJpeg(500, 500);
        const res = await request(app).post('/api/chat/upload').attach('chatImage', img, 'photo.jpg');
        expect(res.status).toBe(401);
    });
});

describe('Sending messages with attachments', () => {
    async function getMyConversationId(token) {
        const res = await request(app)
            .get('/api/chat/conversations/me')
            .set('Authorization', `Bearer ${token}`);
        return res.body.data._id;
    }

    test('an image-only message (no body text) is accepted, and the conversation preview shows [รูปภาพ]', async () => {
        const customerToken = await registerCustomer();
        const conversationId = await getMyConversationId(customerToken);

        const res = await request(app)
            .post(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ attachments: [{ url: '/uploads/chat/fake.webp', type: 'image' }] });

        expect(res.status).toBe(201);
        expect(res.body.data.body).toBe('');
        expect(res.body.data.attachments).toHaveLength(1);

        const ownerToken = await registerOwner();
        const inboxRes = await request(app)
            .get('/api/chat/conversations')
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(inboxRes.body.data[0].lastMessagePreview).toBe('[รูปภาพ]');
    });

    test('rejects a message with neither body nor attachments', async () => {
        const customerToken = await registerCustomer();
        const conversationId = await getMyConversationId(customerToken);

        const res = await request(app)
            .post(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('Rate limiting on chat message send', () => {
    test('blocks a burst of more than 15 messages within the 10s window', async () => {
        const customerToken = await registerCustomer();
        const conversationId = await (async () => {
            const res = await request(app)
                .get('/api/chat/conversations/me')
                .set('Authorization', `Bearer ${customerToken}`);
            return res.body.data._id;
        })();

        const results = [];
        for (let i = 0; i < 17; i++) {
            const res = await request(app)
                .post(`/api/chat/conversations/${conversationId}/messages`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ body: `message ${i}` });
            results.push(res.status);
        }

        const successCount = results.filter((s) => s === 201).length;
        const blockedCount = results.filter((s) => s === 429).length;

        expect(successCount).toBe(15);
        expect(blockedCount).toBe(2);
    });
});
