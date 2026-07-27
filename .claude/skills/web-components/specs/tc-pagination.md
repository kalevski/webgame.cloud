---
component: tc-pagination
---

### tc-pagination

Page navigation controls.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `current` | number | 1 | Current page (1-based) |
| `total` | number | 1 | Total page count |
| `max-visible` | number | 5 | Max visible page buttons |
| `size` | `sm\|lg` | — | Control size |
| `align` | `start\|center\|end` | `start` | Alignment |

**Events:** `tc-page-change` with `{ detail: { page: number } }`

```html
<tc-pagination total="20" current="3" max-visible="7"></tc-pagination>
```

---