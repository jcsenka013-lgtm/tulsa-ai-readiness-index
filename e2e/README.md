# End-to-end tests

Playwright walks both assessments in a real browser against a production
build and a local Supabase with the repo's migrations applied.

```bash
npx supabase start -x studio,imgproxy,mailpit,edge-runtime,logflare,vector,realtime,supavisor,postgres-meta,storage-api
eval "$(npx supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=' | sed 's/^/SB_/')"
export NEXT_PUBLIC_SUPABASE_URL=$SB_API_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$SB_ANON_KEY \
  SUPABASE_SERVICE_ROLE_KEY=$SB_SERVICE_ROLE_KEY NEXT_PUBLIC_SITE_URL=http://localhost:3100
npm run build
npm run test:e2e
```

Email and Slack are skipped (no `RESEND_API_KEY` / webhook), so nothing is
sent. CI runs the same steps in the `e2e` job of `.github/workflows/ci.yml`.
