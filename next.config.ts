import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // PERFORMANCE: Enable compression
  compress: true,
  poweredByHeader: false,
  // PERFORMANCE: Optimize package imports (tree-shaking)
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion", "date-fns"],
  },
};

export default nextConfig;
