# Bundles

A bundle is a **saved rule for selecting files**, not a folder: included/excluded tags plus an optional
category, a target engine, packing options, and an optional build tag naming the channel it builds into.
Any `ready` asset matching the rule is in the bundle — re-tag a file and its bundles follow with no
further action.

## The rule

Preview and build share one SQL predicate, so they can never disagree:

```sql
WHERE f.project_id = $1 AND f.upload_status = 'ready' AND f.deleted_at IS NULL
  AND ($2::text IS NULL OR f.category_id = $2)
  AND (cardinality($3::text[]) = 0 OR f.tags && $3)
  AND NOT (f.tags && $4::text[])
```

`POST /api/projects/:id/bundles/preview` runs it against an **unsaved** rule (the wizard previews before
the row exists) and returns a server-side count, total bytes and at most 50 sample rows. The browser never
pulls the project's whole file list to count locally.

`resolve(bundle)` returns the matched assets' `upload_uuid`s plus a `relations` array — one entry per child
asset whose parent is also in the set. That array is what tells the realm which normal map belongs to which
texture.

## Rules of the road

- Tags and the build tag are validated against the project's categories and tags on write (`unknown_tag`,
  `unknown_build_tag`).
- Quota `bundles_per_project`, charged to the project owner.
- A rule that matches nothing is **saveable** (the card shows `0 files`) but **not buildable** —
  triggering it returns `400 bundle_empty`.
- Deleting a bundle soft-deletes its builds and their output rows in the same statement, which is what the
  confirmation copy promises.
- Extrude, padding and power-of-two stay realm-side packer defaults; the four advanced fields
  (algorithm, downscale, rotation, engine) are the whole surface.


## The bundle wizard (console)

`modals/BundleWizardModal.tsx` is a three-step wizard — **Details**, **Rule**, **Packing** — in a wide,
scrollable modal, with a **live preview table permanently pinned under the steps**.

- Details picks the engine with the landing page's engine-card design (`components/ChoiceCards.tsx`, real
  Phaser/PixiJS logos, colour per engine).
- Rule selects category, included tags, excluded tags and build tag. Every one of them is a **select over the
  project's existing categories and tags** — the wizard can no longer create tags or categories, because a bundle that
  invents a tag nothing carries silently matches nothing. Add them in project settings.
- The preview calls `POST /api/projects/:id/bundles/preview` (debounced 250 ms) on every rule change and
  renders the matched files in a `tc-advanced-table` with a `N files · size` summary, so "what does this rule
  actually select" is answered before the bundle exists.
- **Save** appears only on the last step.

The bundles screen itself is a three-column grid of `tc-asset-bundle` cards with an intro explaining that a
bundle is a saved query, plus a recommendation for how to split bundles per payload kind.

**The card is restyled entirely in CSS** (`styles/components/_asset-bundle.scss`), because the shipped
component reads wrong inside the console:

- `--tc-success` is not remapped outside `.module-landing`, so the "included" tag chips **and every section
  label** rendered amber — a rule's included tags looked like warnings. Included is now teal (`#097f74`, the
  same "this ships" colour the pipeline and build tags use), excluded is `--tc-danger`, and the section
  labels are muted mono micro-labels instead of coloured ones.
- Build-tag chips are painted like the build tags everywhere else: teal outline, mono, uppercase. One
  vocabulary across the pipeline's Live station, the builds list and the bundle card.
- Counts are mono with tabular figures and a bold value, matching the console's data face.
- Cards **stretch to equal height** (`.bundle-list--grid` uses `align-items: stretch`, the card is a flex
  column, and `.tc-asset-bundle-advanced` takes `margin-top: auto`) so the *Advanced* toggles line up
  instead of floating mid-card on a bundle with no build tag.

`BundleList` gives each card a `bundle-card` class **for cascade reasons, not styling ones**: the library's
theme rules are `[data-tc-theme="blueprint"] .tc-asset-bundle-…`, which is (0,2,0) and beats any
`tc-asset-bundle .tc-…` override (0,1,1) — attribute selectors count at class level. `.bundle-card.bundle-card`
also carries the `--bs-asset-bundle-*` token overrides for the same reason: a token set on the bare element
selector loses to `[data-tc-theme] tc-asset-bundle`. When a `tc-*` override looks like it is being ignored,
count the class-level components before reaching for `!important`.
