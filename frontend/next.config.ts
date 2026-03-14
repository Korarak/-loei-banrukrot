import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['localhost', '127.0.0.1', 'banrukrot-api.loeitech.org', 'banrukrot.loeitech.org'],
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
    ],
  },
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  reactCompiler: true,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  turbopack: {},
};

export default nextConfig;
