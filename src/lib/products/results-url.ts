import { getSiteUrl } from "@/lib/email/site-url";
import { PRODUCTS } from "@/lib/products/productConfig";
import type { ProductType } from "@/types/assessment";

export function getResultsPageUrl(assessmentId: string, productType: ProductType): string {
  const site = getSiteUrl();
  return `${site}${PRODUCTS[productType].resultsPath(assessmentId)}`;
}
