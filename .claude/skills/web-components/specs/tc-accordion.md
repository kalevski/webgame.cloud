---
component: tc-accordion
---

### tc-accordion

Collapsible accordion container. Wrap `tc-accordion-item` children inside to build a group where only one item can be open at a time (unless `always-open` is set).

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `flush` | boolean | false | Removes borders and rounded corners so the accordion sits edge-to-edge with its parent |
| `always-open` | boolean | false | Allows multiple items to be expanded simultaneously |

```html
<tc-accordion>
    <tc-accordion-item header="First item" open>Body of the first item.</tc-accordion-item>
    <tc-accordion-item header="Second item">Body of the second item.</tc-accordion-item>
    <tc-accordion-item header="Third item">Body of the third item.</tc-accordion-item>
</tc-accordion>
```

---