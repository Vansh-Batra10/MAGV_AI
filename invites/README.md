# {BRAND}: cinematic Indian wedding invitations

The card is the website. A couple picks one of three cinematic templates, personalises it, and sends every guest their
own link that opens like a premium card and scrolls into a complete wedding website.

Spec: [`docs/MASTER_PROMPT.md`](docs/MASTER_PROMPT.md) (if present) · decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md) ·
facts to verify: [`docs/VERIFY.md`](docs/VERIFY.md) · architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Run it in 5 minutes

Requires Node 22 and pnpm 10. Everything runs in MOCK mode with zero keys.

```bash
cd invites
pnpm install
cp .env.example .env
pnpm dev            # web on http://localhost:3000
```

- Template playground: http://localhost:3000/dev/playground
- Demo guest links: http://localhost:3000/demo/mehtaPAR1 (elder, Hindi), /demo/riyaFRND2 (friend), /demo/kapoorOF3 (office)

## What's where

| Surface | URL / command |
|---|---|
| Marketing site (EN / HI) | `/`, `/hi`, `/templates/sheesh-mahal`, `/pricing`, `/blog` |
| Guest invite | `/{inviteCode}/{guestCode}`; public link `/{inviteCode}` |
| Studio (couple) | `/studio` (log in with any phone; MOCK mode shows the OTP). Demo couple: `+919800000000` |
| Admin | `/admin` (demo admin phone `+919800000001`) |
| Playground (dev) | `/dev/playground` |
| Render worker | `pnpm --filter @invites/render-worker dev` (port 3100); started by `pnpm dev` |
| Couple app | `cd apps/mobile && npm install && npx expo start` (outside the pnpm workspace) |
| AI assets | `pnpm assets:generate --template sheesh-mahal --pack jaipur-dusk` (MOCK provider) |

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm e2e            # Playwright (needs `pnpm dev` or starts its own server)
pnpm --filter @invites/render-worker test:exports   # slow: renders videos (web must be running)
```

Docs: [`docs/TEMPLATES.md`](docs/TEMPLATES.md), [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md), screenshots in [`docs/screens/`](docs/screens/).
