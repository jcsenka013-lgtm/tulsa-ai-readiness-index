import Link from "next/link";

import { LinkedInIcon } from "@/components/marketing/LinkedInIcon";

const LINKEDIN_HREF = "https://www.linkedin.com/company/tulsa-applied-ai";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
] as const;

type MarketingFooterProps = {
  /** e.g. cross-link to the general AI assessment from Copilot pages */
  crossPromo?: { href: string; label: string };
  /** e.g. independent-consultancy disclosure on Copilot pages */
  disclosureNote?: string;
};

export function MarketingFooter({ crossPromo, disclosureNote }: MarketingFooterProps) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Tulsa Applied AI LLC</p>
          <p>Tulsa, Oklahoma</p>
          {crossPromo ? (
            <p className="pt-2">
              <span className="text-muted-foreground">Also from Tulsa Applied AI: </span>
              <Link
                href={crossPromo.href}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {crossPromo.label}
              </Link>
            </p>
          ) : null}
          {disclosureNote ? (
            <p className="max-w-xl pt-2 text-xs leading-relaxed text-muted-foreground/90">
              {disclosureNote}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Footer">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
          <a
            href={LINKEDIN_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="LinkedIn"
          >
            <LinkedInIcon className="h-4 w-4" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground md:max-w-xs md:text-right">
          &copy; {new Date().getFullYear()} Tulsa Applied AI LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
