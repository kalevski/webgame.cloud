---
component: tc-asset-row-list
---

### tc-asset-row-list

Bordered container for a sequence of `tc-asset-row` elements. Provides a single 1px `--tc-border` outer frame; inner row separators are owned by each child `tc-asset-row` (hairline border-bottom, removed on `:last-child` to avoid double-borders). Flat white surface — no decorative color or shadow. Non-interactive; dispatches no events.

**Tag:** `tc-asset-row-list`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `class` / `className` | string | — | Extra CSS classes applied directly to the host element (pass-through; not managed by the component) |

**JS Properties**

None.

**Events**

None. `tc-asset-row-list` is a purely presentational container.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | One or more `tc-asset-row` elements. Children survive re-renders and are re-projected into the inner `.tc-asset-row-list-body` |

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-asset-row-list-border-color` | `var(--tc-border)` | Outer frame hairline colour |
| `--bs-asset-row-list-bg` | `var(--tc-surface)` | Background of the list container |

```html
<!-- Basic file list -->
<tc-asset-row-list>
    <tc-asset-row icon="FileText" name="README.md" size="4.2 KB"></tc-asset-row>
    <tc-asset-row icon="Image" name="logo.png" size="18 KB"></tc-asset-row>
    <tc-asset-row icon="FileCode" name="index.ts" size="2.1 KB"></tc-asset-row>
</tc-asset-row-list>

<!-- With tags set via JS property -->
<tc-asset-row-list>
    <tc-asset-row id="pkg1" icon="Package" name="@toolcase/base" size="12 KB"></tc-asset-row>
    <tc-asset-row id="pkg2" icon="Box" name="bundle.min.js" size="48 KB"></tc-asset-row>
</tc-asset-row-list>
<script>
    document.getElementById('pkg1').tags = ['v2.1.0', 'stable']
    document.getElementById('pkg2').tags = ['ts', 'esm', 'minified']
</script>
```

---