const {
    Order, OrderDetail, Payment,
    Product, ProductVariant, ProductImage, StockMovement, Category,
    Customer, CustomerAddress, Cart, CartItem,
} = require('../models');

// DELETE /api/settings/reset/orders  — ล้างคำสั่งซื้อ + payments
exports.truncateOrders = async (req, res, next) => {
    try {
        const [orders, details, payments] = await Promise.all([
            Order.deleteMany({}),
            OrderDetail.deleteMany({}),
            Payment.deleteMany({}),
        ]);
        res.json({
            success: true,
            message: 'ลบคำสั่งซื้อทั้งหมดแล้ว',
            deleted: { orders: orders.deletedCount, details: details.deletedCount, payments: payments.deletedCount },
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/settings/reset/products  — ล้างสินค้า + stock movements (เก็บ category)
exports.truncateProducts = async (req, res, next) => {
    try {
        const [products, variants, images, stock] = await Promise.all([
            Product.deleteMany({}),
            ProductVariant.deleteMany({}),
            ProductImage.deleteMany({}),
            StockMovement.deleteMany({}),
        ]);
        res.json({
            success: true,
            message: 'ลบสินค้าทั้งหมดแล้ว',
            deleted: { products: products.deletedCount, variants: variants.deletedCount, images: images.deletedCount, stock: stock.deletedCount },
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/settings/reset/categories  — ล้างหมวดหมู่
exports.truncateCategories = async (req, res, next) => {
    try {
        const result = await Category.deleteMany({});
        res.json({ success: true, message: 'ลบหมวดหมู่ทั้งหมดแล้ว', deleted: result.deletedCount });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/settings/reset/customers  — ล้างลูกค้า + cart
exports.truncateCustomers = async (req, res, next) => {
    try {
        const [customers, addresses, carts, cartItems] = await Promise.all([
            Customer.deleteMany({}),
            CustomerAddress.deleteMany({}),
            Cart.deleteMany({}),
            CartItem.deleteMany({}),
        ]);
        res.json({
            success: true,
            message: 'ลบข้อมูลลูกค้าทั้งหมดแล้ว',
            deleted: { customers: customers.deletedCount, addresses: addresses.deletedCount, carts: carts.deletedCount, cartItems: cartItems.deletedCount },
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/settings/reset/all  — เริ่มต้นใหม่ทั้งหมด (ยกเว้น Users, Settings)
exports.truncateAll = async (req, res, next) => {
    try {
        await Promise.all([
            Order.deleteMany({}),
            OrderDetail.deleteMany({}),
            Payment.deleteMany({}),
            Product.deleteMany({}),
            ProductVariant.deleteMany({}),
            ProductImage.deleteMany({}),
            StockMovement.deleteMany({}),
            Category.deleteMany({}),
            Customer.deleteMany({}),
            CustomerAddress.deleteMany({}),
            Cart.deleteMany({}),
            CartItem.deleteMany({}),
        ]);
        res.json({ success: true, message: 'รีเซ็ตข้อมูลร้านทั้งหมดเรียบร้อยแล้ว' });
    } catch (error) {
        next(error);
    }
};
