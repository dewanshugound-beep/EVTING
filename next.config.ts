import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    // Ensure correct project root for Turbopack
  },
  turbopack: {
    root: "C:/Users/Administrator/evting-hub",
  },
};

export default nextConfig;
