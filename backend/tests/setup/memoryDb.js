// tests/setup/memoryDb.js — shared in-memory MongoDB helper for backend tests.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

async function connect() {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
}

async function closeDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongod) await mongod.stop();
}

async function clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

module.exports = { connect, closeDatabase, clearDatabase };
