import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();
  return { rules: { userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/auth"] }, sitemap: `${site}/sitemap.xml` };
}
