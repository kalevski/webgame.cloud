---
component: tc-empty-state
---

### tc-empty-state

Centered placeholder shown when data is unavailable — the canonical empty treatment for tables, tabs, lists, and search results (`tc-table` renders it automatically for its empty state). Composition, all optional: a lucide icon in a sharp slate tile, a short bold `heading`, a muted `description`, slotted body content, and an `action` CTA row.

**Tag:** `tc-empty-state`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `icon` | string | — | Lucide icon name in kebab-case or PascalCase (e.g. `"inbox"`, `"folder-open"`, `"FolderOpen"`). When set, renders the icon as an inline SVG inside a muted tile above the body. When omitted (or unknown), no icon is shown. |
| `heading` | string | — | Short bold line under the icon (e.g. `"No recipes yet"`). |
| `description` | string | — | Muted explanation under the heading; wraps at `max-width: 40ch`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `icon` | `string \| null` | Reflects the `icon` attribute. |
| `heading` | `string \| null` | Reflects the `heading` attribute. |
| `description` | `string \| null` | Reflects the `description` attribute. |

**Events**

None. `tc-empty-state` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Free-form body content (message text, headings). Rendered inside `.tc-empty-state__body`, below the `heading`/`description`. Preserved across attribute re-renders. Kept for back-compat — unchanged. |
| `action` | Children with `slot="action"` render as a CTA row under the text (e.g. a `tc-button`). |

**Accessibility**

- The icon SVG carries `aria-hidden="true"` — it is decorative; the message text is the readable content.
- Any slotted `tc-button` or `<button>` remains keyboard-reachable with a visible focus ring.
- `prefers-reduced-motion` is honoured globally via the reset; no transitions are defined by default.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-empty-state-padding-y` | `3rem` | Vertical padding of the centered container. |
| `--bs-empty-state-padding-x` | `1.5rem` | Horizontal padding of the centered container. |
| `--bs-empty-state-gap` | `1rem` | Gap between the icon tile and the body. |
| `--bs-empty-state-color` | `var(--tc-text-muted)` | Default text color for body content. |
| `--bs-empty-state-icon-size` | `1.25rem` | Width and height of the icon SVG. |
| `--bs-empty-state-icon-color` | `var(--tc-text-faint)` | Icon stroke color. |
| `--bs-empty-state-icon-bg` | `var(--tc-surface-muted)` | Background of the icon tile. |
| `--bs-empty-state-icon-padding` | `0.75rem` | Padding inside the icon tile. |

```html
<!-- Icon + message -->
<tc-empty-state icon="Inbox">No messages yet</tc-empty-state>

<!-- Heading + description + action row -->
<tc-empty-state
    icon="FolderOpen"
    heading="No files yet"
    description="Files you upload will show up here."
>
    <tc-button slot="action" variant="secondary">Upload a file</tc-button>
</tc-empty-state>

<!-- Icon + message + action button -->
<tc-empty-state icon="FolderOpen">
    No files found
    <tc-button variant="secondary">Upload a file</tc-button>
</tc-empty-state>

<!-- Message only, no icon -->
<tc-empty-state>Nothing to show here yet.</tc-empty-state>
```

---