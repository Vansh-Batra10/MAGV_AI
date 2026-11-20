# PROGRESS

Resume with: *"Read BUILD_SPEC.md and PROGRESS.md, continue from the next unchecked item."* (BUILD_SPEC.md is the spec the owner pasted into the first session; ask them for it if missing.) Decisions are in `DECISIONS.md`.

App lives in `hilo/`. `npm i && npm run dev` works with zero env vars (MOCK mode).

## Release 1 — "Launch slice"

### Phase 0 — Scaffold ✅
- [x] Next.js 16 + TS + Tailwind 4 + fonts (Instrument Serif, Manrope, Kalam, Tiro Devanagari) + tokens
- [x] ESLint, Vitest, Playwright, MOCK adapters (db/payments/email/WhatsApp/SMS/LLM/storage), migrations, seed, `.env.example`, `docs/SETUP.md`

### Phase 1 — Design system ✅
- [x] Tokens, glass, magnetic+haptic buttons, chips, phone frame (scaled 390×844 stage, tilt + glare), starfield, grain, thread SVG + animated logo, reveal, cursor thread, reduced-motion + low-end detection (incl. in-app FPS probe), Web Audio sound engine, `/brand` page (+ reel cover generator)

### Phase 2 — Template engine + question-flow creator ✅
- [x] Registry / meta / schema / questions / defaults / renderers (code-split per template), preview modes live/preview/thumbnail/reel, watermark
- [x] Question-flow creator (default) with AI auto-fill (LLM adapter, canned fallback), localStorage + server autosave, `time_to_first_preview` + `question_step` events
- [x] Schema form editor (`?mode=form`), photo upload (WebP, EXIF stripped, EXIF-date ordering), voice recorder with upload / open-in-browser fallbacks, YouTube/Spotify embeds
- [x] i18n: editions (`/`, `/in`, `/in/en`, `/in/hi`), catalogs with build-time key check, per-gift language

### Phase 3 — Release 1 templates ✅
- [x] #0 Quick Surprise (free) · #1 Laal Dhaaga · #3 Midnight Birthday · #4 Sorry Wala Meter · #5 Snow Globe (R3F + 2D fallback) · #6 Our Year Rewound · #7 Sab Ki Taraf Se
- [x] Engines extracted: Interactive Scene (`engines/shell`), Stories (`engines/stories`), Group Wall (`engines/group-wall`)
- [x] Story card + Reel Studio mode for every template

### Phase 4 — Commerce, free tier & delivery ✅
- [x] Checkout (Razorpay + mock), verify + idempotent webhook fulfilment, 24h/Forever, free tier with quota, keep-forever by sender or recipient, success page (link, QR, market-ordered share, story card, 4 printable QR PDFs, schedule send, password, edit), geo currency, coupons, referral discount + credit, utility messages, crons (deliver, expire + retention purge)

### Phase 5 — Group flow ✅
- [x] Organiser setup → manage (contributions hide/delete, nudge, deadline, reveal schedule, pay & lock), contributor page with consent notice, contributor → creator loop

### Phase 6 — Marketing site ✅ (Release 1 scope)
- [x] Home (all 14 sections, Christmas/New Year takeover, `?season=`), gallery with filters (occasion/mood/for/mode), template detail with live player, `/group`, `/long-distance`, `/pricing`, occasion pages, legal (India + Global variants), about, contact, reviews (honest empty state), 404/error, sitemap/robots/hreflang/JSON-LD, PWA manifest + icons
- [x] Both editions; `hi` UI shipped early

### Phase 7 — Recipient extras & ops ✅
- [x] Replies (heart/text/voice/answer), open notifications, reaction capture (opt-in, consent), takedown/report, dashboard (gifts, opens, replies, reactions, edit, delete, account deletion), reminders, admin (funnel, k, free→paid, group, unit economics, revenue, orders, moderation, template flags), outbox, Reel Studio + `npm run reels`, OG images, consent banner + gated analytics, UTM capture

### Release 1 gate
- [x] Unit tests (`npm test`): occasions, pricing, every template schema × 3 languages, songs, cities
- [~] E2E (`npm run e2e`): free→keep forever, purchase + password gate, group + fake-clock cron reveal, reply + reaction (fake camera), editions — see latest run notes below
- [ ] Lighthouse CI budgets (not yet wired — `npx lighthouse` manual run recommended)
- [ ] axe accessibility pass
- [x] `npm run build` passes · [x] lint 0 errors
- [ ] Tag `release-1` after the items above

## Next steps (in order)
1. Finish the Release 1 gate: Lighthouse budgets + axe pass; fix findings; screenshot every route (`npm run screens -- --label=release-1`) and review against §15; tag `release-1`.
2. Release 2 — Phase 8: Unlock Calendar engine (server-side lock stripping helper; cron `/api/cron/unlock` already stubbed) → #2 Open When, #8 Valentine Week, #9 Will You Be Mine?, #10 Scrapbook, #11 Love Letter AI (`/api/ai/letter` exists).
3. Phase 9: partner program + prepaid codes (`partners`, `prepaid_codes` tables exist; `/partners`, `/redeem` are coming-soon), reviews collection email (3 days after purchase), reaction-video incentive, Season Pass flag, Google sign-in via Supabase Auth.
4. Phase 10: 8 MDX guides + Global guides, Valentine's Week pages.
5. Release 3: Batch C festival skins, Invite + RSVP engine, `/for/[relation]` pages.

## Known gaps / honest notes
- WhatsApp templates must be approved before real sending; until then messages stay in the outbox.
- Festival dates marked `verify` need human confirmation (listed in `/admin`).
- Google sign-in is not available yet (email OTP only).
