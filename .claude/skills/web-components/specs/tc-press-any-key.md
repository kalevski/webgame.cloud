---
component: tc-press-any-key
---

### tc-press-any-key

"Press any key to continue" prompt. Renders a pulsing mono text label that fires `tc-continue` on any non-modifier keydown (document-level) or mousedown on the element. Styled to the toolcase design system (JetBrains Mono, slate muted text, sharp corners, opacity-pulse animation). No shadow root; light DOM; `display: block`.

**Tag:** `tc-press-any-key`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | `'Press Any Key'` | Text label displayed in the prompt |
| `disabled` | boolean | `false` | When present, suppresses event dispatch, freezes the pulse animation, and reduces opacity to 40% |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `text` | string | Mirrors the `text` attribute |
| `disabled` | boolean | Mirrors the `disabled` boolean attribute |
| `onContinue` | `((e: CustomEvent<void>) => void) \| null` | Optional callback invoked synchronously alongside the `tc-continue` event |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-continue` | `void` | Dispatched when any non-modifier key is pressed (document-level) or the element receives a `mousedown`. Ignored when `disabled`. |

**Slots:** none — content is fully driven by the `text` attribute.

**Custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-press-any-key-color` | `var(--tc-text-muted)` | Text color at rest |
| `--bs-press-any-key-color-hover` | `var(--tc-text)` | Text color on hover |
| `--bs-press-any-key-font-size` | `0.8125rem` | Font size (13 px — mono micro-label tier) |
| `--bs-press-any-key-font-weight` | `500` | Font weight |
| `--bs-press-any-key-letter-spacing` | `0.08em` | Letter-spacing for the uppercase mono label |
| `--bs-press-any-key-padding-y` | `0.375rem` | Vertical padding on the inner text span |
| `--bs-press-any-key-padding-x` | `0.75rem` | Horizontal padding on the inner text span |
| `--bs-press-any-key-pulse-duration` | `1.8s` | Duration of the opacity-pulse animation cycle |
| `--bs-press-any-key-cursor` | `pointer` | Cursor style |

```html
<!-- Default -->
<tc-press-any-key></tc-press-any-key>

<!-- Custom text -->
<tc-press-any-key text="Press Space to Continue"></tc-press-any-key>

<!-- Disabled (animation frozen, event suppressed) -->
<tc-press-any-key disabled="" text="Press Any Key"></tc-press-any-key>

<!-- Listen for tc-continue -->
<tc-press-any-key id="prompt"></tc-press-any-key>
<script>
  document.getElementById('prompt').addEventListener('tc-continue', () => {
    console.log('continuing…')
  })
</script>

<!-- Custom theme — cyan accent, faster pulse -->
<tc-press-any-key
  style="
    --bs-press-any-key-color: var(--tc-accent);
    --bs-press-any-key-color-hover: #fff;
    --bs-press-any-key-pulse-duration: 1.2s;
  "
></tc-press-any-key>
```

---