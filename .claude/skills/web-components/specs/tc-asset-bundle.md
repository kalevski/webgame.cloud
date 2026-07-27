---
component: tc-asset-bundle
---

### tc-asset-bundle

Asset bundle card showing a target engine, included/excluded tag chips, file-type counts, build references, an action menu (kebab) in the header, and a collapsible **Advanced** packing section. Slate neutrals carry the card; colour is status only — included tags use a `--tc-success` tint and excluded tags a `--tc-danger` tint. Counts and build refs use the mono font. Card motif: white surface, 1px hairline, `--tc-shadow-sm`, faint ink-gradient header cap. Sharp corners throughout.

**Tag:** `tc-asset-bundle`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Display name of the asset bundle. |
| `target` | string | — | Target engine label (e.g. `"unity"`, `"godot"`). Also lower-cased into a `tc-asset-bundle--<target>` modifier class. |
| `target-icon` | string | `Package` | Lucide icon name shown beside the target. Accepts PascalCase (`"Boxes"`) or kebab-case (`"git-branch"`). |
| `category` | string | — | Optional category chip shown in the header. |
| `latest-build-ref` | string | — | Latest build reference (commit hash / build number), rendered in mono. |
| `default-build-tag` | string | — | The default build tag. Becomes a build-tag chip. |
| `build-tag` | string | — | The active build tag. When both `default-build-tag` and `build-tag` differ, the two render as interactive radio chips; clicking one updates `build-tag` and fires `tc-build-tag-change`. |
| `loading` | boolean | `false` | Renders a shimmer skeleton card body and sets `aria-busy` on the host. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `includedTags` | `string[]` | `[]` | Tags included in the bundle. Rendered as positive (success-tinted) chips with a `+` glyph. |
| `excludedTags` | `string[]` | `[]` | Tags excluded from the bundle. Rendered as negative (danger-tinted) chips with a `−` glyph. |
| `counts` | `Record<string, number>` | `{}` | File-type counts. Rendered as a stat row with mono numbers. |
| `advanced` | `AssetBundleAdvancedOptions` | `{}` | Advanced packing options (e.g. `{ compress?, powerOfTwo?, trim?, padding?, algorithm?, ... }`). Rendered inside the collapsible Advanced section: booleans → on/off pill, numbers/strings → mono value. |
| `menuItems` | `ActionItem[]` | `[]` | Header kebab-menu items. Each item: `{ key, label, icon?, disabled?, danger?, divider? }` (`icon` is a lucide name). |
| `onMenuItemClick` | `((key: string) => void) \| null` | `null` | Callback fired when a menu item is selected (alongside `tc-menu-click`). |
| `onAdvancedToggle` | `((open: boolean) => void) \| null` | `null` | Callback fired when the Advanced section is toggled (alongside `tc-advanced-toggle`). |
| `onBuildTagChange` | `((tag: string) => void) \| null` | `null` | Callback fired when the active build tag changes (alongside `tc-build-tag-change`). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-menu-click` | `{ key: string }` | Dispatched when a header menu item is selected. Bubbles, composed. |
| `tc-advanced-toggle` | `{ open: boolean }` | Dispatched when the Advanced section is expanded or collapsed. Bubbles, composed. |
| `tc-build-tag-change` | `{ tag: string }` | Dispatched when the active build tag changes via the interactive chips. Bubbles, composed. |

**Slots**

None. All content is driven by attributes and JS properties.

**Accessibility**

- The Advanced toggle is a real `<button>` with `aria-expanded` and `aria-controls` pointing at the collapsible panel; the panel is `hidden` while collapsed.
- The header menu trigger is a `<button>` with `aria-haspopup="menu"` / `aria-expanded`; the open menu uses `role="menu"` / `role="menuitem"` with roving focus (Arrow keys, Home, End, Enter, Space, Escape) and returns focus to the trigger on close.
- Interactive build-tag chips form a `role="radiogroup"` of `role="radio"` chips with `aria-checked`.
- Included/excluded status is conveyed by an icon glyph (`+` / `−`) in addition to colour.
- `loading` sets `aria-busy="true"` on the host with a visually-hidden `Loading…` status.
- Focus is always visible; `prefers-reduced-motion` freezes the skeleton shimmer and caret rotation.
- Touch targets ≥ 44px under coarse pointers.

**CSS Custom Properties** (subset — all cosmetics flow through `--bs-asset-bundle-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-asset-bundle-bg` | `var(--tc-surface)` | Card background. |
| `--bs-asset-bundle-border-color` | `var(--tc-border)` | Card / hairline border colour. |
| `--bs-asset-bundle-shadow` | `var(--tc-shadow-sm)` | Resting card shadow. |
| `--bs-asset-bundle-tag-included-color` | `var(--tc-success)` | Included-tag chip text/border tint. |
| `--bs-asset-bundle-tag-excluded-color` | `var(--tc-danger)` | Excluded-tag chip text/border tint. |
| `--bs-asset-bundle-count-value-color` | `var(--tc-text)` | Mono count figure colour. |
| `--bs-asset-bundle-control-active-bg` | `var(--tc-app-accent)` | Active build-tag chip / pressed control ink fill. |

```html
<!-- Attribute-only card -->
<tc-asset-bundle
    name="UI Sprites"
    target="unity"
    target-icon="Boxes"
    category="Interface"
    latest-build-ref="a1b3c9f"
    default-build-tag="v2.1-release"
    build-tag="nightly">
</tc-asset-bundle>

<!-- Rich props + events via JS -->
<tc-asset-bundle id="ab1" name="Character Sprites" target="godot" target-icon="Gamepad2"></tc-asset-bundle>
<script>
    const ab = document.getElementById('ab1')
    ab.includedTags = ['hero', 'npc', 'enemy']
    ab.excludedTags = ['wip']
    ab.counts = { textures: 89, animations: 34, sounds: 12 }
    ab.advanced = { compress: true, powerOfTwo: true, trim: false, padding: 2, algorithm: 'maxrects' }
    ab.menuItems = [
        { key: 'build', icon: 'Play', label: 'Build Now' },
        { key: 'export', icon: 'Download', label: 'Export Config' },
        { key: 'd1', label: '', divider: true },
        { key: 'delete', icon: 'Trash2', label: 'Delete', danger: true },
    ]
    ab.addEventListener('tc-menu-click', e => console.log('menu', e.detail.key))
    ab.addEventListener('tc-advanced-toggle', e => console.log('advanced', e.detail.open))
</script>

<!-- Loading -->
<tc-asset-bundle loading></tc-asset-bundle>
```

---