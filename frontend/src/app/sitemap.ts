import type { MetadataRoute } from 'next';
import { SITE_URL, serverApi } from '@/lib/seo';

// Built on demand and cached — the build container can't reach the backend.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const entries: MetadataRoute.Sitemap = [
        { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
        { url: `${SITE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
    ];

    const PAGE = 100;
    for (let page = 1; page <= 50; page++) {
        const products = await serverApi<any[]>(`/products?limit=${PAGE}&page=${page}&channel=online&isActive=true`, 3600);
        for (const p of products ?? []) {
            entries.push({
                url: `${SITE_URL}/products/${p._id}`,
                lastModified: p.dateCreated || undefined,
                changeFrequency: 'weekly',
                priority: 0.7,
            });
        }
        if ((products?.length ?? 0) < PAGE) break;
    }
    return entries;
}
