process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { Product, ProductVariant, Category, StockMovement } = require('../models');

let ownerToken;

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

async function createProductWithVariant(sku, overrides = {}) {
    const product = await Product.create({
        productName: 'Test Product',
        shippingSize: 'small',
        categoryId: 1,
        isPos: true,
        isOnline: true,
        ...overrides
    });
    const variant = await ProductVariant.create({
        productId: product._id,
        sku,
        price: 100,
        stockAvailable: 10
    });
    return { product, variant };
}

function csvBuffer(rows) {
    const header = 'VariantID,SKU,ProductName,Category,Brand,Option1,Option2,Price,Stock,ShippingSize,IsActive,IsPos,IsOnline';
    return Buffer.from([header, ...rows].join('\n'), 'utf-8');
}

beforeEach(async () => {
    ownerToken = await registerOwner();
});

describe('POST /api/products/import/csv', () => {
    test('updates price and stock for a matched VariantID, and logs a StockMovement', async () => {
        const { variant } = await createProductWithVariant('SKU-1');

        const csv = csvBuffer([`${variant._id},SKU-1,,,,,,150,25,,,,`]);

        const res = await request(app)
            .post('/api/products/import/csv')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('file', csv, 'products.csv');

        expect(res.status).toBe(200);
        expect(res.body.data.updatedCount).toBe(1);
        expect(res.body.data.skippedCount).toBe(0);

        const updated = await ProductVariant.findById(variant._id);
        expect(updated.price).toBe(150);
        expect(updated.stockAvailable).toBe(25);

        const movements = await StockMovement.find({ variantId: variant._id });
        expect(movements).toHaveLength(1);
        expect(movements[0].type).toBe('adjustment');
        expect(movements[0].note).toBe('CSV import');
        expect(movements[0].quantityChange).toBe(15);
    });

    test('reports unknown VariantID as a skipped row without touching other rows', async () => {
        await createProductWithVariant('SKU-1');

        const csv = csvBuffer([`000000000000000000000000,SKU-DOES-NOT-EXIST,,,,,,150,25,,,,`]);

        const res = await request(app)
            .post('/api/products/import/csv')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('file', csv, 'products.csv');

        expect(res.status).toBe(200);
        expect(res.body.data.updatedCount).toBe(0);
        expect(res.body.data.skippedCount).toBe(1);
        expect(res.body.data.skipped[0].reason).toMatch(/VariantID not found/);
    });

    test('resolves Category by name and rejects unknown category names for the whole row', async () => {
        const category = await Category.create({ categoryId: 7, name: 'Engine Parts', slug: 'engine-parts' });
        const { product, variant } = await createProductWithVariant('SKU-1');

        const goodCsv = csvBuffer([`${variant._id},SKU-1,,Engine Parts,,,,,,,,,`]);
        const goodRes = await request(app)
            .post('/api/products/import/csv')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('file', goodCsv, 'products.csv');

        expect(goodRes.body.data.updatedCount).toBe(1);
        const updatedProduct = await Product.findById(product._id);
        expect(updatedProduct.categoryId).toBe(7);

        const badCsv = csvBuffer([`${variant._id},SKU-1,,Nonexistent Category,,,,999,,,,,`]);
        const badRes = await request(app)
            .post('/api/products/import/csv')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('file', badCsv, 'products.csv');

        expect(badRes.body.data.skippedCount).toBe(1);
        // Whole-row atomicity: Price must NOT have been applied even though it was valid
        const untouchedVariant = await ProductVariant.findById(variant._id);
        expect(untouchedVariant.price).toBe(100);
    });

    test('blank cells leave existing values unchanged', async () => {
        const { product, variant } = await createProductWithVariant('SKU-1', { brand: 'Acme' });

        const csv = csvBuffer([`${variant._id},SKU-1,,,,,,,5,,,,`]); // only Stock set

        const res = await request(app)
            .post('/api/products/import/csv')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('file', csv, 'products.csv');

        expect(res.status).toBe(200);
        expect(res.body.data.updatedCount).toBe(1);

        const updatedProduct = await Product.findById(product._id);
        const updatedVariant = await ProductVariant.findById(variant._id);
        expect(updatedProduct.brand).toBe('Acme'); // untouched
        expect(updatedVariant.price).toBe(100); // untouched
        expect(updatedVariant.stockAvailable).toBe(5); // changed
    });

    test('duplicate VariantID rows in one file apply deltas against the running value', async () => {
        const { variant } = await createProductWithVariant('SKU-1'); // starts at 10

        const csv = csvBuffer([
            `${variant._id},SKU-1,,,,,,,15,,,,`, // 10 -> 15
            `${variant._id},SKU-1,,,,,,,20,,,,`  // 15 -> 20
        ]);

        const res = await request(app)
            .post('/api/products/import/csv')
            .set('Authorization', `Bearer ${ownerToken}`)
            .attach('file', csv, 'products.csv');

        expect(res.status).toBe(200);
        expect(res.body.data.updatedCount).toBe(2);

        const updated = await ProductVariant.findById(variant._id);
        expect(updated.stockAvailable).toBe(20);

        const movements = await StockMovement.find({ variantId: variant._id }).sort({ createdAt: 1 });
        expect(movements).toHaveLength(2);
        expect(movements[0].quantityChange).toBe(5);
        expect(movements[1].quantityChange).toBe(5);
    });

    test('rejects a request with no file', async () => {
        const res = await request(app)
            .post('/api/products/import/csv')
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.status).toBe(400);
    });
});
