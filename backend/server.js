// server.js
require('dotenv').config();
const connectDB = require('./config/db');

const PORT = process.env.PORT || 8080;

// ====== CRITICAL: Environment Variable Validation ======
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`\x1b[31m[CRITICAL ERROR] Missing required environment variables: ${missingEnvVars.join(', ')}\x1b[0m`);
    console.error(`\x1b[31mServer cannot start securely. Exiting.\x1b[0m`);
    process.exit(1);
}
// =======================================================

// เชื่อมต่อ MongoDB
connectDB();

const app = require('./app');

const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   - Auth:       http://localhost:${PORT}/api/auth`);
    console.log(`   - Products:   http://localhost:${PORT}/api/products`);
    console.log(`   - Categories: http://localhost:${PORT}/api/categories`);
    console.log(`   - Cart:       http://localhost:${PORT}/api/cart`);
    console.log(`   - Orders:     http://localhost:${PORT}/api/orders`);
    console.log(`   - POS:        http://localhost:${PORT}/api/pos`);
    console.log(`   - Upload:     http://localhost:${PORT}/api/upload`);
    console.log(`   - Users:      http://localhost:${PORT}/api/users`);
    console.log(`   - Customers:  http://localhost:${PORT}/api/customers`);
    console.log(`   - Dashboard:  http://localhost:${PORT}/api/dashboard`);
    console.log(`   - Status:     http://localhost:${PORT}/api/status`);
});

// Prevent 502 errors behind reverse proxy — Node's default (5s) is shorter than Nginx's idle timeout
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
