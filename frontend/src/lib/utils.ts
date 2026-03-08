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
  return `${serverUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
