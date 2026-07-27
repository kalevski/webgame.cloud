---
component: tc-credits-scroll
---

### tc-credits-scroll

**Tag:** `tc-credits-scroll`

Auto-scrolling end-credits sequence. The credit sections scroll upward at a configurable speed; click or press Space/Enter to pause and play. Fires `tc-complete` when the track has fully passed the viewport. The whole element is a `role="button"` toggle (`aria-pressed` reflects the paused state). Under `prefers-reduced-motion` the auto-scroll is disabled and the viewport becomes a static, scrollable region instead.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `speed` | number | `30` | Scroll speed in pixels per second. Non-positive or non-finite values fall back to `30`. |
| `scroll-title` | string | `''` (none) | Optional title rendered at the top of the credits track. Omit the attribute to render no title. |
| `role` | string | `'button'` | Set automatically on connect if absent. |
| `tabindex` | string | `'0'` | Set automatically on connect if absent, so the toggle is keyboard-focusable. |
| `aria-label` | string | `'Credits — Space or Enter to pause or play'` | Set automatically on connect if absent. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sections` | `CreditsScrollSection[]` | `[]` | Array of credit sections (set via JS, not an attribute). Setting it resets the scroll offset, re-renders, and restarts the loop. |
| `speed` | number | `30` | Reflected from the `speed` attribute. |
| `scrollTitle` | string | `''` | Reflected from the `scroll-title` attribute. |
| `playing` | boolean | `true` | Read-only — whether the credits are currently scrolling. |
| `onComplete` | `(() => void) \| null` | `null` | Optional callback fired alongside the `tc-complete` event. |

Each `CreditsScrollSection`:

| Field | Type | Description |
|-------|------|-------------|
| `role` | string | Section heading (e.g. `"Engineering"`), rendered as a mono uppercase micro-label. |
| `names` | `string[]` | Names listed under the role, each on its own line. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-complete` | `{}` | Fired once when the credits track has fully scrolled past the viewport. The element pauses itself afterwards. Bubbles and is composed. |

**Slots**

None — content is generated from the `sections` property and `scroll-title` attribute.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-credits-scroll-bg` | `var(--tc-surface)` | Background of the credits surface. |
| `--bs-credits-scroll-border` | `var(--tc-border)` | Colour of the 1px hairline frame. |
| `--bs-credits-scroll-min-height` | `20rem` | Minimum height of the element (it also fills a sized parent). |
| `--bs-credits-scroll-track-padding-x` | `1.5rem` | Inline padding of the scrolling track. |
| `--bs-credits-scroll-track-padding-y` | `2.5rem` | Block padding of the scrolling track. |
| `--bs-credits-scroll-section-gap` | `2rem` | Vertical gap between credit sections. |
| `--bs-credits-scroll-title-color` | `var(--tc-text)` | Title text colour. |
| `--bs-credits-scroll-title-font-size` | `1.25rem` | Title font size. |
| `--bs-credits-scroll-title-font-weight` | `600` | Title font weight. |
| `--bs-credits-scroll-title-gap` | `2.25rem` | Space below the title. |
| `--bs-credits-scroll-role-color` | `var(--tc-text-muted)` | Role micro-label colour. |
| `--bs-credits-scroll-role-font-size` | `0.6875rem` | Role micro-label font size. |
| `--bs-credits-scroll-role-letter-spacing` | `0.12em` | Role micro-label letter-spacing. |
| `--bs-credits-scroll-name-color` | `var(--tc-text)` | Name text colour. |
| `--bs-credits-scroll-name-font-size` | `0.9375rem` | Name text font size. |
| `--bs-credits-scroll-name-gap` | `0.25rem` | Vertical gap between names within a section. |
| `--bs-credits-scroll-indicator-bg` | `var(--tc-surface)` | Background of the pause indicator badge. |
| `--bs-credits-scroll-indicator-border` | `var(--tc-border-strong)` | Border of the pause indicator badge. |
| `--bs-credits-scroll-indicator-color` | `var(--tc-text-muted)` | Pause icon colour. |
| `--bs-credits-scroll-indicator-size` | `1.75rem` | Pause indicator badge size. |
| `--bs-credits-scroll-indicator-offset` | `0.625rem` | Inset of the pause indicator from the top-right corner. |

**Example**

```html
<div style="height: 320px; max-width: 480px;">
  <tc-credits-scroll id="credits" speed="40" scroll-title="Toolcase Studio"></tc-credits-scroll>
</div>

<script>
  const el = document.getElementById('credits')
  el.sections = [
    { role: 'Direction', names: ['Aldric Vane', 'Brina Storm'] },
    { role: 'Engineering', names: ['Caelum Brook', 'Dorin Hale'] },
    { role: 'Special Thanks', names: ['Ironwood Studio'] },
  ]
  el.addEventListener('tc-complete', () => console.log('Credits finished!'))
</script>
```

---