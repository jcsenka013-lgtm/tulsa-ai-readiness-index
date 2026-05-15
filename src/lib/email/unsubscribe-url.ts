import { getSiteUrl } from "@/lib/email/site-url";

export function encodeUnsubscribeToken(email: string): string {
  return Buffer.from(email.trim().toLowerCase(), "utf8").toString("base64url");
}

export function decodeUnsubscribeToken(token: string): string {
  const t = token.trim();
  let out = "";
  try {
    out = Buffer.from(t, "base64url").toString("utf8").trim().toLowerCase();
  } catch {
    out = "";
  }
  if (out.includes("@")) return out;
  try {
    const normalized = t.replace(/-/g, "+").replace(/_/g, "/");
    out = Buffer.from(normalized, "base64").toString("utf8").trim().toLowerCase();
  } catch {
    return "";
  }
  return out.includes("@") ? out : "";
}

export function buildUnsubscribeUrl(email: string): string {
  const site = getSiteUrl();
  if (!site) return "#";
  return `${site}/api/unsubscribe/${encodeURIComponent(encodeUnsubscribeToken(email))}`;
}
