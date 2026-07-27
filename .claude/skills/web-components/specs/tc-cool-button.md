---
component: tc-cool-button
---

### tc-cool-button

Grouped button with variants, sizes, loading state, and an optional addon region separated by a 1px internal divider. The addon sits in its own muted fill segment on either side of the label. Dispatches a `tc-click` event on activation.

**Tag:** `tc-cool-button`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info'` | `'primary'` | Visual color variant. Maps to Bootstrap `.btn-{variant}` (or `.btn-outline-{variant}` when `outline` is set). |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | Button size. Maps to `btn-sm` / (none) / `btn-lg`. |
| `outline` | boolean | `false` | Renders as an outline variant instead of a filled solid. |
| `loading` | boolean | `false` | Shows a spinner and disables the button. |
| `disabled` | boolean | `false` | Disables the button. |
| `label` | string | — | Text label for the button. Used when no default slot children are present. |
| `addon` | string | — | Text content for the addon region. Used when no `slot="addon"` children are present. |
| `addon-position` | `'left' \| 'right'` | `'right'` | Which side the addon sits on. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `variant` | `CoolButtonVariant` | Reflects the `variant` attribute. |
| `size` | `CoolButtonSize` | Reflects the `size` attribute. |
| `outline` | `boolean` | Reflects the `outline` attribute. |
| `loading` | `boolean` | Reflects the `loading` attribute. |
| `disabled` | `boolean` | Reflects the `disabled` attribute. |
| `label` | `string \| null` | Reflects the `label` attribute. |
| `addon` | `string \| null` | Reflects the `addon` attribute. |
| `addonPosition` | `CoolButtonAddonPosition` | Reflects the `addon-position` attribute. |
| `onClick` | `(() => void) \| null` | Optional callback fired on activation (alongside the `tc-click` event). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-click` | `{}` | Fired when the button is activated (clicked). Not fired when `disabled` or `loading`. Bubbles and composed. |

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Main button label content. Preserved across re-renders inside `.tc-cool-button-content`. Takes precedence over the `label` attribute. |
| `addon` | Content for the addon region. Preserved across re-renders inside `.tc-cool-button-addon`. Takes precedence over the `addon` attribute. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-cool-button-divider-color` | `rgba(255,255,255,0.28)` for solid; `var(--tc-border-strong)` for outline | Color of the 1px internal separator. |
| `--bs-cool-button-addon-bg` | `var(--tc-surface-muted)` | Addon region background fill. |
| `--bs-cool-button-addon-color` | `var(--tc-text)` | Addon region text color. |

```html
<!-- label attribute -->
<tc-cool-button variant="primary" label="Deploy"></tc-cool-button>

<!-- addon on the right (default) -->
<tc-cool-button variant="primary" label="Deploy" addon="▶"></tc-cool-button>

<!-- addon on the left -->
<tc-cool-button variant="primary" label="Download" addon="↓" addon-position="left"></tc-cool-button>

<!-- outline + loading -->
<tc-cool-button variant="success" outline loading label="Saving…"></tc-cool-button>

<!-- slot children + addon slot -->
<tc-cool-button variant="primary">
    Publish
    <span slot="addon" style="font-size:0.75rem;font-weight:700">v2</span>
</tc-cool-button>

<!-- tc-click event -->
<tc-cool-button id="btn1" variant="primary" label="Save"></tc-cool-button>
<script>
    document.getElementById('btn1').addEventListener('tc-click', () => console.log('saved'))
</script>
```

---