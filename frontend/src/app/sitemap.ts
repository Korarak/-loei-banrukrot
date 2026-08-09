import type { MetadataRoute } from "next";

const siteUrl = "https://banrukrot.com";

export const revalidate = 3600;

async function getProductRoutes(): Promise<MetadataRoute.Sitemap> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];

    try {
        const res = await fetch(`${apiUrl}/products?limit=100`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];

        const { data } = await res.json();
        if (!Array.isArray(data)) return [];

        return data.map((product: { _id: string }) => ({
            url: `${siteUrl}/products/${product._id}`,
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));
    } catch {
        // Sitemap should never fail the request just because the API is down.
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${siteUrl}/products`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
    ];

    const productRoutes = await getProductRoutes();

    return [...staticRoutes, ...productRoutes];
}
