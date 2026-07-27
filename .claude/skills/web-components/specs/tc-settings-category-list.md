---
component: tc-settings-category-list
---

### tc-settings-category-list

Settings sidebar panel with a left-side category nav and a right-side slotted content area. Categories are driven by the `categories` JS property; the active category is tracked via `selected-id`; clicking a tab fires `tc-select`. Styled to the slate/ink design system with sharp corners, JetBrains Mono tabs, a 2px ink left-border active indicator, and `--bs-settings-category-list-*` custom properties as the theming contract.

**Tag:** `tc-settings-category-list`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `selected-id` | `string` | `''` | ID of the currently active category; applies the ink left-border and active text color to that tab |

#### JS Properties

| Property | Type | Description |
|---|---|---|
| `categories` | `SettingsCategory[]` | Array of category objects to render in the nav. Setting this re-renders the nav list. |
| `selectedId` | `string` | Reflects the `selected-id` attribute |
| `onSelect` | `((id: string) => void) \| null` | Callback fired alongside `tc-select` when the active category changes |

**`SettingsCategory` shape:**

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique category identifier |
| `label` | `string` | Display label shown in the tab |
| `icon` | `string?` | Lucide icon name (kebab-case, e.g. `"monitor"`) or any text / emoji fallback |

#### Events

| Event | `detail` | Description |
|---|---|---|
| `tc-select` | `{ id: string }` | Fired (bubbles, composed) when a category tab is clicked or activated with Enter/Space |

#### Slots

| Slot | Description |
|---|---|
| *(default)* | Content area rendered in the right-hand panel. Replace or swap children externally to show the settings for the selected category. |

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-settings-category-list-nav-width` | `200px` | Width of the left-side category nav column |
| `--bs-settings-category-list-nav-bg` | `transparent` | Nav column background |
| `--bs-settings-category-list-nav-border-color` | `var(--tc-border)` | 1px hairline separating nav from body |
| `--bs-settings-category-list-item-color` | `var(--tc-text-muted)` | Default tab text color |
| `--bs-settings-category-list-item-hover-color` | `var(--tc-text)` | Tab text color on hover |
| `--bs-settings-category-list-item-hover-bg` | `var(--tc-surface-muted)` | Tab background on hover |
| `--bs-settings-category-list-item-font-size` | `13px` | Tab label font size |
| `--bs-settings-category-list-item-letter-spacing` | `0.06em` | Tab label letter-spacing |
| `--bs-settings-category-list-item-active-color` | `var(--tc-app-accent)` | Active tab text color |
| `--bs-settings-category-list-item-active-bg` | `var(--tc-surface-muted)` | Active tab background |
| `--bs-settings-category-list-item-active-border-color` | `var(--tc-app-accent)` | Active tab left-border accent color |
| `--bs-settings-category-list-icon-size` | `14px` | Icon width and height |
| `--bs-settings-category-list-icon-color` | `var(--tc-text-faint)` | Default icon color |
| `--bs-settings-category-list-icon-active-color` | `var(--tc-app-accent)` | Active tab icon color |
| `--bs-settings-category-list-body-padding` | `1rem 1.25rem` | Padding inside the right-side content area |

#### Example

```html
<tc-settings-category-list id="settings" selected-id="graphics"
    style="border: 1px solid var(--tc-border); height: 260px;">
  <p>Graphics settings appear here.</p>
</tc-settings-category-list>

<script>
  const el = document.getElementById('settings')

  el.categories = [
    { id: 'graphics', label: 'Graphics', icon: 'monitor' },
    { id: 'audio',    label: 'Audio',    icon: 'volume-2' },
    { id: 'controls', label: 'Controls', icon: 'gamepad-2' },
  ]

  el.addEventListener('tc-select', e => console.log('selected', e.detail.id))
</script>
```

---