---
component: tc-ammo-counter
---

### tc-ammo-counter

Magazine / clip counter HUD readout — current rounds in the magazine, magazine capacity, reserve ammo, an optional weapon name, and a reloading state. Purely presentational, attribute-driven, no slots. A `data-state` attribute (`normal` | `low` | `reloading`) is reflected on the host: the count drops below 20% of capacity → `low` (danger ink), or `reloading` when the `reloading` attribute is present.

**Tag:** `tc-ammo-counter`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `mag` | number | `0` | Rounds currently in the magazine. Rendered as the large mono figure. |
| `mag-max` | number | `30` | Magazine capacity. Values `<= 0` (or non-numeric) fall back to `30`. |
| `reserve` | number | `0` | Reserve ammo, rendered as `+N`. |
| `weapon-name` | string | `""` | Optional weapon name shown as an uppercase JetBrains Mono micro-label above the readout. |
| `reloading` | boolean | `false` | When present, shows a `Reloading…` label and dims the count. Sets `data-state="reloading"`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `mag` | `number` | Reflects the `mag` attribute. |
| `magMax` | `number` | Reflects the `mag-max` attribute. |
| `reserve` | `number` | Reflects the `reserve` attribute. |
| `weaponName` | `string` | Reflects the `weapon-name` attribute. |
| `reloading` | `boolean` | Reflects the `reloading` boolean attribute. |

**Events**

None. `tc-ammo-counter` is a purely presentational element.

**Slots**

None. `tc-ammo-counter` is attribute-driven.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-ammo-counter-bg` | `var(--tc-surface)` | Readout background. |
| `--bs-ammo-counter-border-color` | `var(--tc-border-strong)` | 1px hairline border color. |
| `--bs-ammo-counter-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-ammo-counter-padding-y` | `0.625rem` | Vertical inner padding. |
| `--bs-ammo-counter-padding-x` | `0.875rem` | Horizontal inner padding. |
| `--bs-ammo-counter-min-width` | `8.75rem` | Minimum readout width. |
| `--bs-ammo-counter-weapon-color` | `var(--tc-text-muted)` | Weapon-name micro-label color. |
| `--bs-ammo-counter-weapon-font-size` | `0.6875rem` | Weapon-name font size (~11px). |
| `--bs-ammo-counter-weapon-letter-spacing` | `0.12em` | Weapon-name letter spacing. |
| `--bs-ammo-counter-mag-color` | `var(--tc-text)` | Magazine count color (normal state). |
| `--bs-ammo-counter-mag-font-size` | `1.75rem` | Magazine count font size. |
| `--bs-ammo-counter-mag-font-weight` | `600` | Magazine count font weight (≤600). |
| `--bs-ammo-counter-sep-color` | `var(--tc-text-faint, var(--tc-text-muted))` | `/` separator color. |
| `--bs-ammo-counter-max-color` | `var(--tc-text-muted)` | Magazine capacity color. |
| `--bs-ammo-counter-secondary-font-size` | `1rem` | Separator + capacity font size. |
| `--bs-ammo-counter-reserve-color` | `var(--tc-text-muted)` | Reserve `+N` color. |
| `--bs-ammo-counter-reserve-font-size` | `0.8125rem` | Reserve `+N` font size. |
| `--bs-ammo-counter-low-color` | `var(--tc-danger)` | Magazine count color in the `low` state. |
| `--bs-ammo-counter-state-color` | `var(--tc-app-accent)` | Reloading label color. |
| `--bs-ammo-counter-state-font-size` | `0.625rem` | Reloading label font size. |
| `--bs-ammo-counter-state-letter-spacing` | `0.12em` | Reloading label letter spacing. |

**Example**

```html
<!-- Magazine, capacity, reserve, and a weapon name -->
<tc-ammo-counter weapon-name="MK-18" mag="18" mag-max="30" reserve="90"></tc-ammo-counter>

<!-- Low magazine — count rendered in danger ink -->
<tc-ammo-counter weapon-name="Sidearm" mag="3" mag-max="17" reserve="34"></tc-ammo-counter>

<!-- Reloading state -->
<tc-ammo-counter weapon-name="MK-18" mag="0" mag-max="30" reserve="90" reloading></tc-ammo-counter>
```

---