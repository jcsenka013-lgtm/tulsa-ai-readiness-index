# Tulsa AI Readiness Index

A lead-generation web app for **Tulsa Applied AI LLC**. Visitors take a
five-minute assessment, get a readiness score across five dimensions, a custom
ROI estimate, and a personalized roadmap PDF.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui** (slate palette)
- **Supabase** (Postgres + Auth; magic-link email planned)
- **Vercel** for hosting

## Prerequisites

- Node.js **20.x** or newer
- npm **10.x** or newer
- A Supabase project — free tier is fine
- (Optional) the **Supabase CLI** to run migrations locally: <https://supabase.com/docs/guides/cli>

## 1. Clone and install

```bash
npm install
```

## 2. Configure environment variables

Copy the example file and fill it in with values from your Supabase project
(**Project Settings → API**):

```bash
cp .env.local.example .env.local
```

Variables:

| Variable | Where it's used | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server clients | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server clients | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (bypasses RLS) | **No — never commit** |
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs in emails/PDFs | Yes |

## 3. Run the database migrations

The schema lives in `supabase/migrations/` and is applied in order:

| File | Purpose |
| --- | --- |
| `001_initial_schema.sql` | Creates `assessments` and `leads` tables with RLS enabled. |
| `002_align_scoring_domains.sql` | Re-aligns score columns to match the five domains defined in `src/lib/questions/questions.json` (data_security_compliance, operational_process_maturity, technology_infrastructure, team_change_management, financial_strategic_alignment). |

### Option A — Supabase CLI (recommended)

```bash
# One-time: link this repo to your remote Supabase project
supabase link --project-ref <your-project-ref>

# Apply the migration to the linked remote database
supabase db push
```

### Option B — Paste into the SQL editor

1. Open your Supabase project → **SQL Editor → New query**.
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`.
3. Run.

### Option C — Local Supabase stack

```bash
supabase start                 # Docker-based local stack
supabase migration up          # Apply all migrations to the local DB
```

## 4. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

## Project layout

```
src/
  app/                    # Next.js App Router routes
    assessment/           # Assessment flow (multi-step form)
    results/[id]/         # Personalized results page
    api/                  # Route handlers (server actions, webhooks)
  components/
    ui/                   # shadcn/ui primitives
    assessment/           # Assessment-specific components
  lib/
    supabase/             # Browser + server Supabase clients
    scoring/              # Scoring engine (domains, ROI, insights, orchestrator) + tests
    questions/            # Canonical question bank (questions.json) + typed loader + firmographics
    email/                # Transactional email (TBD)
    pdf/                  # PDF roadmap generation (TBD)
  types/
    assessment.ts         # Domain types mirroring the schema
supabase/
  migrations/             # SQL migration files
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on `localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the vitest suite once |
| `npm run test:watch` | Run vitest in watch mode |

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in <https://vercel.com/new>.
3. Add the four environment variables from `.env.local.example` in
   **Project → Settings → Environment Variables** (make sure
   `SUPABASE_SERVICE_ROLE_KEY` is marked **Secret**, not exposed to the
   browser).
4. Deploy.

## License

Proprietary — © Tulsa Applied AI LLC.
