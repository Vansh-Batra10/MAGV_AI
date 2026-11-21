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

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm e2e            # Playwright (needs `pnpm dev` or starts its own server)
```
