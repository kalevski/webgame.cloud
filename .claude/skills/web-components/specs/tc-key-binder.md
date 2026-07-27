---
component: tc-key-binder
---

### tc-key-binder

Click (or press Enter / Space) to enter capture mode; the next key press commits a new binding. Pressing Escape cancels. Emits `tc-change` with `{ value, code, key }` when a key is bound; emits `tc-cancel` when capture is cancelled. The bound key label renders in JetBrains Mono. Styled to the toolcase design system — flat slate surface, sharp hairline border.

**Tag:** `tc-key-binder`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | `''` | The currently bound key label (e.g. `"W"`, `"Space"`, `"ArrowUp"`). Set to `""` or remove to clear. |
| `placeholder` | string | `'Click to bind'` | Text shown when no value is set and the element is not in capture mode. |
| `disabled` | boolean | `false` | When present, disables click and keyboard activation. |
| `capturing` | boolean (reflected, read-only) | — | Present on the host element while capture mode is active. Set by the component; do not write. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string` | Reflects the `value` attribute. Get/set the bound key label. |
| `placeholder` | `string` | Reflects the `placeholder` attribute. Defaults to `'Click to bind'`. |
| `disabled` | `boolean` | Reflects the `disabled` attribute. |
| `capturing` | `boolean` (read-only) | `true` while capture mode is active, `false` otherwise. |
| `onChange` | `((detail: { value: string; code: string; key: string }) => void) \| null` | Optional callback fired alongside `tc-change`. |
| `onCancel` | `(() => void) \| null` | Optional callback fired alongside `tc-cancel`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string; code: string; key: string }` | Fired when a key is captured. `value` is the display label (single characters are uppercased); `code` is the physical key code (e.g. `"KeyW"`); `key` is the raw `KeyboardEvent.key` value. |
| `tc-cancel` | — | Fired when capture mode is cancelled (Escape pressed or element loses focus while capturing). |

**Slots**

None. The element renders its own label from the `value` / `placeholder` attributes.

**CSS custom properties** (cosmetics flow through `--bs-key-binder-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-key-binder-bg` | `var(--tc-surface)` | Default surface background |
| `--bs-key-binder-border-color` | `var(--tc-border-strong)` | Default hairline border color |
| `--bs-key-binder-color` | `var(--tc-text)` | Default text color |
| `--bs-key-binder-font-size` | `0.8125rem` | Label font size |
| `--bs-key-binder-font-weight` | `600` | Label font weight |
| `--bs-key-binder-padding-x` | `0.875rem` | Horizontal padding |
| `--bs-key-binder-padding-y` | `0.5rem` | Vertical padding |
| `--bs-key-binder-min-width` | `3.5rem` | Minimum tile width |
| `--bs-key-binder-hover-bg` | `var(--tc-surface-muted)` | Background on hover |
| `--bs-key-binder-hover-border-color` | `var(--tc-app-accent)` | Border color on hover |
| `--bs-key-binder-capturing-bg` | `var(--tc-app-accent)` | Accent fill while capturing |
| `--bs-key-binder-capturing-border-color` | `var(--tc-app-accent)` | Border color while capturing |
| `--bs-key-binder-capturing-color` | `#fff` | Text color while capturing |
| `--bs-key-binder-empty-color` | `var(--tc-text-faint)` | Placeholder text color when no value is set |
| `--bs-key-binder-empty-border-color` | `var(--tc-border)` | Dashed border color when no value is set |
| `--bs-key-binder-disabled-bg` | `var(--tc-surface-muted)` | Surface background when disabled |
| `--bs-key-binder-disabled-border-color` | `var(--tc-border)` | Border color when disabled |
| `--bs-key-binder-disabled-color` | `var(--tc-text-faint)` | Text color when disabled |
| `--bs-key-binder-disabled-opacity` | `0.6` | Overall opacity when disabled |

**Example**

```html
<tc-key-binder id="jump-key" value="Space"></tc-key-binder>
<script>
  const el = document.getElementById('jump-key')
  el.addEventListener('tc-change', (e) => {
    console.log('new binding:', e.detail.value, e.detail.code)
    // e.g. "W" / "KeyW"
  })
  el.addEventListener('tc-cancel', () => console.log('capture cancelled'))
</script>
```

---