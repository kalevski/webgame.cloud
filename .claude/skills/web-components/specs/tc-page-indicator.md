---
component: tc-page-indicator
---

### tc-page-indicator

Dot page-navigation widget. Renders one circular button per page; clicking or pressing Enter/Space on a dot selects that page and fires `tc-select`.

**Tag:** `tc-page-indicator`

**Category:** Navigation

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `count` | `number` | `0` | Total number of pages (dots rendered). |
| `index` | `number` | `0` | Zero-based index of the currently active dot. Updated automatically on selection. |
| `size` | `number` | — | Dot diameter in pixels. When absent, `--bs-page-indicator-size` (default `8px`) is used. |
| `gap` | `string` | — | CSS length for the gap between dots (e.g. `"10px"`). When absent, `--bs-page-indicator-gap` (default `6px`) is used. |
| `color` | `string` | — | CSS color for inactive dots. Writes `--bs-page-indicator-color` as an inline style. |
| `active-color` | `string` | — | CSS color for the active dot. Writes `--bs-page-indicator-active-color` as an inline style. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `count` | `number` | `0` | Reflects the `count` attribute. |
| `index` | `number` | `0` | Reflects the `index` attribute. Setting this programmatically re-renders without firing `tc-select`. |
| `size` | `number \| null` | `null` | Reflects the `size` attribute. |
| `gap` | `string` | `""` | Reflects the `gap` attribute. |
| `color` | `string` | `""` | Reflects the `color` attribute. |
| `activeColor` | `string` | `""` | Reflects the `active-color` attribute. |
| `onSelect` | `((index: number) => void) \| null` | `null` | Optional callback fired alongside `tc-select`. |

#### Events

| Event | Detail | Description |
|---|---|---|
| `tc-select` | `{ index: number }` | Fired when the user selects a dot by click or keyboard. Not fired when `index` is set programmatically. |

#### Slots

None. `tc-page-indicator` is entirely attribute-driven; all content is generated internally.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-page-indicator-size` | `8px` | Diameter of each dot. Overridden by the `size` attribute when set. |
| `--bs-page-indicator-gap` | `6px` | Gap between dots. Overridden by the `gap` attribute when set. |
| `--bs-page-indicator-color` | `var(--tc-border-strong)` | Inactive dot color (border and fill on hover). Overridden by the `color` attribute. |
| `--bs-page-indicator-active-color` | `var(--tc-app-accent)` | Active dot fill color. Overridden by the `active-color` attribute. |
| `--bs-page-indicator-dot-border-width` | `1px` | Border width of each dot. |

#### Usage

```html
<!-- Static: 5 pages, second dot active -->
<tc-page-indicator count="5" index="1"></tc-page-indicator>

<!-- Larger dots with custom spacing -->
<tc-page-indicator count="4" index="0" size="12" gap="12px"></tc-page-indicator>

<!-- Custom accent color -->
<tc-page-indicator count="6" index="2" active-color="var(--tc-accent)"></tc-page-indicator>

<!-- Listening to selection -->
<tc-page-indicator id="pager" count="5" index="0"></tc-page-indicator>
<script>
    const pager = document.getElementById('pager');
    pager.addEventListener('tc-select', e => {
        console.log('Selected page', e.detail.index);
    });
    // Or via callback:
    pager.onSelect = index => console.log('Selected page', index);
</script>
```

---