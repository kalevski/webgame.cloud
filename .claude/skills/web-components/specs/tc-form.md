---
component: tc-form
---

### tc-form

Form wrapper with HTML5 constraint validation.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `validated` | boolean | false | Show validation feedback |
| `novalidate` | boolean | false | Disable native validation UI |

**Methods**

| Method | Returns | Description |
|--------|---------|-------------|
| `validate()` | `boolean` | Submit-time gate mirroring native constraint validation: calls `reportValidity()` on the inner form (every invalid control receives an `invalid` event, flipping toolcase inputs to their submitted state so inline errors render), adds the `was-validated` chrome when invalid, and returns overall validity. Use it to gate programmatic submits (e.g. a modal footer button outside the form). |
| `resetValidity()` | `void` | Returns every control to its pristine (no visible errors) state without touching values — call when reopening a dialog or after a successful submit. Removes the `was-validated` chrome and invokes `resetValidity()` on each form-associated control that exposes it. |

```html
<tc-form novalidate>
    <tc-input label="Name" required></tc-input>
    <tc-button type="submit" variant="primary">Submit</tc-button>
</tc-form>

<script>
    // Programmatic gating, e.g. from a modal footer:
    const form = document.querySelector('tc-form')
    if (form.validate()) saveAndClose()
    // Later, when reopening the dialog:
    form.resetValidity()
</script>
```

---