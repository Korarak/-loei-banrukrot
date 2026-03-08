const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Order, OrderDetail, Customer, Product, ProductVariant, User, CustomerAddress, Payment } = require('./models');
const connectDB = require('./config/db');

const seedOrders = async () => {
    try {
        await connectDB();

        console.log('🧹 Clearing existing orders and payments...');
        await Order.deleteMany({});
        await OrderDetail.deleteMany({});
        await Payment.deleteMany({});

        // Fetch dependencies
        const customers = await Customer.find({});
        const products = await Product.find({});
        const variants = await ProductVariant.find({});
        const users = await User.find({}); // For cashierUserId
        const addresses = await CustomerAddress.find({});

        if (customers.length === 0 || products.length === 0 || variants.length === 0) {
            console.error('❌ Please seed customers and products first!');
            process.exit(1);
        }

        console.log('🌱 Seeding orders...');

        const orders = [];
        const orderDetails = [];
        const payments = [];

        // Helper to get random item
        const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        // Generate 50 mock orders
        for (let i = 0; i < 50; i++) {
            const isPos = Math.random() > 0.4; // 60% POS, 40% Online
            const source = isPos ? 'pos' : 'online';
            const customer = getRandom(customers);
            const cashier = isPos ? getRandom(users) : null;

            // Find address for this customer if online
            let shippingAddressId = null;
            if (source === 'online') {
                const customerAddresses = addresses.filter(addr => addr.customerId.toString() === customer._id.toString());
                if (customerAddresses.length > 0) {
                    shippingAddressId = getRandom(customerAddresses)._id;
                }
            }

            // Random date within last 30 days
            const date = new Date();
            date.setDate(date.getDate() - getRandomInt(0, 30));

            const order = new Order({
                customerId: customer._id,
                shippingAddressId,
                source,
                cashierUserId: cashier ? cashier._id : null,
                orderDate: date,
                orderStatus: 'completed',
                totalAmount: 0 // Will calculate later
            });

            // Generate 1-5 items per order
            let orderTotal = 0;
            const numItems = getRandomInt(1, 5);

            for (let j = 0; j < numItems; j++) {
                const variant = getRandom(variants);
                const quantity = getRandomInt(1, 3);
                const price = variant.price;
                const subtotal = price * quantity;

                orderDetails.push({
                    orderId: order._id,
                    variantId: variant._id,
                    quantity,
                    pricePerUnit: price,
                    subtotal
                });

                orderTotal += subtotal;
            }

            order.totalAmount = orderTotal;
            orders.push(order);

            // Create Payment
            const paymentMethods = ['Cash', 'Card', 'Transfer', 'QR', 'ShopeePay'];
            payments.push({
                orderId: order._id,
                paymentMethod: getRandom(paymentMethods),
                amountPaid: orderTotal,
                transactionDate: date,
                paidByCustomerId: customer._id,
                referenceNo: `PAY-${Date.now()}-${getRandomInt(1000, 9999)}`
            });
        }

        await Order.insertMany(orders);
        await OrderDetail.insertMany(orderDetails);
        await Payment.insertMany(payments);

        console.log(`✅ Created ${orders.length} orders`);
        console.log(`✅ Created ${orderDetails.length} order details`);
        console.log(`✅ Created ${payments.length} payment records`);

        console.log('✨ Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedOrders();
