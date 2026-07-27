---
component: tc-skill-bar
---

### tc-skill-bar

A horizontal toolbar of ability-card slots. Each slot is composed from `tc-ability-card` and driven entirely by the `slots` JS property. Clicking or pressing Enter/Space on a slot fires `tc-activate`. Styled to the toolcase design system — flat slate surface, sharp corners, hairline borders.

**Tag:** `tc-skill-bar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `slot-size` | number (px) | `180` | Minimum width of each slot (in pixels). |
| `gap` | string (CSS length) | `'0.5rem'` | Gap between slots. Accepts any CSS length or custom-property value. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `slots` | `SkillSlot[]` | `[]` | Array of slot descriptors. Setting triggers a re-render. See shape below. |
| `slotSize` | `number` | `180` | Reflects the `slot-size` attribute. |
| `gap` | `string` | `'0.5rem'` | Reflects the `gap` attribute. |
| `onActivate` | `((detail: { id: string }) => void) \| null` | `null` | Callback fired alongside `tc-activate`. |

**`SkillSlot` shape**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier used in the `tc-activate` detail. |
| `name` | `string?` | Display name passed as `ability-name` to `tc-ability-card`. Falls back to `id`. |
| `icon` | `string?` | PascalCase Lucide icon name forwarded to `tc-ability-card`. |
| `hotkey` | `string?` | Hotkey label forwarded as `keybind` to `tc-ability-card`. |
| `cooldown` | `number?` | Total cooldown in seconds (shown as `"Xs"` in the meta row). |
| `remaining` | `number?` | Seconds remaining on cooldown. When `> 0` a muted overlay with a countdown and a progress bar is shown. |
| `charges` | `number?` | Charge count displayed as `"Nx"` in the cost meta row. |
| `disabled` | `boolean?` | Dims the slot and removes it from the tab order. |
| `selected` | `boolean?` | Highlights the slot with the ink accent border. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-activate` | `{ id: string }` | Fired on click or Enter/Space when the slot is not disabled. `id` is the slot's `id` field. |

**Slots**

None. All content is driven by the `slots` JS property.

**Accessibility**

- Host receives `role="toolbar"` and `aria-label="Skill Bar"` automatically (overridable by authors).
- Each slot carries `role="button"`, `aria-pressed` (selected state), `aria-disabled`, `aria-label` (slot name), and `tabindex="0"` or `"-1"` (disabled).
- Visible focus ring via `:focus-visible`.
- `prefers-reduced-motion` freezes the inner ability-card lift while retaining the shadow transition.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-skill-bar-gap` | `0.5rem` | Gap between slots (also driven by the `gap` attribute). |
| `--bs-skill-bar-slot-size` | `180px` | Minimum slot width (also driven by `slot-size`). |
| `--bs-skill-bar-selected-border` | `var(--tc-app-accent)` | Border colour for the selected slot. |
| `--bs-skill-bar-selected-shadow` | `0 0 0 1px var(--tc-app-accent), var(--tc-shadow-sm)` | Box shadow for the selected slot. |
| `--bs-skill-bar-disabled-opacity` | `0.45` | Opacity for disabled slots. |
| `--bs-skill-bar-cd-bg` | `rgba(10, 12, 15, 0.72)` | Background of the cooldown overlay. |
| `--bs-skill-bar-cd-label-color` | `#fff` | Countdown label colour. |
| `--bs-skill-bar-cd-label-size` | `1.25rem` | Countdown label font size. |
| `--bs-skill-bar-cd-bar-color` | `var(--tc-info)` | Cooldown progress bar fill colour. |
| `--bs-skill-bar-cd-bar-height` | `3px` | Cooldown progress bar height. |

```html
<tc-skill-bar id="bar"></tc-skill-bar>

<script>
  const bar = document.querySelector('#bar')
  bar.slots = [
    { id: 'fireball', name: 'Fireball', icon: 'Flame', hotkey: 'Q', cooldown: 8 },
    { id: 'frost-nova', name: 'Frost Nova', icon: 'Snowflake', hotkey: 'W', cooldown: 10, selected: true },
    { id: 'blink', name: 'Blink', icon: 'Zap', hotkey: 'E', cooldown: 15, remaining: 9 },
    { id: 'meteor', name: 'Meteor', icon: 'Sparkles', hotkey: 'R', cooldown: 120, disabled: true },
  ]
  bar.addEventListener('tc-activate', e => console.log('Activated:', e.detail.id))
</script>
```

---