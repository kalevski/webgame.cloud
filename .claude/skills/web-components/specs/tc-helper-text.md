---
component: tc-helper-text
---

### tc-helper-text

Contextual helper text with a leading lucide icon. Pair with form inputs via `aria-describedby`.

**Tag:** `tc-helper-text`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | — | Text content. When set, takes precedence over slotted children |
| `variant` | `default\|success\|warning\|error` | `default` | Controls icon and color |
| `icon` | string | — | Lucide icon name in PascalCase (e.g. `HelpCircle`). Overrides the variant default |
| `class-name` | string | — | Extra CSS classes merged onto the rendered wrapper |
| `id` | string | — | Forwarded to the rendered wrapper element for `aria-describedby` pairing |

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Helper text content when the `text` attribute is not set. Supports rich inline markup (links, emphasis, etc.) |

**Default icons per variant**

| Variant | Icon |
|---------|------|
| `default` | `Info` |
| `success` | `CheckCircle` |
| `warning` | `AlertTriangle` |
| `error` | `AlertCircle` |

**Events**

None. `tc-helper-text` is purely presentational.

**Accessibility**

- The leading icon is marked `aria-hidden="true"` (decorative).
- Set `id` on `tc-helper-text` and `aria-describedby` on the paired input to expose the hint to assistive technology.

```html
<!-- All four variants -->
<tc-helper-text variant="default" text="We'll never share your email"></tc-helper-text>
<tc-helper-text variant="success" text="Your password is strong"></tc-helper-text>
<tc-helper-text variant="warning" text="This field will be publicly visible"></tc-helper-text>
<tc-helper-text variant="error" text="Password must be at least 8 characters"></tc-helper-text>

<!-- Slotted children (rich content) -->
<tc-helper-text variant="error">Email already in use — <a href="/login">sign in instead</a></tc-helper-text>

<!-- Custom icon -->
<tc-helper-text variant="default" icon="HelpCircle" text="Need help? See our docs"></tc-helper-text>

<!-- Paired with an input via aria-describedby -->
<input id="email" type="email" aria-describedby="email-hint" />
<tc-helper-text id="email-hint" variant="default" text="We'll never share your email"></tc-helper-text>
```

---