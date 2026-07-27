---
component: tc-ping-display
---

### tc-ping-display

Compact network-latency readout: a status pip square plus a JetBrains Mono millisecond value, colour-coded by tier. Styled to the toolcase design system (slate neutrals, sharp corners, `--bs-ping-display-*` custom properties). No shadow root; light DOM; `display: inline-flex`.

**Tag:** `tc-ping-display`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `ping` | `number \| null` | `null` | Round-trip latency in milliseconds. Absent or empty renders an em-dash in the unknown tier colour. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `ping` | `number \| null` | `null` | Reflects the `ping` attribute. Set to `null` to remove. |

#### Tier mapping

| `data-tier` | Condition | Colour token |
|---|---|---|
| `success` | ping < 60 ms | `--tc-success` |
| `warning` | 60 ms ≤ ping < 200 ms | `--tc-warning` |
| `danger` | ping ≥ 200 ms | `--tc-danger` |
| `unknown` | ping absent / `null` | `--tc-text-faint` |

#### Events

None. `tc-ping-display` is a purely presentational readout with no user interaction.

#### Slots

None. All content is generated from the `ping` attribute.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-ping-display-gap` | `0.375rem` | Gap between the pip and the value label. |
| `--bs-ping-display-pip-size` | `6px` | Width and height of the status pip square. |
| `--bs-ping-display-font-size` | `0.6875rem` | Font size of the value label. |
| `--bs-ping-display-letter-spacing` | `0.05em` | Letter-spacing of the value label. |
| `--bs-ping-display-font-weight` | `500` | Font weight of the value label. |
| `--bs-ping-display-color-unknown` | `var(--tc-text-faint)` | Pip and text colour for the `unknown` tier. |
| `--bs-ping-display-color-success` | `var(--tc-success)` | Pip and text colour for the `success` tier. |
| `--bs-ping-display-color-warning` | `var(--tc-warning)` | Pip and text colour for the `warning` tier. |
| `--bs-ping-display-color-danger` | `var(--tc-danger)` | Pip and text colour for the `danger` tier. |

#### Example

```html
<!-- Good ping -->
<tc-ping-display ping="22"></tc-ping-display>

<!-- High latency -->
<tc-ping-display ping="350"></tc-ping-display>

<!-- Unknown (no ping attribute) -->
<tc-ping-display></tc-ping-display>

<!-- JS-property live update -->
<tc-ping-display id="hud-ping"></tc-ping-display>
<script>
    const hud = document.getElementById('hud-ping');
    setInterval(() => { hud.ping = Math.round(20 + Math.random() * 300) }, 1000);
</script>
```