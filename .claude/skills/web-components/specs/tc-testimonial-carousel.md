---
component: tc-testimonial-carousel
---

### tc-testimonial-carousel

**Tag:** `tc-testimonial-carousel`

Shows one testimonial at a time on a white card, with prev/next arrow controls and a row of dot indicators. Prev/next wrap around; clicking a dot jumps to that slide. With the `autoplay` attribute the slide auto-advances every `interval` ms, pausing on hover, on focus, and when the tab is hidden. Left/Right arrow keys move between slides when the carousel (or a control) is focused. Honours `prefers-reduced-motion` (the slide-in animation is disabled; autoplay still advances, just without motion).

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `autoplay` | boolean | absent | When present, auto-advances the carousel on a timer. Requires more than one item. |
| `interval` | number | `5000` | Autoplay cadence in milliseconds (floored at 500). Only used when `autoplay` is present. |
| `aria-label` | string | `'Testimonials'` | Accessible label applied to the inner `role="region"` carousel container. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `Testimonial[]` | `[]` | The testimonials to display. Must be set as a JS property (`el.items = [...]`), not an attribute. Setting it re-renders and resets the active slide if the previous index is now out of range. |
| `autoplay` | boolean | `false` | Reflected from the `autoplay` attribute. |
| `interval` | number | `5000` | Reflected from the `interval` attribute. |

`Testimonial` shape:

```ts
interface Testimonial {
    id: string
    quote: string
    author: string
    role?: string
    company?: string
    avatarUrl?: string
    rating?: number // 0–5; rendered as filled stars
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ index: number; id: string }` | Fired whenever the active slide changes (via arrows, dots, keyboard, or autoplay). Not fired on initial render. |

**Slots**

None. Content is driven entirely by the `items` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-testimonial-carousel-surface` | `var(--tc-surface)` | Card background. |
| `--bs-testimonial-carousel-border` | `var(--tc-border)` | Card and control hairline border. |
| `--bs-testimonial-carousel-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-testimonial-carousel-quote-color` | `var(--tc-text)` | Quote text colour. |
| `--bs-testimonial-carousel-author-color` | `var(--tc-text)` | Author name colour. |
| `--bs-testimonial-carousel-muted-color` | `var(--tc-text-muted)` | Role / company text colour. |
| `--bs-testimonial-carousel-control-color` | `var(--tc-text)` | Prev/next icon colour. |
| `--bs-testimonial-carousel-control-hover-bg` | `var(--tc-surface-muted)` | Prev/next hover well. |
| `--bs-testimonial-carousel-dot-color` | `var(--tc-border-strong)` | Inactive dot colour. |
| `--bs-testimonial-carousel-dot-active-color` | `var(--tc-app-accent)` | Active dot (pill) fill. |
| `--bs-testimonial-carousel-star-color` | `var(--tc-warning)` | Filled star colour. |
| `--bs-testimonial-carousel-star-empty-color` | `var(--tc-border-strong)` | Empty star colour. |
| `--bs-testimonial-carousel-avatar-size` | `2.5rem` | Avatar diameter (rendered as a circle). |
| `--bs-testimonial-carousel-gap` | `1rem` | Gap between the slide row and the dots. |

**Example**

```html
<tc-testimonial-carousel id="tc" aria-label="Customer testimonials"></tc-testimonial-carousel>
<script>
  const el = document.getElementById('tc')
  el.items = [
    { id: 'a', quote: 'A joy to work with.', author: 'Ada Reyes', role: 'Staff Engineer', company: 'Northwind', rating: 5, avatarUrl: '/ada.jpg' },
    { id: 'b', quote: 'Sharp and themeable.', author: 'Marcus Lin', role: 'Design Lead', rating: 4 },
  ]
  el.addEventListener('tc-change', e => console.log(e.detail.index, e.detail.id))
</script>

<!-- Autoplay every 3s -->
<tc-testimonial-carousel id="tc2" autoplay interval="3000" aria-label="Testimonials"></tc-testimonial-carousel>
<script>
  document.getElementById('tc2').items = [/* … */]
</script>
```

---