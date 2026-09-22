# Demo data

An empty database is a bad place to judge a screen. Every list looks fine with three rows; paging, filters,
empty states and slow queries only show themselves under volume. `seed-demo` fills a database with a realistic
dataset so those can be looked at, and so performance work has something to measure.

- API: `api/src/contracts/demo.ts`, `services/DemoDataService.ts`, `routers/controlRouter.ts`.
- CLI: `npm run cli -w @webgame-cloud/api -- seed-demo [--scale=…] [--seed=…] [--force]`.

## What it writes

Everything goes **through the real services**, not through raw SQL. A demo project is created by
`ProjectService`, a demo ticket by `TicketService`. That is the point: the dataset exercises the same
validation, quota and audit paths a real request does, so it cannot drift into a shape the application would
never produce — and a broken service shows up as a failed seed.

Three scales (`DEMO_SCALES`):

| Scale | For |
| --- | --- |
| `small` | one of everything — enough to look at a screen |
| `medium` | enough for paging, filters and a busy queue to be real |
| `large` | the volume performance work measures against |

The result (`DemoResult`) reports the scale and seed used, the accounts created, a per-entity count, how many
notification/email dispatches were suppressed, and how long it took.

## Determinism and safety

- **Deterministic.** Every random choice comes from a seeded PRNG (`domain/random.ts`), default seed
  `webgame`. The same scale and seed produce the same dataset, so a screenshot or a benchmark is reproducible.
- **No outbound anything.** Every address is on `example.com`, and notification and email dispatch are
  suppressed for the duration of the run — seeding never sends mail or fires a webhook at a real target.
- **Refuses production.** It will not run under `APP_ENV=production`.
- **Refuses a populated database.** If accounts already exist it stops with `demo_refused_populated`, because
  seeding on top *layers a second dataset* rather than replacing the first. `--force` overrides that, and
  means what it says.
- **Needs an owner.** It writes as the owner account, so sign in once first, or it stops with
  `demo_refused_no_owner`.

## Running it

```bash
# locally, against the dev stack
npm run cli -w @webgame-cloud/api -- seed-demo --scale=medium

# inside a container
docker exec <container> node /app/dist/cli.js seed-demo --scale=large --seed=bench
```

The CLI talks to the localhost-bound control API — see [operations.md](operations.md).
