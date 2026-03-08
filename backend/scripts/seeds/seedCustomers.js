const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Customer, CustomerAddress } = require('./models');
const connectDB = require('./config/db');

const seedCustomers = async () => {
    try {
        await connectDB();

        console.log('🧹 Clearing existing customers...');
        await Customer.deleteMany({});
        await CustomerAddress.deleteMany({});

        console.log('🌱 Seeding customers...');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('123456', salt);

        const customers = [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                passwordHash,
                phone: '0812345678',
                isActive: true,
                dateRegistered: new Date('2024-01-01')
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                passwordHash,
                phone: '0898765432',
                isActive: true,
                dateRegistered: new Date('2024-02-15')
            },
            {
                firstName: 'Alice',
                lastName: 'Johnson',
                email: 'alice@example.com',
                passwordHash,
                phone: '0855555555',
                isActive: false,
                dateRegistered: new Date('2024-03-10')
            },
            {
                firstName: 'Bob',
                lastName: 'Brown',
                email: 'bob@example.com',
                passwordHash,
                phone: '0866666666',
                isActive: true,
                dateRegistered: new Date('2024-04-05')
            },
            {
                firstName: 'Charlie',
                lastName: 'Davis',
                email: 'charlie@example.com',
                passwordHash,
                phone: '0877777777',
                isActive: true,
                dateRegistered: new Date('2024-05-20')
            }
        ];

        const createdCustomers = await Customer.insertMany(customers);
        console.log(`✅ Created ${createdCustomers.length} customers`);

        console.log('🌱 Seeding addresses...');
        const addresses = [
            {
                customerId: createdCustomers[0]._id,
                addressLabel: 'Home',
                recipientName: 'John Doe',
                streetAddress: '123 Sukhumvit Road',
                subDistrict: 'Khlong Toei',
                district: 'Khlong Toei',
                province: 'Bangkok',
                zipCode: '10110',
                isDefault: true
            },
            {
                customerId: createdCustomers[0]._id,
                addressLabel: 'Office',
                recipientName: 'John Doe',
                streetAddress: '456 Silom Road',
                subDistrict: 'Silom',
                district: 'Bang Rak',
                province: 'Bangkok',
                zipCode: '10500',
                isDefault: false
            },
            {
                customerId: createdCustomers[1]._id,
                addressLabel: 'Home',
                recipientName: 'Jane Smith',
                streetAddress: '789 Phahonyothin Road',
                subDistrict: 'Chatuchak',
                district: 'Chatuchak',
                province: 'Bangkok',
                zipCode: '10900',
                isDefault: true
            }
        ];

        await CustomerAddress.insertMany(addresses);
        console.log(`✅ Created ${addresses.length} addresses`);

        console.log('✨ Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedCustomers();
