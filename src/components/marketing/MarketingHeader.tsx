import Link from "next/link";
import { Menu } from "lucide-react";

import { LinkedInIcon } from "@/components/marketing/LinkedInIcon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#engineering", label: "Behind the build" },
  { href: "/about", label: "About" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/contact", label: "Contact" },
] as const;

const LINKEDIN_HREF = "https://www.linkedin.com/company/tulsa-applied-ai";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/70 backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-background/60">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-3">Skip to content</a>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/"
            className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base"
          >
            Tulsa AI Readiness Index
          </Link>
        </div>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </Link>
          ))}
          <a
            href={LINKEDIN_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Tulsa Applied AI on LinkedIn"
          >
            <LinkedInIcon className="h-4 w-4" />
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/assessment"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            Start the assessment
          </Link>
          <details className="relative md:hidden">
            <summary
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-popover p-1 shadow-md">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-sm px-3 py-2 text-sm hover:bg-muted"
                >
                  {label}
                </Link>
              ))}
              <a
                href={LINKEDIN_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-sm px-3 py-2 text-sm hover:bg-muted"
              >
                LinkedIn
              </a>
              <Link
                href="/assessment"
                className="mt-1 block rounded-sm bg-primary px-3 py-2 text-center text-sm text-primary-foreground"
              >
                Start the assessment
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
