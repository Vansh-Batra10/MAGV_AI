# Security & breach response

## Controls in place
- Gift slugs: 14 chars from a 58-char alphabet (~82 bits); media keys 20 chars. Gift/contributor pages are `noindex` and excluded in robots.
- Optional gift password (bcrypt), rate-limited gate (8 tries / 10 min / slug+IP); unlock cookie is an HMAC bound to the current password hash.
- Uploads: HMAC-signed, 10-minute upload tokens with type + size limits (images ≤10 MB pre-compression, audio ≤3 MB, reactions ≤12 MB). Photos are re-encoded to WebP client-side, which strips EXIF/GPS.
- All user text is rendered as text (no `dangerouslySetInnerHTML` except static JSON-LD). Control characters stripped; basic abuse filter; report + takedown on every gift.
- State-changing JSON APIs check `Origin`; cookies are `SameSite=Lax`, `HttpOnly`, `Secure` in production.
- Razorpay webhook: HMAC verified; idempotent via unique `payments_events.provider_event_id`; fulfilment is idempotent (`status <> 'paid'` guard).
- Server recomputes every price; client prices are never trusted.
- Supabase RLS (`0002_rls.supabase.sql`) as defence in depth; the server uses the service role and checks ownership in code.
- Analytics/ads load only after cookie consent. No recipient IPs stored.

## Retention (enforced by `/api/cron/expire`)
- Free 24h gifts: purged 7 days after expiry (with media + reactions).
- Drafts: purged after 30 days of inactivity.
- Reaction clips: deleted with their gift. Account deletion removes gifts, media, replies, reactions, reminders; orders keep only non-identifying tax fields.

## Breach-response runbook
1. **Contain** (≤1h): rotate `AUTH_SECRET`, Supabase service key, Razorpay/WhatsApp/Resend keys; revoke sessions (rotating `AUTH_SECRET` does this); disable affected routes via feature flags or Vercel deployment rollback.
2. **Assess** (≤24h): what data, whose, how many; preserve logs (Vercel, Supabase, Razorpay).
3. **Notify**: India — the Data Protection Board and affected Data Principals as required by the DPDP Rules 2025 (initial intimation without delay, detailed report within the prescribed window). EU/UK — supervisory authority within 72 hours where required. Notify affected users in plain language with what happened and what they should do.
4. **Fix & review**: root cause, patch, post-mortem in `docs/incidents/`.
Owner: the Grievance Officer in `src/config/brand.ts`.
