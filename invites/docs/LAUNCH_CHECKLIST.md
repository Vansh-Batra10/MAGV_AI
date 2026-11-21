# Launch checklist

Legend: [x] done in repo · [ ] owner-only (needs accounts, keys, devices or legal sign-off)

## Product
- [x] Three templates (Sheesh Mahal, Rang Kahani, Mohar) × three packs, reduced-motion + Lite paths, tier A/B/C
- [x] Guest page: personal links, only invited functions, RSVP per function, shagun UPI intent + QR, live updates, day-of banner, public link mode
- [x] Studio: OTP login, wizard, editor, guests import + matrix, send queue, dashboard, shagun ledger, plans, exports
- [x] Render worker: video, cards, PDF, QR card, per-guest OG + story, crest
- [x] Couple app (Expo): typechecks, Android JS bundle exports
- [ ] Couple app native builds (Xcode / Android SDK) and Maestro smoke on emulators (`apps/mobile/e2e/smoke.yaml`)
- [ ] Real AI image provider chosen and one pack per template generated, reviewed and approved (VERIFY #11)
- [ ] Recorded, licensed audio (optional; synthesised audio ships today) with licence files in `/licenses`

## Services (switch MOCK_MODE=false)
- [ ] Supabase project: run `packages/db/migrations/*.sql`, phone OTP provider, Storage buckets (private for personal photos)
- [ ] Implement the Supabase adapter behind `Store` (same method surface; RLS already in SQL)
- [ ] Razorpay live keys + webhook secret; RevenueCat products; GST invoice fields (VERIFY #3)
- [ ] SMS provider for OTP and VPA-change notices
- [ ] Render worker deployed with `DATABASE_URL` (pg-boss), `RENDER_TOKEN`, `WEB_URL`, `APP_URL`; tesseract installed for OCR checks
- [ ] Sentry DSNs (web, app, worker); PostHog key (no guest PII; allow-list in `lib/analytics.ts`)
- [ ] CDN in front of `/fonts`, `/_next/static`, exports (immutable URLs)
- [ ] Static map provider for guest pages (VERIFY #4)

## Quality gates
- [x] Unit tests (Vitest) across packages; determinism test; Hindi segmentation tests
- [x] E2E: guest flows ×3 templates, public link, couple flow, isolation
- [x] Export assertions (video size/duration/resolution, QR decode, card/OG sizes, crest transparency): `pnpm --filter @invites/render-worker test:exports` with the web app running
- [x] Guest route JS budget (≤ 180 KiB gzip incl. framework) measured in production build
- [ ] Lighthouse CI in CI (`lighthouserc.json`) against a deployed preview
- [ ] k6 send-burst load test against staging (`load/send-burst.js`)
- [ ] Real-device pass: budget Android (₹10–15k) on 4G, iPhone Safari, Instagram + Facebook in-app browsers (audio + orientation)

## Legal & safety
- [ ] Lawyer review of privacy notice, terms, refunds, grievance officer (DPDP Act, VERIFY #10)
- [ ] CA review of GST and any shagun tax FAQ (VERIFY #3, #9)
- [ ] App Store / Play billing rules for India (VERIFY #7)
- [x] Retention job (`apps/web/scripts/retention.mjs`, 90-day guest anonymisation) and personal-photo purge helper (30 days)
- [x] Abuse reports → admin takedown; rate limits on RSVP, pledges, OTP, public names; honeypot on public form; CSP + security headers
- [ ] Brand name trademark + domain (VERIFY #1)
