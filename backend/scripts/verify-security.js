const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSecurityHeaders() {
    console.log('Testing Security Headers...');
    try {
        const res = await axios.get(`${BASE_URL}/status`);
        const headers = res.headers;

        const requiredHeaders = [
            'x-dns-prefetch-control',
            'x-frame-options',
            'strict-transport-security',
            'x-download-options',
            'x-content-type-options',
            'x-xss-protection'
        ];

        let missing = [];
        requiredHeaders.forEach(h => {
            if (!headers[h]) missing.push(h);
        });

        if (missing.length === 0) {
            console.log('✅ All Helmet security headers presence verified.');
        } else {
            console.log('⚠️ Missing headers:', missing.join(', '));
        }

        if (headers['x-powered-by']) {
            console.log('❌ X-Powered-By header should be hidden!');
        } else {
            console.log('✅ X-Powered-By header is hidden.');
        }

    } catch (error) {
        console.error('Error testing headers:', error.message);
    }
}

async function testRateLimit() {
    console.log('\nTesting Rate Limiting (Login)...');
    const loginUrl = `${BASE_URL}/auth/login`;
    // Using a fake credential to trigger 401/400 but mostly to hit the limiter
    const payload = { email: 'test@example.com', password: 'password' };

    let hits = 0;
    const max = 22; // Our limit is 20
    try {
        for (let i = 0; i < max; i++) {
            try {
                await axios.post(loginUrl, payload);
                process.stdout.write('.');
            } catch (err) {
                if (err.response && err.response.status === 429) {
                    console.log(`\n✅ Rate limit passed! Blocked at request ${i + 1}`);
                    return;
                }
                process.stdout.write('.');
            }
            hits++;
        }
        console.log('\n❌ Rate limit check failed. Allowed more than expected requests.');
    } catch (error) {
        console.error('Error testing rate limit:', error.message);
    }
}

async function testNoSQLInjection() {
    console.log('\nTesting NoSQL Injection Sanitization...');
    // Attempt to login with a common NoSQL injection payload
    // If sanitization works, keys starting with $ should be removed or escaped
    // Depending on express-mongo-sanitize default behavior, it removes keys.
    // So { email: { $ne: null } } becomes { email: {} } or similar which likely fails validation or auth

    // We expect the server to handle this gracefully (400 or 401), NOT 500 or bypass.
    // Ideally we'd see if the middleware striped it.

    const loginUrl = `${BASE_URL}/auth/login`;
    const payload = {
        email: { "$ne": null },
        password: { "$ne": null }
    };

    try {
        await axios.post(loginUrl, payload);
        console.log('⚠️ Request with NoSQL injection accepted (might be bad if logic allows).');
    } catch (err) {
        // We expect a validation error or 401, not a crash.
        // If the middleware strips '$', express-validator might complain about invalid email format, which is GOOD.
        if (err.response) {
            console.log(`✅ Server rejected injection payload with status: ${err.response.status}`);
            console.log('   Response:', JSON.stringify(err.response.data));
        } else {
            console.log('❌ Server error or no response:', err.message);
        }
    }
}

async function runTests() {
    await testSecurityHeaders();
    await testNoSQLInjection();
    // Rate limit test takes time and spams console, allow user to skip or run last
    await testRateLimit();
}

runTests();
