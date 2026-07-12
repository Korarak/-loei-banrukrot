import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getServerUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('Missing NEXT_PUBLIC_API_URL environment variable');
  }

  if (baseUrl.endsWith('/api')) {
    return baseUrl.slice(0, -4);
  }
  return baseUrl;
};

export function getImageUrl(path: string | undefined | null) {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const serverUrl = getServerUrl();
  const normalizedPath = `${path.startsWith('/') ? '' : '/'}${path}`;

  // Dev: frontend/backend are separate origins (localhost:8081 / :8080, possibly
  // different Docker containers). An absolute localhost URL here gets fetched
  // server-side by next/image's optimizer, which can't reliably reach "localhost"
  // (wrong container, or blocked by Next's SSRF guard). A relative path routes
  // through the next.config.ts dev rewrite instead. Production keeps the absolute
  // URL — /uploads/ is already same-origin there via Nginx.
  try {
    const { hostname } = new URL(serverUrl);
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return normalizedPath;
    }
  } catch { /* serverUrl always absolute via getServerUrl(); ignore */ }

  return `${serverUrl}${normalizedPath}`;
}

// Splits a comma-separated brand string (e.g. "SIP, PIAGGIO") into individual,
// trimmed brand names for display as tags or membership checks in filters.
export function parseBrands(brand?: string | null): string[] {
  if (!brand) return [];
  return brand.split(',').map((b) => b.trim()).filter(Boolean);
}

// De-dupes brand names case-insensitively (keeping the first-seen casing) and
// sorts them — without this, "SIP" and "sip" from two different products would
// show up as two visually-identical filter options (brand badges render
// uppercase via CSS, so the casing difference is invisible to the user).
export function uniqueBrands(brands: string[]): string[] {
  const seen = new Map<string, string>();
  for (const b of brands) {
    const key = b.toLowerCase();
    if (!seen.has(key)) seen.set(key, b);
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

interface PrimaryImageLike {
  imagePath: string;
  isPrimary?: boolean;
  blurDataURL?: string;
}

// Picks the primary image from a product/category image array, falling back
// to the first image, then to a legacy single-image-url field if provided.
export function getPrimaryImage(
  images?: PrimaryImageLike[] | null,
  fallbackUrl?: string | null
): PrimaryImageLike | null {
  const found = images?.find((img) => img.isPrimary) || images?.[0];
  if (found) return found;
  if (fallbackUrl) return { imagePath: fallbackUrl, isPrimary: true };
  return null;
}
