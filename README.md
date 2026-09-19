# MFin Portal

Next.js App Router portal (BFF) for eZi-Micro / MFin, backed by Laravel APIs.

## Docs

| Document | Purpose |
|----------|---------|
| [`docs/PROGRESS.md`](./docs/PROGRESS.md) | **Progress tracker** — done, rationale, remaining work |
| [`PROJECT_BLUEPRINT.md`](./PROJECT_BLUEPRINT.md) | Architecture standard |
| [`AGENTS.md`](./AGENTS.md) | AI / contributor rules |
| [`apilist.txt`](./apilist.txt) | Documented Laravel API contracts |

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill server secrets — never commit real secrets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev        # development
npm run build      # production build
npm run start      # start production server
npm run typecheck  # TypeScript
npm run lint       # ESLint
```

## Security notes

- Laravel Bearer tokens stay in an httpOnly sealed session cookie (server-side only).
- Browser calls same-origin `/api/*` BFF routes only.
- See `docs/PROGRESS.md` §3.6 and §4 for current security decisions and gaps.
