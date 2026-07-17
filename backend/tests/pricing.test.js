const { applyDiscount } = require('../utils/pricing');

describe('applyDiscount', () => {
    test('returns the original price when discountPercent is 0, undefined, or omitted', () => {
        expect(applyDiscount(100, 0)).toBe(100);
        expect(applyDiscount(100, undefined)).toBe(100);
        expect(applyDiscount(100)).toBe(100);
    });

    test('applies a percentage discount', () => {
        expect(applyDiscount(100, 20)).toBe(80);
        expect(applyDiscount(200, 50)).toBe(100);
    });

    test('a 100% discount results in a free item', () => {
        expect(applyDiscount(150, 100)).toBe(0);
    });

    test('rounds to 2 decimal places to avoid floating-point noise', () => {
        expect(applyDiscount(99, 15)).toBe(84.15);
    });
});
