# Game configuration data

> Values a shipped game reads at runtime, keyed by build tag.
>
> Part of the WebGame Cloud feature set — see `README.md` in this directory for the full list.

---

## What the user does

Configs are how a developer changes their game's behaviour **without rebuilding it**. The flow has
three layers:

1. A **schema** defines the shape — the fields and their types.
2. A **config** is a named set of values against a schema. Its name is the key the game reads.
3. **Config versions** hold the actual values. Each config has one **default** version, and can have
   one version bound to each **build tag**.

That last part is what makes it useful: the `production` version of `difficulty` and the `beta`
version can differ, and a build tagged `beta` reads the beta values automatically. Two partial unique
indexes enforce it — one default per config, one version per `(config, build tag)`.

On screen, the Configs page has **Configs** and **Schemas** tabs. A schema is built with a property
editor offering `string`, `number`, `integer`, `boolean`, `object`, `array`, `ref` — where the
object/array/ref types reference *another schema in the same project*, so schemas nest. Creating a
config requires picking a schema, so **Add is disabled until at least one schema exists**.

Inside a config, the tab strip is **Default** followed by **one tab per project build tag** — the
release channels made literal. Opening a tag that has no override pre-fills from the default, so you
are editing a copy; saving creates the version row. Tags that already have an override are marked
with a trailing dot (`release ●`). Values are edited through a generated typed form — switches for
booleans, collapsible groups for objects, `#1`/`#2` item headers for arrays — not a raw JSON box, and
the default tab is validated against the schema on save.

An **Update Schema** action lights up only when the underlying schema has moved on since the config
was created (`schema.updateIterator > config.schemaUpdateIterator`) — the signal that a config is
running against a stale shape, and the way to pull it forward.

Build tags themselves are free text, created in **Project Settings → Build Tags** ("ex. 'debug',
'release', 'staging'") and bound to actual builds through the Manage Build Tag modal, which states
the rule plainly: *"Each tag can only be held by one build per bundle."*

## What the game does at runtime

A shipped game calls the **public, unauthenticated** endpoints — this is the only part of the system
with no credential at all:

| Endpoint | Cached how | Why |
| --- | --- | --- |
| `GET /public/projects/:id/assets?buildId=…` | `immutable`, one year | a build never changes |
| `GET /public/projects/:id/assets?buildTag=…` | short TTL | a tag can be moved |
| `GET /public/projects/:id/configs/:key` | **`no-store`** | edit a value, running games see it |
| `GET /public/projects/:id/configs?keys=a,b,c` | `no-store` | batch form |
| `GET /public/builds/:id/config` | 60 seconds | build is fixed, values are not |

Config values are **deliberately not inlined** into the asset manifest, precisely so they stay live.
Tweak a number in the dashboard and a running game picks it up without a redeploy — that is the feature.

All of these are IP rate limited (20 rps, burst 100) and project-scoped in the query, so a config
from another project is invisible rather than forbidden. This surface deserves care: it is
unauthenticated and takes unbounded traffic from the public internet.

## Where the values live

A config row carries its name and the schema it is bound to. **All values live in `config_versions`** —
one default version per config, plus at most one version per build tag. There is no value storage on
the config row itself.

---

## Screens & components

Screen: **Configs & schemas — `/projects/:id/configs`**

```
pages/FooPage.tsx      route shell — page title, auth guard, layout wrapper
  └ modules/Foo.tsx    the screen — selectors, actions, modals, tc-* elements
      └ state/foo.slice.ts   fetch/mutate, alerts
          └ services/FooService.ts   one method per endpoint
```

These four rules apply to every screen:

- **Gate reads and writes separately.** The page renders for any project member; each write control is
  wrapped in the matching permission check. A read-only member must never see a dead button — drop the
  entry from a `tc-action-header` `actions` array rather than disabling it, and swap an actionable
  `tc-action-row-list` for a plain `tc-data-list`.
- **Boolean props need `value || undefined`** so the attribute is absent when off.
- **Object props and custom events go through `useTc<HTMLElement>(props, events)`** — assign the
  returned ref. Anything set via a JS property (`options`, `items`, `steps`, `usage`, `tabs`, `states`,
  `badges`) is passed this way, not as an attribute.
- **`tc-advanced-table` body rows are a trusted HTML string** fed through `rows`, never React children —
  escape every interpolated value, and handle clicks with one delegated handler on the module root.

Read the matching component spec before using a `tc-*` element; attribute names and event payloads are
per component.

This screen is almost entirely two purpose-built components:

| Region | Component | Notes |
| --- | --- | --- |
| Configs / Schemas switch | `tc-tab-bar` | |
| Schema property editor | `tc-json-schema-def` | Exactly this feature: editable schema-name field, property rows, add-property button |
| Config version tabs | `tc-tab-sections` | `Default` plus one section per build tag; mark tags that already have an override |
| Config value editor | `tc-json-editor` | Schema-driven form editor — switches for booleans, groups for objects, item headers for arrays. No raw JSON box |
| Validation errors | `tc-alert` variant `danger` | One line per error, `<path>: <message>` |
| Stale-schema signal | `tc-badge` + `tc-action-header` | *Update Schema* enabled only when the schema moved on |
| Add / Save / Discard / Delete | `tc-action-header` | All gated on `config.write` |
