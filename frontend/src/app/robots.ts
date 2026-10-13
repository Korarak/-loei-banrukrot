import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin', '/api/', '/cart', '/orders', '/profile', '/wishlist',
                '/login', '/register', '/customer-login', '/customer-register',
                '/forgot-password', '/reset-password', '/verify-email', '/auth/',
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
