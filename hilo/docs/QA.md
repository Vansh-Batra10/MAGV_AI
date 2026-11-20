# Manual QA checklist

Automated: `npm test` (unit), `npm run e2e` (Playwright, Pixel 7 emulation, fake camera/mic), screenshots in `screenshots/`.

## In-app browsers (do on real devices before each release)
- [ ] Instagram in-app browser — Android: open a gift link from a DM; envelope gate, sound toggle, all scenes, reply (heart/text), voice reply falls back gracefully.
- [ ] Instagram in-app browser — iOS: same; mic / camera / motion prompts never block a step; "tap" fallbacks work (candles, snow globe).
- [ ] Facebook & WhatsApp in-app browsers: link preview shows the OG card ("A surprise for …"), never a photo of the recipient.
- [ ] Creator inside Instagram: voice recorder failure shows "Upload an audio file" + "Copy link to open in Safari/Chrome"; draft survives reopening in Safari.
- [ ] Purchase inside Instagram (Android): Razorpay opens, **UPI intent** hands off to a UPI app and returns; webhook fulfils even if the user never returns.
- [ ] Purchase inside Instagram (iOS): cards; Apple Pay where available (Global).
- [ ] 100dvh: no content hidden behind the browser toolbars; safe areas respected on notched phones.

## Editions
- [ ] `/` shows zero Hinglish/Hindi, ₹ or UPI; `/in` defaults to Hinglish; `/in/en` English with ₹; `/in/hi` Devanagari.
- [ ] First visit from India (`x-vercel-ip-country: IN`) redirects to `/in` once; manual switch is respected forever.

## Visual (BUILD_SPEC §15) — every route at 390×844 and 1440×900
- [ ] Premium, one focal point, dark ink + one glow, grain overlay, thread motif.
- [ ] Long names ("Venkatalakshmi Subramanian") and Devanagari never overflow.
- [ ] Reduced motion (`?reduced`) and low-end (`?lowend`) modes look designed.
