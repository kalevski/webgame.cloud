---
component: tc-model-family-card
---

### tc-model-family-card

Card for one `model_family` row of a vehicle catalog — manufacturer eyebrow,
range title, a machine-facing mono lineage breadcrumb
`RANGE / SERIES / GENERATION`, and a meta row with a body-type chip (lucide
icon + humanized enum label), a mono years span and a variant count. An
optional photo strip caps the card; `href` links the title. An absent or
unknown `body-type` renders no chip (unknown is NULL — no sentinel).

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `manufacturer` | string | — | Muted eyebrow above the title |
| `range` | string | — | Human-readable title (and first lineage part) |
| `series` | string | — | Second lineage part |
| `generation` | string | — | Third lineage part |
| `body-type` | enum | — | `body_type` member (`SUV`, `ESTATE`, `PICKUP_TRUCK`, …) → icon + label chip |
| `years-text` | string | — | Mono years span, e.g. "2020–2025" |
| `variant-count-text` | string | — | e.g. "34 variants" |
| `href` | string | — | Wraps the title in a link |
| `image-src` / `image-alt` | string | — | Optional photo strip |

```html
<tc-model-family-card
    manufacturer="BMW"
    range="3 Series"
    series="G20"
    generation="LCI"
    body-type="NOTCHBACK"
    years-text="2022–2025"
    variant-count-text="34 variants"
    href="/families/bmw-3-series-g20"
    image-src="/img/families/g20.jpg"
></tc-model-family-card>
```

---