process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { PushSubscription } = require('../models');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

async function registerOwner() {
    const res = await request(app).post('/api/auth/register').send({
        username: 'owner1', email: 'owner@example.com', password: 'secret123'
    });
    return { token: res.body.data.token, id: res.body.data.id };
}

async function registerCustomer() {
    const res = await request(app).post('/api/auth/register-customer').send({
        firstName: 'Test', lastName: 'Customer', email: 'cust1@example.com', password: 'secret123'
    });
    return { token: res.body.data.token, id: res.body.data._id };
}

const fakeSubscription = (n = 1) => ({
    endpoint: `https://push.example.com/endpoint-${n}`,
    keys: { p256dh: 'fake-p256dh-key', auth: 'fake-auth-key' }
});

describe('Push subscriptions', () => {
    test('customer can subscribe, and ownerType/ownerId are derived from the JWT, not the request body', async () => {
        const customer = await registerCustomer();

        const res = await request(app)
            .post('/api/push/subscribe')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ ...fakeSubscription(), ownerType: 'User', ownerId: 'attacker-controlled-id' });

        expect(res.status).toBe(201);

        const stored = await PushSubscription.findOne({ endpoint: fakeSubscription().endpoint });
        expect(stored.ownerType).toBe('Customer');
        expect(stored.ownerId.toString()).toBe(customer.id);
    });

    test('staff can subscribe as ownerType User', async () => {
        const owner = await registerOwner();

        const res = await request(app)
            .post('/api/push/subscribe')
            .set('Authorization', `Bearer ${owner.token}`)
            .send(fakeSubscription(2));

        expect(res.status).toBe(201);
        const stored = await PushSubscription.findOne({ endpoint: fakeSubscription(2).endpoint });
        expect(stored.ownerType).toBe('User');
        expect(stored.ownerId.toString()).toBe(owner.id);
    });

    test('re-subscribing with the same endpoint upserts rather than duplicating', async () => {
        const customer = await registerCustomer();
        const sub = fakeSubscription(3);

        await request(app).post('/api/push/subscribe').set('Authorization', `Bearer ${customer.token}`).send(sub);
        await request(app).post('/api/push/subscribe').set('Authorization', `Bearer ${customer.token}`).send(sub);

        const count = await PushSubscription.countDocuments({ endpoint: sub.endpoint });
        expect(count).toBe(1);
    });

    test('rejects a subscription missing required keys', async () => {
        const customer = await registerCustomer();

        const res = await request(app)
            .post('/api/push/subscribe')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ endpoint: 'https://push.example.com/bad', keys: { p256dh: '' } });

        expect(res.status).toBe(400);
    });

    test('unsubscribe removes the subscription', async () => {
        const customer = await registerCustomer();
        const sub = fakeSubscription(4);

        await request(app).post('/api/push/subscribe').set('Authorization', `Bearer ${customer.token}`).send(sub);
        const res = await request(app)
            .post('/api/push/unsubscribe')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ endpoint: sub.endpoint });

        expect(res.status).toBe(200);
        const stored = await PushSubscription.findOne({ endpoint: sub.endpoint });
        expect(stored).toBeNull();
    });

    test('rejects an unauthenticated subscribe request', async () => {
        const res = await request(app).post('/api/push/subscribe').send(fakeSubscription(5));
        expect(res.status).toBe(401);
    });
});
