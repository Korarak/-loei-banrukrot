process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { Customer } = require('../models');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('POST /api/auth/register + /api/auth/login', () => {
    const credentials = { username: 'owner1', email: 'owner@example.com', password: 'secret123' };

    test('first registration succeeds and bootstraps the owner account', async () => {
        const res = await request(app).post('/api/auth/register').send(credentials);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.role).toBe('owner');
        expect(res.body.data.token).toBeTruthy();
    });

    test('second registration is rejected once an owner already exists', async () => {
        await request(app).post('/api/auth/register').send(credentials);

        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'owner2', email: 'owner2@example.com', password: 'secret123' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe('REGISTRATION_CLOSED');
    });

    test('login succeeds with correct credentials', async () => {
        await request(app).post('/api/auth/register').send(credentials);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: credentials.email, password: credentials.password });

        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeTruthy();
    });

    test('login fails with wrong password', async () => {
        await request(app).post('/api/auth/register').send(credentials);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: credentials.email, password: 'wrong-password' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

describe('GET /api/auth/registration-status', () => {
    test('reports open while no user exists', async () => {
        const res = await request(app).get('/api/auth/registration-status');

        expect(res.status).toBe(200);
        expect(res.body.data.open).toBe(true);
    });

    test('reports closed once the owner is bootstrapped', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'owner1', email: 'owner@example.com', password: 'secret123' });

        const res = await request(app).get('/api/auth/registration-status');

        expect(res.status).toBe(200);
        expect(res.body.data.open).toBe(false);
    });
});

describe('POST /api/auth/register-customer', () => {
    const payload = {
        firstName: 'Somchai',
        lastName: 'Jaidee',
        email: 'somchai@example.com',
        password: 'secret123',
        phone: '0812345678',
    };

    test('registers a customer and returns a token', async () => {
        const res = await request(app).post('/api/auth/register-customer').send(payload);

        expect(res.status).toBe(201);
        expect(res.body.data.token).toBeTruthy();
        expect(res.body.data.email).toBe(payload.email);
    });

    // กติกาเบอร์โทรของ frontend (frontend/src/lib/phone.ts) กับ backend ต้องตรงกัน
    // ไม่งั้นผู้ใช้ผ่านฟอร์มแล้วมาโดน 400 ตรงนี้
    test.each([
        ['9-digit landline', '042812345'],
        ['10-digit mobile with dashes', '081-234-5678'],
    ])('accepts %s', async (_label, phone) => {
        const res = await request(app)
            .post('/api/auth/register-customer')
            .send({ ...payload, phone });

        expect(res.status).toBe(201);
    });

    test.each([
        ['too short', '08123'],
        ['not starting with 0', '9812345678'],
        ['too long', '08123456789'],
    ])('rejects a phone number that is %s', async (_label, phone) => {
        const res = await request(app)
            .post('/api/auth/register-customer')
            .send({ ...payload, phone });

        expect(res.status).toBe(400);
    });

    test('strips separators before saving the phone number', async () => {
        await request(app)
            .post('/api/auth/register-customer')
            .send({ ...payload, phone: '081-234 5678' });

        const customer = await Customer.findOne({ email: payload.email });
        expect(customer.phone).toBe('0812345678');
    });

    test('rejects a duplicate email with EMAIL_EXISTS', async () => {
        await request(app).post('/api/auth/register-customer').send(payload);

        const res = await request(app).post('/api/auth/register-customer').send(payload);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    test('tells a Google-registered email to use Google instead', async () => {
        await Customer.create({
            firstName: 'Google',
            lastName: 'User',
            email: payload.email,
            provider: 'google',
            providerId: 'google-123',
        });

        const res = await request(app).post('/api/auth/register-customer').send(payload);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('ACCOUNT_USES_GOOGLE');
    });
});

describe('POST /api/auth/login-customer', () => {
    // บัญชี Google ไม่มี passwordHash — ก่อนหน้านี้ bcrypt.compare(password, undefined) throw กลายเป็น 500
    test('returns ACCOUNT_USES_GOOGLE instead of crashing for a passwordless account', async () => {
        await Customer.create({
            firstName: 'Google',
            lastName: 'User',
            email: 'google-user@example.com',
            provider: 'google',
            providerId: 'google-123',
        });

        const res = await request(app)
            .post('/api/auth/login-customer')
            .send({ email: 'google-user@example.com', password: 'whatever123' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('ACCOUNT_USES_GOOGLE');
    });

    test('logs in a password customer', async () => {
        await request(app).post('/api/auth/register-customer').send({
            firstName: 'Somchai',
            lastName: 'Jaidee',
            email: 'somchai@example.com',
            password: 'secret123',
            phone: '0812345678',
        });

        const res = await request(app)
            .post('/api/auth/login-customer')
            .send({ email: 'somchai@example.com', password: 'secret123' });

        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeTruthy();
    });
});
