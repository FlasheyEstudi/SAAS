import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Optimización de rendimiento de red
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  /*
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;" },
        ],
      },
    ];
  },
  */
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  // Permitir acceso desde cualquier origen en desarrollo (HMR, etc)
  // @ts-ignore
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000', '0.0.0.0:3000'],
};

export default nextConfig;
