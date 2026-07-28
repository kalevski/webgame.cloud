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

- Tags and the build tag are validated against the project vocabularies on write (`unknown_tag`,
  `unknown_build_tag`).
- Quota `bundles_per_project`, charged to the project owner.
- A rule that matches nothing is **saveable** (the card shows `0 files`) but **not buildable** —
  triggering it returns `400 bundle_empty`.
- Deleting a bundle soft-deletes its builds and their output rows in the same statement, which is what the
  confirmation copy promises.
- Extrude, padding and power-of-two stay realm-side packer defaults; the four advanced fields
  (algorithm, downscale, rotation, engine) are the whole surface.
