import axios from 'axios';

if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('Missing NEXT_PUBLIC_API_URL environment variable');
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        // Check for both user and customer tokens
        const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
        const customerToken = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null;

        let token = null;

        // Determine which token to use based on the current path
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/admin')) {
                token = userToken;
            } else {
                token = customerToken;
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Check if we are on the client side
            if (typeof window !== 'undefined') {
                const path = window.location.pathname;
                // Avoid looping/redirecting if already on login pages
                if (!path.includes('/login') && !path.includes('/register') && !path.includes('/auth')) {

                    // Determine where to redirect based on context (admin vs customer) - simple logic for now
                    // If error message contains "Access token is required" or similar, maybe generic redirect?
                    // But we have separate logins.

                    // For now, let's assume if the user was seemingly on admin path, go to admin login
                    // Otherwise customer login.

                    // Actually, the request interceptor used path to decide token.
                    // We can use the same logic.

                    if (path.startsWith('/admin')) {
                        // Admin session expired or invalid
                        localStorage.removeItem('userToken');
                        // Only redirect if not already there
                        if (path !== '/login') window.location.href = '/login';
                    } else {
                        // Customer session expired or invalid
                        localStorage.removeItem('customerToken');
                        if (path !== '/customer-login') window.location.href = '/customer-login';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
