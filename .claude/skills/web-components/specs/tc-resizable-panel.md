---
component: tc-resizable-panel
---

### tc-resizable-panel

Two-pane layout with a draggable divider, localStorage persistence, and keyboard resizing. The **first two element children** become pane A and pane B. Drag the divider to resize, focus it and use the arrow keys to nudge the split, `Home`/`End` to jump to the min/max, or double-click to reset to `defaultSizes`. Sizes are percentages summing to 100; the host should be given an explicit size by its container.

**Tag:** `tc-resizable-panel`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `direction` | `horizontal\|vertical` | `horizontal` | `horizontal` = side-by-side panes with a vertical divider; `vertical` = stacked panes with a horizontal divider. |
| `min-size` | number | `10` | Minimum size of either pane, as a percentage (clamped to `0–49`). Neither pane can be dragged below this. |
| `storage-key` | string | — | When set, the current split is persisted to `localStorage[storage-key]` (as a `[a, b]` JSON tuple) on every settled change and restored on load. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `defaultSizes` | `[number, number]` | The initial `[a, b]` split (percentages, default `[50, 50]`). Used when there is no persisted value, and as the double-click reset target. |
| `sizes` | `[number, number]` | Get or set the current `[a, b]` split. Setting clamps to `min-size` and patches the panes without a full re-render. |
| `onResize` | `((sizes: [number, number]) => void) \| null` | Optional callback fired when the divider settles (drag end, keyboard, double-click). Mirrors the `tc-resize` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-resize` | `{ sizes: [number, number] }` | Fired when the divider settles after a drag, keyboard nudge, or double-click reset. |

**Slots**

The default slot's **first two element children** are placed into pane A and pane B respectively. Any further children are ignored.

**Accessibility**

The divider is `role="separator"` with `aria-orientation` (matching `direction`), `tabindex="0"`, and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` reflecting pane A's percentage. Focus is always visible; reduced motion is honoured.

```html
<tc-resizable-panel direction="horizontal" min-size="15" storage-key="editor-split">
    <div>Pane A — first child</div>
    <div>Pane B — second child</div>
</tc-resizable-panel>
<script>
  const el = document.querySelector('tc-resizable-panel')
  el.defaultSizes = [60, 40]
  el.addEventListener('tc-resize', e => console.log(e.detail.sizes))
</script>
```

---