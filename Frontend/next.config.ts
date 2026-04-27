import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['192.168.0.110', '172.16.27.22', '172.16.27.216', '192.168.1.*', '192.168.0.*', '10.0.0.*', 'localhost'],
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
