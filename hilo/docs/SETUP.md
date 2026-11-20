# Setup

## Run locally (zero credentials)

```bash
cd hilo
npm i
npm run dev
```

Open http://localhost:3000. Every external service falls back to **MOCK mode** when its env vars are missing:

| Service | Real | Mock |
|---|---|---|
| Database | Postgres via `DATABASE_URL` (Supabase) | PGlite (embedded Postgres) in `node_modules/.cache/hilo-data/pglite` |
| Storage | Supabase Storage (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) | `node_modules/.cache/hilo-data/uploads`, served by `/api/media/...` |
| Payments | Razorpay (`RAZORPAY_KEY_ID/SECRET`, `RAZORPAY_WEBHOOK_SECRET`) | Branded test checkout with *Simulate success / failure* — runs the same fulfilment as the webhook |
| Email | Resend (`RESEND_API_KEY`) | Written to `outbox`, visible at `/admin/outbox` |
| WhatsApp | WhatsApp Cloud API (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) | outbox |
| SMS | Twilio-compatible (`TWILIO_*`) | outbox |
| AI | Anthropic Messages API (`ANTHROPIC_API_KEY`) | canned drafts per tone/language |

Migrations in `supabase/migrations` run automatically on first DB access. `*.supabase.sql` files (RLS) only run on real Postgres.

Admin: sign in at `/login` with an address listed in `ADMIN_EMAILS` (default `admin@hilo.example`). In MOCK mode the 6-digit code is shown on screen. `/studio/*`, `/brand` and `/admin/outbox` are open in local development only.

Useful scripts: `npm run seed` (demo data + a coupon), `npm run reels` (record every template at 1080×1920 into `marketing/reels/`), `npm test`, `npm run e2e`, `npm run i18n:build` (rebuild catalogs from `messages/src`).

## Switching to real services

1. **Supabase**: create a project → copy the *Session pooler* connection string to `DATABASE_URL`, the URL + service-role key to `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, and create a **private** bucket named `gift-media`.
2. **Razorpay**: add keys; create a webhook to `https://YOUR_DOMAIN/api/webhooks/razorpay` for `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`; put its secret in `RAZORPAY_WEBHOOK_SECRET`. Enable international cards for the Global edition.
3. **WhatsApp Cloud API**: get templates approved with the names used in code (`gift_ready`, `gift_delivered`, `gift_opened`, `gift_reply`, `gift_upgraded`, `group_revealed`, `reminder`). Classify reminders as *marketing* and the rest as *utility*.
4. **Resend**: verify your domain, set `EMAIL_FROM`.
5. **Anthropic**: set `ANTHROPIC_API_KEY` (model in `ANTHROPIC_MODEL`).
6. Set a long random `AUTH_SECRET` and `CRON_SECRET`.

## Deploy (Vercel + Supabase)

1. Import the repo in Vercel with **Root Directory = `hilo`**.
2. Add the env vars above. `vercel.json` registers the crons (deliver every 5 min, expire hourly, reminders 09:00 IST).
3. Point your domain, update `NEXT_PUBLIC_SITE_URL` and `src/config/brand.ts`.

## ⚠️ Before launch — needs a human

- **Legal drafts must be reviewed by a lawyer before launch** (India: DPDP Act 2023 / Rules 2025). **Global legal pages (GDPR/UK GDPR, US state privacy) also need a lawyer review before marketing there.**
- Replace every placeholder in `src/config/brand.ts` (legal name, GSTIN, address, grievance officer, WhatsApp number, Instagram).
- Verify every festival date marked `verify` / `TODO_VERIFY_DATE` in `src/config/occasions.ts` (the admin dashboard lists them).
- Real keys for the services above; domain; WhatsApp template approvals.
- Real reviews and reaction videos (the site shows honest empty states until then).
