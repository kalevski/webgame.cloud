---
component: tc-page-footer
---

### tc-page-footer

Full-site footer with brand column, navigation menu columns, social icon links, optional CTA block, and a legal bar. All data is supplied via attributes and JS properties — no events emitted.

**Tag:** `tc-page-footer`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `brand` | `string` | — | Mono wordmark text (rendered with cyan brand-dot treatment). When absent, the `brand` slot is used instead. |
| `tagline` | `string` | — | Short tagline shown below the brand wordmark. |
| `description` | `string` | — | Longer description below the tagline. |
| `legal-text` | `string` | — | Copyright / legal copy in the bottom legal bar (rendered in mono). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `brand` | `string \| null` | Reflects the `brand` attribute. |
| `tagline` | `string \| null` | Reflects the `tagline` attribute. |
| `description` | `string \| null` | Reflects the `description` attribute. |
| `legalText` | `string \| null` | Reflects the `legal-text` attribute. |
| `menus` | `PageFooterMenu[]` | Navigation link columns. Setting re-renders. Default `[]`. |
| `socialLinks` | `PageFooterSocialLink[]` | Social icon button row. Setting re-renders. Default `[]`. |
| `legalLinks` | `PageFooterLink[]` | Links rendered in the legal bar. Setting re-renders. Default `[]`. |
| `cta` | `PageFooterCta \| null` | Optional CTA block shown above the main grid. Default `null`. |

**`PageFooterMenu` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | yes | Column heading (mono, uppercase, muted). Also used as the `<nav aria-label>`. |
| `links` | `{ label: string; href: string }[]` | yes | Link list rendered under the title. |

**`PageFooterSocialLink` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `icon` | `string` | yes | Lucide icon name in kebab-case (e.g. `'github'`, `'twitter'`, `'linkedin'`). |
| `href` | `string` | yes | Link URL. Opens in a new tab. |
| `label` | `string` | no | Accessible label for the icon button. Defaults to the `icon` value. |

**`PageFooterLink` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | yes | Link text. |
| `href` | `string` | yes | Link URL. |

**`PageFooterCta` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | yes | CTA button text. |
| `href` | `string` | yes | CTA button link URL. |
| `heading` | `string` | no | Optional heading above the button. |
| `description` | `string` | no | Optional description below the heading. |

**Events**

None. `tc-page-footer` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `brand` | Custom brand mark content distributed into the brand-word area when the `brand` attribute is absent. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-page-footer-bg` | `var(--tc-surface)` | Footer background. |
| `--bs-page-footer-color` | `var(--tc-text)` | Footer text color. |
| `--bs-page-footer-border-color` | `var(--tc-border)` | Hairline color for top border and section separators. |
| `--bs-page-footer-padding-x` | `2rem` | Horizontal padding for all sections. |
| `--bs-page-footer-padding-y` | `3rem` | Vertical padding for the main grid section. |
| `--bs-page-footer-brand-color` | `var(--tc-text)` | Brand wordmark text color. |
| `--bs-page-footer-brand-font-size` | `0.9375rem` | Brand wordmark font size. |
| `--bs-page-footer-brand-dot-bg` | `var(--tc-accent)` | Cyan accent dot color in the brand wordmark. |
| `--bs-page-footer-tagline-color` | `var(--tc-text)` | Tagline text color. |
| `--bs-page-footer-tagline-font-size` | `0.8125rem` | Tagline font size. |
| `--bs-page-footer-description-color` | `var(--tc-text-muted)` | Description text color. |
| `--bs-page-footer-menu-title-color` | `var(--tc-text-muted)` | Menu column title color. |
| `--bs-page-footer-menu-title-font-size` | `0.6875rem` | Menu column title font size. |
| `--bs-page-footer-link-color` | `var(--tc-text-muted)` | Menu link color at rest. |
| `--bs-page-footer-link-hover-color` | `var(--tc-accent)` | Menu link color on hover/focus. |
| `--bs-page-footer-link-font-size` | `0.875rem` | Menu link font size. |
| `--bs-page-footer-social-btn-size` | `2rem` | Social icon button size (width & height). |
| `--bs-page-footer-social-icon-size` | `1rem` | Social icon SVG size. |
| `--bs-page-footer-social-color` | `var(--tc-text-muted)` | Social icon color at rest. |
| `--bs-page-footer-social-hover-color` | `var(--tc-text)` | Social icon color on hover. |
| `--bs-page-footer-social-hover-bg` | `var(--tc-surface-muted)` | Social icon button hover background. |
| `--bs-page-footer-legal-color` | `var(--tc-text-muted)` | Legal text color. |
| `--bs-page-footer-legal-font-size` | `0.75rem` | Legal text and link font size. |
| `--bs-page-footer-legal-link-color` | `var(--tc-text-muted)` | Legal link color at rest. |
| `--bs-page-footer-legal-link-hover-color` | `var(--tc-text)` | Legal link color on hover. |
| `--bs-page-footer-cta-bg` | `var(--tc-surface-muted)` | CTA block background. |
| `--bs-page-footer-cta-border-color` | `var(--tc-border)` | CTA block bottom border color. |
| `--bs-page-footer-cta-heading-color` | `var(--tc-text)` | CTA heading text color. |
| `--bs-page-footer-cta-desc-color` | `var(--tc-text-muted)` | CTA description text color. |

```html
<!-- Minimal footer with brand and legal text -->
<tc-page-footer brand="toolcase" legal-text="© 2026 Toolcase."></tc-page-footer>

<!-- Full footer (menus, social, legal, cta via JS) -->
<tc-page-footer
  id="site-footer"
  brand="toolcase"
  tagline="The open-source UI toolkit"
  description="Framework-free components for modern web applications."
  legal-text="© 2026 Toolcase. All rights reserved."
></tc-page-footer>
<script>
  const footer = document.getElementById('site-footer')
  footer.menus = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
      ],
    },
  ]
  footer.socialLinks = [
    { icon: 'github', href: 'https://github.com', label: 'GitHub' },
    { icon: 'twitter', href: 'https://twitter.com', label: 'Twitter' },
  ]
  footer.legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ]
  footer.cta = {
    heading: 'Start building today',
    description: 'Join thousands of developers shipping faster with Toolcase.',
    label: 'Get started free',
    href: '/signup',
  }
</script>

<!-- Brand slot (custom logo image instead of text wordmark) -->
<tc-page-footer legal-text="© 2026 Toolcase.">
  <img slot="brand" src="/logo.svg" alt="Toolcase" height="24" />
</tc-page-footer>
```

---