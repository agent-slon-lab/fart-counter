import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel автоматически настраивает Next.js, но standalone полезен для других хостингов
  output: "standalone",
  reactStrictMode: false,
  // Разрешаем обработку больших JSON-файлов фактов
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
