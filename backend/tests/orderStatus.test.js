process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { Order } = require('../models');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

async function registerOwner() {
    const res = await request(app).post('/api/auth/register').send({
        username: 'owner1',
        email: 'owner@example.com',
        password: 'secret123'
    });
    return res.body.data.token;
}

describe('PATCH /api/orders/:id/status — cancelled is terminal (stock double-restoration regression)', () => {
    test('rejects an invalid orderStatus value', async () => {
        const token = await registerOwner();
        const order = await Order.create({ source: 'pos', totalAmount: 100, orderStatus: 'pending' });

        const res = await request(app)
            .patch(`/api/orders/${order._id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ orderStatus: 'not-a-real-status' });

        expect(res.status).toBe(400);
    });

    test('rejects transitioning a cancelled order back to another status', async () => {
        const token = await registerOwner();
        const order = await Order.create({ source: 'pos', totalAmount: 100, orderStatus: 'cancelled' });

        const res = await request(app)
            .patch(`/api/orders/${order._id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ orderStatus: 'confirmed' });

        expect(res.status).toBe(400);

        const stillCancelled = await Order.findById(order._id);
        expect(stillCancelled.orderStatus).toBe('cancelled');
    });

    test('allows a normal, non-cancelled status transition', async () => {
        const token = await registerOwner();
        const order = await Order.create({ source: 'pos', totalAmount: 100, orderStatus: 'pending' });

        const res = await request(app)
            .patch(`/api/orders/${order._id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ orderStatus: 'confirmed' });

        expect(res.status).toBe(200);
        expect(res.body.data.orderStatus).toBe('confirmed');
    });
});
