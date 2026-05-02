import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
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
        hostname: '**.railway.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.up.railway.app',
        pathname: '/**',
      },
    ],
  },
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  reactCompiler: true,
  webpack: (config, { dev, isServer }) => {
    // Allow resolution of packages hoisted to the monorepo root node_modules
    config.resolve.modules = [
      ...config.resolve.modules,
      path.resolve(__dirname, '../node_modules'),
    ];
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
