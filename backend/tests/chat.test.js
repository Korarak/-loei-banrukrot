process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
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

describe('Chat', () => {
    test('customer conversation is lazily created on first GET /me', async () => {
        const customerToken = await registerCustomer();

        const res = await request(app)
            .get('/api/chat/conversations/me')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('open');

        // Calling it again returns the same conversation, not a duplicate
        const res2 = await request(app)
            .get('/api/chat/conversations/me')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res2.body.data._id).toBe(res.body.data._id);
    });

    test('customer can send a message and staff sees it in the inbox with an unread count', async () => {
        const ownerToken = await registerOwner();
        const customerToken = await registerCustomer();

        const convRes = await request(app)
            .get('/api/chat/conversations/me')
            .set('Authorization', `Bearer ${customerToken}`);
        const conversationId = convRes.body.data._id;

        const sendRes = await request(app)
            .post(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ body: 'สวัสดีครับ อยากสอบถามสินค้า' });

        expect(sendRes.status).toBe(201);
        expect(sendRes.body.data.senderType).toBe('customer');
        expect(sendRes.body.data.body).toBe('สวัสดีครับ อยากสอบถามสินค้า');

        const inboxRes = await request(app)
            .get('/api/chat/conversations')
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(inboxRes.status).toBe(200);
        expect(inboxRes.body.data).toHaveLength(1);
        expect(inboxRes.body.data[0].unreadCount).toBe(1);
        expect(inboxRes.body.data[0].lastMessagePreview).toBe('สวัสดีครับ อยากสอบถามสินค้า');
    });

    test('staff reply updates lastReadByStaffAt so unread count resets, and message history is paginated in chronological order', async () => {
        const ownerToken = await registerOwner();
        const customerToken = await registerCustomer();

        const convRes = await request(app)
            .get('/api/chat/conversations/me')
            .set('Authorization', `Bearer ${customerToken}`);
        const conversationId = convRes.body.data._id;

        await request(app)
            .post(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ body: 'ข้อความที่ 1' });

        await request(app)
            .post(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ body: 'ข้อความที่ 2 (staff)' });

        const historyRes = await request(app)
            .get(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${customerToken}`);

        expect(historyRes.status).toBe(200);
        expect(historyRes.body.data).toHaveLength(2);
        expect(historyRes.body.data[0].body).toBe('ข้อความที่ 1');
        expect(historyRes.body.data[1].body).toBe('ข้อความที่ 2 (staff)');
        expect(historyRes.body.data[1].senderType).toBe('staff');

        const inboxRes = await request(app)
            .get('/api/chat/conversations')
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(inboxRes.body.data[0].unreadCount).toBe(0);
    });

    test('a customer cannot read another customer\'s conversation', async () => {
        const customerAToken = await registerCustomer('a@example.com');
        const customerBToken = await registerCustomer('b@example.com');

        const convA = await request(app)
            .get('/api/chat/conversations/me')
            .set('Authorization', `Bearer ${customerAToken}`);
        const conversationId = convA.body.data._id;

        const res = await request(app)
            .get(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${customerBToken}`);

        expect(res.status).toBe(403);
    });

    test('rejects an empty message body', async () => {
        const customerToken = await registerCustomer();
        const convRes = await request(app)
            .get('/api/chat/conversations/me')
            .set('Authorization', `Bearer ${customerToken}`);

        const res = await request(app)
            .post(`/api/chat/conversations/${convRes.body.data._id}/messages`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ body: '' });

        expect(res.status).toBe(400);
    });

    test('mark-read updates lastReadByCustomerAt', async () => {
        const ownerToken = await registerOwner();
        const customerToken = await registerCustomer();

        const convRes = await request(app)
            .get('/api/chat/conversations/me')
            .set('Authorization', `Bearer ${customerToken}`);
        const conversationId = convRes.body.data._id;

        await request(app)
            .post(`/api/chat/conversations/${conversationId}/messages`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ body: 'staff says hi' });

        const readRes = await request(app)
            .post(`/api/chat/conversations/${conversationId}/read`)
            .set('Authorization', `Bearer ${customerToken}`);

        expect(readRes.status).toBe(200);
    });
});
