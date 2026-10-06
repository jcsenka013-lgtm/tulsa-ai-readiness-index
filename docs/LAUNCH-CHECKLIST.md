# Pre-launch checklist — two products (AI Readiness + Copilot Readiness)

Use this for production before a broad public push. The app differentiates
**general AI Readiness** (`ai_readiness`) and **Microsoft 365 Copilot Readiness**
(`copilot_readiness`) via `assessments.product_type` / `leads.source_product`
on the same scoring and API stack.

Where "both products" is mentioned, treat the task as done only when it has
been verified for **each** product independently.

---

## 1. Rate limiting (per product, tighter on Copilot)

`src/lib/rate-limit/assessment-create.ts` scopes the fixed window limit by
`(client ip, product)` so Copilot's smaller, targeted audience can run on a
stricter ceiling without starving the general product.

- [ ] Defaults confirmed in production: `ASSESSMENT_CREATE_LIMIT_AI=20` and
  `ASSESSMENT_CREATE_LIMIT_COPILOT=10` per 15-minute window per IP. Override
  via env when you need to tighten Copilot further during a launch push.
- [ ] `ASSESSMENT_CREATE_RATE_LIMIT_DISABLED` **must be unset or `false`** in
  production (only `true` for local debugging).
- [ ] Manual check: hit `/assessment` and `/copilot/assessment` from the same
  IP in quick succession — Copilot should hit `429` first.

## 2. Analytics funnel (per product)

All funnel events flow through `trackFunnel(name, productType, extra?)`
in `src/lib/analytics-funnel.ts`, which emits a `tai:analytics` CustomEvent
with `product_type` attached. Wire your destination (GTM, Segment, GA4, …) to
listen once and split by `properties.product_type`.

The full funnel per product:

| Step | Event name | Fired from |
| --- | --- | --- |
| Landing viewed | `funnel_landing_viewed` | `src/components/marketing/AiLandingAnalytics.tsx`, `src/app/copilot/CopilotLandingAnalytics.tsx` |
| Assessment started | `funnel_assessment_started` | `src/app/assessment/AssessmentStartClient.tsx` |
| Assessment completed | `funnel_assessment_completed` | `src/components/assessment/AssessmentForm.tsx` |
| Results viewed | `funnel_results_viewed` | `src/app/results/[id]/page.tsx`, `src/app/copilot/results/[id]/page.tsx` |
| Discovery call booked | `funnel_discovery_call_booked` | Same results pages (via `?calendly_booked=1` post-booking redirect) |
| Engagement signed | `funnel_engagement_signed` | CRM / contract flow (see note below) |

- [ ] Open both landings in devtools and confirm a `tai:analytics` event with
  `product_type` for each funnel step.
- [ ] Compare conversion at each stage by product in your analytics
  destination (AI vs Copilot) — conversion rates **will** differ and that's
  the point of the per-product instrumentation.
- [ ] **Engagement signed**: not wired in-repo (closed deals typically happen
  outside the product). When you sign a contract, fire
  `funnel_engagement_signed` with `product_type` from your CRM, admin tool,
  or a short internal page so the full funnel reflects realized revenue.

## 3. Cross-product promotion

Implemented in `src/lib/cross-product/promo.ts` (unit-tested) and applied on
each results page.

- [ ] `/results/[id]` — if `technology_infrastructure < 50` **and** the
  firmographic answer for "primary productivity stack" is Microsoft 365,
  show: *"Your M365 posture came up in this assessment. Want a deeper look
  specific to Copilot? Take the Copilot Readiness Assessment."* → `/copilot`.
  (`shouldShowCopilotCrossSell`)
- [ ] `/copilot/results/[id]` — if the respondent signalled `not_m365_tenant`
  (supplemental signal) **or** the M365 gap engine derives
  `copilot_relevance.status === "not_microsoft_365_tenant"`, show: *"This
  product isn't quite right for you. Try the general AI Readiness Index
  instead."* → `/`. (`shouldShowAiReadinessCrossSell`)
- [ ] Copy / tone reviewed against final marketing voice (soft, not pushy).

## 4. URL disambiguation (back-compat for old links)

Any `/results/[id]` link — shared from before the Copilot split, in an old
email, or in an older PDF — must resolve to the correct product's results
page based on `assessments.product_type`.

- [ ] `/results/[id]` for an AI Readiness assessment renders inline.
- [ ] `/results/[id]` for a Copilot assessment **redirects** to
  `/copilot/results/[id]` (and vice-versa from `/copilot/results/[id]` for an
  AI assessment). See the `router.replace` branches in both page clients.
- [ ] All *outgoing* links built inside the app (emails, PDFs, Slack,
  dashboards) use `getResultsPageUrl(id, productType)` which reads
  `PRODUCTS[productType].resultsPath` — **never** hard-code `/results/${id}`
  in new code.

## 5. SEO — sitemap and robots

- [ ] `https://<site>/sitemap.xml` lists **both** products' landing and
  sample-report pages (`/`, `/sample-report`, `/copilot`,
  `/copilot/sample-report`) plus `/about`, `/contact`, and the assessment
  entry points. Per-user results pages and in-progress assessment ids are
  **not** included.
- [ ] `https://<site>/robots.txt` disallows `/assessment/` and
  `/copilot/assessment/` (both in-progress paths). Shared `/results/[id]`
  stays crawlable so shared links keep their back-compat.

## 6. OG images (two distinct)

- [ ] `GET /og-image.png` → slate-gradient AI Readiness card (via the
  `next.config.ts` rewrite to `/og-image`).
- [ ] `GET /og-copilot.png` → Microsoft-blue Copilot card with
  **"Copilot Readiness Assessment"** prominent.
- [ ] Paste both URLs into LinkedIn Post Inspector and X's card validator
  to confirm 1200×630 rendering and correct titles/descriptions.

## 7. Monitoring — Sentry + Slack per product

### Sentry

Every product-aware route/page calls `setSentryProductTypeTag(productType)`
so the current scope includes a `product_type` tag before any throw:

- `src/app/api/assessment/create/route.ts`
- `src/app/api/assessment/[id]/complete/route.ts`
- `src/app/api/assessment/[id]/booked/route.ts`
- `src/app/api/assessment/[id]/pdf/route.ts` (both POST and GET)
- `src/app/results/[id]/page.tsx`, `src/app/copilot/results/[id]/page.tsx`

- [ ] Trigger a deliberate error (e.g. a bogus id) on each surface and
  verify the Sentry event shows the right `product_type` tag.
- [ ] `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN` (client) are set.

### Slack

`src/lib/notifications/slack.ts` prepends a product label to every new-lead
and booked-call message header so you can triage at a glance:

- *New lead:* `🎯 *[Copilot] New lead:* <Company>` or
  `🎯 *[AI Readiness] New lead:* <Company>` — the results link embedded in
  the message uses `PRODUCTS[productType].resultsPath`, so clicking jumps to
  the right product's results page.
- *Booked call:* `📞 *[Copilot]* *<Name>* from *<Co>* just booked a
  discovery call` (AI Readiness equivalent).

- [ ] `SLACK_WEBHOOK_URL_LEADS` and `SLACK_WEBHOOK_URL_ERRORS` are set.
- [ ] Run one completion per product — confirm the header prefix is right
  and the link opens the matching results page.

## 8. Competitive disclosure (Copilot footer)

Legal + plain-language disclosure on the Copilot landing page footer. The
shared `MarketingFooter` accepts a `disclosureNote` prop so only
Copilot pages carry this text:

> Tulsa Applied AI is an independent consultancy. We are not a Microsoft
> Partner or reseller. Pricing information is current as of **[DATE]** and
> sourced from Microsoft's published documentation.

- [ ] Update `[DATE]` in `src/app/copilot/page.tsx` on the day you publish
  updated Copilot pricing copy. (Refreshing this date quarterly, or whenever
  Microsoft pricing shifts, is the simplest defence against stale claims.)
- [ ] Footer is **not** shown on `/` or `/results/[id]` (AI product should
  stay neutral / not reference Microsoft Partner status).

## 9. Email, PDF, and Calendly UTMs

Every outbound link uses product-aware URL builders so attribution splits
AI vs Copilot end-to-end.

- [ ] **Emails** (results-ready, 24h, 72h, 7-day, abandoned-recovery) use
  `getResultsPageUrl(id, productType)` for the results CTA and
  `getDiscoveryCalendlyWithUtm` / `getCalendly15MinWithUtm` for Calendly —
  with `utm_source=tulsa_applied_ai`, `utm_medium=email|pdf|results_cta|web`,
  `utm_campaign=ai_readiness|copilot_readiness`, and `utm_content=<id>`.
- [ ] **Subjects** for the "results ready" email include
  `PRODUCTS[productType].shortName` (verified in the complete route).
- [ ] **PDF copy** is product-aware (uses the Copilot tone / M365 gap
  sections when `product_type = copilot_readiness`).
- [ ] **Calendly event types**: for each event type, set the confirmation
  redirect to the matching results URL with `?calendly_booked=1` — e.g.
  `https://<site>/results/<id>?calendly_booked=1` for AI or
  `/copilot/results/<id>?calendly_booked=1` for Copilot. This marks
  `booked_call_at`, posts the Slack booked-call ping, and fires
  `funnel_discovery_call_booked` exactly once (via `useRef` idempotency).
- [ ] In Calendly reporting, confirm UTM parameters actually separate AI
  vs Copilot (`utm_campaign`).

## 10. Admin dashboard

- [ ] `/admin/leads` lists both products with a `source_product` column and
  filter chips for *All / AI Readiness / Copilot Readiness*. Counts should
  match what you see per product in Supabase.

---

# Final pre-launch smoke tests (production)

Run **each** item once per product against the production deployment.

### A. Complete both assessments end-to-end on production

- [ ] `/` → start → firmographics → contact gate → full question set →
  submit → lands on `/results/<id>` with a score, tier, insights, and ROI.
- [ ] `/copilot` → start → firmographics (+ Copilot supplemental step) →
  contact gate → submit → lands on `/copilot/results/<id>` with M365 gap
  analysis section populated.
- [ ] Back-compat: open `/results/<copilot-id>` manually — confirm it
  redirects to `/copilot/results/<copilot-id>`.

### B. PDF renders correctly for both products

- [ ] On each results page, click "Download PDF" → opens signed URL, 1-page
  cover + domain scores + M365 section where applicable + recommended next
  step. The PDF header/branding matches the product.
- [ ] Hit `GET /api/assessment/<id>/pdf` directly on both — a 302 redirects
  to a fresh 7-day signed URL and the `pdf_download_count` increments.

### C. Emails send with correct subject + copy per product

- [ ] Results-ready email: subject contains `Your <shortName>` for each
  product; body CTA opens the right results page; Calendly link has
  `utm_campaign=ai_readiness` or `utm_campaign=copilot_readiness`.
- [ ] Follow-up 24h / 72h / 7-day: same attribution; unsubscribe link works
  and routes to `/unsubscribed`.
- [ ] Abandoned-recovery email fires for an incomplete assessment after the
  cron runs (`/api/cron/email-sequences`) and links back to the correct
  product's assessment path.

### D. Admin dashboard shows both products distinctly

- [ ] `/admin/leads` with no filter — both products in the list with the
  product label column populated.
- [ ] Filter chip for *Copilot Readiness* — only `source_product = copilot_readiness` rows.
- [ ] Filter chip for *AI Readiness* — only `source_product = ai_readiness` rows.

### E. Calendly bookings are UTM-tagged per product

- [ ] Book a discovery call from the AI results page — in Calendly, the
  booking row shows `utm_campaign=ai_readiness` and
  `utm_content=<assessment id>`.
- [ ] Book a discovery call from the Copilot results page — Calendly row
  shows `utm_campaign=copilot_readiness` and `utm_content=<assessment id>`.
- [ ] Slack booked-call message header shows `[AI Readiness]` or
  `[Copilot]` matching the product.

---

## Environment sanity

- [ ] `NEXT_PUBLIC_SITE_URL` / `SITE_URL` is the production origin (no
  trailing slash).
- [ ] Supabase migrations through `005_product_type.sql` applied;
  `leads.source_product` column exists.
- [ ] `RESEND_API_KEY`, `EMAIL_FROM`, `SLACK_WEBHOOK_URL_LEADS`,
  `SLACK_WEBHOOK_URL_ERRORS`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`,
  `CRON_SECRET` are all set.
- [ ] Cloudflare cron trigger (`0 * * * *` in `wrangler.jsonc`) registered for `/api/cron/email-sequences`.
- [ ] `ASSESSMENT_CREATE_LIMIT_AI`, `ASSESSMENT_CREATE_LIMIT_COPILOT` set
  (or accept the defaults of 20 / 10 per 15-minute IP window).

## Sign-off

- [ ] All 5 smoke tests (A–E) green for **both** products.
- [ ] Sentry last-hour dashboard clean; any event shown has a `product_type`
  tag.
- [ ] Slack leads channel received test pings with the right `[Copilot]` /
  `[AI Readiness]` header on each product.
