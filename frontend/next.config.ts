import type { NextConfig } from "next";
import path from "path";

// CSP ต้องอนุญาต origin ของ API (รูปสินค้า + XHR) — ดึงจาก build-time env
// บน production API อยู่ domain เดียวกันผ่าน nginx จึงซ้ำกับ 'self' อย่างไม่มีผลเสีย
let apiOrigin = '';
try {
  apiOrigin = process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : '';
} catch { /* ignore malformed URL */ }

const isDev = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js ต้องใช้ inline script ตอน hydration (ไม่ได้ใช้ nonce)
  // dev เท่านั้น: webpack dev server (--webpack) ใช้ eval() สำหรับ source map เร็ว — ขาด unsafe-eval แล้ว JS ทั้งหน้าจะถูกบล็อกเงียบๆ (หน้าขาว ไม่มี error ฝั่ง server)
  // static.cloudflareinsights.com — Cloudflare Web Analytics beacon, ฉีดโดย edge เอง ไม่ได้มาจากโค้ดเรา
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ''}`,
  // Tailwind inline styles + Framer Motion ต้องใช้ inline style
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin} https://*.loeitech.org https://lh3.googleusercontent.com`.replace(/\s+/g, ' '),
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://cloudflareinsights.com`.replace(/\s+/g, ' '),
  // @zxing barcode scanner ใช้ camera stream + blob
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Default also includes 2048/3840 — unrealistic for this site's widest
    // real usage (product-detail gallery at 50vw); trimming the matrix means
    // fewer variants for the optimizer to generate/cache.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Next 16's SSRF guard blocks any upstream image whose hostname resolves to a
    // loopback/private IP — localhost always does, so dev (backend on localhost:8080)
    // needs this opt-out. Production points at banrukrot.com (public), so stays protected.
    dangerouslyAllowLocalIP: isDev,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.loeitech.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'banrukrot.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.banrukrot.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
    // 1 year — safe because every upload gets a unique file-<timestamp>-<random>.webp
    // name (see backend/routes/uploadRoutes.js), so there's no same-URL-different-content
    // staleness risk; an edited image is a new file with a new name.
    minimumCacheTTL: 31536000,
  },
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  reactCompiler: true,
  turbopack: {},
  async rewrites() {
    // Dev only: frontend and backend are separate origins/containers (production's
    // /uploads/ is already routed to the backend at the Nginx layer, before Next.js).
    // Proxying here lets getImageUrl() emit a relative path in dev, so next/image's
    // server-side optimizer fetch stays in-process instead of hitting "localhost"
    // from inside the frontend container (wrong container) or Next's SSRF guard.
    if (!isDev) return [];
    const internalApiUrl = process.env.INTERNAL_API_URL || 'http://localhost:8080';
    return [
      {
        source: '/uploads/:path*',
        destination: `${internalApiUrl}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    const baseHeaders = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // camera=(self) — หน้า admin orders ใช้ BarcodeScanner (@zxing) สแกนผ่านกล้อง
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
    // 1-year immutable cache เหมาะกับ production build เท่านั้น (ชื่อไฟล์มี content hash)
    // dev ใช้ชื่อ chunk เดิมซ้ำ — cache แบบนี้ทำให้เบราว์เซอร์เสิร์ฟ JS เก่าค้างหลังแก้โค้ด (หน้าขาว/พังเงียบๆ)
    if (isDev) return baseHeaders;
    return [
      ...baseHeaders,
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.modules = [
      ...config.resolve.modules,
      path.resolve(__dirname, '../node_modules'),
    ];
    // ไม่ตั้ง watchOptions.poll ที่นี่ — ปล่อยให้ WATCHPACK_POLLING (env, docker-compose.dev.yml)
    // เป็นตัวคุม polling เพียงจุดเดียว ตั้งซ้อนกันสองที่ทำให้ fs.stat() วิ่งถี่ 2 เท่าบน bind mount
    // ของ Docker Desktop (Windows) ซึ่งเป็นสาเหตุหลักที่ CPU/RAM ของ frontend container พุ่ง
    return config;
  },
};

export default nextConfig;
