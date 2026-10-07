# Tulsa AI Readiness Index

[![CI](https://github.com/jcsenka013-lgtm/tulsa-ai-readiness-index/actions/workflows/ci.yml/badge.svg)](https://github.com/jcsenka013-lgtm/tulsa-ai-readiness-index/actions/workflows/ci.yml)

**Live:** [tulsaappliedai.com](https://tulsaappliedai.com)

A full-stack lead-generation and diagnostic web app for **Tulsa Applied AI LLC**.
Small and mid-sized businesses take a five-minute assessment and get a 0–100
AI-readiness score across five weighted domains, an ROI estimate, prioritized
consultant-style insights, and a downloadable PDF roadmap. Every completion
becomes a qualified lead with an automated email follow-up sequence.

The app runs two products on one codebase:

- **AI Readiness Index** (`/`) — general AI readiness for SMBs.
- **Copilot Readiness Assessment** (`/copilot`) — Microsoft 365 Copilot
  readiness, with a dedicated M365 security/compliance gap-analysis engine.

## Features

- **Multi-step assessment** with autosave and resume (firmographics → contact
  gate → questions), driven by a JSON question bank (48 weighted questions).
- **Scoring engine** — weighted domain scores, readiness tier, recommended next
  step with compliance overrides, ROI banding, and a prioritized rule-based
  insight generator. Covered by 84 Vitest unit tests.
- **Microsoft 365 gap analysis** — Copilot prerequisites, compliance gaps,
  licensing upgrades, and quick wins.
- **PDF report** generated server-side with `@react-pdf/renderer`, stored in a
  private Supabase Storage bucket, and served via short-lived signed URLs.
- **Email automation** — results email plus 24h / 72h / 7-day follow-ups and
  abandoned-assessment recovery via Resend + React Email, run by an hourly
  Cloudflare Workers cron trigger, with idempotent send logging and one-click
  unsubscribe.
- **Ops** — Slack lead and booked-call alerts, Sentry error monitoring tagged
  by product, per-IP rate limiting, per-product analytics funnel events, and a
  password-protected admin leads dashboard.
- **SEO** — sitemap, robots rules, and dynamic Open Graph images per product.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Route Handlers, Proxy), React 19, TypeScript; built for Workers with [vinext](https://github.com/cloudflare/vinext) on Vite 8 |
| UI | Tailwind CSS v4, shadcn/ui, Base UI, Floating UI |
| Data | Supabase (Postgres with RLS, Storage) |
| Email | Resend, React Email |
| PDF | @react-pdf/renderer |
| Monitoring | Sentry, Slack incoming webhooks |
| Testing / CI | Vitest, ESLint, GitHub Actions |
| Hosting | Cloudflare Workers (custom domain, cron trigger, Wrangler) |

## Project layout

```
src/
  app/                    # Routes: marketing pages, /assessment, /results/[id],
                          # /copilot/*, /admin, and api/* route handlers
  components/             # assessment/, results/, marketing/, ui/ (shadcn)
  lib/
    scoring/              # Domain scores, tiers, ROI, insights (+ tests)
    questions/            # questions.json, Copilot supplemental set, firmographics
    m365-gap-analysis.ts  # Microsoft 365 / Copilot gap engine
    pdf/                  # React-PDF report document and generation
    email/                # Resend client, templates, follow-up sequence cron
    notifications/        # Slack webhooks
    products/             # Per-product config (AI vs Copilot)
    supabase/             # Browser + server clients
  proxy.ts                # Basic Auth for /admin
worker/index.ts           # Workers entry: vinext fetch handler + hourly cron
supabase/migrations/      # SQL schema, applied in order
vite.config.ts            # vinext + Cloudflare build (see "Running on Workers")
wrangler.jsonc            # Worker config: domains, cron, public vars
```

## Local setup

Requires Node.js 20+ and a Supabase project (free tier works).

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys at minimum
npm run dev                        # http://localhost:3000
```

### Database

Apply `supabase/migrations/001` through `007` in order, either with the
Supabase CLI (`supabase link --project-ref <ref> && supabase db push`) or by
pasting each file into the Supabase SQL editor.

Then create a **private** Storage bucket named `reports` (PDF only, 10 MB
limit) for generated PDF reports — see `003_pdf_tracking.sql`.

### Environment variables

The full list with comments is in [`.env.local.example`](.env.local.example).
Only the Supabase variables and `NEXT_PUBLIC_SITE_URL` are required to run the
assessment locally; email, Slack, Sentry, and Calendly degrade gracefully when
unset. `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to
the browser. Set `ADMIN_PASSWORD` to enable `/admin`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server on `localhost:3000` |
| `npm run dev:vinext` | vinext dev server in the Workers runtime (`localhost:3001`) |
| `npm run build:vinext` / `npm run start:vinext` | Workers build / serve it locally in workerd |
| `npm run build` | Next.js production build (kept as a compatibility check in CI) |
| `npm run deploy` | Production Workers build + `wrangler deploy` |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Vitest suite |
| `npm run generate-sample-pdf` | Render a sample PDF report locally |

## Deploying (Cloudflare Workers)

Production runs on Cloudflare Workers at `tulsaappliedai.com` / `www`, both
configured as custom domains in [`wrangler.jsonc`](wrangler.jsonc) along with the
hourly email cron and the public configuration (`vars`).

1. Authenticate Wrangler: `npx wrangler login`, or set `CLOUDFLARE_API_TOKEN`
   (Workers edit + zone DNS edit) and `CLOUDFLARE_ACCOUNT_ID`.
2. Set the secrets once:
   `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY` (and `RESEND_API_KEY`,
   `CRON_SECRET`, `ADMIN_PASSWORD`).
3. `npm run deploy`.

### Running on Workers

`vite.config.ts` includes two small resolver plugins needed because route
handlers run in the React Server Components environment on workerd:

- **Full React for the PDF and email renderers.** `@react-pdf/renderer` and
  `@react-email/render` (via `react-dom/server.edge`) need React's full build,
  not its react-server build. Next.js gets the same effect by treating them as
  server-external packages.
- **Precompiled Yoga WebAssembly.** Workers forbid compiling WebAssembly at
  runtime, so the layout engine used by `@react-pdf` is extracted at build time
  and loaded as a `.wasm` module through Emscripten's `instantiateWasm` hook.

See [`docs/DEPLOYMENT-EMAIL.md`](docs/DEPLOYMENT-EMAIL.md) for Resend/DNS setup
and [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) for production smoke
tests.

## License

Proprietary — © Tulsa Applied AI LLC.
