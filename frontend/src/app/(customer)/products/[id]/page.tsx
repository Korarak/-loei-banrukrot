import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { SITE_URL, absoluteImage, serverFetch, truncate } from '@/lib/seo';
import { siteConfig } from '@/config/site';

type Props = { params: Promise<{ id: string }> };

const isObjectId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

// Real 404 only when the id is malformed or the backend says the product doesn't exist.
// If the backend is merely unreachable we render the page anyway (client fetches it),
// so an outage never gets real products de-indexed as "not found".
async function getProduct(id: string) {
    if (!isObjectId(id)) notFound();
    const { data, notFound: missing } = await serverFetch<any>(`/products/${id}`);
    if (missing) notFound();
    return data;
}

function primaryImage(product: any): string | undefined {
    const images: any[] = product.images || [];
    const img = images.find((i) => i.isPrimary) || images[0];
    return absoluteImage(img?.imagePath || product.imageUrl);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);
    // Backend unreachable or unknown id — fall back to the layout's generic metadata.
    if (!product) return {};

    const title = `${product.productName} | ${siteConfig.brand.name}`;
    const description = truncate(product.description) ||
        `${product.productName} อะไหล่เวสป้า จัดส่งทั่วไทย จาก${siteConfig.brand.name} เมืองเลย`;
    const image = primaryImage(product);
    const url = `${SITE_URL}/products/${id}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        robots: product.isActive === false ? { index: false, follow: false } : undefined,
        openGraph: {
            type: 'website',
            url,
            title,
            description,
            siteName: siteConfig.brand.name,
            locale: 'th_TH',
            images: image ? [{ url: image, alt: product.productName }] : undefined,
        },
        twitter: {
            card: image ? 'summary_large_image' : 'summary',
            title,
            description,
            images: image ? [image] : undefined,
        },
    };
}

export default async function ProductDetailPage({ params }: Props) {
    const { id } = await params;
    const product = await getProduct(id);

    let jsonLd: Record<string, unknown> | null = null;
    if (product && product.isActive !== false) {
        const variants: any[] = product.variants || [];
        const prices = variants.map((v) => v.effectivePrice ?? v.price).filter((n) => typeof n === 'number');
        const inStock = variants.some((v) => (v.stock ?? v.stockAvailable ?? 0) > 0);
        const image = primaryImage(product);
        if (prices.length > 0) {
            const brand = (product.brand || '').split(',')[0]?.trim();
            jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: product.productName,
                description: truncate(product.description, 500) || undefined,
                image: image ? [image] : undefined,
                sku: variants[0]?.sku,
                brand: brand ? { '@type': 'Brand', name: brand } : undefined,
                offers: {
                    '@type': 'AggregateOffer',
                    priceCurrency: 'THB',
                    lowPrice: Math.min(...prices),
                    highPrice: Math.max(...prices),
                    offerCount: variants.length,
                    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                    url: `${SITE_URL}/products/${id}`,
                },
            };
        }
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    // `<` escaped so product text can never close the script tag
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
                />
            )}
            <ProductDetailClient />
        </>
    );
}
