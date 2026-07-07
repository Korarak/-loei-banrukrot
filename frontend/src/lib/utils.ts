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
