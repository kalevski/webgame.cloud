---
component: tc-player-frame
---

### tc-player-frame

Player nameplate / HUD frame combining a portrait tile (glyph + optional level badge), a player name, an optional class label, and up to three stacked resource bars (HP always shown; MP and Stamina shown via boolean attributes). Styled to the toolcase design system: slate neutrals, sharp corners (`border-radius: 0`), 1px hairline borders, JetBrains Mono for machine-facing text. No shadow root; light DOM; `display: block`.

**Tag:** `tc-player-frame`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `''` | Player display name shown in the header. |
| `class-name` | `string` | — | Optional archetype / class label shown below the name in monospace. |
| `glyph` | `string` | `'—'` | Portrait character — typically an emoji or unicode glyph. |
| `level` | `number` | — | Optional player level. Shown as a badge strip at the bottom of the portrait tile. |
| `hp` | `number` | `0` | Current HP value. |
| `hp-max` | `number` | `100` | Maximum HP. Must be > 0; falls back to 100. |
| `mp` | `number` | `0` | Current MP value. Only visible when `show-mp` is set. |
| `mp-max` | `number` | `100` | Maximum MP. Must be > 0; falls back to 100. |
| `stamina` | `number` | `0` | Current stamina value. Only visible when `show-stamina` is set. |
| `stamina-max` | `number` | `100` | Maximum stamina. Must be > 0; falls back to 100. |
| `show-mp` | `boolean` | absent | When present, renders the MP bar below the HP bar. |
| `show-stamina` | `boolean` | absent | When present, renders the stamina bar below the MP bar (or HP bar if MP is hidden). |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `''` | Reflects the `name` attribute. |
| `classLabel` | `string` | `''` | Reflects the `class-name` attribute. Renamed to avoid shadowing `HTMLElement.className`. |
| `glyph` | `string` | `''` | Reflects the `glyph` attribute. |
| `level` | `number \| null` | `null` | Reflects the `level` attribute. Set to `null` to remove the badge. |
| `hp` | `number` | `0` | Reflects the `hp` attribute. |
| `hpMax` | `number` | `100` | Reflects the `hp-max` attribute. |
| `mp` | `number` | `0` | Reflects the `mp` attribute. |
| `mpMax` | `number` | `100` | Reflects the `mp-max` attribute. |
| `stamina` | `number` | `0` | Reflects the `stamina` attribute. |
| `staminaMax` | `number` | `100` | Reflects the `stamina-max` attribute. |
| `showMp` | `boolean` | `false` | Reflects the `show-mp` attribute. |
| `showStamina` | `boolean` | `false` | Reflects the `show-stamina` attribute. |

#### Events

None. `tc-player-frame` is a purely presentational component.

#### Slots

None. All content is generated from attributes.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-player-frame-bg` | `var(--tc-surface)` | Card background. |
| `--bs-player-frame-border` | `var(--tc-border)` | 1 px hairline border around the card. |
| `--bs-player-frame-portrait-size` | `3rem` | Width (and minimum height) of the portrait tile. |
| `--bs-player-frame-portrait-bg` | `var(--tc-surface-muted)` | Portrait tile background. |
| `--bs-player-frame-portrait-border` | `var(--tc-border)` | Right border separating portrait from body. |
| `--bs-player-frame-glyph-size` | `1.375rem` | Font size of the portrait glyph. |
| `--bs-player-frame-glyph-color` | `var(--tc-text)` | Portrait glyph colour. |
| `--bs-player-frame-level-bg` | `var(--tc-surface)` | Level badge background. |
| `--bs-player-frame-level-border` | `var(--tc-border)` | Top border of the level badge strip. |
| `--bs-player-frame-level-color` | `var(--tc-text-muted)` | Level badge text colour. |
| `--bs-player-frame-name-color` | `var(--tc-text)` | Player name text colour. |
| `--bs-player-frame-class-color` | `var(--tc-text-muted)` | Class label text colour. |
| `--bs-player-frame-hp-track-bg` | `var(--tc-surface-muted)` | HP bar track background. |
| `--bs-player-frame-hp-fill` | `var(--tc-success, #16a34a)` | HP bar fill colour. |
| `--bs-player-frame-mp-track-bg` | `var(--tc-surface-muted)` | MP bar track background. |
| `--bs-player-frame-mp-fill` | `var(--tc-info, #0284c7)` | MP bar fill colour. |
| `--bs-player-frame-stamina-track-bg` | `var(--tc-surface-muted)` | Stamina bar track background. |
| `--bs-player-frame-stamina-fill` | `var(--tc-warning, #d97706)` | Stamina bar fill colour. |
| `--bs-player-frame-bar-height` | `0.3125rem` | Height of each resource bar (5 px). |

#### Example

```html
<tc-player-frame
    id="frame"
    name="Aria"
    class-name="Arcane Mage"
    glyph="🔮"
    level="34"
    hp="90"
    hp-max="120"
    mp="55"
    mp-max="100"
    show-mp="">
</tc-player-frame>

<script>
const frame = document.getElementById('frame');

// Update HP dynamically
frame.setAttribute('hp', '60');

// Or via the JS property
frame.hp = 60;
frame.mp = 30;

// Show the stamina bar
frame.showStamina = true;
frame.stamina = 80;
frame.staminaMax = 100;
</script>
```

---