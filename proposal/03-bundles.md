# Asset bundles (groups of files)

> A saved rule for selecting files — the input to a build.
>
> Part of the WebGame Cloud feature set — see `README.md` in this directory for the full list.

---

## What the user does

A bundle is a **saved rule for selecting files**, not a folder. The user never drags files into a
bundle. They configure:

- `includedTags` / `excludedTags` — the selection rule
- `engine` and `category` — what the output targets
- `downscale`, `rotationEnabled`, `algorithm` — how images get packed
- an optional `buildTag` — the publish channel this bundle builds into

Any file in the project that is `ready` and matches the tag filter is in the bundle. Re-tag a file
and the bundle's contents change with no further action. Bundles render as a card grid; each card
offers **Run Build**, **Edit** and **Delete**, so building is one click from the list rather than a
separate screen.

The form is a **four-step wizard**, and step three is the good idea:

| Step | What it asks |
| --- | --- |
| **Basics** | Bundle name, and target engine — Phaser / PixiJS / Custom |
| **Query** | Category (default "All Categories"), **Included Tags**, **Excluded Tags** |
| **Preview** | *"N files matched your query."* plus the actual file list — or *"No files match the current query. Adjust the category or tags."* |
| **Advanced** | Packing algorithm (Basic / MaxRects / Shelf / Guillotine), Downscale %, Allow Rotation |

**The Preview step answers "how do I know what's in this bundle?"** — a rule-based selector is opaque
without it. It live-refreshes as the query changes, backed by a server-side count rather than
fetching the project's whole file list into the browser.

Deleting a bundle warns that **"All builds associated with this bundle will also be deleted."**

Bundles are quota-limited **per project** (`bundles_per_project`), charged to the project owner.

## How the selection resolves

At build time, `resolveBundleUploadIds` collects every `ready` file matching `includedTags` minus
`excludedTags`, and takes their `upload_uuid`s. It also builds a `relations` array — one entry per
child file (a file with both `parent_file_id` and `kind`) whose parent is also in the set. That array
is what tells the build machine "this normal map belongs to that texture".

**If the rule matches nothing, the build fails.** An empty upload list is rejected by the worker. A
user who mistypes a tag gets a failed build, not an empty one.

---

## Screens & components

Screen: **Bundles — `/projects/:id/bundles`**

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

| Region | Component | Notes |
| --- | --- | --- |
| Bundle card | `tc-section-card` | One per bundle; the `action` slot carries the kebab |
| Tag rule display | `tc-badge-row` | Included/excluded tags as key/value chips |
| Card actions | `tc-action-items` | *Run Build* (needs `build.run`), *Edit* / *Delete* (need `bundle.write`) |
| Wizard shell | `tc-modal` + `tc-stepper` | `steps` JS property, `active-step` attribute drives state |
| Step 1 — Basics | `tc-form-input`, `tc-card-options` | Name; engine as three cards (Phaser / PixiJS / Custom) |
| Step 2 — Query | `tc-extended-select`, `tc-tag-input` ×2 | Category (searchable, "All Categories" default); included and excluded tags |
| Step 3 — Preview | `tc-asset-row-list` + `tc-asset-row` | Purpose-built: leading icon, name, tag chips, trailing size. `tc-spinner` while the count refreshes, `tc-empty-state` on no match |
| Step 4 — Advanced | `tc-select`, `tc-slider`, `tc-switch` | Algorithm; downscale % (the slider constrains it to 1–100); allow rotation |

The Preview is backed by a server-side count, so editing the query does not pull the project's whole
file list into the browser.
