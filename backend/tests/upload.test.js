process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { UPLOADS_BASE } = require('../middleware/upload');

let ownerToken;
const writtenFiles = [];

beforeAll(async () => await connect());
afterEach(async () => {
    await clearDatabase();
    // Clean up any files this suite wrote to the real uploads dir on disk.
    while (writtenFiles.length) {
        const file = writtenFiles.pop();
        try { fs.unlinkSync(file); } catch { /* already gone */ }
    }
});
afterAll(async () => await closeDatabase());

async function registerOwner() {
    const res = await request(app).post('/api/auth/register').send({
        username: 'owner1',
        email: 'owner@example.com',
        password: 'secret123'
    });
    return res.body.data.token;
}

async function makeSyntheticJpeg(width, height) {
    return sharp({
        create: { width, height, channels: 3, background: { r: 200, g: 100, b: 50 } }
    }).jpeg().toBuffer();
}

beforeEach(async () => {
    ownerToken = await registerOwner();
});

describe('POST /api/upload', () => {
    test('resizes a large image, returns webp path + blurDataURL, and writes a much smaller file to disk', async () => {
        const large = await makeSyntheticJpeg(4000, 3000);

        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('image', large, 'big-photo.jpg');

        expect(res.status).toBe(200);
        expect(res.body.data.imagePath).toMatch(/^\/uploads\/products\/file-.*\.webp$/);
        expect(res.body.data.blurDataURL).toMatch(/^data:image\/webp;base64,/);

        const diskPath = path.join(UPLOADS_BASE, res.body.data.imagePath.replace('/uploads/', ''));
        writtenFiles.push(diskPath);
        expect(fs.existsSync(diskPath)).toBe(true);

        const written = fs.readFileSync(diskPath);
        expect(written.length).toBeLessThan(large.length);

        const meta = await sharp(written).metadata();
        expect(meta.format).toBe('webp');
        expect(meta.width).toBeLessThanOrEqual(1920);
        expect(meta.height).toBeLessThanOrEqual(1920);
    });

    test('rejects a request with no file', async () => {
        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.status).toBe(400);
    });

    test('rejects a corrupt/unsupported image with 400, not 500', async () => {
        const garbage = Buffer.from('this is not a real jpeg file, just text pretending to be one');

        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('image', garbage, 'fake.jpg');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('rejects unauthenticated requests', async () => {
        const large = await makeSyntheticJpeg(500, 500);
        const res = await request(app).post('/api/upload').attach('image', large, 'photo.jpg');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/upload/profile', () => {
    test('resizes to the smaller profile-picture cap', async () => {
        const large = await makeSyntheticJpeg(3000, 3000);

        const res = await request(app)
            .post('/api/upload/profile')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('profile', large, 'avatar.jpg');

        expect(res.status).toBe(200);
        expect(res.body.data.imagePath).toMatch(/^\/uploads\/profiles\/file-.*\.webp$/);

        const diskPath = path.join(UPLOADS_BASE, res.body.data.imagePath.replace('/uploads/', ''));
        writtenFiles.push(diskPath);

        const meta = await sharp(fs.readFileSync(diskPath)).metadata();
        expect(meta.width).toBeLessThanOrEqual(512);
        expect(meta.height).toBeLessThanOrEqual(512);
    });
});
