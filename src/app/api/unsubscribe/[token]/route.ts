import { createServiceClient } from "@/lib/supabase/server";
import { decodeUnsubscribeToken } from "@/lib/email/unsubscribe-url";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token: raw } = await ctx.params;
  const token = decodeURIComponent(raw ?? "");
  const email = decodeUnsubscribeToken(token);

  if (!email || !email.includes("@")) {
    return Response.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), 302);
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("unsubscribes").insert({
    email,
    source: "link",
    reason: "unsubscribe_link",
  });

  if (error && error.code !== "23505") {
    return new Response(`Could not process unsubscribe: ${error.message}`, {
      status: 500,
    });
  }

  const site = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "") || "http://localhost:3000";
  const dest = new URL("/unsubscribed", site);
  dest.searchParams.set("email", email);
  return Response.redirect(dest, 302);
}
