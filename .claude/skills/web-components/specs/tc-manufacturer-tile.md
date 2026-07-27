---
component: tc-manufacturer-tile
---

### tc-manufacturer-tile

Brand tile for manufacturer grids and filter rails (the `manufacturer`
lookup table of a vehicle catalog). Renders a sharp square brand mark — a
logo image, or an auto-monogram built from the name's initials when no logo
is set (deliberately not the circular avatar treatment) — plus an optional
mono eyebrow, the name and a count line. With `href` the whole tile is a
link; `active` paints the solid-ink selected-filter state.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Manufacturer name (also feeds the monogram) |
| `logo-src` | string | — | Logo image; omit for the auto-monogram well |
| `href` | string | — | Makes the whole tile a link |
| `count-text` | string | — | Count line, e.g. "128 models" |
| `eyebrow` | string | — | Mono micro-label above the name, e.g. "Marque" |
| `active` | boolean | false | Selected-filter state (solid ink) |

```html
<tc-manufacturer-tile
    name="Alfa Romeo"
    href="/manufacturers/alfa-romeo"
    eyebrow="Marque"
    count-text="42 models"
></tc-manufacturer-tile>
```

---