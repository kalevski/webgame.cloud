---
component: tc-code-label-cell
---

### tc-code-label-cell

**Tag:** `tc-code-label-cell`

Machine-facing code chip alongside a human-readable display name. Purely presentational — designed to drop into table or list cells.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `code` | string | `""` | The machine-facing identifier (rendered in a mono chip). |
| `name` | string | `""` | The human-readable display name rendered beside the code chip. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `code` | `string` | Reflects the `code` attribute. |
| `name` | `string` | Reflects the `name` attribute. |

**Events**

None. `tc-code-label-cell` is purely presentational.

**Slots**

None. All content is generated from attributes.

**Accessibility**

The `<code>` element semantically marks the machine identifier. Both values are escaped before injection so user-supplied strings cannot inject markup.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-code-label-cell-gap` | `0.5rem` | Gap between the code chip and the name. |
| `--bs-code-label-cell-code-padding-x` | `0.375rem` | Horizontal padding of the code chip. |
| `--bs-code-label-cell-code-padding-y` | `0.125rem` | Vertical padding of the code chip. |
| `--bs-code-label-cell-code-font-size` | `0.75rem` | Font size of the code chip text. |
| `--bs-code-label-cell-code-font-weight` | `500` | Font weight of the code chip text. |
| `--bs-code-label-cell-code-color` | `var(--tc-text)` | Text color of the code chip. |
| `--bs-code-label-cell-code-bg` | `var(--tc-surface-muted)` | Background color of the code chip. |
| `--bs-code-label-cell-code-border` | `1px solid var(--tc-border)` | Border of the code chip. |
| `--bs-code-label-cell-name-font-size` | `0.875rem` | Font size of the name text. |
| `--bs-code-label-cell-name-color` | `var(--tc-text-muted)` | Color of the name text. |

```html
<!-- Basic usage -->
<tc-code-label-cell code="USR_001" name="Alice Johnson"></tc-code-label-cell>
<tc-code-label-cell code="PRD_42" name="Premium Widget"></tc-code-label-cell>

<!-- Inside a table cell -->
<table>
    <tr>
        <td>
            <tc-code-label-cell code="INV-0001" name="Monthly subscription"></tc-code-label-cell>
        </td>
        <td>Paid</td>
        <td>$49.00</td>
    </tr>
</table>
```

---