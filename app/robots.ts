import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/robots.txt", "/sitemap.xml"],
      disallow: ["/api/", "/*/projects", "/*/members", "/*/nfr"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
