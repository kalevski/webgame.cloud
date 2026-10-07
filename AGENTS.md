# AGENTS.md

Guidance for any coding agent or person working in this repository, whatever harness they are using.
`CLAUDE.md` symlinks to this file so Claude Code picks it up; other tools read `AGENTS.md`. Nothing
here is agent-specific — anything only one tool can act on belongs in that tool's own configuration.

**This file is orientation. The graph is the reference.** It is kept short on purpose: everything it
does not say is one `notegraph` query away, and duplicating the graph here is how both go stale.

## Start here — `notegraph read root`

This repository has **no `docs/` directory and no skills directory**. Every convention, every
feature's documentation and every guide lives in a notegraph context graph, reached with the
`notegraph` CLI through the `.notegraph` config in the repo root.

```bash
notegraph read root                                   # ALWAYS first — the map, and how to query it
notegraph search --tag guide --titles                 # the guides — "how do I do X"
notegraph search "<area>" --scope title               # a feature area's own node
notegraph search "<area> — Key files" --scope title   # which files implement it
notegraph index --in 7d403c46-4504-4a77-8e5b-b11a890d3584 --titles   # every area, one line each
notegraph tasks --status open                         # what is unfinished
```

**Query with one or two keywords, not a sentence** — the ranking rewards a literal match on a title,
heading or tag, and a long question earns none of them. `ownership`, `quota`, `backup`, `photos`.

Three things to know before writing anything:

- **`project / Project state` decides what "correct" means for a migration.** Read it first. The
  phase is `development` today, so `00001_schema.sql` and `00002_seed.sql` are edited in place and
  the database is rebuilt — never add a numbered migration until that node says otherwise.
- **Changing a feature means updating its node in the same change** — see *Documentation policy*.
- **The graph itself is the source of truth — nothing is exported into this repo.** `sh
  scripts/graph-export.sh` writes a local `.notegraph` snapshot outside the repo, on demand, for
  handing the graph to a derived project; it is never committed here.

The `@toolcase/*` library API index is a **separate graph**, read-only from here. A `node:` link
cannot cross graphs, so reference it by name: `notegraph search "tc-bottom-sheet" --scope title --use toolcase`.

## What this is

A **template repository**: a Postgres-backed Fastify API plus a React 19 SPA, wired together and
ready to build a product on. New projects are created FROM this repo; it is not itself a product.

1. **Keep it generic.** Anything added must be scaffolding most apps need. Product logic belongs in
   the derived project.
2. **Keep it copyable.** Favour patterns that are easy to find, copy and delete over clever
   indirection.

npm workspaces monorepo — `api` (Fastify + pg), `worker` (the example second service), `web` (Vite +
React 19). Scope `@appkit`. A service owns its database, migrations, Dockerfile and image.

For what ships — auth, access policy, billing, email, tickets, files, webhooks, jobs, the shell and
the rest — read the `knowledge` shelf; there are 40 area nodes and each one is current in a way a
list here would not be.

## Run it

```bash
nvm use                       # Node 24 — an older default fails with a misleading tsx/decorator error
docker start app-template-pg  # or any Postgres matching DATABASE_*
npm run migrate               # createdb + goose up, every service
npm run dev                   # api :39911, worker :27474, web :32188
```

Then `http://localhost:32188` → `/login` → **Log in as owner**. The first account ever created claims
`owner`; everyone after gets the `default` slot role. Prove the stack rather than assuming it:

```bash
curl -s localhost:39911/api/health | jq .data    # {"status":"ok"}
npm run cli -w @appkit/api -- status             # components, alarms, workers
```

Ports are pinned in each workspace's `dev` script, not in `.env`. Everything else about the
environment — the `.env` loader, precedence, the port table, Postgres in Docker — is in the graph.

## Commands

```bash
npm run dev | dev:api | dev:worker | dev:web
npm run typecheck                        # tsc --noEmit, every workspace
npm run build                            # typecheck gate + bundle
npm run migrate[:down|:status|:create]   # -w @appkit/<service>; root runs every service
npm run cli -w @appkit/api -- status     # also: seed-demo, jobs, run
npm run backup -w @appkit/api            # and restore-test, per service
sh scripts/authz-sweep.sh                # probes every route → the graph's Authorization matrix; non-zero on mismatch
sh scripts/graph-export.sh               # on demand: a local .notegraph snapshot, never committed here
sh scripts/graph-import.sh "<name>"      # in a derived project, day one
```

`typecheck` and `build` are the only automated checks in CI. Before a release also run
`sh scripts/authz-sweep.sh` and `npm audit --omit=dev`, and work the *Manual verification script*
node — it stands in for the test suite this repo deliberately does not have.

## Rules you will otherwise get wrong

The graph explains each of these properly; they are here because they bite before you would think to
look them up.

- **Every JSON response is enveloped** — `{ status: 'OK', data }` / `{ status: 'rejected', cause }`.
  A `curl` shows the envelope, so reach into `.data`. `cause` is a machine code plus params, never
  display copy; the web renders the sentence from `strings.errors`.
- **Contracts first.** Add or change the shape in `api/src/contracts/` before wiring the route and
  the web side. Both workspaces key off it.
- **Every table carries `created_at`, `updated_at`, `deleted_at`** — no exceptions. Nothing is
  hard-deleted, every read filters `deleted_at IS NULL`, every index is partial on it.
- **Layering, never skipped.** API: `routers → services → repositories → .sql`. Web: `pages →
  modules → components/services/state`, with `helpers/api.ts` the only thing that talks to the API.
- **Ownership is a named predicate in the handler**, not a policy engine. Capability check first,
  ownership check second.
- **No code comments.** Rationale goes in the graph. Carve-outs: functional directives (`-- +goose`,
  shebangs, `/// <reference`) and the per-entry gloss in `api/src/contracts/` catalogs.
- **No tests, and none are to be added.** Verification is manual against a running stack.
- **No semicolons, single quotes, 4-space indent.** No linter enforces it — match the file you are in.
- **Corner radius comes from the theme** (`var(--bs-border-radius)`), never a literal, except genuine
  circles and pills.
- **Search the graph before assuming a bug is new** — `notegraph search "<symptom>"`.

## Documentation policy — MANDATORY

**The documentation is the graph.** One node per feature area under `knowledge`, each `##` section of
it a child node, plus the `guides` shelf for "how do I do X".

**Every change to this repository updates the graph in the same change:**

- Behaviour change → update that area's node, including its `Key files` section when the file map moved.
- New feature area → a new node under `knowledge`, labelled `in progress` or `kept`.
- Removed or renamed behaviour → fix the stale node; a removed slice is relabelled `removed`.
- A pure refactor or typo is the only exception — and being unable to name the node a change belongs
  to means the graph is missing one.
- The graph itself is what's authoritative — there is nothing further to export or commit.

`README.md` and this file are orientation and part of that rule: keep them true, keep them short, and
push detail into the graph rather than restating it here.

Cite concrete function, route and table names in a node — never line numbers. Don't duplicate contract
types into the graph; point at `api/src/contracts/`.
