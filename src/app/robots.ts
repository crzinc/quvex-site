import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://quvex.org";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard/", "/studio/", "/auth/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
