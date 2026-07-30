process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// ดัก mailer ไว้ตั้งแต่ก่อน require app — เทสต์ไม่ควรต้องมี SMTP จริง แต่ต้องเห็น token
// ที่ถูกส่งออกไป เพราะ token ถูกเก็บใน DB เป็น SHA-256 อ่านย้อนกลับไม่ได้
jest.mock('../utils/mailer', () => ({
    isMailEnabled: jest.fn(() => true),
    sendMail: jest.fn(async () => true),
    sendPasswordResetEmail: jest.fn(async () => true),
    sendVerificationEmail: jest.fn(async () => true),
}));

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { Customer } = require('../models');
const mailer = require('../utils/mailer');

const CUSTOMER = {
    firstName: 'Somchai',
    lastName: 'Jaidee',
    email: 'somchai@example.com',
    password: 'secret123',
    phone: '0812345678',
};

/** รอจน mock ถูกเรียกครบตามจำนวน — ใช้กับงานที่ controller ตั้งใจไม่ await */
async function waitForCall(mockFn, count = 1, timeoutMs = 2000) {
    const start = Date.now();
    while (mockFn.mock.calls.length < count) {
        if (Date.now() - start > timeoutMs) {
            throw new Error(`timed out waiting for ${count} call(s), got ${mockFn.mock.calls.length}`);
        }
        await new Promise((resolve) => setImmediate(resolve));
    }
}

async function registerCustomer() {
    const res = await request(app).post('/api/auth/register-customer').send(CUSTOMER);
    // การสมัครยิงเมลยืนยันแบบ fire-and-forget เพื่อไม่ให้ SMTP ช้ามาถ่วงการสมัคร
    // เทสต์จึงต้องรอให้มันวิ่งจบเอง ไม่งั้นจะอ่าน mock ตอนที่ยังไม่ถูกเรียก
    if (mailer.isMailEnabled()) await waitForCall(mailer.sendVerificationEmail, 1);
    return res;
}

/** token ตัวจริงอ่านได้จาก argument ที่ถูกส่งเข้า mailer เท่านั้น */
const lastToken = (mockFn) => mockFn.mock.calls[mockFn.mock.calls.length - 1][0].token;

beforeAll(async () => await connect());
afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    mailer.isMailEnabled.mockReturnValue(true);
});
afterAll(async () => await closeDatabase());

describe('POST /api/auth/forgot-password', () => {
    test('emails a reset link to an existing customer', async () => {
        await registerCustomer();

        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: CUSTOMER.email });

        expect(res.status).toBe(200);
        expect(mailer.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
        expect(mailer.sendPasswordResetEmail.mock.calls[0][0].to).toBe(CUSTOMER.email);
    });

    // ถ้าตอบต่างกันระหว่าง "มีบัญชี" กับ "ไม่มีบัญชี" endpoint นี้จะกลายเป็นเครื่องมือ
    // ไล่เช็คว่าอีเมลไหนเป็นลูกค้าร้านนี้
    test('answers identically for an unknown email and sends nothing', async () => {
        await registerCustomer();

        const known = await request(app).post('/api/auth/forgot-password').send({ email: CUSTOMER.email });
        jest.clearAllMocks();
        const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });

        expect(unknown.status).toBe(known.status);
        expect(unknown.body).toEqual(known.body);
        expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    test('sends nothing for a Google account that has no password', async () => {
        await Customer.create({
            firstName: 'Google', lastName: 'User',
            email: 'google-user@example.com', provider: 'google', providerId: 'g-1',
        });

        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'google-user@example.com' });

        expect(res.status).toBe(200);
        expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    test('never stores the raw token', async () => {
        await registerCustomer();
        await request(app).post('/api/auth/forgot-password').send({ email: CUSTOMER.email });

        const token = lastToken(mailer.sendPasswordResetEmail);
        const stored = await Customer.findOne({ email: CUSTOMER.email }).select('+passwordResetTokenHash');

        expect(stored.passwordResetTokenHash).toBeTruthy();
        expect(stored.passwordResetTokenHash).not.toBe(token);
    });
});

describe('POST /api/auth/reset-password', () => {
    async function requestReset() {
        await registerCustomer();
        await request(app).post('/api/auth/forgot-password').send({ email: CUSTOMER.email });
        return lastToken(mailer.sendPasswordResetEmail);
    }

    test('sets a new password that then works for login', async () => {
        const token = await requestReset();

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ token, password: 'brand-new-pw' });
        expect(res.status).toBe(200);

        const login = await request(app)
            .post('/api/auth/login-customer')
            .send({ email: CUSTOMER.email, password: 'brand-new-pw' });
        expect(login.status).toBe(200);
        expect(login.body.data.token).toBeTruthy();
    });

    test('invalidates the old password', async () => {
        const token = await requestReset();
        await request(app).post('/api/auth/reset-password').send({ token, password: 'brand-new-pw' });

        const login = await request(app)
            .post('/api/auth/login-customer')
            .send({ email: CUSTOMER.email, password: CUSTOMER.password });

        expect(login.status).toBe(401);
    });

    test('a token works only once', async () => {
        const token = await requestReset();
        await request(app).post('/api/auth/reset-password').send({ token, password: 'brand-new-pw' });

        const second = await request(app)
            .post('/api/auth/reset-password')
            .send({ token, password: 'another-pw' });

        expect(second.status).toBe(400);
        expect(second.body.code).toBe('INVALID_RESET_TOKEN');
    });

    test('rejects an expired token', async () => {
        const token = await requestReset();
        await Customer.updateOne(
            { email: CUSTOMER.email },
            { passwordResetExpires: new Date(Date.now() - 1000) }
        );

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ token, password: 'brand-new-pw' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_RESET_TOKEN');
    });

    test('rejects a made-up token', async () => {
        await requestReset();

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({ token: 'not-a-real-token', password: 'brand-new-pw' });

        expect(res.status).toBe(400);
    });

    // กดลิงก์จากอีเมลได้ = พิสูจน์แล้วว่าเป็นเจ้าของอีเมลจริง
    test('marks the email verified as a side effect', async () => {
        const token = await requestReset();
        await request(app).post('/api/auth/reset-password').send({ token, password: 'brand-new-pw' });

        const stored = await Customer.findOne({ email: CUSTOMER.email });
        expect(stored.emailVerified).toBe(true);
    });
});

describe('Email verification', () => {
    test('registration sends a verification email but still succeeds', async () => {
        const res = await registerCustomer();

        expect(res.status).toBe(201);
        expect(res.body.data.emailVerified).toBe(false);
        expect(mailer.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    test('registration still succeeds when SMTP is not configured', async () => {
        mailer.isMailEnabled.mockReturnValue(false);

        const res = await registerCustomer();

        expect(res.status).toBe(201);
        expect(mailer.sendVerificationEmail).not.toHaveBeenCalled();
    });

    test('a valid token verifies the email', async () => {
        await registerCustomer();
        const token = lastToken(mailer.sendVerificationEmail);

        const res = await request(app).post('/api/auth/verify-email').send({ token });

        expect(res.status).toBe(200);
        const stored = await Customer.findOne({ email: CUSTOMER.email });
        expect(stored.emailVerified).toBe(true);
    });

    test('the verification token works only once', async () => {
        await registerCustomer();
        const token = lastToken(mailer.sendVerificationEmail);
        await request(app).post('/api/auth/verify-email').send({ token });

        const second = await request(app).post('/api/auth/verify-email').send({ token });

        expect(second.status).toBe(400);
        expect(second.body.code).toBe('INVALID_VERIFICATION_TOKEN');
    });

    test('login reports the verification state', async () => {
        await registerCustomer();

        const before = await request(app)
            .post('/api/auth/login-customer')
            .send({ email: CUSTOMER.email, password: CUSTOMER.password });
        expect(before.body.data.emailVerified).toBe(false);

        await request(app)
            .post('/api/auth/verify-email')
            .send({ token: lastToken(mailer.sendVerificationEmail) });

        const after = await request(app)
            .post('/api/auth/login-customer')
            .send({ email: CUSTOMER.email, password: CUSTOMER.password });
        expect(after.body.data.emailVerified).toBe(true);
    });

    test('resend requires a logged-in customer', async () => {
        const res = await request(app).post('/api/auth/resend-verification');
        expect(res.status).toBe(401);
    });

    test('a logged-in customer can request a fresh link', async () => {
        const registered = await registerCustomer();
        jest.clearAllMocks();
        mailer.isMailEnabled.mockReturnValue(true);

        const res = await request(app)
            .post('/api/auth/resend-verification')
            .set('Authorization', `Bearer ${registered.body.data.token}`);

        expect(res.status).toBe(200);
        expect(mailer.sendVerificationEmail).toHaveBeenCalledTimes(1);
        // token ที่ส่งรอบใหม่ต้องใช้ยืนยันได้จริง
        const verify = await request(app)
            .post('/api/auth/verify-email')
            .send({ token: lastToken(mailer.sendVerificationEmail) });
        expect(verify.status).toBe(200);
    });

    // ยืนยันแบบ soft: ไม่ยืนยันก็ต้องล็อกอินและใช้งานได้ตามปกติ
    test('an unverified customer can still log in', async () => {
        await registerCustomer();

        const res = await request(app)
            .post('/api/auth/login-customer')
            .send({ email: CUSTOMER.email, password: CUSTOMER.password });

        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeTruthy();
    });
});
