---
component: tc-cookbook-grid
---

### tc-cookbook-grid

Multi-column grid of code-recipe cards with title, description, code snippet, and optional tags. Linked cards animate with a 1 px lift on hover. Purely presentational — no callbacks or events.

**Tag:** `tc-cookbook-grid`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `2\|3` | `2` | Number of grid columns. Collapses to a single column on narrow viewports. |
| `title` | string | — | Optional plain-text section heading rendered above the grid. Use `slot="title"` for rich content. When both are absent, no header is rendered. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `recipes` | `Recipe[]` | Array of recipe entries to render. Set via JS property. Default: `[]`. Re-renders on assignment. |
| `columns` | `CookbookGridColumns` | Reflects the `columns` attribute. |
| `title` | `string` | Reflects the `title` attribute. |

`Recipe` shape:
```ts
interface Recipe {
    title: string          // card heading; used as aria-label on linked cards
    description?: string   // optional muted subtext beneath the title
    code: string           // code snippet to display (HTML-escaped automatically)
    language?: string      // optional language micro-label shown above the code block
    tags?: string[]        // optional tag chips shown below the code block
    href?: string          // when set, the card is rendered as an <a> with this href
}
```

**Events**

None. `tc-cookbook-grid` is purely presentational. Recipe cards link via `href`.

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Rich heading content rendered above the grid. Used when the `title` attribute is absent. |

**Accessibility**

- Linked cards are real `<a>` elements with `aria-label` set to the recipe title.
- Non-linked cards use `<article>` elements.
- Code is rendered in a readable `<pre><code>` block.
- Tags are plain text spans.
- Focus ring is always visible (`outline: 2px solid var(--tc-app-accent)`).
- `prefers-reduced-motion` suppresses the 1 px hover lift while keeping the shadow transition.
- Linked cards have a minimum touch target of `2.75rem` under coarse pointers.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-cookbook-grid-gap` | `1rem` | Gap between cards. |
| `--bs-cookbook-grid-card-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-cookbook-grid-card-border` | `var(--tc-border)` | Card hairline border color. |
| `--bs-cookbook-grid-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-cookbook-grid-card-shadow-hover` | `var(--tc-shadow-hover)` | Card shadow on hover (linked cards only). |
| `--bs-cookbook-grid-card-padding` | `1.25rem` | Inner padding of each card. |
| `--bs-cookbook-grid-section-title-color` | `var(--tc-text)` | Section heading color. |
| `--bs-cookbook-grid-title-color` | `var(--tc-text)` | Recipe title text color. |
| `--bs-cookbook-grid-title-font-size` | `0.9375rem` | Recipe title font size. |
| `--bs-cookbook-grid-title-font-weight` | `600` | Recipe title font weight. |
| `--bs-cookbook-grid-desc-color` | `var(--tc-text-muted)` | Description text color. |
| `--bs-cookbook-grid-desc-font-size` | `0.8125rem` | Description font size. |
| `--bs-cookbook-grid-code-bg` | `var(--tc-ink)` | Code block dark background. |
| `--bs-cookbook-grid-code-color` | `var(--tc-text-inverse)` | Code text color. |
| `--bs-cookbook-grid-code-font-size` | `0.75rem` | Code block font size. |
| `--bs-cookbook-grid-code-padding` | `0.75rem` | Code block padding. |
| `--bs-cookbook-grid-lang-color` | `var(--tc-slate-400)` | Language micro-label color. |
| `--bs-cookbook-grid-lang-font-size` | `0.625rem` | Language micro-label font size. |
| `--bs-cookbook-grid-tag-bg` | `var(--tc-surface-muted)` | Tag chip background. |
| `--bs-cookbook-grid-tag-color` | `var(--tc-text-muted)` | Tag chip text color. |
| `--bs-cookbook-grid-tag-font-size` | `0.6875rem` | Tag chip font size. |
| `--bs-cookbook-grid-hover-translate` | `-1px` | Vertical lift on hover for linked cards. |

```html
<!-- 2-column grid with title attribute -->
<tc-cookbook-grid id="cg1" columns="2" title="JS Recipes"></tc-cookbook-grid>
<script>
    document.getElementById('cg1').recipes = [
        {
            title: 'Debounce a function',
            description: 'Delay execution until after a quiet period.',
            code: 'function debounce(fn, delay) {\n  let id\n  return (...args) => {\n    clearTimeout(id)\n    id = setTimeout(() => fn(...args), delay)\n  }\n}',
            language: 'javascript',
            tags: ['utility', 'async'],
            href: '/recipes/debounce',
        },
        {
            title: 'Deep clone an object',
            code: 'const clone = obj => JSON.parse(JSON.stringify(obj))',
            language: 'javascript',
            tags: ['utility'],
        },
    ]
</script>

<!-- 3-column grid -->
<tc-cookbook-grid id="cg2" columns="3" title="Snippets"></tc-cookbook-grid>

<!-- Rich title via slot -->
<tc-cookbook-grid id="cg3" columns="2">
    <span slot="title"><strong>Advanced Recipes</strong></span>
</tc-cookbook-grid>
```
```

---