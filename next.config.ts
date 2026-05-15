import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/og-image.png", destination: "/og-image" }];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
});
