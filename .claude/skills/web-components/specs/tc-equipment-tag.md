---
component: tc-equipment-tag
---

### tc-equipment-tag

One vehicle-equipment chip (the catalog's `equipment` table), optionally
carrying its per-variant `feature_flag` (`variant_equipment.flag`). The flag
is information, rendered as color + a mono suffix: `included` = success edge
+ check glyph, `optional` = neutral + "OPT", `package` = info tint + "PKG".
Without a flag it is a plain neutral chip. Pair with `tc-equipment-matrix`
for a variant's full sheet.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Equipment display text |
| `icon` | string | flag default | Lucide icon name (kebab or PascalCase); overrides the flag's default glyph (check / plus / package) |
| `flag` | `included\|optional\|package` | — | The `feature_flag` enum value (case-insensitive); omit for a plain chip |

```html
<tc-equipment-tag label="Adaptive cruise control" flag="included"></tc-equipment-tag>
<tc-equipment-tag label="Panoramic sunroof" flag="optional"></tc-equipment-tag>
<tc-equipment-tag label="Winter package" flag="package"></tc-equipment-tag>
<tc-equipment-tag label="Heated seats" icon="armchair" flag="included"></tc-equipment-tag>
```

---