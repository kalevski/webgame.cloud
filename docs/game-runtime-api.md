# The game runtime API

The public surface a shipped game reads. It is the **only** place in the codebase that does not use the
REST envelope: these routes return bare JSON so a game client and a CDN can consume them directly.

| Route | Cache-Control |
| --- | --- |
| `GET /api/public/projects/:id/assets?buildId=` | `public, max-age=31536000, immutable` |
| `GET /api/public/projects/:id/assets?buildTag=` | `public, max-age=60` |
| `GET /api/public/projects/:id/configs/:key` | `public, max-age=0, s-maxage=30, stale-while-revalidate=60` |
| `GET /api/public/projects/:id/configs?keys=a,b,c` | same (max 25 keys) |

## Why bare, and how

The envelope opt-out is **per route** (`config: { envelope: false }`, read by the `preSerialization` hook),
never a URL prefix. `/api/public/constants` is also unauthenticated but is consumed by the console through
`apiFetch`, so it keeps its envelope — a prefix rule would silently break it.

## Rate limiting

Public reads use an **in-process token bucket** (20 rps, burst 100, per IP) plus a 30-second response
cache, not the DB-backed `rate_limits` table. The table does an upsert per request, which on this surface
would mean a Postgres write per player per fetch. The DB-backed limiter stays on the write surface,
including the waitlist POST.

## Caveats worth knowing

- A config from another project is **invisible, not forbidden** — the project id is part of the lookup, so
  a mismatch is a 404 that reveals nothing.
- Values are deliberately **not inlined** into the asset manifest; that is what keeps them live.
- `?buildId=` promises `immutable`, but a build can still be deleted or purged. A game pinned to a build id
  must treat a 404 as "re-resolve by tag".
