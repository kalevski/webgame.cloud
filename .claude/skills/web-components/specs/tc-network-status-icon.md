---
component: tc-network-status-icon
---

### tc-network-status-icon

4-bar signal-strength indicator for connectivity / network quality. Bar count and tier are computed from ping latency and packet loss; the optional label shows the ping value or offline state. No shadow root; light DOM; `display: inline-flex`.

**Tag:** `tc-network-status-icon`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `ping` | `number \| null` | `null` | Round-trip latency in milliseconds. `null` or absent = unknown. |
| `loss` | `number` | `0` | Packet-loss percentage (0–100). High loss downgrades the tier even with a low ping. |
| `connected` | `boolean` | `false` | Boolean presence attribute. When absent the component renders in the **offline** (0-bar) tier. |
| `size` | `number` | `16` | Icon height in pixels. Bar widths scale proportionally. |
| `show-label` | `boolean` | `false` | When present, renders a JetBrains Mono label: ping value (`"N ms"`), `"ONLINE"` if connected with no ping, or `"OFFLINE"`. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `ping` | `number \| null` | `null` | Reflects the `ping` attribute. Set to `null` to remove. |
| `loss` | `number` | `0` | Reflects the `loss` attribute. |
| `connected` | `boolean` | `false` | Reflects the `connected` boolean attribute. |
| `size` | `number` | `16` | Reflects the `size` attribute. |
| `showLabel` | `boolean` | `false` | Reflects the `show-label` attribute. |

#### Tier mapping

| Active bars | `data-tier` | Condition |
|---|---|---|
| 4 | `good` | ping < 60 ms and loss < 1 % |
| 3 | `ok` | ping < 120 ms and loss < 3 % |
| 2 | `warning` | ping < 200 ms and loss < 5 % |
| 1 | `bad` | ping ≥ 200 ms or loss ≥ 5 % |
| 0 | `offline` | `connected` attribute absent |

#### Events

None. `tc-network-status-icon` is a purely presentational indicator with no user interaction.

#### Slots

None. All content is generated from attributes.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-network-status-icon-size` | `16px` | Icon height (set by the `size` attribute; override to drive size from CSS). |
| `--bs-network-status-icon-gap` | `0.375rem` | Gap between bar group and label. |
| `--bs-network-status-icon-bar-gap` | `2px` | Gap between individual bars. |
| `--bs-network-status-icon-bar-width` | `calc(size × 0.22)` | Width of each bar. |
| `--bs-network-status-icon-inactive-color` | `var(--tc-border-strong)` | Colour of inactive (empty) bars. |
| `--bs-network-status-icon-label-font-size` | `calc(size × 0.75)` | Label font size. |
| `--bs-network-status-icon-label-color` | `var(--tc-text-muted)` | Label text colour. |
| `--bs-network-status-icon-color-offline` | `var(--tc-text-faint)` | Active bar colour for the `offline` tier. |
| `--bs-network-status-icon-color-bad` | `var(--tc-danger)` | Active bar colour for the `bad` tier. |
| `--bs-network-status-icon-color-warning` | `var(--tc-warning)` | Active bar colour for the `warning` tier. |
| `--bs-network-status-icon-color-ok` | `var(--tc-accent)` | Active bar colour for the `ok` tier. |
| `--bs-network-status-icon-color-good` | `var(--tc-success)` | Active bar colour for the `good` tier. |

#### Example

```html
<!-- Good signal with ping label -->
<tc-network-status-icon connected ping="45" show-label></tc-network-status-icon>

<!-- Compact, no label -->
<tc-network-status-icon connected ping="120"></tc-network-status-icon>

<!-- Offline -->
<tc-network-status-icon show-label></tc-network-status-icon>

<!-- JS-property update -->
<tc-network-status-icon id="net" connected size="24" show-label></tc-network-status-icon>
<script>
    const net = document.getElementById('net');
    // Simulate a live ping readout
    setInterval(() => { net.ping = Math.round(20 + Math.random() * 200) }, 1000);
</script>
```