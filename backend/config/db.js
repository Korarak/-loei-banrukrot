// config/db.js

const mongoose = require('mongoose');
require('dotenv').config(); // โหลดตัวแปรจาก .env

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Options for better connection handling
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Failed!');
        console.error('Error Message:', error.message);
        console.error('Connection URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;