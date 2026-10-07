# Email automation, Slack, and cron — deployment guide

This document covers production setup for the Tulsa AI Readiness Index lead funnel: Resend transactional email, Supabase `email_log` / `unsubscribes`, Cloudflare Workers cron follow-ups, and Slack webhooks.

## 1. Environment variables

Public values live in `vars` in `wrangler.jsonc`; secrets are set with `npx wrangler secret put <NAME>`. Mirror them in `.env.local` for local testing.

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes (prod) | Resend API key for sending mail |
| `EMAIL_FROM` | No | Default `results@tulsaappliedai.com` — must be a verified sender/domain in Resend |
| `SITE_URL` or `NEXT_PUBLIC_SITE_URL` | Yes | Absolute origin for links in email and Slack (no trailing slash) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase (already required for assessments) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Used to build Supabase dashboard links in Slack |
| `CRON_SECRET` | Yes (prod cron) | Long random string; the Worker's scheduled handler sends `Authorization: Bearer <CRON_SECRET>` |
| `SLACK_WEBHOOK_URL_LEADS` | No | Incoming webhook for new leads + booked-call pings |
| `SLACK_WEBHOOK_URL_ERRORS` | No | Incoming webhook for email pipeline errors (no PII) |
| `CALENDLY_DISCOVERY_URL` | No | 30-minute discovery scheduling link (defaults in code) |
| `CALENDLY_15MIN_URL` | No | 15-minute link for 72h follow-up |
| `EMAIL_SIGNATURE_NAME` | No | Closing line on templates |
| `EMAIL_SIGNATURE_PHONE` | No | Phone in signature |
| `EMAIL_SIGNATURE_EMAIL` | No | Reply email in signature |
| `BUSINESS_ADDRESS` | No | Physical address line in email footer |
| `SUPABASE_DASHBOARD_PROJECT_URL` | No | Override Slack “open Supabase” link if the auto-derived URL is not ideal |
| `NEXT_PUBLIC_EMAIL_PREVIEW` | Dev only | Set to `true` to enable `/email-preview` and `/api/email-preview/render` |

### Generating `CRON_SECRET`

Use a cryptographically random string (32+ bytes), for example:

```bash
openssl rand -hex 32
```

Store it as a Worker secret: `npx wrangler secret put CRON_SECRET`. The scheduled handler in `worker/index.ts` sends it as a Bearer token when invoking `/api/cron/email-sequences`.

## 2. Resend account and domain

1. Create an account at [https://resend.com](https://resend.com).
2. Add and verify your sending domain (e.g. `tulsaappliedai.com`).
3. Create an API key with send permission; set it as `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to an address on the verified domain (e.g. `results@tulsaappliedai.com`).

## 3. DNS for deliverability

Work with whoever manages DNS for your domain. Typical records:

### SPF (TXT)

Authorizes Resend (and any other mail senders you use) to send on behalf of your domain. Resend’s dashboard shows the exact TXT value after you add the domain.

### DKIM (TXT)

Resend provides DKIM host/name and value — add as TXT records.

### DMARC (TXT)

Example policy (start in reporting mode, then tighten):

```text
Name: _dmarc.tulsaappliedai.com
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@tulsaappliedai.com
```

Later you may move to `p=quarantine` or `p=reject` once you are confident SPF/DKIM align.

### MX

MX applies if you receive mail on the same hostname. For a subdomain used only for **sending** (e.g. `send.tulsaappliedai.com`), follow Resend’s subdomain guidance. If you use Google Workspace / Microsoft 365 for **inbound** mail on the root domain, do not replace those MX records—add sender authentication only where Resend instructs.

## 4. Supabase migration

Apply `supabase/migrations/004_email_infra.sql` to your project (CLI `supabase db push`, SQL editor, or CI). It creates:

- `email_log` — idempotent send log (`unique (assessment_id, email_type)`).
- `unsubscribes` — opt-outs with lowercase email enforced by trigger.

## 5. Slack apps and webhooks

1. In Slack, create an app (or use an existing workspace app) with **Incoming Webhooks** enabled.
2. Add a webhook to the channel where you want **leads + bookings** → copy URL → `SLACK_WEBHOOK_URL_LEADS`.
3. Add a second webhook to an **errors / engineering** channel → `SLACK_WEBHOOK_URL_ERRORS`.

Messages are plain text (markdown-style asterisks for bold in some clients). No passwords or full PII are posted to the errors channel.

## 6. Cloudflare cron trigger

`wrangler.jsonc` schedules the Worker hourly:

```jsonc
"triggers": { "crons": ["0 * * * *"] }
```

The `scheduled` handler in `worker/index.ts` calls `/api/cron/email-sequences` with the `CRON_SECRET` Bearer token. After deploy, `wrangler deploy` prints `schedule: 0 * * * *`; the trigger is also listed in the Cloudflare dashboard under **Workers & Pages → tulsa-ai-readiness-index → Settings → Trigger events**.

## 7. Manual testing checklist

1. **Send each follow-up template** — set `NEXT_PUBLIC_EMAIL_PREVIEW=true`, open `/email-preview`, pick template + fixture; confirm copy and links. For real sends, use a personal address and complete an assessment in staging.
2. **Unsubscribe** — open an unsubscribe link from a received email, confirm redirect to `/unsubscribed`, row in `unsubscribes`, and that the next `sendEmail` returns `outcome: "skipped"` for that address.
3. **Cron auth** — locally:

   ```bash
   curl -sS -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/email-sequences"
   ```

   Expect JSON `{ sent, skipped, errors }`.

4. **24h follow-up** — in Supabase, set a completed assessment’s `completed_at` to more than 24 hours ago, ensure `booked_call_at` is null, ensure `results_ready` / `followup_24h` logs allow the sequence (24h requires prior completion only; 72h requires 24h log; 7d requires 72h log). Run cron twice; second run should show duplicates **skipped** via `email_log`.
5. **Abandoned recovery** — `in_progress` row with `email` set, `created_at` more than 2 hours ago, no `abandoned_recovery` log; run cron; confirm one email; run again → skipped.

## 8. Application routes (reference)

- `POST /api/assessment/[id]/complete` — scores, persists, sends **results** email (once per assessment + type), then Slack lead.
- `POST /api/assessment/[id]/booked` — sets `booked_call_at`, Slack ping.
- `GET /api/cron/email-sequences` — Bearer `CRON_SECRET`; sequence sends (max 50 per run).
- `GET /api/unsubscribe/[token]` — base64url email token; inserts opt-out; redirects to `/unsubscribed`.

## 9. Operational notes

- If Resend returns an error and a **`failed`** row is inserted in `email_log`, that `(assessment_id, email_type)` pair will not retry automatically (unique constraint). Delete or adjust that row if you intentionally want a retry.
- Without `RESEND_API_KEY`, the API still inserts a **failed** log row for the attempt (when applicable), which also blocks duplicate retries until you clear it.
