# Templates: how to add a template, a pack or a slot

A template is a package `packages/templates/<id>` exporting a `TemplateModule`:

```ts
{ manifest, packs, loader(ctx) => dispose, create(ctx) => TemplateInstance }
```

- **manifest**: id, name, supported functions, layers (with parallax and tier visibility), slots (id, kind, aspect,
  maxBytes, alphaRequired, promptTemplateId, fallback), fonts, keyframes.
- **packs**: tokens only (CSS custom properties) + optional slot fills (URLs). Choreography must not change between packs.
- **loader**: must paint the guest salutation instantly with no network.
- **create**: builds DOM, the opening timeline (paused), scroll chapters (`pinChapters`), the shared sections
  (`renderSections` with template hooks) and, for scripted mode, a master storyboard timeline. Register ambient motion with
  `ctx.clock.add((t) => ...)` as pure functions of time.

## Rules
1. Never `Math.random()` (lint enforces). Use `ctx.rng` / `rng.fork("salt")`.
2. Every animation has a reduced-motion and Lite path (`ctx.reduced`, `ctx.lite`): fades, no canvas in Lite.
3. Dates, times and venues are solid DOM text, never only inside canvas or an animation.
4. Indic text: never split by code point; use `splitIntoSpans` / `animationUnits`.
5. Motifs only at the top/centre of a composition.
6. Primary actions in the bottom 40 % of the screen.

## Adding a pack
Add an entry to `packs.ts` with every token the template uses, add its id to `manifest.packs`, then run the screenshot
script for that pack and review against the template's Director's Checklist.

## Adding a slot
Declare it in `manifest.slots` with a byte budget and a procedural fallback, add a prompt template in
`packages/ai-assets/prompts/<template>/<pack>/<slot>.md`, and read `ctx.pack.slots[id]` in the art code.

## Screenshots
`pnpm dev`, then `node apps/web/scripts/screens.mjs --template sheesh-mahal --out docs/screens/M2 --tiers A,C --locales hinglish,hi`.
