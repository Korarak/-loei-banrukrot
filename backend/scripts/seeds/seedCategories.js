const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const Category = require('./models/Category');

const categories = [
    {
        categoryId: 1,
        name: 'Engine Parts',
        slug: 'engine-parts',
        description: 'Pistons, cylinders, gaskets, and engine components',
        sortOrder: 1
    },
    {
        categoryId: 2,
        name: 'Body & Frame',
        slug: 'body-frame',
        description: 'Panels, fenders, frames, and body accessories',
        sortOrder: 2
    },
    {
        categoryId: 3,
        name: 'Electrical',
        slug: 'electrical',
        description: 'Lights, wiring, batteries, and electrical components',
        sortOrder: 3
    },
    {
        categoryId: 4,
        name: 'Transmission',
        slug: 'transmission',
        description: 'Gears, clutches, and transmission parts',
        sortOrder: 4
    },
    {
        categoryId: 5,
        name: 'Brakes & Suspension',
        slug: 'brakes-suspension',
        description: 'Brake pads, discs, shocks, and suspension components',
        sortOrder: 5
    },
    {
        categoryId: 6,
        name: 'Exhaust System',
        slug: 'exhaust-system',
        description: 'Exhaust pipes, mufflers, and exhaust accessories',
        sortOrder: 6
    },
    {
        categoryId: 9,
        name: 'CNC Custom Parts',
        slug: 'cnc-custom',
        description: 'Custom machined parts made to specifications',
        sortOrder: 7
    },
    {
        categoryId: 10,
        name: 'Accessories',
        slug: 'accessories',
        description: 'Mirrors, grips, covers, and other accessories',
        sortOrder: 8
    }
];

async function seedCategories() {
    try {
        // Clear existing categories
        await Category.deleteMany({});
        console.log('🗑️  Cleared existing categories');

        // Insert new categories
        await Category.insertMany(categories);
        console.log(`✅ Successfully seeded ${categories.length} categories!`);

        // Display categories
        const allCategories = await Category.find().sort({ sortOrder: 1 });
        console.log('\n📂 Categories:');
        allCategories.forEach(cat => {
            console.log(`   ${cat.categoryId}. ${cat.name} (${cat.slug})`);
        });

        console.log('\n🎉 Category seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();
