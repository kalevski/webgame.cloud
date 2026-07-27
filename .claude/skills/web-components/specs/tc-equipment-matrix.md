---
component: tc-equipment-matrix
---

### tc-equipment-matrix

The full equipment sheet of one catalog variant (the `variant_equipment`
link table): items grouped by `feature_flag` into **Standard equipment /
Optional extras / Packages** sections, each capped by a mono uppercase
micro-header with an item count. Sections with no items are omitted; items
without a flag fall into the Standard section. Renders `tc-equipment-tag`
chips by default.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `chips\|list` | `chips` | `list` renders a dense two-column checklist (single column below 576px) instead of chips |
| `collapsible` | boolean | false | Sections beyond the first start collapsed behind a chevron toggle |

**Properties (JS-only):** `items: { label: string; icon?: string; flag?:
'included'|'optional'|'package' }[]` — the variant's equipment rows. Set via
a ref (`el.items = [...]`) or the `useTc` React hook — arrays can't be
passed as HTML attributes.

```html
<tc-equipment-matrix collapsible></tc-equipment-matrix>
<script>
    document.querySelector('tc-equipment-matrix').items = [
        { label: 'Adaptive cruise control', flag: 'included' },
        { label: 'Matrix LED headlights', flag: 'included' },
        { label: 'Panoramic sunroof', flag: 'optional' },
        { label: 'Winter package', flag: 'package' },
    ]
</script>
```

---