import type { NextConfig } from "next";
const nextConfig: NextConfig = { transpilePackages: ["@ecom/catalog", "@ecom/types"], images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] } };
export default nextConfig;
