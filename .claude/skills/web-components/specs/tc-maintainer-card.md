---
component: tc-maintainer-card
---

### tc-maintainer-card

Profile card of a maintainer with a circular avatar, name heading, optional role sub-label, optional location line, optional bio paragraph, a row of social-link icon buttons, and a sponsor button. All data is driven by attributes and the `links` JS property — no slot content.

**Tag:** `tc-maintainer-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `''` | The maintainer's display name. Rendered as an `<h3>` heading and used as the avatar `alt` text. |
| `avatar-url` | string | `''` | Avatar image source URL. |
| `role` | string | — | Role / title sub-label displayed beneath the name. |
| `bio` | string | — | Short bio paragraph rendered in muted prose type. |
| `sponsor-href` | string | — | When set, renders the sponsor button as an `<a href>` pointing to this URL (opens in new tab). Without it, the button is a `<button type="button">`. |
| `sponsor-label` | string | `'Sponsor'` | Text label for the sponsor button. |
| `location` | string | — | Optional location line rendered with a lucide `map-pin` icon. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `links` | `MaintainerLink[]` | `[]` | Array of social link objects. Setting it re-renders the link row. |
| `avatarUrl` | `string` | `''` | Reflects the `avatar-url` attribute. |
| `sponsorHref` | `string \| null` | `null` | Reflects the `sponsor-href` attribute. |
| `sponsorLabel` | `string` | `'Sponsor'` | Reflects the `sponsor-label` attribute. |
| `bio` | `string \| null` | `null` | Reflects the `bio` attribute. |
| `location` | `string \| null` | `null` | Reflects the `location` attribute. |
| `name` | `string` | `''` | Reflects the `name` attribute. |

`MaintainerLink` shape:

```ts
interface MaintainerLink {
    key: string       // unique identifier for the link
    href: string      // link destination
    label: string     // accessible label (aria-label on the <a>)
    icon?: string     // lucide icon name in kebab-case (e.g. 'github', 'twitter', 'globe')
}
```

**Events**

None. `tc-maintainer-card` is a purely presentational component.

**Slots**

None. All content is driven by attributes and JS properties.

**Accessibility**

- Name is rendered as a real `<h3>` heading.
- Avatar `<img>` has `alt` set to the maintainer's name.
- Social link `<a>` elements carry `aria-label` (the link's `label`); lucide SVGs are `aria-hidden`.
- External links use `target="_blank" rel="noopener noreferrer"`.
- Focus ring always visible (`outline: 2px solid var(--tc-app-accent)`).
- Touch targets ≥ 44 px under `@media (pointer: coarse)`.
- `prefers-reduced-motion` is honoured: hover lift transitions are removed.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-maintainer-card-avatar-size` | `5rem` | Diameter of the circular avatar. |
| `--bs-maintainer-card-name-color` | `var(--tc-text)` | Name heading color. |
| `--bs-maintainer-card-name-size` | `1.0625rem` | Name heading font size. |
| `--bs-maintainer-card-role-color` | `var(--tc-text-muted)` | Role sub-label color. |
| `--bs-maintainer-card-role-size` | `0.8125rem` | Role sub-label font size. |
| `--bs-maintainer-card-location-color` | `var(--tc-text-muted)` | Location line color (includes icon). |
| `--bs-maintainer-card-location-size` | `0.8125rem` | Location line font size. |
| `--bs-maintainer-card-bio-color` | `var(--tc-text-muted)` | Bio paragraph color. |
| `--bs-maintainer-card-bio-size` | `0.875rem` | Bio paragraph font size. |
| `--bs-maintainer-card-link-color` | `var(--tc-text-muted)` | Social link icon color at rest. |
| `--bs-maintainer-card-link-hover-bg` | `var(--tc-surface-muted)` | Social link hover well background. |
| `--bs-maintainer-card-link-hover-color` | `var(--tc-text)` | Social link icon color on hover. |
| `--bs-maintainer-card-link-icon-size` | `1.125rem` | Social link icon SVG size. |
| `--bs-maintainer-card-sponsor-bg` | `var(--tc-danger)` | Sponsor button background color. |
| `--bs-maintainer-card-sponsor-color` | `#fff` | Sponsor button text and icon color. |
| `--bs-maintainer-card-sponsor-hover-bg` | `#b91c1c` | Sponsor button background on hover. |
| `--bs-maintainer-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow (inherited from `.card`). |
| `--bs-maintainer-card-shadow-hover` | `var(--tc-shadow-hover)` | Card shadow on hover. |
| `--bs-maintainer-card-padding` | `1.5rem` | Card body padding. |

```html
<!-- Full card -->
<tc-maintainer-card
    id="mc"
    name="Alex Chen"
    avatar-url="https://example.com/avatar.jpg"
    role="Core Maintainer"
    bio="Building open-source tools that developers love."
    location="San Francisco, CA"
    sponsor-href="https://github.com/sponsors/alexchen"
    sponsor-label="Sponsor">
</tc-maintainer-card>
<script>
  document.getElementById('mc').links = [
    { key: 'github', href: 'https://github.com/alexchen', label: 'GitHub', icon: 'github' },
    { key: 'twitter', href: 'https://twitter.com/alexchen', label: 'X (Twitter)', icon: 'twitter' },
    { key: 'web', href: 'https://alexchen.dev', label: 'Website', icon: 'globe' },
  ]
</script>

<!-- Minimal (name + avatar only) -->
<tc-maintainer-card name="Taylor Kim" avatar-url="https://example.com/taylor.jpg"></tc-maintainer-card>
```

---