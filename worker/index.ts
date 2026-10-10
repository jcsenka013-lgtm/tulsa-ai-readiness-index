import handler from "vinext/server/fetch-handler";

import { registerWorkersAi, type WorkersAiBinding } from "../src/lib/assistant/workers-ai";

type Env = { CRON_SECRET?: string; AI?: WorkersAiBinding };
type Ctx = { waitUntil(promise: Promise<unknown>): void };

const worker = {
  fetch(request: Request, env: Env, ctx: Ctx) {
    // Route handlers can't see `env`; hand the Workers AI binding to the
    // results assistant's embedding search.
    registerWorkersAi(env.AI);
    return handler.fetch(request, env, ctx);
  },

  /** Hourly email sequences (replaces Vercel Cron); reuses the route's Bearer auth. */
  scheduled(_controller: unknown, env: Env, ctx: Ctx) {
    const request = new Request("https://cron.internal/api/cron/email-sequences", {
      headers: { authorization: `Bearer ${env.CRON_SECRET ?? ""}` },
    });
    ctx.waitUntil(
      handler.fetch(request, env, ctx).then(async (res: Response) => {
        if (!res.ok) {
          console.error("email-sequences cron failed:", res.status, await res.text());
        }
      }),
    );
  },
};

export default worker;
