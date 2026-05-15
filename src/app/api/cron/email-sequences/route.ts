import type { NextRequest } from "next/server";

import { runEmailSequenceCron } from "@/lib/email/sequence-cron";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runEmailSequenceCron();
    return Response.json(summary);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 500 });
  }
}
