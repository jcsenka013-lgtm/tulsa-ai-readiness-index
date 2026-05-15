export const BUSINESS_ADDRESS =
  process.env.BUSINESS_ADDRESS ??
  "Tulsa, OK";

export const SUPPORT_EMAIL = "support@tulsaappliedai.com";

export const SIGNATURE_NAME =
  process.env.EMAIL_SIGNATURE_NAME ?? "Tulsa Applied AI";

export const SIGNATURE_PHONE =
  process.env.EMAIL_SIGNATURE_PHONE ?? "(918) 555-0100";

export const SIGNATURE_EMAIL =
  process.env.EMAIL_SIGNATURE_EMAIL ?? "hello@tulsaappliedai.com";

export function getCalendlyDiscoveryUrl(): string {
  return (
    process.env.CALENDLY_DISCOVERY_URL ??
    "https://calendly.com/tulsaappliedai/discovery"
  );
}

export function getCalendly15MinUrl(): string {
  return (
    process.env.CALENDLY_15MIN_URL ??
    "https://calendly.com/tulsaappliedai/15min"
  );
}
