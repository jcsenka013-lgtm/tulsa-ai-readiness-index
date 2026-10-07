import handler from "vinext/server/fetch-handler";

type Env = { CRON_SECRET?: string };
type Ctx = { waitUntil(promise: Promise<unknown>): void };

const worker = {
  fetch(request: Request, env: Env, ctx: Ctx) {
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
