import type { ProductType } from "@/types/assessment";

/**
 * Resolves the active product from a URL pathname (e.g. from `usePathname()`).
 * `/copilot` and anything under it map to the Copilot assessment product.
 */
export function resolveProductFromPath(pathname: string): ProductType {
  if (pathname === "/copilot" || pathname.startsWith("/copilot/")) {
    return "copilot_readiness";
  }
  return "ai_readiness";
}
