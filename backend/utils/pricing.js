// utils/pricing.js
// Applies a product's discountPercent (0-100) to a variant's base price.
// Result is rounded to 2 decimal places to avoid floating-point noise (e.g. 99 * 0.85).
const applyDiscount = (price, discountPercent = 0) => {
    if (!discountPercent) return price;
    return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
};

module.exports = { applyDiscount };
