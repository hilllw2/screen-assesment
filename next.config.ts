import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Increase limit for uploads
    },
  },
};

export default nextConfig;
