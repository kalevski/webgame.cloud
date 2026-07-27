---
component: tc-version-picker
---

### tc-version-picker

Version selector rendered as a segmented button group or a native-style dropdown. Each version may be annotated `latest`, `lts`, or `deprecated`.

**Tag:** `tc-version-picker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | — | Currently selected version value (reflected). Falls back to the first version when unset/unmatched. |
| `name` | string | — | Form field name. The dropdown sets it on the native `<select>`; the segmented variant adds a hidden `<input>` so the value posts in native `<form>` submits. |
| `variant` | `'segmented' \| 'dropdown'` | `segmented` | Render style. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `versions` | `VersionOption[]` | Array of version objects (set via JS, not attribute). Setting it re-renders. |
| `value` | `string` | Reflects the `value` attribute. |
| `name` | `string \| null` | Reflects the `name` attribute. |
| `variant` | `'segmented' \| 'dropdown'` | Reflects the `variant` attribute. |
| `onChange` | `((value: string) => void) \| null` | Optional callback invoked with the new value on selection. |

Each `VersionOption`:

```ts
{ label: string; value: string; latest?: boolean; lts?: boolean; deprecated?: boolean }
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired when the selected version changes (click, arrow-key navigation, or dropdown change). Bubbles + composed. |

**Slots:** none

**Keyboard behaviour (segmented):** the group is a `role="group"` of toggle buttons with roving `tabindex`. Arrow Left/Up → previous version (wrapping); Arrow Right/Down → next version (wrapping); Home/End → first/last. The dropdown variant uses a native `<select>`.

```html
<tc-version-picker id="ver" variant="segmented" name="version"></tc-version-picker>
<script>
  const el = document.getElementById('ver')
  el.versions = [
    { label: 'v3.2', value: '3.2', latest: true },
    { label: 'v3.1', value: '3.1' },
    { label: 'v2.8', value: '2.8', lts: true },
    { label: 'v1.4', value: '1.4', deprecated: true },
  ]
  el.value = '3.2'
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---