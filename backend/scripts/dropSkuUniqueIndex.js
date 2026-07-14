// One-off: drops the legacy unique index on ProductVariant.sku.
// Needed because SKU is now allowed to repeat across different products
// (e.g. the same color/size code reused on unrelated product lines).
// Mongoose's autoIndex only adds indexes still declared in the schema —
// it never drops ones that were removed, so this has to run once manually
// against any database created before this change.
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('productvariants');
        const indexes = await collection.indexes();
        const skuUniqueIndex = indexes.find(idx => idx.key && idx.key.sku === 1 && idx.unique);

        if (!skuUniqueIndex) {
            console.log('No unique index on sku found — nothing to do');
        } else {
            await collection.dropIndex(skuUniqueIndex.name);
            console.log(`Dropped unique index "${skuUniqueIndex.name}" on productvariants.sku`);
        }

        // Recreate the plain (non-unique) index declared in the schema.
        await collection.createIndex({ sku: 1 });
        console.log('Ensured non-unique index on productvariants.sku');

        process.exit(0);
    } catch (error) {
        console.error('Failed:', error);
        process.exit(1);
    }
}

run();
