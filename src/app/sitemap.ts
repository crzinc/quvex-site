import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl();
  return ["", "/register", "/login"].map((path) => ({ url: `${site}${path}`, changeFrequency: "weekly" }));
}
