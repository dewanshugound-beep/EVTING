import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    // Ensure correct project root for Turbopack
  },
  turbopack: {
    // No longer hardcoding root path to avoid machine-specific errors.
    // Next.js will typically infer this, but settings process.cwd() is a safer cross-platform way if override is needed.
  },
};

export default nextConfig;
