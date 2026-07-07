process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');

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
