---
component: tc-scroll-text
---

### tc-scroll-text

Scrollable text panel with an optional mono uppercase title header. Drop any HTML content into the default slot; set `max-height` to enable a scrollable viewport. Styled to the slate design system.

**Tag:** `tc-scroll-text`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `scroll-title` | string | `""` | Optional title displayed in a mono uppercase header strip above the body. Absent = no header rendered. |
| `max-height` | string \| number | *(none)* | Maximum height of the scrollable body. A bare integer is treated as pixels (e.g. `"200"` → `200px`). Any valid CSS length is accepted (e.g. `"12rem"`). When absent the body expands to fit its content. |

#### JS Properties

| Property | Type | Maps to |
|---|---|---|
| `scrollTitle` | `string` | `scroll-title` attribute |
| `maxHeight` | `string \| null` | `max-height` attribute |

#### Events

None. `tc-scroll-text` is a presentational element.

#### Slots

| Slot | Description |
|---|---|
| *(default)* | The text or HTML content to display inside the scrollable body. |

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-scroll-text-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-scroll-text-border-color` | `var(--tc-border)` | 1px outer hairline border color. |
| `--bs-scroll-text-max-height` | `none` | Max-height of the body; overridden per instance by the `max-height` attribute. |
| `--bs-scroll-text-header-color` | `var(--tc-text-muted)` | Title text color. |
| `--bs-scroll-text-header-font-size` | `0.6875rem` | Title font size (~11px). |
| `--bs-scroll-text-header-letter-spacing` | `0.08em` | Title letter spacing. |
| `--bs-scroll-text-header-padding-y` | `0.5rem` | Title vertical padding. |
| `--bs-scroll-text-header-padding-x` | `1rem` | Title horizontal padding. |
| `--bs-scroll-text-header-border-color` | `var(--tc-border)` | 1px hairline under the title header. |
| `--bs-scroll-text-body-color` | `var(--tc-text)` | Body text color. |
| `--bs-scroll-text-body-font-size` | `0.925rem` | Body font size. |
| `--bs-scroll-text-body-line-height` | `1.65` | Body line height. |
| `--bs-scroll-text-body-padding-y` | `0.875rem` | Body vertical padding. |
| `--bs-scroll-text-body-padding-x` | `1rem` | Body horizontal padding. |
| `--bs-scroll-text-scrollbar-color` | `var(--tc-border-strong)` | Thin scrollbar thumb color. |

#### Example

```html
<!-- Basic with title -->
<tc-scroll-text scroll-title="Mission Briefing">
  Your target is deep inside the Eastern Quarter. Avoid the main boulevard.
</tc-scroll-text>

<!-- Capped height — shows scrollbar when content overflows -->
<tc-scroll-text scroll-title="Codex Entry" max-height="160">
  <p>Paragraph one of the entry.</p>
  <p>Paragraph two continues here.</p>
</tc-scroll-text>

<script>
  const el = document.querySelector('tc-scroll-text')
  el.scrollTitle = 'Updated Title'
  el.maxHeight = '200px'
</script>
```

---