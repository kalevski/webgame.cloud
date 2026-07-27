---
component: tc-entity-cell
---

### tc-entity-cell

Entity card showing a sharp initials tile, a primary name, and an optional sublabel. Tile colour can be tinted per entity for identity purposes. Supports an optional click handler that dispatches `tc-click`.

**Tag:** `tc-entity-cell`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `""` | Primary label — the entity's display name. Also used as the accessible label on the inner container when clickable. |
| `initial` | string | `""` | Short string (1–2 characters) shown inside the initials tile. |
| `sub-label` | string | — | Optional secondary line rendered below the name in mono micro-text. When absent, the sublabel row is omitted. |
| `color` | `'slate' \| 'blue' \| 'green' \| 'red' \| 'yellow' \| 'purple' \| 'orange'` | `'slate'` | Tile tint colour. Maps to a soft background + dark emphasis text from the design palette. Unknown values fall back to `'slate'`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Scales the initials tile and name typography. Unknown values fall back to `'md'`. |
| `clickable` | boolean | `false` | When present, renders the inner container as a `<button>` with hover/active/focus-visible states and dispatches `tc-click` on activation. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Reflects the `name` attribute. |
| `initial` | `string` | Reflects the `initial` attribute. |
| `subLabel` | `string \| null` | Reflects the `sub-label` attribute. |
| `color` | `EntityCellColor` | Reflects the `color` attribute (validated, falls back to `'slate'`). |
| `size` | `EntityCellSize` | Reflects the `size` attribute (validated, falls back to `'md'`). |
| `clickable` | `boolean` | Reflects the `clickable` boolean attribute. |
| `onClick` | `(() => void) \| null` | Optional callback fired alongside `tc-click`. Setting it makes the cell interactive even without the `clickable` attribute. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-click` | `{ name: string \| null }` | Fired on click (or Enter/Space via the inner `<button>`) when the cell is interactive. Bubbles and composed. |

**Slots**

None. All content is driven by attributes.

**Accessibility**

- When clickable, the inner element is a `<button type="button">` — Enter and Space activate it natively.
- `aria-label` on the button is set to the `name` attribute value.
- The initials tile carries `aria-hidden="true"` — it is decorative; the name is the readable label.
- Focus is visible via a 2px `--tc-app-accent` outline (`:focus-visible`).
- Coarse-pointer touch target is `min-height: 44px` when interactive.
- `prefers-reduced-motion` retains state transitions (background, border, color) but does not add transform animations.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-entity-cell-bg` | `var(--tc-surface)` | Cell background. |
| `--bs-entity-cell-border-color` | `var(--tc-border)` | 1px hairline border colour. |
| `--bs-entity-cell-hover-bg` | `var(--tc-surface-muted)` | Background on hover (interactive only). |
| `--bs-entity-cell-gap` | `0.625rem` | Gap between tile and text column. |
| `--bs-entity-cell-padding-y` | `0.5rem` | Vertical padding of the cell. |
| `--bs-entity-cell-padding-x` | `0.75rem` | Horizontal padding of the cell. |
| `--bs-entity-cell-name-color` | `var(--tc-text)` | Primary name text colour. |
| `--bs-entity-cell-sublabel-color` | `var(--tc-text-muted)` | Sublabel text colour. |
| `--bs-entity-cell-sublabel-font-size` | `0.75rem` | Sublabel font size. |
| `--bs-entity-cell-tile-size-sm` | `1.5rem` | Tile width and height at `sm`. |
| `--bs-entity-cell-tile-size-md` | `2rem` | Tile width and height at `md`. |
| `--bs-entity-cell-tile-size-lg` | `2.5rem` | Tile width and height at `lg`. |
| `--bs-entity-cell-name-font-size-sm` | `0.8125rem` | Name font size at `sm`. |
| `--bs-entity-cell-name-font-size-md` | `0.9375rem` | Name font size at `md`. |
| `--bs-entity-cell-name-font-size-lg` | `1.0625rem` | Name font size at `lg`. |

```html
<!-- Basic entity, default slate tile -->
<tc-entity-cell initial="AJ" name="Alice Johnson" color="slate"></tc-entity-cell>

<!-- With sublabel and blue tile -->
<tc-entity-cell initial="BK" name="Bob Karlsson" sub-label="bob@example.com" color="blue"></tc-entity-cell>

<!-- Large size, green tile -->
<tc-entity-cell initial="CA" name="Cara Andrade" color="green" size="lg"></tc-entity-cell>

<!-- Clickable — dispatches tc-click -->
<tc-entity-cell id="ec1" initial="AJ" name="Alice Johnson" color="blue" clickable></tc-entity-cell>
<script>
    document.getElementById('ec1').addEventListener('tc-click', e => {
        console.log('clicked', e.detail.name)
    })
</script>

<!-- onClick callback property -->
<tc-entity-cell id="ec2" initial="FP" name="Finn Petrov" color="purple"></tc-entity-cell>
<script>
    document.getElementById('ec2').onClick = () => console.log('entity selected')
</script>
```

---