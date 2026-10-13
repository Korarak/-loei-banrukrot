import { siteConfig } from '@/config/site';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://banrukrot.com').replace(/\/$/, '');

/**
 * Server-side fetch against the backend over the Docker network (same address the
 * next.config.ts /uploads rewrite uses). Never throws — SEO must not take a page down;
 * callers fall back to generic metadata when this returns null.
 */
export async function serverApi<T = any>(path: string, revalidate = 300): Promise<T | null> {
    const internal = process.env.INTERNAL_API_URL
        || (process.env.NODE_ENV === 'production' ? 'http://backend:8080' : 'http://localhost:8080');
    try {
        const res = await fetch(`${internal}/api${path}`, { next: { revalidate } });
        if (!res.ok) return null;
        const json = await res.json();
        return (json?.data ?? null) as T | null;
    } catch {
        return null;
    }
}

/** Absolute URL for an uploaded image path (or already-absolute URL). */
export function absoluteImage(path?: string | null): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function truncate(text: string | undefined, max = 160): string {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    '@id': `${SITE_URL}/#store`,
    name: siteConfig.brand.name,
    alternateName: siteConfig.brand.englishName,
    description: siteConfig.brand.description,
    url: SITE_URL,
    image: `${SITE_URL}/logo.png`,
    logo: `${SITE_URL}/logo.png`,
    address: {
        '@type': 'PostalAddress',
        streetAddress: '519/2 หมู่ 5 บ้านหนองผักก้าม ต.เมือง',
        addressLocality: 'อ.เมือง',
        addressRegion: 'เลย',
        postalCode: '42000',
        addressCountry: 'TH',
    },
    hasMap: 'https://goo.gl/maps/Cbas3yCjPz6feeSPA',
    sameAs: Object.values(siteConfig.footerData.contact.social).filter((u) => u !== 'https://instagram.com/banrakrod'),
};
