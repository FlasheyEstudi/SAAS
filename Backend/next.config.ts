import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['172.16.27.22', 'localhost'],
  turbopack: {
    root: "c:/Users/RESP_SOPORTE_TECNICO/SAAS/Backend",
  },
};

export default nextConfig;
