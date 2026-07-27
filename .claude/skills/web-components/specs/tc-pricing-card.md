---
component: tc-pricing-card
---

### tc-pricing-card

Pricing tier card with a feature list, action button, and optional highlight/badge. Sharp corners everywhere; the highlight variant adds a 135° slate-ink top cap and a stronger `--tc-app-accent` border. The action button reuses the primary-button motif. Feature glyphs use `--tc-success` for included items and `--tc-text-faint` for excluded ones.

**Tag:** `tc-pricing-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `""` | Plan name displayed as the card heading. |
| `price` | string | `""` | Price string (e.g. `"$29"`, `"Free"`). Rendered in JetBrains Mono. |
| `period` | string | — | Billing period (e.g. `"/ month"`). Rendered in JetBrains Mono, muted. Omit for one-time or custom pricing. |
| `description` | string | — | Short description beneath the price line. |
| `badge-text` | string | — | Optional badge label (e.g. `"Most popular"`). Rendered as a rectangular mono flag at the top of the card. |
| `highlight` | boolean | `false` | When present, applies the highlight variant: `--tc-app-accent` border, 135° ink top cap, and a stronger shadow. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Reflects the `name` attribute. |
| `price` | `string` | Reflects the `price` attribute. |
| `period` | `string \| null` | Reflects the `period` attribute. |
| `description` | `string \| null` | Reflects the `description` attribute. |
| `badgeText` | `string \| null` | Reflects the `badge-text` attribute. |
| `highlight` | `boolean` | Reflects the `highlight` boolean attribute. |
| `features` | `Array<string \| PricingCardFeature>` | Feature list. A plain string means included (`true`). `PricingCardFeature: { label: string; included?: boolean }` — `included` defaults to `true` when omitted. Setting this property re-renders. |
| `action` | `PricingCardAction` | Action button descriptor. `PricingCardAction: { label: string; href?: string; onClick?: () => void; variant?: string; disabled?: boolean }`. When `href` is set (and not `disabled`), renders an `<a>`; otherwise renders a `<button>`. Setting this property re-renders. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-action` | `{}` | Fired (bubbles, composed) when the action button is clicked and the action is not disabled. The `action.onClick` callback is also called if provided. |

**Slots**

None. All content is driven by attributes and JS properties.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-pricing-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-pricing-card-border-color` | `var(--tc-border)` | Default 1px hairline border colour. |
| `--bs-pricing-card-shadow` | `var(--tc-shadow-sm)` | Default card shadow. |
| `--bs-pricing-card-padding-y` | `1.5rem` | Vertical card padding. |
| `--bs-pricing-card-padding-x` | `1.5rem` | Horizontal card padding. |
| `--bs-pricing-card-gap` | `1.25rem` | Gap between card sections. |
| `--bs-pricing-card-name-color` | `var(--tc-text)` | Plan name text colour. |
| `--bs-pricing-card-name-size` | `1.0625rem` | Plan name font size. |
| `--bs-pricing-card-price-color` | `var(--tc-text)` | Price text colour. |
| `--bs-pricing-card-price-size` | `1.875rem` | Price font size. |
| `--bs-pricing-card-period-color` | `var(--tc-text-muted)` | Period text colour. |
| `--bs-pricing-card-period-size` | `0.875rem` | Period font size. |
| `--bs-pricing-card-desc-color` | `var(--tc-text-muted)` | Description text colour. |
| `--bs-pricing-card-badge-bg` | `var(--tc-app-accent)` | Badge background colour. |
| `--bs-pricing-card-badge-color` | `#fff` | Badge text colour. |
| `--bs-pricing-card-feature-included-color` | `var(--tc-success)` | Colour of the check glyph for included features. |
| `--bs-pricing-card-feature-excluded-color` | `var(--tc-text-faint)` | Colour of the x/minus glyph and label for excluded features. |
| `--bs-pricing-card-feature-label-color` | `var(--tc-text)` | Feature label text colour (included items). |
| `--bs-pricing-card-feature-icon-size` | `1rem` | Feature glyph size. |
| `--bs-pricing-card-highlight-border-color` | `var(--tc-app-accent)` | Border colour for the highlight variant. |
| `--bs-pricing-card-highlight-shadow` | `0 4px 20px rgba(30,41,59,0.18)` | Shadow for the highlight variant. |
| `--bs-pricing-card-highlight-cap-bg` | `linear-gradient(135deg, var(--tc-app-accent), #2b3a51)` | Gradient for the 4px top cap on the highlight variant. |

```html
<!-- Free tier -->
<tc-pricing-card
    id="free-card"
    name="Free"
    price="$0"
    period="/ month"
    description="Everything you need to get started."
></tc-pricing-card>
<script>
    document.getElementById('free-card').features = [
        { label: '5 projects', included: true },
        { label: '1 GB storage', included: true },
        { label: 'Custom domains', included: false },
    ]
    document.getElementById('free-card').action = {
        label: 'Get started free',
        href: '/signup',
    }
</script>

<!-- Highlighted Pro tier with badge and event listener -->
<tc-pricing-card
    id="pro-card"
    name="Pro"
    price="$29"
    period="/ month"
    description="For growing teams and serious projects."
    highlight
    badge-text="Most popular"
></tc-pricing-card>
<script>
    const pro = document.getElementById('pro-card')
    pro.features = [
        'Unlimited projects',
        '50 GB storage',
        'Priority support',
        'Custom domains',
        'Advanced analytics',
    ]
    pro.action = {
        label: 'Start Pro trial',
        onClick: () => console.log('Pro plan selected'),
    }
    pro.addEventListener('tc-action', e => {
        console.log('tc-action fired', e.detail)
    })
</script>