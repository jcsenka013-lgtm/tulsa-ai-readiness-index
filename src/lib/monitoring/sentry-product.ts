import * as Sentry from "@sentry/nextjs";

import type { ProductType } from "@/types/assessment";

export type SentryProductTag = ProductType | "global";

/**
 * Set `product_type` on the current Sentry scope (client or server) when a
 * DSN is configured.
 */
export function setSentryProductTypeTag(tag: SentryProductTag): void {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }
  Sentry.getCurrentScope().setTag("product_type", tag);
}
