# Architecture

```
invites/
  apps/web             Next.js App Router: guest route, playground, studio, admin, marketing
  apps/render-worker   Node + Playwright + ffmpeg: video, cards, OG images (M7)
  apps/mobile          Expo couple app (M8)
  packages/renderer    Framework-agnostic TS engine: mount(), clock, tiers, audio, text, particles, sections
  packages/templates/* One package per template (sheesh-mahal, rang-kahani, mohar)
  packages/content-schema  Zod schemas, UPI/ICS builders, sample + stress content
  packages/i18n        Strings (en/hi/hinglish × tone), dates, wording presets
  packages/config      Brand, pricing/entitlements, env (MOCK mode)
  packages/db          SQL migrations + typed client (M5/M6)
  packages/ai-assets   Image provider adapters, prompts, post-processing (M9)
```

## Renderer

`mount(el, { template, themePack, content, guest, mode, tier, locale, services })` returns an `Invite`
(`play/seek/goTo/open/on/update/destroy`). It:

1. Detects the tier from device signals, then refines it with a 500 ms rAF probe while the template's loader is up.
2. Injects the template's fonts and pack tokens (CSS custom properties on the root).
3. Calls `template.create(ctx)` with a `RenderContext` (seeded PRNG, frame clock, audio manager, translator, services).
4. Interactive: `start()` shows the gate; the FPS monitor downgrades A→B→C live if FPS < 40 for 2 s.
   Scripted (`autoplay`/`static`): `seek(t)` drives the template's master storyboard timeline and then `clock.renderAt(t)`.

**Determinism rule:** anything that moves is either a paused GSAP tween or a pure function of `t` registered on the clock.
Particles use `particleAt(p, τ)` (closed form). PRNG = mulberry32 seeded with `inviteId`.

## Guest page data flow

Server: `/{inviteCode}/{guestCode}` loads wedding + guest (mock JSON store in MOCK mode, Supabase otherwise), renders an SSR
loader shell with the salutation, then the client mounts the renderer with `GuestServices` that call route handlers
(`/api/g/...`) for RSVP, pledges, gift claims and open tracking.
