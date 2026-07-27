---
component: tc-accordion-item
---

### tc-accordion-item

Single panel inside a `tc-accordion`. Renders a clickable header button and a collapsible body region; default slot content becomes the body.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `header` | string | — | Text for the clickable header button |
| `open` | boolean | false | Expanded state of this item |

**Events:** `tc-show`, `tc-shown`, `tc-hide`, `tc-hidden`

```html
<tc-accordion>
    <tc-accordion-item header="Details" open>
        <p>Any body content goes here.</p>
    </tc-accordion-item>
</tc-accordion>
```

---