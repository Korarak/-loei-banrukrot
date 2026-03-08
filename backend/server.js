// server.js
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

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

// Trust reverse proxy for correct IP parsing (Required for Rate Limiting behind Docker/Nginx)
app.set('trust proxy', 1);

// Middleware
// Security Headers
const helmet = require('helmet');
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cross-Origin Resource Sharing (CORS) - STRCITLY allow only the FRONTEND_URL
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests if desired, 
        // but for strict browser security it's better to block or handle precisely).
        // Since we explicitly want FRONTEND_URL, let's enforce it.
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body Parsers
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true }));

// Data Sanitization against NoSQL Injection
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
const hpp = require('hpp');
app.use(hpp());

app.use(require('./config/passport').initialize());

// Serve static files
app.use('/uploads', express.static('public/uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/pos', require('./routes/posRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/shipping-methods', require('./routes/shippingMethodRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Health check
app.get('/api/status', async (req, res) => {
    const mongoose = require('mongoose');

    try {
        const dbStatus = mongoose.connection.readyState;
        const statusMap = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting'
        };

        if (dbStatus === 1) {
            res.status(200).json({
                status: 'Server Running',
                database: 'Connected',
                dbName: mongoose.connection.name,
                host: mongoose.connection.host
            });
        } else {
            res.status(500).json({
                status: 'Server Running',
                database: statusMap[dbStatus] || 'Unknown'
            });
        }
    } catch (error) {
        console.error('DB Health Check Failed:', error.message);
        res.status(500).json({
            status: 'Server Running',
            database: 'Disconnected',
            error: error.message
        });
    }
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
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
