const { connect, closeDatabase, clearDatabase } = require('./setup/memoryDb');
const { Product, ProductVariant, StockMovement } = require('../models');
const { changeStock, deductStock, addStock } = require('../utils/stockUtils');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

async function createVariant(stockAvailable = 10) {
    const product = await Product.create({ productName: 'Test Product', shippingSize: 'small' });
    return ProductVariant.create({
        productId: product._id,
        sku: `SKU-${Date.now()}-${Math.random()}`,
        price: 100,
        stockAvailable
    });
}

describe('stockUtils', () => {
    test('deductStock lowers stockAvailable and logs a StockMovement', async () => {
        const variant = await createVariant(10);

        const { variant: updated, movement } = await deductStock(
            variant._id, 3, 'sale_pos', null, null, null
        );

        expect(updated.stockAvailable).toBe(7);
        expect(movement.quantityChange).toBe(-3);
        expect(movement.stockBefore).toBe(10);
        expect(movement.stockAfter).toBe(7);
        expect(movement.type).toBe('sale_pos');

        const persisted = await ProductVariant.findById(variant._id);
        expect(persisted.stockAvailable).toBe(7);

        const movements = await StockMovement.find({ variantId: variant._id });
        expect(movements).toHaveLength(1);
    });

    test('addStock raises stockAvailable and logs a positive StockMovement', async () => {
        const variant = await createVariant(5);

        const { variant: updated, movement } = await addStock(
            variant._id, 20, 'stock_in', null, null, null
        );

        expect(updated.stockAvailable).toBe(25);
        expect(movement.quantityChange).toBe(20);
        expect(movement.stockBefore).toBe(5);
        expect(movement.stockAfter).toBe(25);
    });

    test('deductStock throws and leaves stock untouched when insufficient', async () => {
        const variant = await createVariant(2);

        await expect(
            deductStock(variant._id, 5, 'sale_pos', null, null, null)
        ).rejects.toThrow(/Insufficient stock/);

        const persisted = await ProductVariant.findById(variant._id);
        expect(persisted.stockAvailable).toBe(2);

        const movements = await StockMovement.find({ variantId: variant._id });
        expect(movements).toHaveLength(0);
    });

    test('changeStock throws for a non-existent variant', async () => {
        const fakeId = new (require('mongoose').Types.ObjectId)();
        await expect(
            changeStock(fakeId, -1, 'adjustment', null, null, null)
        ).rejects.toThrow(/not found/);
    });
});
