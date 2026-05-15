const PERSONAL_DOMAINS = new Set(
  [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
  ].map((d) => d.toLowerCase()),
);

export function isLikelyPersonalEmailDomain(email: string): boolean {
  const at = email.indexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return PERSONAL_DOMAINS.has(domain);
}
