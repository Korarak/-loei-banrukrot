process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('PUT /api/users/me — self-service password change', () => {
    const credentials = { username: 'owner1', email: 'owner@example.com', password: 'secret123' };

    test('rejects a new password with no currentPassword', async () => {
        const register = await request(app).post('/api/auth/register').send(credentials);
        const token = register.body.data.token;

        const res = await request(app)
            .put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'newpassword456' });

        // 400, not 401 — the frontend interceptor logs the user out on 401/403
        expect(res.status).toBe(400);

        const login = await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
        expect(login.status).toBe(200);
    });

    test('rejects a wrong currentPassword', async () => {
        const register = await request(app).post('/api/auth/register').send(credentials);
        const token = register.body.data.token;

        const res = await request(app)
            .put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'newpassword456', currentPassword: 'wrong-old-password' });

        expect(res.status).toBe(400);
    });

    test('accepts a correct currentPassword and rotates it', async () => {
        const register = await request(app).post('/api/auth/register').send(credentials);
        const token = register.body.data.token;

        const res = await request(app)
            .put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'newpassword456', currentPassword: credentials.password });

        expect(res.status).toBe(200);

        const oldLogin = await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
        expect(oldLogin.status).toBe(401);

        const newLogin = await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'newpassword456' });
        expect(newLogin.status).toBe(200);
    });
});

describe('PUT /api/customer/:id — self-service password change', () => {
    async function registerCustomer(email) {
        const res = await request(app).post('/api/auth/register-customer').send({
            firstName: 'Test',
            lastName: 'Customer',
            email,
            password: 'secret123'
        });
        return { id: res.body.data._id, token: res.body.data.token };
    }

    test('rejects a new password with no currentPassword', async () => {
        const customer = await registerCustomer('customer@example.com');

        const res = await request(app)
            .put(`/api/customer/${customer.id}`)
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ password: 'newpassword456' });

        expect(res.status).toBe(400);
    });

    test('accepts a correct currentPassword and rotates it', async () => {
        const customer = await registerCustomer('customer2@example.com');

        const res = await request(app)
            .put(`/api/customer/${customer.id}`)
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ password: 'newpassword456', currentPassword: 'secret123' });

        expect(res.status).toBe(200);

        const newLogin = await request(app).post('/api/auth/login-customer').send({ email: 'customer2@example.com', password: 'newpassword456' });
        expect(newLogin.status).toBe(200);
    });

    test('staff resetting a customer password does not need currentPassword', async () => {
        const owner = await request(app).post('/api/auth/register').send({ username: 'owner2', email: 'owner2@example.com', password: 'secret123' });
        const ownerToken = owner.body.data.token;
        const customer = await registerCustomer('customer3@example.com');

        const res = await request(app)
            .put(`/api/customer/${customer.id}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ password: 'staffresetpw789' });

        expect(res.status).toBe(200);

        const newLogin = await request(app).post('/api/auth/login-customer').send({ email: 'customer3@example.com', password: 'staffresetpw789' });
        expect(newLogin.status).toBe(200);
    });
});
