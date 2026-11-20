# Hilo — interactive digital gifts

Cinematic, mobile-first gift pages for your person, your people and every festival. Individual and **group** gifts, a question-flow creator that builds a full preview in under 90 seconds, a free 24-hour tier, and two editions: **India** (Hinglish/English/Hindi, ₹ + UPI) and **Global** (English, USD).

Brand name, prices, occasions and templates are all config: `src/config/brand.ts`, `src/config/pricing.ts`, `src/config/occasions.ts`, `src/templates/registry.ts`.

## Run locally

```bash
cd hilo
npm i
npm run dev        # http://localhost:3000 — works with zero env vars (MOCK mode)
```

- Global edition: `/` · India: `/in` (Hinglish), `/in/en`, `/in/hi`
- Make a gift: `/gifts` → pick one → answer a few questions → preview → mock checkout (*Simulate success*)
- Admin: `/login` with `admin@hilo.example` (the code is shown on screen in MOCK mode) → `/admin`, `/admin/outbox`
- Reel Studio: `/studio/reel/<template>?autostart=1` · Brand kit: `/brand`

| Command | What |
|---|---|
| `npm test` | Vitest unit tests |
| `npm run e2e` | Playwright end-to-end (starts its own server on :3100 with a fresh DB) |
| `npm run build` | i18n key check + production build |
| `npm run lint` / `npm run typecheck` | ESLint / tsc |
| `npm run reels` | Record every template at 1080×1920 → `marketing/reels/` (dev server must be running) |
| `npm run screens -- --label=x` | Screenshot main routes at 390×844 and 1440×900 |
| `npm run seed` | Demo coupon `LAUNCH10` + admin profile |
| `npm run i18n:build` | Rebuild `messages/*.json` from `messages/src/*.mjs` |

## Architecture

- **Next.js 16 App Router** + TypeScript; `src/proxy.ts` routes editions (`/m/[site]` internally).
- **Templates** (`src/templates/<slug>/def.ts` + `Renderer.tsx`) are thin skins on **engines** (`src/engines/shell` interactive scenes, `stories`, `group-wall`).
- **Adapters** (`src/lib/server/adapters/*`): payments (Razorpay / mock / MoR slot), messaging (Resend / WhatsApp Cloud / Twilio → outbox), LLM (Anthropic → canned), storage (Supabase / local).
- **DB**: Postgres (Supabase) or embedded PGlite; migrations in `supabase/migrations`.
- Design system in `src/styles/tokens.css`, `src/app/globals.css`, `src/components/ui`.

## Switching to real services & deploying

See [`docs/SETUP.md`](docs/SETUP.md). Short version: set `DATABASE_URL` + Supabase keys, Razorpay keys + webhook, Resend / WhatsApp / Twilio, `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `CRON_SECRET`; deploy on Vercel with root directory `hilo` (`vercel.json` registers the crons).

## Still needs a human

- Domain, real API keys, WhatsApp template approvals.
- **Legal review** of privacy/terms/refunds (India DPDP; GDPR/US for the Global edition).
- Brand placeholders in `src/config/brand.ts` (legal name, GSTIN, address, grievance officer, support WhatsApp, Instagram).
- Verify festival dates marked `verify` in `src/config/occasions.ts`.
- Real reviews and reaction videos (the site shows honest empty states, never fakes).

Docs: [`PROGRESS.md`](PROGRESS.md), [`DECISIONS.md`](DECISIONS.md), [`docs/QA.md`](docs/QA.md), [`docs/SECURITY.md`](docs/SECURITY.md), [`docs/GROWTH.md`](docs/GROWTH.md), [`docs/VOICE.md`](docs/VOICE.md).
