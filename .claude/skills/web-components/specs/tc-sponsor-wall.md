---
component: tc-sponsor-wall
---

### tc-sponsor-wall

Sponsor logos organised by tier with an optional wall title and per-logo links. Logos rest greyscale/muted and lift to full colour on hover. No shadow DOM — renders into light DOM.

**Tag:** `tc-sponsor-wall`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Optional plain-text heading rendered above all tiers. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `tiers` | `SponsorTier[]` | Array of tier objects to render. Set via JS property. Default: `[]`. Re-renders on assignment. |
| `title` | `string` | Reflects the `title` attribute. |

`SponsorTier` shape:
```ts
interface SponsorTier {
    name: string           // tier identifier; used as the group aria-label when label is absent
    label?: string         // human-readable label rendered above the logo grid
    logos: SponsorLogo[]   // logos for this tier
    size?: 'xl' | 'lg' | 'md' | 'sm'  // logo box height; defaults to 'md'
}
```

`SponsorLogo` shape:
```ts
interface SponsorLogo {
    src: string      // image URL
    alt: string      // meaningful alt text for the logo
    href?: string    // when set, logo is wrapped in <a target="_blank" rel="noopener noreferrer">
}
```

**Events**

None. `tc-sponsor-wall` is purely presentational — logo links navigate natively.

**Slots**

None.

**Accessibility**

Each tier is wrapped in `role="group"` with `aria-label` set to the tier label (or name). Logo images carry meaningful `alt` text. Linked logos are real `<a>` elements with `target="_blank"` and `rel="noopener noreferrer"`. Focus ring is always visible (`:focus-visible` outline using `--tc-app-accent`, offset 2 px). `prefers-reduced-motion` suppresses the 1 px lift while keeping the opacity/filter transition.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-sponsor-wall-title-color` | `var(--tc-text-faint)` | Wall title text colour. |
| `--bs-sponsor-wall-title-font-size` | `0.6875rem` | Wall title font size. |
| `--bs-sponsor-wall-title-margin-bottom` | `1.5rem` | Space below the wall title. |
| `--bs-sponsor-wall-tier-gap` | `2rem` | Vertical gap between tiers. |
| `--bs-sponsor-wall-label-color` | `var(--tc-text-faint)` | Tier label text colour. |
| `--bs-sponsor-wall-label-font-size` | `0.6875rem` | Tier label font size. |
| `--bs-sponsor-wall-logos-gap` | `1px` | Gap between logo cells (hairline grid). |
| `--bs-sponsor-wall-cell-bg` | `var(--tc-surface)` | Logo cell background. |
| `--bs-sponsor-wall-cell-border` | `var(--tc-border)` | Hairline colour between cells. |
| `--bs-sponsor-wall-logo-grayscale` | `1` | Greyscale filter amount at rest (0–1). |
| `--bs-sponsor-wall-logo-opacity` | `0.55` | Logo opacity at rest. |
| `--bs-sponsor-wall-hover-translate` | `-1px` | Vertical lift of the logo cell on hover. |
| `--bs-sponsor-wall-size-xl` | `5rem` | Max logo height for `size="xl"` tiers. |
| `--bs-sponsor-wall-size-lg` | `3.75rem` | Max logo height for `size="lg"` tiers. |
| `--bs-sponsor-wall-size-md` | `3rem` | Max logo height for `size="md"` tiers (default). |
| `--bs-sponsor-wall-size-sm` | `2.25rem` | Max logo height for `size="sm"` tiers. |

```html
<!-- Multiple tiers with title -->
<tc-sponsor-wall id="sw1" title="Our Sponsors"></tc-sponsor-wall>
<script>
    document.getElementById('sw1').tiers = [
        {
            name: 'Platinum',
            label: 'Platinum',
            size: 'xl',
            logos: [
                { src: '/logos/acme.svg', alt: 'Acme Corp', href: 'https://acme.example' },
                { src: '/logos/globex.svg', alt: 'Globex', href: 'https://globex.example' },
            ],
        },
        {
            name: 'Gold',
            label: 'Gold',
            size: 'lg',
            logos: [
                { src: '/logos/initech.svg', alt: 'Initech', href: 'https://initech.example' },
                { src: '/logos/umbrella.svg', alt: 'Umbrella' },
            ],
        },
        {
            name: 'Community',
            size: 'sm',
            logos: [
                { src: '/logos/hooli.svg', alt: 'Hooli', href: 'https://hooli.example' },
            ],
        },
    ]
</script>
```

---