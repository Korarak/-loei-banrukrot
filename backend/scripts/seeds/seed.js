const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const Product = require('./models/Product');
const ProductVariant = require('./models/ProductVariant');

// Category mapping (since backend uses categoryId as number)
const categories = {
    'Engine Parts': 1,
    'Body & Frame': 2,
    'Electrical': 3,
    'Transmission': 4,
    'Brakes & Suspension': 5,
    'Exhaust System': 6,
    'Fuel System': 7,
    'Cooling System': 8,
    'CNC Custom Parts': 9,
    'Accessories': 10,
    'Tools & Maintenance': 11
};

const vespaProducts = [
    // Engine Parts
    {
        productName: 'Vespa PX 150 Piston Kit',
        description: 'High-quality piston kit for Vespa PX 150. Includes piston, rings, and pin. Made from premium aluminum alloy.',
        category: 'Engine Parts',
        brand: 'Vespa',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        variants: [
            { sku: 'VPX-PST-150-STD', price: 2500, stock: 15 },
            { sku: 'VPX-PST-150-OS1', price: 2700, stock: 8 }
        ]
    },
    {
        productName: 'Vespa Sprint Cylinder Head',
        description: 'Original specification cylinder head for Vespa Sprint 150. Direct replacement part.',
        category: 'Engine Parts',
        brand: 'Vespa',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        variants: [
            { sku: 'VSP-CYH-150', price: 4500, stock: 6 }
        ]
    },
    {
        productName: 'Vespa GTS 300 Spark Plug NGK',
        description: 'NGK iridium spark plug for Vespa GTS 300. Long-lasting performance.',
        category: 'Engine Parts',
        brand: 'NGK',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        variants: [
            { sku: 'VGT-SPK-300-NGK', price: 350, stock: 50 }
        ]
    },
    {
        productName: 'Vespa Primavera Crankshaft',
        description: 'Complete crankshaft assembly for Vespa Primavera 150. Balanced and tested.',
        category: 'Engine Parts',
        brand: 'Vespa',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        variants: [
            { sku: 'VPR-CRK-150', price: 8900, stock: 4 }
        ]
    },
    {
        productName: 'Vespa LX Gasket Set Complete',
        description: 'Full gasket set for Vespa LX 125/150. Includes all engine gaskets.',
        category: 'Engine Parts',
        brand: 'Vespa',
        variants: [
            { sku: 'VLX-GSK-125', price: 850, stock: 20 },
            { sku: 'VLX-GSK-150', price: 950, stock: 18 }
        ]
    },

    // Body & Frame
    {
        productName: 'Vespa PX Front Fender Chrome',
        description: 'Chrome-plated front fender for Vespa PX series. Mirror finish.',
        category: 'Body & Frame',
        brand: 'Vespa',
        variants: [
            { sku: 'VPX-FND-FRT-CHR', price: 3200, stock: 10 }
        ]
    },
    {
        productName: 'Vespa GTS Side Panel Left (Matte Black)',
        description: 'Left side panel for Vespa GTS 300. Matte black finish.',
        category: 'Body & Frame',
        brand: 'Vespa',
        variants: [
            { sku: 'VGT-PNL-L-BLK', price: 4500, stock: 5 }
        ]
    },
    {
        productName: 'Vespa Sprint Leg Shield',
        description: 'Front leg shield for Vespa Sprint. Includes mounting hardware.',
        category: 'Body & Frame',
        brand: 'Vespa',
        variants: [
            { sku: 'VSP-LSH-FRT', price: 5800, stock: 7 }
        ]
    },
    {
        productName: 'Vespa Primavera Seat Cover (Brown Leather)',
        description: 'Premium brown leather seat cover for Vespa Primavera. Handcrafted.',
        category: 'Body & Frame',
        brand: 'Vespa',
        variants: [
            { sku: 'VPR-SCO-BRN', price: 2800, stock: 12 }
        ]
    },

    // Electrical
    {
        productName: 'Vespa PX Headlight Assembly',
        description: 'Complete headlight assembly for Vespa PX. Includes bulb and wiring.',
        category: 'Electrical',
        brand: 'Vespa',
        variants: [
            { sku: 'VPX-HLT-ASM', price: 1800, stock: 15 }
        ]
    },
    {
        productName: 'Vespa GTS Battery 12V',
        description: 'Maintenance-free 12V battery for Vespa GTS 300. 2-year warranty.',
        category: 'Electrical',
        brand: 'Yuasa',
        variants: [
            { sku: 'VGT-BAT-12V', price: 2200, stock: 20 }
        ]
    },
    {
        productName: 'Vespa Sprint Turn Signal LED Set',
        description: 'LED turn signal set (4 pieces) for Vespa Sprint. Bright and energy-efficient.',
        category: 'Electrical',
        brand: 'Vespa',
        variants: [
            { sku: 'VSP-TSG-LED-SET', price: 1200, stock: 25 }
        ]
    },
    {
        productName: 'Vespa LX Ignition Coil',
        description: 'High-performance ignition coil for Vespa LX 125/150.',
        category: 'Electrical',
        brand: 'Vespa',
        variants: [
            { sku: 'VLX-IGC-125', price: 1500, stock: 18 }
        ]
    },

    // Transmission
    {
        productName: 'Vespa PX Clutch Kit',
        description: 'Complete clutch kit for Vespa PX 150. Includes plates, springs, and cork.',
        category: 'Transmission',
        brand: 'Vespa',
        variants: [
            { sku: 'VPX-CLT-150-KIT', price: 3500, stock: 10 }
        ]
    },
    {
        productName: 'Vespa GTS Drive Belt',
        description: 'OEM specification drive belt for Vespa GTS 300.',
        category: 'Transmission',
        brand: 'Vespa',
        variants: [
            { sku: 'VGT-BLT-300', price: 1800, stock: 15 }
        ]
    },
    {
        productName: 'Vespa Sprint Variator Roller Set',
        description: 'Performance variator roller set for Vespa Sprint 150. 6 pieces.',
        category: 'Transmission',
        brand: 'Malossi',
        variants: [
            { sku: 'VSP-VRR-150-6G', price: 650, stock: 30 },
            { sku: 'VSP-VRR-150-7G', price: 650, stock: 28 }
        ]
    },

    // Brakes & Suspension
    {
        productName: 'Vespa PX Brake Shoes Front',
        description: 'High-friction brake shoes for Vespa PX front wheel.',
        category: 'Brakes & Suspension',
        brand: 'Vespa',
        variants: [
            { sku: 'VPX-BRK-SHO-FRT', price: 850, stock: 25 }
        ]
    },
    {
        productName: 'Vespa GTS Brake Pads (Front)',
        description: 'Premium brake pads for Vespa GTS 300 front disc brake.',
        category: 'Brakes & Suspension',
        brand: 'Brembo',
        variants: [
            { sku: 'VGT-BRK-PAD-FRT', price: 1200, stock: 20 }
        ]
    },
    {
        productName: 'Vespa Sprint Shock Absorber Rear',
        description: 'Adjustable rear shock absorber for Vespa Sprint. Chrome finish.',
        category: 'Brakes & Suspension',
        brand: 'Vespa',
        variants: [
            { sku: 'VSP-SHK-REA-CHR', price: 4500, stock: 8 }
        ]
    },
    {
        productName: 'Vespa Primavera Fork Seal Kit',
        description: 'Complete fork seal kit for Vespa Primavera front suspension.',
        category: 'Brakes & Suspension',
        brand: 'Vespa',
        variants: [
            { sku: 'VPR-FRK-SEL-KIT', price: 950, stock: 15 }
        ]
    },

    // Exhaust System
    {
        productName: 'Vespa PX Exhaust Pipe Chrome',
        description: 'Classic chrome exhaust pipe for Vespa PX. Italian style.',
        category: 'Exhaust System',
        brand: 'Vespa',
        variants: [
            { sku: 'VPX-EXH-CHR', price: 5500, stock: 6 }
        ]
    },
    {
        productName: 'Vespa GTS Performance Exhaust',
        description: 'Stainless steel performance exhaust for Vespa GTS 300. +5% power.',
        category: 'Exhaust System',
        brand: 'Akrapovic',
        variants: [
            { sku: 'VGT-EXH-PRF-SS', price: 12500, stock: 3 }
        ]
    },

    // CNC Custom Parts
    {
        productName: 'CNC Machined Brake Lever (Vespa Universal)',
        description: 'Custom CNC-machined aluminum brake lever. Anodized finish. Fits most Vespa models.',
        category: 'CNC Custom Parts',
        brand: 'Custom CNC',
        variants: [
            { sku: 'CNC-BLV-BLK', price: 1800, stock: 12, option1Value: 'Black' },
            { sku: 'CNC-BLV-RED', price: 1800, stock: 10, option1Value: 'Red' },
            { sku: 'CNC-BLV-GLD', price: 1900, stock: 8, option1Value: 'Gold' }
        ]
    },
    {
        productName: 'CNC Billet Handlebar Grips',
        description: 'Premium CNC-machined handlebar grips. Diamond knurling pattern.',
        category: 'CNC Custom Parts',
        brand: 'Custom CNC',
        variants: [
            { sku: 'CNC-GRP-SLV', price: 2200, stock: 15, option1Value: 'Silver' },
            { sku: 'CNC-GRP-BLK', price: 2200, stock: 15, option1Value: 'Black' }
        ]
    },
    {
        productName: 'CNC Custom Footboard Trim',
        description: 'Decorative CNC-machined footboard trim. Stainless steel.',
        category: 'CNC Custom Parts',
        brand: 'Custom CNC',
        variants: [
            { sku: 'CNC-FBT-SS', price: 3500, stock: 6 }
        ]
    },
    {
        productName: 'CNC Machined Mirror Set',
        description: 'Custom CNC mirrors with adjustable arms. Sold as pair.',
        category: 'CNC Custom Parts',
        brand: 'Custom CNC',
        variants: [
            { sku: 'CNC-MIR-SET-CHR', price: 4200, stock: 8 }
        ]
    },

    // Accessories
    {
        productName: 'Vespa Windshield Touring (Smoked)',
        description: 'Large touring windshield for Vespa GTS/Sprint. Smoked acrylic.',
        category: 'Accessories',
        brand: 'Vespa',
        variants: [
            { sku: 'ACC-WND-TOU-SMK', price: 3800, stock: 10 }
        ]
    },
    {
        productName: 'Vespa Top Case 37L (Black)',
        description: 'Spacious 37-liter top case. Fits 2 helmets. Includes mounting kit.',
        category: 'Accessories',
        brand: 'Givi',
        variants: [
            { sku: 'ACC-TCS-37L-BLK', price: 5500, stock: 7 }
        ]
    },
    {
        productName: 'Vespa Chrome Rack Rear',
        description: 'Chrome-plated rear luggage rack. Universal fit for most Vespa models.',
        category: 'Accessories',
        brand: 'Vespa',
        variants: [
            { sku: 'ACC-RCK-REA-CHR', price: 2800, stock: 12 }
        ]
    },
    {
        productName: 'Vespa Floor Mat Set (Rubber)',
        description: 'Anti-slip rubber floor mat set. Vespa logo embossed.',
        category: 'Accessories',
        brand: 'Vespa',
        variants: [
            { sku: 'ACC-FMT-RUB-SET', price: 850, stock: 25 }
        ]
    }
];

async function seedDatabase() {
    try {
        // Clear existing data
        await Product.deleteMany({});
        await ProductVariant.deleteMany({});
        console.log('🗑️  Cleared existing products and variants');

        let totalProducts = 0;
        let totalVariants = 0;

        // Insert products and variants
        for (const productData of vespaProducts) {
            // Create product
            const product = await Product.create({
                productName: productData.productName,
                description: productData.description,
                categoryId: categories[productData.category],
                brand: productData.brand,
                isActive: true
            });

            totalProducts++;

            // Create variants
            for (const variantData of productData.variants) {
                await ProductVariant.create({
                    productId: product._id,
                    sku: variantData.sku,
                    price: variantData.price,
                    stockAvailable: variantData.stock,
                    option1Value: variantData.option1Value || null,
                    option2Value: variantData.option2Value || null
                });
                totalVariants++;
            }
        }

        console.log(`✅ Successfully added ${totalProducts} Vespa products!`);
        console.log(`✅ Successfully added ${totalVariants} product variants!`);

        // Show summary by category
        const categorySummary = {};
        for (const [catName, catId] of Object.entries(categories)) {
            const count = await Product.countDocuments({ categoryId: catId });
            if (count > 0) {
                categorySummary[catName] = count;
            }
        }

        console.log('\n📊 Products by Category:');
        Object.entries(categorySummary)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, count]) => {
                console.log(`   - ${cat}: ${count} products`);
            });

        console.log('\n🎉 Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
