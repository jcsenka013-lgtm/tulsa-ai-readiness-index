import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/email/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl() || "http://localhost:3000";
  const base = origin.replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/email-preview/", "/assessment/", "/copilot/assessment/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
