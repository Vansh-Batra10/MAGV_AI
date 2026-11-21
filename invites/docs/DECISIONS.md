# Decisions log

Format: date — decision. Options considered. Reason.

## 2026-11-21

- **Monorepo lives in `invites/`, not the repo root.** Options: root, subfolder. The repository already holds an unrelated Python project (AI receptionist); building at the root would mix toolchains, READMEs and CI. A subfolder keeps both intact. CI for this product is `.github/workflows/invites.yml` with `working-directory: invites`.
- **Working brand name "Nimantran" (`packages/config/brand.ts`).** Placeholder only; every surface reads it from config. Trademark/domain check is in VERIFY.md.
- **Packages ship TypeScript source (no build step).** `exports` point at `src/index.ts`; Next.js `transpilePackages`, Vitest and `tsx` consume them directly. Faster iteration, one source of truth.
- **Audio is synthesised with Web Audio (reed phrase for the shehnai sting, plucked partials for santoor, pitched thumps for dholak, filtered noise for paper/whoosh, bell partials for the coin clink).** Options: licensed recordings, synthesis. Zero bytes to download (well under the 400 KB budget), works offline, no licensing risk, no film music. Recorded audio can replace any sound via `AudioManager.registerBuffer` once a licence file exists in `/licenses`.
- **Loader flame is an SVG + CSS keyframe animation instead of a Lottie file.** Same look, 0 KB vs ≤25 KB, no lottie-web on the critical path. lottie-web stays allowed for slots that need it later.
- **Procedural art in MOCK mode.** All Sheesh Mahal plates (sky, palace, gateway, doors, toran, diyas, chambers) are generated SVG driven by pack tokens (CSS custom properties). Slots stay declared in the manifest with byte budgets, so real AI/illustrated plates can replace them without touching choreography.
- **Nameplate sits on the gateway lintel, not across the door leaves.** A plate across both leaves would tear when the doors open; on the lintel it stays readable at 360 px and the camera flies under it.
- **Mirror mosaic = static fine-grain wall in an offscreen buffer + per-frame "live" tiles only inside the names box.** The tier budgets (A 900 / B 500 / C 220) apply to the live tiles that spell the names. One gradient fill per frame draws the light sweep across the whole wall. Gives legible "names in reflections" at 60 fps instead of coarse 17 px tiles.
- **Determinism: ambient motion and particles are closed-form functions of time** (`Clock.renderAt(t)`, `particleAt(p, τ)`), never integrated state; GSAP timelines are built paused. A seek renders identical DOM state and canvas pixels. Screenshot comparison allows ≤ 0.05 % differing pixels because GPU compositing of transformed layers can vary by a few anti-aliased pixels.
- **Indic text animates per word; Latin per grapheme.** `Intl.Segmenter` grapheme clusters (with a merge pass for older ICU without GB9c) keep conjuncts together, but shaping like reph and half-forms can span clusters, so per-word is the safe unit for Indic scripts.
- **Motif art:** Om, Ik Onkar, Khanda and Bismillah are glyph outlines extracted from OFL fonts (Rozha One, Noto Sans Gurmukhi, Noto Sans Symbols, Amiri) with `packages/renderer/scripts/extract_glyph.py` and stored as SVG paths. Ganesh and the cross are hand-drawn line art. The motif draws in a gold line via `stroke-dashoffset`.
- **Fonts are self-hosted from `@fontsource/*` (OFL), latin + latin-ext + devanagari subsets with `unicode-range`.** Per-invite glyph subsets are produced with `pyftsubset --layout-features='*'` at publish time (`packages/renderer/scripts/subset_fonts.py`). Dependency reason: fontsource is the cleanest way to vendor Google Fonts files with licences.
- **QR codes:** `qrcode-generator@1.4.4` (MIT, ~20 KB, no deps), used for the desktop UPI QR, video end card and printable QR cards. Not in §18; added because a hand-written QR encoder is a correctness risk for payments.
- **Shared guest sections (§9) live in the renderer (`@invites/renderer/sections`) as framework-agnostic DOM**, styled through `--sec-*` tokens each template maps from its own palette. Templates hook in their signature moments (lantern sky RSVP, potli shagun). Same code runs in Next.js, the Expo WebView and the render worker.
- **Static maps are procedural placeholders** linking to Google/Apple Maps deep links; no map SDK on guest pages. A real static-map provider is a VERIFY item.
- **GSAP licence:** GSAP 3.13 is free for commercial use under the standard "no charge" licence, including ScrollTrigger, Flip and MotionPath. The licence forbids use in a product that competes with Webflow's visual animation builders; an invitation product is not such a tool. Recorded here as compliance.
- **ESLint forbids `Math.random()`** (`no-restricted-properties`) so nothing non-deterministic sneaks into renders.
- **Tailwind deferred to the studio (M6).** M0–M5 platform UI is minimal; the guest route ships no Tailwind.

### M5
- **ScrollTrigger replaced by CSS `position: sticky` + a 60-line rAF scrubber (`renderer/src/scripted.ts`).** Measured guest-route initial JS (gzip, production build, framework included): before 179 KB + template; after 155 KB route + template = Rang Kahani 174 KB, Mohar 171 KB, Sheesh Mahal 180 KB (all ≤ 180 KiB). Sticky pinning also avoids ScrollTrigger's pin-spacer reflows on low-end phones. Trade-off: no snap-to-chapter-end; the 0.6 s scrub smoothing is kept. §18 lists ScrollTrigger; it is no longer shipped.
- **Zod never reaches guest browsers.** `@invites/content-schema/client` exports types and pure helpers only; the renderer, templates and i18n import from it. The QR encoder is lazy-loaded (`loadQr`) and preloaded only in scripted modes.
- **The server sends a guest only their own functions** (other functions are filtered out, not just hidden), strips shagun data unless that guest may see it, and never sends the couple's phone or email.
- **Open tracking is posted by the client after the loader** (not counted on server render), so link-preview bots and prefetchers don't mark invites as opened.
- **Mock store = JSON file with RLS-equivalent checks** (`packages/db/src/store.ts`); SQL migrations with RLS policies live in `packages/db/migrations` for Supabase. Store tests prove isolation between weddings.
- **Public link mode** creates a named guest record from "Aapka naam?" (rate-limited to 5 per minute per IP) and redirects to that personal link, so RSVPs are attributed.

### M6
- **Platform UI uses one hand-written stylesheet (`app/studio/studio.css`) instead of Tailwind.** Tailwind is allowed only for platform UI, not required; a ~100-line stylesheet keeps the build simpler and the guest route untouched.
- **Auth: phone OTP with httpOnly session cookies.** MOCK mode shows the code on screen; real mode plugs Supabase phone auth / an SMS provider into `issueOtp`. A verified phone at login satisfies the "OTP before shagun" rule; VPA changes lock for 24 h.
- **Payments: MOCK grants the tier instantly; real mode creates a Razorpay order and only the HMAC-verified webhook (`/api/pay/razorpay`) grants the tier.** RevenueCat (app) will write to the same `orders/entitlements` model.
- **Exports from the studio are CSV (UTF-8 BOM, formula-injection safe) that open in Excel.** True XLSX would need a new dependency; CSV meets the caterer and guest-list needs. Recorded as a deviation from "XLSX export".
- **Editor "advanced" tab edits the full content JSON, validated by the same Zod schema server-side.** Structured forms cover names, functions, dress codes, updates, guests, shagun; the JSON editor covers the long tail (FAQ, stay, wording) until dedicated forms exist.

### M7
- **Render worker = Node + Playwright Chromium + ffmpeg with a small HTTP API** (`apps/render-worker`). MOCK mode uses an in-process idempotent queue (same kind + params → same job; up to 3 attempts); with `DATABASE_URL`, pg-boss is the queue. The web app proxies exports and OG images through `lib/worker.ts`.
- **Video frames are captured by `seek(i/30)` + JPEG screenshots piped to ffmpeg (libx264, CRF 24, maxrate 2.3 Mb/s).** Measured: Sheesh Mahal 34 s → 5.4 MB at 1080×1920. Rendering takes ~5 min on this container (frame screenshots dominate); a CDP screencast or parallel segment rendering is the next optimisation.
- **Video audio track is silent AAC for now.** The synthesised sounds are realtime Web Audio; offline-rendering each template's sound score through `OfflineAudioContext` is a follow-up (TODO in `render.ts`).
- **OG images are rendered by the worker with headless Chromium** (correct Indic shaping), cached per guest + wedding version via an immutable URL (`?v=updatedAt`). Fonts are served with `Access-Control-Allow-Origin: *` so the worker's off-origin pages can load them.
- **QR codes on printed cards are verified by decoding the rendered PNG with jsQR in tests** (`test:exports`).

### M8
- **Couple app = native screens for daily jobs (login, invites, guests + contacts import, send queue, dashboard) + the shared studio in a WebView for rich editing, preview, shagun ledger, plans and exports.** This gives full feature parity with one code path for the heavy UI and the renderer, which the spec requires to run in a WebView anyway.
- **`apps/mobile` is excluded from the pnpm workspace** (`!apps/mobile`) and installed on its own (`npm install` in that folder). It pulls ~380 MB of React Native tooling that web/worker CI does not need.
- **Verified here: `tsc --noEmit` passes and Metro can bundle the app for Android (`expo export`).** Native iOS/Android builds and the Maestro smoke test (`e2e/smoke.yaml`) need Xcode / Android SDK + emulators, which this container lacks; they are owner-run steps in LAUNCH_CHECKLIST.md.

### M9
- **The MOCK image provider draws deterministic procedural placeholder art with a tiny built-in PNG encoder** (no native image deps). Real providers plug into `ImageProvider` once model names, pricing and terms are verified (VERIFY #11).
- **Post-processing uses ffmpeg for AVIF (libaom) + WebP variants** at 720/1080/1440 (or native width when narrower). Matte choke and palette harmonisation run in JS.
- **OCR stray-text check runs only when `tesseract` is installed in the worker image; otherwise it is marked "manual" and the admin must review.** The approve action refuses assets with any failed automatic check.
- **Puppet rigging tool v1 saves polygons + pivots as rig JSON**; cutting the part PNGs from the polygons is the next step (v2: automatic segmentation).

### M10
- **Home hero = the real interactive invite, loaded on tap** (a poster frame of the actual gate until then). Keeps the marketing page at Lighthouse mobile performance 96 / accessibility 100 (measured on a production build with simulated slow 4G).
- **Blog posts are typed data (`lib/content/posts.ts`) rendered by a page, not MDX.** Avoids an MDX toolchain dependency for two SEO posts; switch to MDX when editors need it.
- **Guest route Lighthouse (mobile, simulated): performance 73, FCP 0.8 s (salutation painted), CLS 0, LCP 4.6 s, TBT 360 ms.** The §20 budgets that matter are met (name ≤ 1.5 s, JS ≤ 180 KiB, CLS < 0.05). LCP is the gate art, which only appears once the template's JS runs; the next optimisation is server-rendering each template's gate SVG into the shell so the LCP element is in the HTML.
- **CSP keeps `'unsafe-inline'` for scripts and styles** because Next.js App Router inlines its bootstrap; moving to nonces via middleware is a hardening follow-up. Everything else is `'self'`.
- **Honeypot + rate limit on the public name form; OTP limited per IP and per phone.** No third-party CAPTCHA (privacy and weight on guest pages).
