import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Enable Turbopack explicitly (Next.js 16 default)
  turbopack: {},

  // Move serverComponentsExternalPackages to root level (Next.js 16 change)
  serverExternalPackages: ['@novnc/novnc'],
};

export default nextConfig;
