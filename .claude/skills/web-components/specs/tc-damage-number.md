---
component: tc-damage-number
---

### tc-damage-number

A floating combat number that rises and fades over a configurable duration, then fires a `tc-done` CustomEvent. Styled to the toolcase voice — JetBrains Mono digits in the slate/status palette, sharp corners. Purely attribute/property-driven (no slots). The variant is resolved by precedence: `miss` > `heal` > `crit` > normal.

**Tag:** `tc-damage-number`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | `""` | The number/text to display (e.g. `"42"`). Ignored when `miss` is set (renders `MISS` instead). Rendered as text — no HTML. |
| `crit` | boolean | `false` | Critical-hit styling — larger digits, weight 600, danger-red color. |
| `heal` | boolean | `false` | Heal styling — success-green color with a `+` prefix on the value. |
| `miss` | boolean | `false` | Renders the muted uppercase `MISS` label, ignoring `value`. Takes precedence over `crit`/`heal`. |
| `duration` | number | `700` | Lifetime in milliseconds. Drives both the rise-and-fade animation and the delay before `tc-done` fires. Non-positive / non-numeric values fall back to `700`. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `""` | Reflects the `value` attribute. |
| `crit` | `boolean` | `false` | Reflects the `crit` attribute. |
| `heal` | `boolean` | `false` | Reflects the `heal` attribute. |
| `miss` | `boolean` | `false` | Reflects the `miss` attribute. |
| `duration` | `number` | `700` | Reflects the `duration` attribute. |
| `ondone` | `(() => void) \| null` | `null` | Optional callback fired alongside the `tc-done` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-done` | `{}` | Dispatched once, `duration` ms after the element connects — when the animation completes. `bubbles: true`, `composed: true`. Use it to recycle/remove the element. |

**Slots**

None. `tc-damage-number` is a purely attribute/property-driven component.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-damage-number-duration` | `700ms` | Animation duration. Written inline by the element from the `duration` attribute; override the attribute, not this var. |
| `--bs-damage-number-font-size` | `1.125rem` | Digit size in the normal variant. |
| `--bs-damage-number-font-weight` | `500` | Digit weight in the normal variant. |
| `--bs-damage-number-letter-spacing` | `0.04em` | Letter-spacing of the digits. |
| `--bs-damage-number-color` | `var(--tc-text)` | Color of the normal variant. |
| `--bs-damage-number-crit-font-size` | `1.625rem` | Digit size in the `crit` variant. |
| `--bs-damage-number-crit-font-weight` | `600` | Digit weight in the `crit` variant. |
| `--bs-damage-number-crit-color` | `var(--tc-danger)` | Color of the `crit` variant. |
| `--bs-damage-number-heal-color` | `var(--tc-success)` | Color of the `heal` variant. |
| `--bs-damage-number-miss-font-size` | `0.8125rem` | Label size in the `miss` variant. |
| `--bs-damage-number-miss-color` | `var(--tc-text-muted)` | Color of the `miss` variant. |
| `--bs-damage-number-rise` | `60px` | Distance the number travels upward over its lifetime. |
| `--bs-damage-number-z-index` | `var(--tc-z-tooltip, 1070)` | Stack order when positioned as an overlay. |

Honours `prefers-reduced-motion`: the upward-travel transform is dropped while the opacity fade (the state-conveying part) is kept.

```html
<!-- Plain damage tick -->
<tc-damage-number value="42"></tc-damage-number>

<!-- Critical hit -->
<tc-damage-number value="128" crit></tc-damage-number>

<!-- Heal (renders "+35") -->
<tc-damage-number value="35" heal></tc-damage-number>

<!-- Miss (renders "MISS") -->
<tc-damage-number miss></tc-damage-number>

<!-- Custom lifetime + recycle on completion -->
<tc-damage-number id="dn" value="999" crit duration="1200"></tc-damage-number>
<script>
  const el = document.getElementById('dn')
  el.addEventListener('tc-done', () => el.remove())
</script>
```

---