import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: path.resolve(".") },
  experimental: {
    // Reuse a visited CRM page for 30 s on back/forward and repeat taps instead of refetching it.
    // Every mutation calls revalidatePath(), which drops this cache, so your own changes show at once.
    staleTimes: { dynamic: 30 },
    // Tree-shake big icon/util packages so pages ship less JS.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
