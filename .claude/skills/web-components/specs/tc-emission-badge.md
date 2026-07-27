---
component: tc-emission-badge
---

### tc-emission-badge

Compact emissions credential for a vehicle catalog row: the emission
category label behind a 4px colored left stripe encoding the emission class,
an optional NEDC/WLTP measurement-standard mono tag, and an optional mono
CO₂ figure. The stripe tier derives from the first digit in `label`
(6/5 → success, 4/3 → warning, 2/1 → danger, none → neutral) unless pinned
via `tier`. The stripe is the only colored element — the body stays neutral.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Emission category label (e.g. "Euro 6d-TEMP") |
| `standard` | `NEDC\|WLTP\|NA` | — | Measurement standard mono tag; `NA` is omitted |
| `co2-text` | string | — | Pre-formatted CO₂ figure (e.g. "128 g/km", mono) |
| `tier` | number `1-6` | derived | Explicit stripe tier for labels without a digit |

```html
<tc-emission-badge label="Euro 6d" standard="WLTP" co2-text="128 g/km"></tc-emission-badge>
<tc-emission-badge label="EEV" tier="5"></tc-emission-badge>
```

---