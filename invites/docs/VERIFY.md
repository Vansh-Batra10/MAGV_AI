# Facts to verify before launch (TODO_VERIFY)

Every item here affects money, law, dates or third-party terms. Code that depends on one carries `TODO_VERIFY(<what>)`.

| # | What | Where |
|---|------|-------|
| 1 | Brand name trademark + domain availability ("Nimantran" is a placeholder) | `packages/config/src/brand.ts` |
| 2 | UPI `tn` (note) max length and allowed characters per NPCI spec (we cap at 50 ASCII chars) | `packages/content-schema/src/upi.ts` |
| 3 | GST invoice fields and GST-inclusive display rules | `packages/config/src/pricing.ts` |
| 4 | Static map provider, pricing and terms (placeholder SVG today) | `packages/renderer/src/sections/index.ts` |
| 5 | Whether WhatsApp keeps text + link when an image is shared via Web Share on Android and iOS | send flow (M6) |
| 6 | WhatsApp Business Cloud API: business verification, template approval, per-message pricing (v2) | send flow (v2) |
| 7 | App Store / Play billing rules for India for digital goods sold in the couple app | `apps/mobile` (M8) |
| 8 | Payment-aggregator compliance if card payments for NRI shagun are added (v2) | §11 |
| 9 | Tax treatment of shagun gifts (FAQ only after a CA confirms) | §11 |
| 10 | DPDP Act obligations for guest phone numbers uploaded by couples (our role: processor vs fiduciary) | §24 |
| 11 | Image-generation provider model names, pricing and terms | `packages/ai-assets` (M9) |
| 12 | Festival / muhurat dates if ever shown (none are hard-coded today) | — |
