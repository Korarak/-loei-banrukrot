process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const app = require('../app');
const { Product, ProductVariant, ShippingMethod } = require('../models');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

async function registerCustomer(email) {
    const res = await request(app).post('/api/auth/register-customer').send({
        firstName: 'Test',
        lastName: 'Customer',
        email,
        password: 'secret123'
    });
    return { id: res.body.data._id, token: res.body.data.token };
}

async function seedVariant({ sku, price = 100, stock = 5 }) {
    const product = await Product.create({ productName: `Product ${sku}` });
    const variant = await ProductVariant.create({
        productId: product._id,
        sku,
        price,
        stockAvailable: stock
    });
    return variant;
}

async function createAddress(customer) {
    const res = await request(app)
        .post(`/api/customer/${customer.id}/addresses`)
        .set('Authorization', `Bearer ${customer.token}`)
        .send({
            recipientName: 'Test',
            phone: '0800000000',
            streetAddress: '123 Real St',
            subDistrict: 'Kudpong',
            district: 'Muang',
            province: 'Loei',
            zipCode: '42000'
        });
    return res.body.data._id;
}

async function addToCart(customer, variantId, quantity) {
    return request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({ variantId, quantity });
}

async function getCart(customer) {
    const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customer.token}`);
    return res.body.data;
}

describe('Cart stock rules', () => {
    test('GET /cart exposes stockAvailable per item', async () => {
        const customer = await registerCustomer('cart1@example.com');
        const variant = await seedVariant({ sku: 'CART-1', stock: 7 });

        await addToCart(customer, variant._id, 2);
        const cart = await getCart(customer);

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].variant.stockAvailable).toBe(7);
    });

    test('adding again is rejected when combined quantity exceeds stock', async () => {
        const customer = await registerCustomer('cart2@example.com');
        const variant = await seedVariant({ sku: 'CART-2', stock: 5 });

        const first = await addToCart(customer, variant._id, 3);
        expect(first.status).toBe(201);

        // 3 in cart + 3 new = 6 > 5 — the old code only checked the new quantity
        const second = await addToCart(customer, variant._id, 3);
        expect(second.status).toBe(400);
        expect(second.body.message).toContain('คงเหลือ 5');
        expect(second.body.message).toContain('อยู่ในรถเข็นแล้ว 3');

        const cart = await getCart(customer);
        expect(cart.items[0].quantity).toBe(3);
    });

    test('updating quantity beyond stock is rejected with Thai message', async () => {
        const customer = await registerCustomer('cart3@example.com');
        const variant = await seedVariant({ sku: 'CART-3', stock: 4 });

        await addToCart(customer, variant._id, 2);
        const cart = await getCart(customer);
        const itemId = cart.items[0]._id;

        const overRes = await request(app)
            .put(`/api/cart/items/${itemId}`)
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ quantity: 9 });
        expect(overRes.status).toBe(400);
        expect(overRes.body.message).toContain('คงเหลือ 4');

        const okRes = await request(app)
            .put(`/api/cart/items/${itemId}`)
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ quantity: 4 });
        expect(okRes.status).toBe(200);
    });
});

describe('Create order with selected items (itemIds)', () => {
    async function checkoutSetup(customer) {
        const addressId = await createAddress(customer);
        const shipping = await ShippingMethod.create({
            name: 'Standard',
            price: 50,
            supportedSizes: ['small', 'large']
        });
        return { addressId, shippingId: shipping._id.toString() };
    }

    test('orders only selected items, unselected items stay in cart', async () => {
        const customer = await registerCustomer('order1@example.com');
        const variantA = await seedVariant({ sku: 'ORD-A', price: 100, stock: 5 });
        const variantB = await seedVariant({ sku: 'ORD-B', price: 200, stock: 5 });

        await addToCart(customer, variantA._id, 2);
        await addToCart(customer, variantB._id, 1);
        const cart = await getCart(customer);
        const itemA = cart.items.find(i => i.variant.sku === 'ORD-A');

        const { addressId, shippingId } = await checkoutSetup(customer);
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                shippingAddressId: addressId,
                shippingMethodId: shippingId,
                itemIds: [itemA._id]
            });

        expect(orderRes.status).toBe(201);
        // 2 × 100 + 50 shipping — variant B must not be charged
        expect(orderRes.body.data.totalAmount).toBe(250);

        const cartAfter = await getCart(customer);
        expect(cartAfter.items).toHaveLength(1);
        expect(cartAfter.items[0].variant.sku).toBe('ORD-B');

        const freshA = await ProductVariant.findById(variantA._id);
        const freshB = await ProductVariant.findById(variantB._id);
        expect(freshA.stockAvailable).toBe(3);
        expect(freshB.stockAvailable).toBe(5);
    });

    test('rejects when a selected item went out of stock, cart untouched', async () => {
        const customer = await registerCustomer('order2@example.com');
        const variant = await seedVariant({ sku: 'ORD-OOS', price: 100, stock: 2 });

        await addToCart(customer, variant._id, 2);
        const cart = await getCart(customer);

        // Someone else bought it all while our customer was browsing
        await ProductVariant.updateOne({ _id: variant._id }, { stockAvailable: 0 });

        const { addressId, shippingId } = await checkoutSetup(customer);
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                shippingAddressId: addressId,
                shippingMethodId: shippingId,
                itemIds: [cart.items[0]._id]
            });

        expect(orderRes.status).toBe(400);
        expect(orderRes.body.message).toContain('หมดสต็อก');

        const cartAfter = await getCart(customer);
        expect(cartAfter.items).toHaveLength(1);
    });

    test('without itemIds the whole cart is ordered (backward compat)', async () => {
        const customer = await registerCustomer('order3@example.com');
        const variantA = await seedVariant({ sku: 'ORD-ALL-A', price: 100, stock: 5 });
        const variantB = await seedVariant({ sku: 'ORD-ALL-B', price: 200, stock: 5 });

        await addToCart(customer, variantA._id, 1);
        await addToCart(customer, variantB._id, 1);

        const { addressId, shippingId } = await checkoutSetup(customer);
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({ shippingAddressId: addressId, shippingMethodId: shippingId });

        expect(orderRes.status).toBe(201);
        expect(orderRes.body.data.totalAmount).toBe(350);

        const cartAfter = await getCart(customer);
        expect(cartAfter.items).toHaveLength(0);
    });

    test("itemIds pointing at another customer's cart items order nothing", async () => {
        const victim = await registerCustomer('victim-cart@example.com');
        const attacker = await registerCustomer('attacker-cart@example.com');
        const variant = await seedVariant({ sku: 'ORD-IDOR', price: 100, stock: 5 });

        await addToCart(victim, variant._id, 1);
        const victimCart = await getCart(victim);

        // Attacker's own cart must exist but stays empty
        await getCart(attacker);

        const { addressId, shippingId } = await checkoutSetup(attacker);
        const orderRes = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${attacker.token}`)
            .send({
                shippingAddressId: addressId,
                shippingMethodId: shippingId,
                itemIds: [victimCart.items[0]._id]
            });

        expect(orderRes.status).toBe(400);

        const victimCartAfter = await getCart(victim);
        expect(victimCartAfter.items).toHaveLength(1);
    });
});
