const { execSync } = require('child_process');
const path = require('path');

const runScript = (scriptName) => {
    try {
        console.log(`\n🚀 Starting ${scriptName}...`);
        const scriptPath = path.join(__dirname, scriptName);
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
        console.log(`✅ ${scriptName} completed successfully.`);
    } catch (error) {
        console.error(`❌ Error running ${scriptName}:`, error.message);
        process.exit(1);
    }
};

const seedAll = async () => {
    console.log('🌱 Starting Master Seeder...');

    // 1. Seed Categories
    runScript('seedCategories.js');

    // 2. Seed Products (depends on categories)
    runScript('seed.js');

    // 3. Seed Customers
    runScript('seedCustomers.js');

    // 4. Seed Orders (depends on customers and products)
    runScript('seedOrders.js');

    console.log('\n✨ All seeding completed successfully! ✨');
};

seedAll();
