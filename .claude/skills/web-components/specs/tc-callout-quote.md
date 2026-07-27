---
component: tc-callout-quote
---

### tc-callout-quote

Blockquote with a decorative quote-mark icon, optional attribution, and an optional source link. The quote body is supplied either via the `quote` attribute (plain text) or via default slotted children (rich content). Renders as a semantic `<figure>/<blockquote>/<figcaption>` structure with a 4 px slate left border.

**Tag:** `tc-callout-quote`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `quote` | string | — | Quote body rendered as escaped text inside `<blockquote>`. When absent, slotted children are used instead. |
| `attribution` | string | — | Name of the person being quoted, rendered as `<cite>` inside `<figcaption>`. |
| `source` | string | — | Source name (book, article, etc.) rendered after the attribution. Displayed as plain text unless `source-href` is also set. |
| `source-href` | string | — | URL for the source. When present, the source renders as an `<a>` with `target="_blank" rel="noopener noreferrer"`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `quote` | `string \| null` | Reflects the `quote` attribute. |
| `attribution` | `string \| null` | Reflects the `attribution` attribute. |
| `source` | `string \| null` | Reflects the `source` attribute. |
| `sourceHref` | `string \| null` | Reflects the `source-href` attribute. |

**Events**

None. `tc-callout-quote` is a purely presentational element.

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Quote body content when the `quote` attribute is absent. Preserved across re-renders inside `.tc-callout-quote-content`. |

**Accessibility**

Uses semantic `<figure>`, `<blockquote>`, and `<figcaption>` elements. The quote-mark icon is `aria-hidden`. Attribution uses `<cite>`. A linked source is a real `<a>` with `rel="noopener noreferrer"` and visible focus ring. Respects `prefers-reduced-motion`.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-callout-quote-border-color` | `var(--tc-border)` | Left border colour. |
| `--bs-callout-quote-mark-color` | `var(--tc-text-faint)` | Colour of the decorative quote-mark icon. |
| `--bs-callout-quote-mark-size` | `2rem` | Size of the decorative quote-mark icon. |
| `--bs-callout-quote-text-color` | `var(--tc-text)` | Quote body text colour. |
| `--bs-callout-quote-text-size` | `1.1rem` | Quote body font size. |
| `--bs-callout-quote-caption-color` | `var(--tc-text-muted)` | Caption / attribution area text colour. |
| `--bs-callout-quote-author-color` | `var(--tc-text)` | Attribution `<cite>` text colour. |
| `--bs-callout-quote-source-color` | `var(--tc-text-muted)` | Source text colour (linked or plain). |
| `--bs-callout-quote-source-hover-color` | `var(--tc-app-accent)` | Source link hover colour. |
| `--bs-callout-quote-padding-y` | `1.25rem` | Vertical padding of the figure. |
| `--bs-callout-quote-padding-x` | `1.5rem` | Horizontal padding of the figure. |

```html
<!-- Quote via attribute -->
<tc-callout-quote quote="The best way to predict the future is to invent it."></tc-callout-quote>

<!-- Quote via default slot (rich content) -->
<tc-callout-quote>
    The best way to predict the future is to <strong>invent it</strong>.
</tc-callout-quote>

<!-- With attribution -->
<tc-callout-quote
    quote="Any sufficiently advanced technology is indistinguishable from magic."
    attribution="Arthur C. Clarke"
></tc-callout-quote>

<!-- With attribution and linked source -->
<tc-callout-quote
    quote="Programs must be written for people to read, and only incidentally for machines to execute."
    attribution="Harold Abelson"
    source="SICP"
    source-href="https://mitpress.mit.edu/sites/default/files/sicp/index.html"
></tc-callout-quote>

<!-- With attribution and plain source (no link) -->
<tc-callout-quote
    quote="An idea that is not dangerous is unworthy of being called an idea at all."
    attribution="Oscar Wilde"
    source="The Critic as Artist"
></tc-callout-quote>
```

---