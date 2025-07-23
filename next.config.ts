import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    dynamicIO: true,
    cacheLife: {
      users: {
        stale: 1800, // seconds
        revalidate: 600, // seconds
        expire: 86400, // seconds
      },
    },
  },
};

export default nextConfig;
