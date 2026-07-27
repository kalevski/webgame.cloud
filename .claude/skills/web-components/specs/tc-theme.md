---
component: tc-theme
---

### tc-theme

Theming host element — the `--tc-*` token override container. Every `tc-*` component drives its cosmetics through `--bs-<component>-*` custom properties whose defaults resolve to the design-system `--tc-*` tokens (e.g. `--bs-panel-bg: var(--tc-surface)`). Wrapping a subtree in `<tc-theme>` and re-pointing those tokens on it therefore re-skins **every nested component at once** — no per-component overrides needed. The default tokens are already applied globally at `:root`, so components are themed out of the box; reach for `tc-theme` only when you want a *subtree* to differ from the ambient skin.

`tc-theme` is `display: contents` — it adds no layout box. Inherited properties (the `--tc-*` / `--bs-*` custom properties, plus `color` and `font-family`) pass straight through to descendants, but box properties (`background`, `padding`, `border`) will **not** paint because there is no box. For a themed backdrop, wrap the content in [`tc-artboard-backdrop`](#tc-artboard-backdrop) or set the background on your own container.

Two ways to theme a subtree:

1. **Named theme** via the `name` attribute — opt into a bundled skin. `default` is the product (slate) voice applied globally; `dungeon` (gilded fantasy), `aurora` (dark "production-AI"), `sunshine` (warm citrus boutique), `neon` (dark synthwave / cyberpunk, dual magenta + cyan accents), `blueprint` (light vector-blueprint, rounded corners) and `redline` (light performance-dealership skin — showroom canvas, crimson signature accent, technical-blue highlight, dark navbar/footer/hero chrome, diagonal speed-cut corners) are opt-in skins that stay inert until a `tc-theme` wrapper requests them. Each named skin is scoped under `tc-theme[name="…"]` (a plain wrapper carrying `[data-tc-theme="…"]` is matched too). The `dungeon`, `aurora`, `sunshine`, `neon`, `blueprint` and `redline` skins reference display fonts (Cinzel / EB Garamond for dungeon; Orbitron / Ubuntu Mono for neon; Space Grotesk / Chakra Petch for blueprint; Oswald / Roboto for redline) that are **not** bundled — load them on the host page for the full look; all degrade to system serifs/sans.
2. **Ad-hoc token overrides** — set `--tc-*` (or the finer-grained `--bs-<component>-*`) custom properties directly on the `tc-theme` element via `style` or a class. Because the tokens inherit through the `display: contents` box, every descendant component picks them up.

Every named theme additionally ships eleven **accent variants** selected with the `variant` attribute: `ocean` (blue / cyan), `forest` (green / lime), `ember` (orange / gold), `royal` (violet / magenta), `mint` (teal / mint), `rose` (rose / pink), `crimson` (red / coral), `indigo` (indigo / periwinkle), `slate` (steel / silver), and two gradient variants whose primary is a two-tone sweep instead of a flat colour: `sunset` (coral → orange) and `twilight` (violet → blue). A variant swaps **only the primary and secondary accent colours** (and their derived hovers, soft tints, glows, gradients, focus rings and link colours) — canvas, surfaces, text ramp, semantic status colours and the theme's structure stay untouched: `<tc-theme name="blueprint" variant="ocean">` (or `[data-tc-theme="blueprint"][data-tc-variant="ocean"]` on a plain wrapper).

**Tag:** `tc-theme`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `default\|dungeon\|aurora\|sunshine\|neon\|blueprint\|redline` | — | Selects a bundled named theme for the wrapped subtree. Absent → the subtree inherits the ambient (global `:root`) theme. Unrecognised values simply match no theme scope, so the subtree keeps the inherited skin. |
| `variant` | `ocean\|forest\|ember\|royal\|mint\|rose\|crimson\|indigo\|slate\|sunset\|twilight` | — | Accent variant of the named theme — swaps only the primary and secondary accent colours (plus derived hovers, tints, glows, focus rings and links). Requires `name`; absent → the theme's base accents. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Reflects the `name` attribute. Returns `''` when absent. Setting a truthy value writes the attribute; setting `''`/falsy removes it. |
| `variant` | `string` | Reflects the `variant` attribute. Returns `''` when absent. Setting a truthy value writes the attribute; setting `''`/falsy removes it. |

**Events**

None.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | The themed subtree. Rendered in place (the host is `display: contents`, so children participate in the parent's layout directly — no projection, no wrapper box). |

**CSS Custom Properties**

`tc-theme` defines no custom properties of its own — it is a passthrough host for the design-system tokens. Override any `--tc-*` token (or `--bs-<component>-*` contract variable) on the element to re-skin its descendants. Common roots: `--tc-surface`, `--tc-surface-muted`, `--tc-border`, `--tc-text`, `--tc-text-muted`, `--tc-accent`, `--tc-app-accent`, `--tc-success`/`--tc-info`/`--tc-warning`/`--tc-danger`, `--tc-font-sans`, `--tc-font-mono`.

Ergonomics floor tokens (defined at `:root`, overridable like any `--tc-*` token):

| Token | Default | Description |
|-------|---------|-------------|
| `--tc-min-touch-target` | `44px` | Coarse-pointer hit-area floor — pagination, tables, icon buttons, sliders, form controls, and the dashboard toggle resolve their `@media (pointer: coarse)` hit areas from it (44px = iOS HIG; bump app-side for strict Android 48dp). |
| `--tc-control-height` | `2.375rem` | Minimum inner height of text controls; `max()`'d with the touch target on coarse pointers. |
| `--tc-font-size-min` | `12px` | Legibility floor — clamped via `max()` in badge, eyebrow, and side-nav captions. |

```html
<!-- Named theme — re-skins the whole subtree to the dungeon palette -->
<tc-theme name="dungeon">
    <tc-panel bordered>
        <tc-panel-header heading="Quest Log"></tc-panel-header>
        <tc-button variant="primary">Accept</tc-button>
    </tc-panel>
</tc-theme>

<!-- Accent variant — same dungeon skin, blue/cyan accents instead of the base pair -->
<tc-theme name="dungeon" variant="ocean">
    <tc-button variant="primary">Accept</tc-button>
</tc-theme>

<!-- Ad-hoc token overrides — recolour nested components via --tc-* tokens -->
<tc-theme style="--tc-accent: #7c3aed; --tc-app-accent: #7c3aed; --tc-border: #e9d5ff; --tc-surface-muted: #faf5ff;">
    <tc-card>
        <tc-button variant="primary">Themed action</tc-button>
        <tc-badge variant="primary">New</tc-badge>
    </tc-card>
</tc-theme>

<!-- Untouched components outside the wrapper keep the global default skin -->
<tc-button variant="primary">Default action</tc-button>
```

---