const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        console.log(`Found ${products.length} products. Checking integrity...`);

        let updatedCount = 0;

        for (const product of products) {
            let needsUpdate = false;
            let updateData = {};
            let unsetData = {};

            // Check for legacy field
            if (product.isPosOnly !== undefined) {
                unsetData.isPosOnly = "";
                needsUpdate = true;

                // If legacy field existed, trust it for the transition
                if (product.isPosOnly === true) {
                    updateData.isOnline = false;
                    updateData.isPos = true;
                } else {
                    updateData.isOnline = true;
                    updateData.isPos = true;
                }
            } else {
                // No legacy field. Check if new fields are missing
                if (product.isOnline === undefined) {
                    updateData.isOnline = true; // Default to true
                    needsUpdate = true;
                }
                if (product.isPos === undefined) {
                    updateData.isPos = true; // Default to true
                    needsUpdate = true;
                }
            }

            // Perform update if needed
            if (needsUpdate) {
                // If we already set values based on legacy, use them. 
                // Otherwise only set the missing ones (preserving existing false values if any)

                // Note: The logic above for isPosOnly overrides everything. 
                // If isPosOnly didn't exist, we respect existing values unless undefined.

                const finalUpdate = { $unset: unsetData };
                if (Object.keys(updateData).length > 0) {
                    finalUpdate.$set = updateData;
                }

                await Product.updateOne({ _id: product._id }, finalUpdate);
                console.log(`Updated ${product.productName}:`, updateData);
                updatedCount++;
            }
        }

        console.log(`Migration completed. Updated ${updatedCount} products.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
