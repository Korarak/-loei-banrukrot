process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { Product, ProductVariant, Category, Order, OrderDetail } = require('../models');

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

async function createProductWithVariant(overrides = {}) {
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
        sku: `SKU-${product._id}`,
        price: 100,
        stockAvailable: 10
    });
    return { product, variant };
}

beforeEach(async () => {
    ownerToken = await registerOwner();
});

describe('PATCH /api/products/bulk-channel', () => {
    test('toggles isPos/isOnline for multiple products', async () => {
        const { product: p1 } = await createProductWithVariant();
        const { product: p2 } = await createProductWithVariant();

        const res = await request(app)
            .patch('/api/products/bulk-channel')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ productIds: [p1._id.toString(), p2._id.toString()], isPos: false });

        expect(res.status).toBe(200);
        expect(res.body.data.modifiedCount).toBe(2);

        const updated1 = await Product.findById(p1._id);
        const updated2 = await Product.findById(p2._id);
        expect(updated1.isPos).toBe(false);
        expect(updated2.isPos).toBe(false);
        expect(updated1.isOnline).toBe(true); // untouched
    });

    test('rejects when neither isPos nor isOnline is provided', async () => {
        const { product } = await createProductWithVariant();

        const res = await request(app)
            .patch('/api/products/bulk-channel')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ productIds: [product._id.toString()] });

        expect(res.status).toBe(400);
    });
});

describe('PATCH /api/products/bulk-category', () => {
    test('updates categoryId for multiple products', async () => {
        const category = await Category.create({ categoryId: 5, name: 'Parts', slug: 'parts' });
        const { product: p1 } = await createProductWithVariant();
        const { product: p2 } = await createProductWithVariant();

        const res = await request(app)
            .patch('/api/products/bulk-category')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ productIds: [p1._id.toString(), p2._id.toString()], categoryId: category.categoryId });

        expect(res.status).toBe(200);
        expect(res.body.data.modifiedCount).toBe(2);

        const updated1 = await Product.findById(p1._id);
        expect(updated1.categoryId).toBe(5);
    });

    test('404s when categoryId does not exist', async () => {
        const { product } = await createProductWithVariant();

        const res = await request(app)
            .patch('/api/products/bulk-category')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ productIds: [product._id.toString()], categoryId: 999 });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/products/bulk-delete', () => {
    test('deletes clean products and their variants', async () => {
        const { product: p1, variant: v1 } = await createProductWithVariant();
        const { product: p2 } = await createProductWithVariant();

        const res = await request(app)
            .delete('/api/products/bulk-delete')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ productIds: [p1._id.toString(), p2._id.toString()] });

        expect(res.status).toBe(200);
        expect(res.body.data.deletedCount).toBe(2);
        expect(res.body.data.skipped).toHaveLength(0);

        expect(await Product.findById(p1._id)).toBeNull();
        expect(await ProductVariant.findById(v1._id)).toBeNull();
    });

    test('skips products referenced in OrderDetail and deletes the rest', async () => {
        const { product: p1, variant: v1 } = await createProductWithVariant();
        const { product: p2 } = await createProductWithVariant();

        const order = await Order.create({ source: 'pos', totalAmount: 100, orderStatus: 'completed' });
        await OrderDetail.create({ orderId: order._id, variantId: v1._id, quantity: 1, pricePerUnit: 100, subtotal: 100 });

        const res = await request(app)
            .delete('/api/products/bulk-delete')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ productIds: [p1._id.toString(), p2._id.toString()] });

        expect(res.status).toBe(200);
        expect(res.body.data.deletedCount).toBe(1);
        expect(res.body.data.skipped).toHaveLength(1);
        expect(res.body.data.skipped[0].productId).toBe(p1._id.toString());

        expect(await Product.findById(p1._id)).not.toBeNull(); // preserved
        expect(await Product.findById(p2._id)).toBeNull(); // deleted
    });
});
