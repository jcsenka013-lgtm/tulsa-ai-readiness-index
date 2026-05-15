import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/email/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl() || "http://localhost:3000";
  const base = origin.replace(/\/+$/, "");
  const now = new Date();

  const routes = [
    "",
    "/about",
    "/contact",
    "/assessment",
    "/sample-report",
    "/copilot",
    "/copilot/assessment",
    "/copilot/sample-report",
  ] as const;

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/copilot" || path === "" ? "weekly" : "monthly",
    priority: path === "" || path === "/copilot" ? 1 : 0.8,
  }));
}
