---
component: tc-platform-icon
---

### tc-platform-icon

Inline platform badge combining a Lucide glyph and an optional JetBrains Mono label. Covers PC, PlayStation, Xbox, Nintendo, Steam, Mobile, and Web. No shadow root; light DOM; `display: inline-flex`. Purely presentational — no events, no slots.

**Tag:** `tc-platform-icon`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `platform` | `'pc' \| 'playstation' \| 'xbox' \| 'nintendo' \| 'steam' \| 'mobile' \| 'web'` | `'pc'` | Which platform to display. Unknown values fall back to `'pc'`. |
| `size` | `number \| null` | `null` | Glyph size in pixels. When absent the glyph inherits its size from `--bs-platform-icon-size` (default `1rem`). |
| `label` | `boolean` | `false` | Boolean presence attribute. When present, renders the platform name beside the glyph. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `platform` | `Platform` | `'pc'` | Reflects the `platform` attribute. |
| `size` | `number \| null` | `null` | Reflects the `size` attribute. Set to `null` to remove. |
| `label` | `boolean` | `false` | Reflects the `label` boolean attribute. |

#### Platform map

| `platform` value | Lucide icon | Displayed label |
|---|---|---|
| `pc` | `Monitor` | PC |
| `playstation` | `Gamepad2` | PlayStation |
| `xbox` | `Gamepad` | Xbox |
| `nintendo` | `Disc` | Nintendo |
| `steam` | `Cog` | Steam |
| `mobile` | `Smartphone` | Mobile |
| `web` | `Globe` | Web |

#### Events

None. `tc-platform-icon` is a purely presentational component with no user interaction.

#### Slots

None. All content is generated from attributes.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-platform-icon-size` | `1rem` | Glyph width and height. Overridden by the `size` attribute inline style when set. |
| `--bs-platform-icon-gap` | `0.375rem` | Gap between glyph and label. |
| `--bs-platform-icon-glyph-color` | `var(--tc-text-muted)` | Glyph stroke colour. |
| `--bs-platform-icon-label-color` | `var(--tc-text-muted)` | Label text colour. |
| `--bs-platform-icon-label-font-size` | `0.8125rem` | Label font size. |
| `--bs-platform-icon-label-font-family` | `var(--tc-font-mono)` | Label font family (JetBrains Mono). |

#### Example

```html
<!-- Glyph only -->
<tc-platform-icon platform="steam"></tc-platform-icon>

<!-- Glyph with label -->
<tc-platform-icon platform="playstation" label></tc-platform-icon>

<!-- Custom size -->
<tc-platform-icon platform="xbox" size="32" label></tc-platform-icon>

<!-- All platforms -->
<tc-platform-icon platform="pc"></tc-platform-icon>
<tc-platform-icon platform="playstation"></tc-platform-icon>
<tc-platform-icon platform="xbox"></tc-platform-icon>
<tc-platform-icon platform="nintendo"></tc-platform-icon>
<tc-platform-icon platform="steam"></tc-platform-icon>
<tc-platform-icon platform="mobile"></tc-platform-icon>
<tc-platform-icon platform="web"></tc-platform-icon>

<!-- JS-property update -->
<tc-platform-icon id="plat" label></tc-platform-icon>
<script>
    const el = document.getElementById('plat');
    el.platform = 'xbox';
    el.size = 24;
</script>
```

---