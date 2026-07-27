---
component: tc-lore-text
---

### tc-lore-text

Flavor / lore body-copy block. Slot-based — used for tooltips, loading screens, codex entries, or any italic narrative aside. Styled to the web-components design system: sharp corners, 1px hairline left border, Inter italic prose.

**Tag:** `tc-lore-text`

**Attributes**

None. `tc-lore-text` is purely slot-driven.

**JS Properties**

None. `tc-lore-text` is purely slot-driven.

**Events**

None. `tc-lore-text` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | The lore / flavor text content. Plain text, `<p>` elements, or any inline content. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-lore-text-bg` | `transparent` | Block background. |
| `--bs-lore-text-border-color` | `var(--tc-border)` | Left accent border color. |
| `--bs-lore-text-border-width` | `2px` | Left accent border width. |
| `--bs-lore-text-padding-y` | `0.75rem` | Vertical inner padding. |
| `--bs-lore-text-padding-x` | `1rem` | Horizontal inner padding (applied to the right; the left is offset by the border). |
| `--bs-lore-text-color` | `var(--tc-text-muted)` | Text color. |
| `--bs-lore-text-font-size` | `0.925rem` | Font size. |
| `--bs-lore-text-font-weight` | `400` | Font weight. |
| `--bs-lore-text-font-style` | `italic` | Font style. |
| `--bs-lore-text-line-height` | `1.7` | Line height. |

**Example**

```html
<!-- Short flavor line -->
<tc-lore-text>
    Some swords remember every hand that wielded them.
</tc-lore-text>

<!-- Multi-sentence passage -->
<tc-lore-text>
    The library at Velkhar burned for three nights and still its ashes
    whispered names. Scholars came from distant kingdoms to listen, hoping
    to catch a verse, a date, a forgotten lineage — anything the fire had
    chosen to spare.
</tc-lore-text>

<!-- Custom accent border -->
<tc-lore-text style="--bs-lore-text-border-color: var(--tc-app-accent); --bs-lore-text-color: var(--tc-text);">
    The door had no handle. It had never needed one.
</tc-lore-text>
```

---