---
component: tc-entity-profile-card
---

### tc-entity-profile-card

Entity profile card with a hero section (lead avatar, title, subtitle, chips row) and a meta-information grid of label-value pairs. Presentational only — no events.

**Tag:** `tc-entity-profile-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | `''` | Plain text title rendered as an `<h3>` heading in the hero. Acts as a fallback when no `slot="title"` child is present. Native `HTMLElement.title` — no JS getter/setter. |
| `loading` | boolean | `false` | When set, replaces card content with an animated skeleton placeholder. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `meta` | `EntityProfileCardMetaItem[]` | Array of `{ label: string; value: string }` pairs rendered in the meta grid. Not reflected to an attribute — set via property only (use a `ref`). |
| `loading` | `boolean` | Reflected from the `loading` attribute. |

**Events**

None. `tc-entity-profile-card` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `lead` | Optional lead region at the top of the hero (e.g. a `tc-avatar`). |
| `title` | Rich title content — takes priority over the `title` attribute when present. |
| `subtitle` | Optional subtitle text below the title (e.g. a role / team line). |
| `chips` | Optional row of chips below the subtitle (e.g. `tc-badge` elements for tags/skills). |

**Accessibility**

- The title is rendered inside an `<h3>` heading for a correct document outline.
- The meta grid uses `<dl>` / `<dt>` / `<dd>` semantics so label-value pairs are associated for assistive technology.
- During loading, the host receives `role="status"` and `aria-busy="true"`; the inner card receives `aria-hidden="true"`; a visually-hidden `Loading…` text is included for screen readers.
- `prefers-reduced-motion` freezes the skeleton shimmer to a static fill.
- Slotted interactive controls keep their visible focus styles — the card itself is presentational.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-entity-profile-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-entity-profile-card-border-color` | `var(--tc-border)` | 1px hairline border colour. |
| `--bs-entity-profile-card-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-entity-profile-card-hero-gradient-start` | `rgba(0,0,0,0.04)` | Ink gradient start colour for the hero cap. |
| `--bs-entity-profile-card-title-color` | `var(--tc-text)` | Hero title colour. |
| `--bs-entity-profile-card-title-font-size` | `1rem` | Hero title font size. |
| `--bs-entity-profile-card-title-font-weight` | `600` | Hero title font weight. |
| `--bs-entity-profile-card-subtitle-color` | `var(--tc-text-muted)` | Subtitle colour. |
| `--bs-entity-profile-card-subtitle-font-size` | `0.8125rem` | Subtitle font size. |
| `--bs-entity-profile-card-meta-separator` | `var(--tc-border)` | Colour of the 1px separators between meta cells. |
| `--bs-entity-profile-card-meta-label-color` | `var(--tc-text-muted)` | Meta label colour. |
| `--bs-entity-profile-card-meta-label-font-size` | `0.6875rem` | Meta label font size. |
| `--bs-entity-profile-card-meta-label-letter-spacing` | `0.08em` | Meta label letter-spacing. |
| `--bs-entity-profile-card-meta-value-color` | `var(--tc-text)` | Meta value colour. |
| `--bs-entity-profile-card-meta-value-font-size` | `0.875rem` | Meta value font size. |

```html
<!-- Title attribute + meta grid via JS property -->
<tc-entity-profile-card title="Anthropic AI"></tc-entity-profile-card>
<script>
  document.querySelector('tc-entity-profile-card').meta = [
    { label: 'Location', value: 'San Francisco, CA' },
    { label: 'Language', value: 'TypeScript' },
    { label: 'Stars', value: '12.4k' },
    { label: 'Joined', value: 'Jan 2019' },
  ]
</script>

<!-- Slotted lead, title, subtitle, and chips -->
<tc-entity-profile-card>
  <tc-avatar slot="lead" name="Alice Chen" size="lg"></tc-avatar>
  <strong slot="title">Alice Chen</strong>
  <span slot="subtitle">Senior Frontend Engineer · Anthropic</span>
  <tc-badge slot="chips" variant="primary">TypeScript</tc-badge>
  <tc-badge slot="chips" variant="secondary">React</tc-badge>
</tc-entity-profile-card>

<!-- Loading skeleton -->
<tc-entity-profile-card loading></tc-entity-profile-card>
```

---