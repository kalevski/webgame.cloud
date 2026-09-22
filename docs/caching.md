# Caching

Three things were being read far more often than they change: the caller's session, the caller's permission
set, and platform settings. Every authenticated request paid for all three. This slice is the small set of
primitives that fixed that, plus the HTTP-level caching on responses that do not vary by caller.

Everything here is **in-process**. There is no Redis. Cross-instance correctness comes from Postgres
`LISTEN/NOTIFY`, not from a shared cache.

- `api/src/domain/cache.ts` — the primitives.
- `api/src/http/httpCache.ts` — response caching.

## The primitives

**`slot<T>()` / `fromSlot(target, ttlMs, load)`** — one cached value with a TTL and a **single-flight guard**.
Ten concurrent requests arriving on a cold slot produce one `load()` call, not ten; the other nine await the
same promise. `dropSlot` clears it. Used for whole-table reads like the access policy and settings.

**`KeyedCache<T>`** — a bounded map with a TTL and an LRU-ish eviction, for per-key values such as
session-token → user. Bounded on purpose: an unbounded map keyed by token is a memory leak with a
attacker-controlled key.

**`Throttle`** — rate-limits a *write*. `last_seen_at` does not need to be exact; writing it on every request
turns a read-only page load into a write. `Throttle` collapses those to one write per interval per key.

## What is cached

| What | Where | TTL | Invalidated by |
| --- | --- | --- | --- |
| session token → user | `SessionRepository` (`KeyedCache`) | 5s | the repository itself on sign-out/revoke, plus a `session_invalidated` `NOTIFY` for other instances |
| bearer API key → identity | `ApiKeyService` | short | revoke |
| access policy (roles, grants, limits) | `AccessPolicyService` (`slot`) | 30s | `access_policy_changed` `NOTIFY` |
| platform settings | `SettingsService` (`slot`) | short | a settings write |
| `users.last_seen_at` | `UserRepository` (`Throttle`) | 5 min | — (it is a write throttle, not a read cache) |
| `sessions.last_seen_at`, API key `last_used_at` | `SessionRepository` / `ApiKeyService` (`Throttle`) | — | — |

Two rules this layer follows, both learned the hard way:

1. **A sign-out can never be outlived.** The session cache is invalidated *in the repository*, on the same
   call that writes the revocation — not by the service above it, which could be bypassed.
2. **A failure is never cached.** `AccessPolicyService` caches a *successful* load only. Caching a caught
   database error for a full TTL meant a user's grants stayed empty for 30 seconds after the database had
   already recovered.

## HTTP caching

`http/httpCache.ts` handles responses that are **caller-independent**: a weak ETag over the payload, plus
`public, max-age=…, stale-while-revalidate=…`. The policy is declared on the route
(`config: { cache: { maxAge, staleWhileRevalidate } }`) rather than in a path table inside the hook, so the
route and its cache policy are read together.

File bytes are handled separately in `filesRouter`: a strong ETag of the file id and
`private, max-age=…, immutable`, with the conditional request answered **before storage is read** — a
`304` never touches S3 or disk.

The public game runtime API sets its own explicit cache headers; see
[game-runtime-api.md](game-runtime-api.md).
