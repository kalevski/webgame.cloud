---
component: tc-hit-marker
---

### tc-hit-marker

A transient hit-confirmation reticle — four inward-pointing corner ticks that pop in and fade out over a configurable duration, then fire a `tc-done` CustomEvent and auto-clear their own `show` attribute. Styled to the toolcase voice — sharp slate/status hairline strokes. The kill variant uses a lucide Skull glyph. Purely attribute/property-driven (no slots). The variant is resolved by precedence: `kill` > `crit` > normal.

**Tag:** `tc-hit-marker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `show` | boolean | `false` | When present (and the element is connected) the marker plays its pop-and-fade animation, then after `duration` ms is auto-removed and `tc-done` fires. Removing it manually hides the marker and cancels the pending timer. |
| `crit` | boolean | `false` | Critical-hit styling — warning-amber strokes. |
| `kill` | boolean | `false` | Kill styling — danger-red strokes plus a centered Skull glyph. Takes precedence over `crit`. |
| `size` | number | `24` | Marker edge length in pixels. Non-positive / non-numeric values fall back to `24`. |
| `duration` | number | `350` | Lifetime in milliseconds. Drives both the pop-and-fade animation and the delay before `tc-done` fires. Non-positive / non-numeric values fall back to `350`. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `show` | `boolean` | `false` | Reflects the `show` attribute. Setting `true` re-arms the marker. |
| `crit` | `boolean` | `false` | Reflects the `crit` attribute. |
| `kill` | `boolean` | `false` | Reflects the `kill` attribute. |
| `size` | `number` | `24` | Reflects the `size` attribute. |
| `duration` | `number` | `350` | Reflects the `duration` attribute. |
| `ondone` | `(() => void) \| null` | `null` | Optional callback fired alongside the `tc-done` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-done` | `{}` | Dispatched once, `duration` ms after `show` is set — when the marker finishes. The element clears its own `show` attribute just before firing. `bubbles: true`, `composed: true`. Use it to recycle/remove the element. |

**Slots**

None. `tc-hit-marker` is a purely attribute/property-driven component.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-hit-marker-size` | `24px` | Marker edge length. Written inline by the element from the `size` attribute; override the attribute, not this var. |
| `--bs-hit-marker-duration` | `350ms` | Animation duration. Written inline by the element from the `duration` attribute; override the attribute, not this var. |
| `--bs-hit-marker-thickness` | `2px` | Stroke width of the corner ticks. |
| `--bs-hit-marker-color` | `var(--tc-app-accent)` | Stroke color of the normal variant. |
| `--bs-hit-marker-crit-color` | `var(--tc-warning)` | Stroke color of the `crit` variant. |
| `--bs-hit-marker-kill-color` | `var(--tc-danger)` | Stroke color and glyph color of the `kill` variant. |
| `--bs-hit-marker-glyph-scale` | `0.6` | Kill-glyph size as a fraction of `--bs-hit-marker-size`. |
| `--bs-hit-marker-z-index` | `var(--tc-z-tooltip, 1070)` | Stack order when positioned as an overlay. |

Honours `prefers-reduced-motion`: the scale transform is dropped while the opacity fade (the state-conveying part) is kept.

```html
<!-- Plain hit confirmation -->
<tc-hit-marker show></tc-hit-marker>

<!-- Critical hit -->
<tc-hit-marker show crit></tc-hit-marker>

<!-- Kill (danger strokes + Skull glyph) -->
<tc-hit-marker show kill></tc-hit-marker>

<!-- Custom size + lifetime, recycle on completion -->
<tc-hit-marker id="hm" size="48" duration="500"></tc-hit-marker>
<script>
  const el = document.getElementById('hm')
  el.addEventListener('tc-done', () => el.remove())
  el.show = true // arm the marker
</script>
```

---