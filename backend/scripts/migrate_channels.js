const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        console.log(`Found ${products.length} products to migrate`);

        for (const product of products) {
            const isPosOnly = product.isPosOnly === true;

            // Logic:
            // if isPosOnly was TRUE -> Online: False, Pos: True
            // if isPosOnly was FALSE/Undef -> Online: True, Pos: True

            const isOnline = !isPosOnly;
            const isPos = true; // Always enable POS by default for migration

            await Product.updateOne(
                { _id: product._id },
                {
                    $set: { isOnline, isPos },
                    $unset: { isPosOnly: "" }
                }
            );
            console.log(`Migrated ${product.productName}: Online=${isOnline}, POS=${isPos}`);
        }

        console.log('Migration completed');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
