const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const createAdmin = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const adminData = {
            username: 'admin',
            email: 'admin@example.com',
            password: 'password123', // You can change this
            role: 'owner'
        };

        // Check if admin already exists
        const existingUser = await User.findOne({
            $or: [
                { username: adminData.username },
                { email: adminData.email }
            ]
        });

        if (existingUser) {
            console.log('⚠️  Admin user already exists!');
            console.log('Username:', existingUser.username);
            console.log('Email:', existingUser.email);
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminData.password, salt);

        // Create new user
        const newAdmin = new User({
            username: adminData.username,
            email: adminData.email,
            passwordHash: passwordHash,
            role: adminData.role,
            isActive: true
        });

        await newAdmin.save();

        console.log('🎉 Admin user created successfully!');
        console.log('-----------------------------------');
        console.log('Username:', adminData.username);
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);
        console.log('Role:', adminData.role);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin();
