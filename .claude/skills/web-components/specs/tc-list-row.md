---
component: tc-list-row
---

### tc-list-row

Single selectable list row (leading media, label, trailing value/action). Styled to the toolcase design system. The host is the interactive element: `role="option"`, `tabindex="0"`, `aria-selected`, `aria-disabled`. Activate via click, Enter, or Space — fires `tc-select`. Accent colour is overridable per-row via the `accent` attribute. Light DOM; all content is author-supplied children using the helper classes below.

**Tag:** `tc-list-row`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected` | boolean | absent | Marks the row as selected. Adds `.tc-list-row--selected`, sets `aria-selected="true"`, and applies a 3px left accent border. |
| `disabled` | boolean | absent | Disables interaction. Adds `.tc-list-row--disabled`, sets `aria-disabled="true"` and `tabindex="-1"`. `tc-select` is suppressed. |
| `accent` | string | (token) | Any CSS colour value (e.g. `"var(--tc-success)"`, `"#a855f7"`). Overrides `--bs-list-row-accent` on the host so the selected-state border and label colour use this value instead of the default ink accent. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selected` | `boolean` | `false` | Reflects the `selected` attribute. |
| `disabled` | `boolean` | `false` | Reflects the `disabled` attribute. |
| `accent` | `string` | `''` | Reflects the `accent` attribute. |
| `onSelect` | `(() => void) \| null` | `null` | Optional callback fired alongside the `tc-select` CustomEvent. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{}` | Bubbles and is composed. Fired when a non-disabled row is activated by click, Enter, or Space. |

**Slots**

`tc-list-row` has no named slots. Author children directly inside the host. Use the helper classes below to achieve consistent layout:

| Class | Element | Description |
|-------|---------|-------------|
| `.tc-list-row-media` | any inline | Leading icon / avatar. `flex-shrink: 0`; inherits accent colour when selected. |
| `.tc-list-row-label` | `<span>` | Primary text. `flex: 1`; truncates with ellipsis. Inherits accent colour when selected. |
| `.tc-list-row-meta` | `<span>` | Trailing value in JetBrains Mono. `flex-shrink: 0`. |
| `.tc-list-row-body` | `<span>` | Optional stacking wrapper for label + sub-label (`flex-direction: column`). |

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-list-row-bg` | `var(--tc-surface)` | Row background colour. |
| `--bs-list-row-border-color` | `var(--tc-border)` | 1px hairline bottom border between rows. |
| `--bs-list-row-padding-y` | `0.625rem` | Vertical padding. |
| `--bs-list-row-padding-x` | `0.875rem` | Horizontal padding. |
| `--bs-list-row-gap` | `0.625rem` | Gap between child regions. |
| `--bs-list-row-min-height` | `2.75rem` | Minimum row height (44px under coarse pointer). |
| `--bs-list-row-accent` | `var(--tc-app-accent)` | Accent colour for the selected state. Overridden inline when `accent` is set. |
| `--bs-list-row-label-color` | `var(--tc-text)` | Label text colour. |
| `--bs-list-row-label-font-size` | `0.9375rem` | Label font size. |
| `--bs-list-row-meta-color` | `var(--tc-text-faint)` | Meta text colour. |
| `--bs-list-row-meta-font-size` | `0.8125rem` | Meta font size. |
| `--bs-list-row-meta-font-family` | `var(--tc-font-mono)` | Meta font family (JetBrains Mono). |
| `--bs-list-row-selected-bg` | `var(--tc-surface-muted)` | Background when selected. |
| `--bs-list-row-disabled-opacity` | `0.45` | Opacity applied to disabled rows. |
| `--bs-list-row-focus-outline` | `2px solid var(--bs-list-row-accent)` | Focus-visible outline. |

**Example**

```html
<div style="border: 1px solid var(--tc-border)">
    <tc-list-row id="row-inbox">
        <span class="tc-list-row-media">📥</span>
        <span class="tc-list-row-label">Inbox</span>
        <span class="tc-list-row-meta">12</span>
    </tc-list-row>

    <tc-list-row id="row-sent" selected>
        <span class="tc-list-row-media">📤</span>
        <span class="tc-list-row-label">Sent</span>
        <span class="tc-list-row-meta">4</span>
    </tc-list-row>

    <tc-list-row id="row-trash" disabled>
        <span class="tc-list-row-media">🗑️</span>
        <span class="tc-list-row-label">Trash</span>
        <span class="tc-list-row-meta">0</span>
    </tc-list-row>
</div>

<script>
    document.querySelectorAll('tc-list-row').forEach(row => {
        row.addEventListener('tc-select', () => {
            document.querySelectorAll('tc-list-row').forEach(r => r.removeAttribute('selected'))
            row.setAttribute('selected', '')
        })
    })
</script>
```

---