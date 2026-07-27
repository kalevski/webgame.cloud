---
component: tc-loot-popup
---

### tc-loot-popup

Modal loot window with Take All / Discard and optional auto-fade timer. Styled to the slate design system (sharp corners, 1px hairline, overlay-tier shadow). Controlled component — fires `tc-close`; the consumer sets `open` to `false` to actually dismiss. Focus trap, scroll lock, and keyboard (`Escape`) handling included. No shadow root; light DOM; `display: block`.

**Tag:** `tc-loot-popup`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Visible state — add/remove to show/hide the popup |
| `popup-title` | string | `"Loot"` | Panel heading text |
| `eyebrow` | string | `""` | Mono uppercase micro-label shown above the title; omit or set empty to hide |
| `discard-label` | string | `"Discard"` | Label for the Discard button |
| `auto-fade-ms` | number | `0` | When > 0, automatically fires `tc-close` after this many milliseconds; reset on each `tc-take` |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | boolean | false | Reflects the `open` attribute |
| `popupTitle` | string | `"Loot"` | Reflects `popup-title` |
| `eyebrow` | string | `""` | Reflects `eyebrow` |
| `discardLabel` | string | `"Discard"` | Reflects `discard-label` |
| `autoFadeMs` | number | `0` | Reflects `auto-fade-ms`; set to 0 or non-finite to disable |
| `items` | `LootEntry[]` | `[]` | Loot entries forwarded to the inner `tc-loot-list`; setting re-renders and resets the auto-fade timer |
| `onTake` | `((id: string) => void) \| null` | `null` | Callback fired alongside `tc-take` |
| `onTakeAll` | `(() => void) \| null` | `null` | Callback fired alongside `tc-take-all` |
| `onDiscard` | `(() => void) \| null` | `null` | Callback fired alongside `tc-discard` |
| `onClose` | `(() => void) \| null` | `null` | Callback fired alongside `tc-close` |

**`LootEntry` / `LootItem` shapes** — same as `tc-loot-list` (see above).

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-take` | `{ id: string }` | Fired when the Take button for an individual item is clicked. Host does **not** self-close. |
| `tc-take-all` | `{}` | Fired when the Take All button (panel actions area or list header) is clicked. Host does **not** self-close. |
| `tc-discard` | `{}` | Fired when the Discard button is clicked. Host does **not** self-close. |
| `tc-close` | `{}` | Fired on Escape key, backdrop click, or auto-fade expiry. Host does **not** self-close — set `open=false` in the handler. |

**Slots:** None — content is supplied through attributes and the `items` JS property.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-loot-popup-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-loot-popup-border-color` | `var(--tc-border)` | Panel border colour. |
| `--bs-loot-popup-shadow` | `var(--tc-shadow-lg)` | Panel box-shadow (overlay tier). |
| `--bs-loot-popup-width` | `420px` | Default panel width. |
| `--bs-loot-popup-max-width` | `calc(100vw - 2rem)` | Maximum panel width (viewport responsive). |
| `--bs-loot-popup-max-height` | `calc(100vh - 4rem)` | Maximum panel height. |
| `--bs-loot-popup-padding` | `1.25rem` | Header and actions horizontal/vertical padding. |
| `--bs-loot-popup-gap` | `0.75rem` | Gap between action buttons. |
| `--bs-loot-popup-eyebrow-color` | `var(--tc-text-muted)` | Eyebrow micro-label colour. |
| `--bs-loot-popup-eyebrow-size` | `0.6875rem` | Eyebrow font size. |
| `--bs-loot-popup-title-color` | `var(--tc-text)` | Heading colour. |
| `--bs-loot-popup-title-size` | `1rem` | Heading font size. |
| `--bs-loot-popup-z-backdrop` | `var(--tc-z-modal-backdrop)` | Backdrop z-index. |
| `--bs-loot-popup-z-panel` | `var(--tc-z-modal)` | Panel z-index. |
| `--bs-loot-popup-backdrop-bg` | `#0f172a` | Backdrop scrim colour. |
| `--bs-loot-popup-backdrop-opacity` | `0.5` | Backdrop opacity (open state). |
| `--bs-loot-popup-btn-font-size` | `0.8125rem` | Action button font size. |
| `--bs-loot-popup-btn-min-height` | `2.25rem` | Action button minimum height (44 px under coarse pointer). |
| `--bs-loot-popup-btn-bg` | `var(--tc-surface)` | Discard button background. |
| `--bs-loot-popup-btn-color` | `var(--tc-text)` | Discard button text colour. |
| `--bs-loot-popup-btn-border` | `1px solid var(--tc-border-strong)` | Discard button border. |
| `--bs-loot-popup-btn-hover-bg` | `var(--tc-surface-muted)` | Discard button hover background. |
| `--bs-loot-popup-btn-primary-bg` | `var(--tc-app-accent)` | Take All button background (ink). |
| `--bs-loot-popup-btn-primary-color` | `#fff` | Take All button text colour. |
| `--bs-loot-popup-btn-primary-hover-bg` | `var(--tc-ink, #0f172a)` | Take All button hover background. |

```html
<button onclick="document.querySelector('#my-popup').setAttribute('open','')">Open loot</button>

<tc-loot-popup
    id="my-popup"
    popup-title="Chest Rewards"
    eyebrow="Acquired"
></tc-loot-popup>

<script>
    const popup = document.querySelector('#my-popup')

    popup.items = [
        { item: { id: 'gold', name: 'Gold Coin', icon: '◎', rarity: 'common', qty: 5 } },
        { item: { id: 'staff', name: 'Frost Staff', icon: '✦', rarity: 'rare' }, qty: 2 },
    ]

    popup.addEventListener('tc-take',     e => console.log('take:', e.detail.id))
    popup.addEventListener('tc-take-all', () => console.log('take all'))
    popup.addEventListener('tc-discard',  () => popup.removeAttribute('open'))
    popup.addEventListener('tc-close',    () => popup.removeAttribute('open'))
</script>
```

---