---
component: tc-status-dot
---

### tc-status-dot

Colour-coded status indicator dot with an optional text label and an optional pulsing ring animation. Uses semantic status colours (`online` → success green, `busy` → danger red, `away` → warning amber, `offline` → slate/neutral). Respects `prefers-reduced-motion` — the pulse ring is disabled, but the static dot remains visible.

**Tag:** `tc-status-dot`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `online\|offline\|busy\|away` | `offline` | Status value. Controls the marker colour and the accessible label when no visible `label` is present |
| `size` | `small\|default\|large` | `default` | Marker diameter: 6 px / 8 px / 10 px, with proportional label font size |
| `label` | string | — | Optional visible label shown to the right of the dot. When present, the marker uses `aria-labelledby` pointing at the label span instead of its own `aria-label` |
| `pulse` | boolean | false | When present, adds an expanding-and-fading ring animation around the marker. Disabled under `prefers-reduced-motion` |

**JS Properties**

All four attributes are reflected as same-named JS properties (`status`, `size`, `label`, `pulse`).

**Events**

None. `tc-status-dot` is a purely presentational element.

**Slots**

None.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-status-dot-marker-size` | `8px` | Diameter of the status dot. Overridden per size modifier |
| `--bs-status-dot-gap` | `6px` | Gap between the marker and the label |
| `--bs-status-dot-label-size` | `13px` | Label font size. Overridden per size modifier |
| `--bs-status-dot-label-color` | `var(--tc-text-muted)` | Label text colour |
| `--bs-status-dot-animation-speed` | `1.6s` | Pulse ring animation duration |
| `--bs-status-dot-color` | _(set per status)_ | Marker fill and pulse ring border colour. Set automatically from the `status` attribute |

```html
<!-- Dot only (no label) -->
<tc-status-dot status="online"></tc-status-dot>
<tc-status-dot status="busy"></tc-status-dot>
<tc-status-dot status="away"></tc-status-dot>
<tc-status-dot status="offline"></tc-status-dot>

<!-- With labels -->
<tc-status-dot status="online" label="Online"></tc-status-dot>
<tc-status-dot status="busy" label="Busy"></tc-status-dot>
<tc-status-dot status="away" label="Away"></tc-status-dot>
<tc-status-dot status="offline" label="Offline"></tc-status-dot>

<!-- Sizes -->
<tc-status-dot status="online" size="small" label="Small"></tc-status-dot>
<tc-status-dot status="online" size="default" label="Default"></tc-status-dot>
<tc-status-dot status="online" size="large" label="Large"></tc-status-dot>

<!-- Pulse animation -->
<tc-status-dot status="online" label="Online" pulse></tc-status-dot>
<tc-status-dot status="busy" label="Busy" pulse></tc-status-dot>
```

---