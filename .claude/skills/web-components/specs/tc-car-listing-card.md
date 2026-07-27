---
component: tc-car-listing-card
---

### tc-car-listing-card

Vehicle listing card: image, category chip, wishlist toggle, title, optional
rating, an icon spec row (mileage/fuel/transmission), current + strikethrough
old price, and an optional seller mini-row. The flagship component of the
**Redline** theme (see `tc-theme name="redline"`), but themeable like any
other `tc-*` element.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `layout` | `grid\|list` | `grid` | Grid card or horizontal list row |
| `image-src` / `image-alt` | string | — | Listing photo |
| `category` | string | — | Category chip (e.g. "Sports Car") |
| `title-text` | string | — | Listing title |
| `href` | string | — | Wraps the title in a link when set |
| `price-text` | string | — | Current price (pre-formatted) |
| `price-old-text` | string | — | Strikethrough original price |
| `rating` | number `0-5` | — | Star rating; omit to hide |
| `rating-count-text` | string | — | Review count shown next to the stars |
| `seller-name` / `seller-avatar-src` | string | — | Optional seller mini-row |
| `wishlisted` | boolean | false | Wishlist heart pressed state |

**Properties (JS-only):** `specs: { icon: string; label: string }[]` — the
icon spec row; `icon` is any lucide icon name (kebab or PascalCase). Set via
a ref (`el.specs = [...]`) or the `useTc` React hook — arrays can't be passed
as HTML attributes.

**Events:** `tc-wishlist-toggle` — `detail: { wishlisted: boolean }`. Fired
when the heart button is clicked; never navigates the card's own link.

```html
<tc-car-listing-card
    image-src="/cars/gt-coupe.jpg"
    category="Sports Car"
    title-text="2024 Vantage GT Coupe"
    href="/cars/gt-coupe"
    price-text="$58,900"
    price-old-text="$62,400"
    rating="4.5"
    rating-count-text="(128)"
    seller-name="Redline Motors"
    seller-avatar-src="/dealers/redline.jpg"
></tc-car-listing-card>
<script>
    document.querySelector('tc-car-listing-card').specs = [
        { icon: 'gauge', label: '12,400 mi' },
        { icon: 'fuel', label: 'Petrol' },
        { icon: 'settings-2', label: 'Automatic' },
    ]
</script>
```

---