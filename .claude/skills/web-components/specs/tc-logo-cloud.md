---
component: tc-logo-cloud
---

### tc-logo-cloud

Grid of logos with an optional section title, optional grayscale filter, and optional per-logo links. Set logos via the `logos` JS property. All logos sit flush on the page surface — no boxes, no shadows, `border-radius: 0`. Grayscale variant desaturates at rest and restores full color on hover/focus-within.

**Tag:** `tc-logo-cloud`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Optional section heading rendered as an `<h2>` above the logo grid. Omit to skip the heading entirely. |
| `grayscale` | boolean | false | When present, applies `filter: grayscale(1)` and reduced opacity to all logos at rest. Color and opacity are restored on hover/focus-within per logo cell. |
| `columns` | number | `5` | Number of grid columns. Parsed as an integer; falls back to `5` on invalid values. At `≤767px` the grid snaps to 3 columns; at `≤479px` to 2 columns — regardless of this attribute. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `logos` | `LogoCloudLogo[]` | `[]` | Array of logo objects. Setting it re-renders the grid. Must be set via JS (`el.logos = [...]`). |
| `title` | `string` | `''` | Reflects the `title` attribute. |
| `grayscale` | `boolean` | `false` | Reflects the `grayscale` boolean attribute. |
| `columns` | `number` | `5` | Reflects the `columns` attribute as a parsed integer. |

`LogoCloudLogo` shape:

```ts
interface LogoCloudLogo {
    src: string       // URL of the logo image
    alt: string       // Meaningful alt text for the logo
    href?: string     // Optional link URL; logo cell becomes an <a target="_blank">
    width?: number    // Optional pixel width applied as an inline style
}
```

**Events**

None. `tc-logo-cloud` is purely presentational.

**Slots**

None. All content is driven by attributes and the `logos` JS property.

**Accessibility**

- Every `<img>` must have a meaningful `alt` string — pass it in the `LogoCloudLogo` object.
- Linked logos render as `<a target="_blank" rel="noopener noreferrer">` with a visually-hidden `"(opens in new tab)"` notice.
- The optional `title` is a real `<h2>` heading.
- Focus ring always visible on linked cells (`outline: 2px solid var(--tc-app-accent)`).
- Touch targets ≥ 44 px under `@media (pointer: coarse)`.
- `prefers-reduced-motion` is honoured: the grayscale-to-color transition is disabled (instant shift).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-logo-cloud-columns` | `5` | CSS grid column count (overridden by the `columns` attribute via inline style). |
| `--bs-logo-cloud-gap` | `2rem` | Gap between logo cells in the grid. |
| `--bs-logo-cloud-cell-padding-x` | `1.25rem` | Horizontal padding inside each logo cell. |
| `--bs-logo-cloud-cell-padding-y` | `1rem` | Vertical padding inside each logo cell. |
| `--bs-logo-cloud-title-color` | `var(--tc-text)` | Section title text color. |
| `--bs-logo-cloud-title-font-size` | `0.8125rem` | Section title font size. |
| `--bs-logo-cloud-title-margin-bottom` | `1.25rem` | Space between the title and the logo grid. |
| `--bs-logo-cloud-grayscale-opacity` | `0.55` | Logo opacity in grayscale-at-rest state. |
| `--bs-logo-cloud-grayscale-transition` | `filter var(--tc-transition-base), opacity var(--tc-transition-base)` | Transition applied to grayscale↔color shift. Disabled under `prefers-reduced-motion`. |

```html
<!-- Basic: 5-column grid, titled -->
<tc-logo-cloud id="lc" title="Trusted by teams using"></tc-logo-cloud>
<script>
  document.getElementById('lc').logos = [
    { src: '/logos/react.svg', alt: 'React', width: 56 },
    { src: '/logos/typescript.svg', alt: 'TypeScript', width: 56 },
    { src: '/logos/nodejs.svg', alt: 'Node.js', width: 80 },
  ]
</script>

<!-- Grayscale variant with links -->
<tc-logo-cloud id="lc2" title="Built with" grayscale></tc-logo-cloud>
<script>
  document.getElementById('lc2').logos = [
    { src: '/logos/vite.svg', alt: 'Vite', href: 'https://vitejs.dev', width: 52 },
    { src: '/logos/vue.svg', alt: 'Vue', href: 'https://vuejs.org', width: 52 },
  ]
</script>

<!-- 3-column layout, no title -->
<tc-logo-cloud id="lc3" columns="3"></tc-logo-cloud>
<script>
  document.getElementById('lc3').logos = [
    { src: '/logos/react.svg', alt: 'React', width: 56 },
    { src: '/logos/typescript.svg', alt: 'TypeScript', width: 56 },
    { src: '/logos/svelte.svg', alt: 'Svelte', width: 44 },
  ]
</script>
```

---