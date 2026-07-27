---
component: tc-carousel
---

### tc-carousel

Slideshow component with built-in slide/fade behavior.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `controls` | boolean | false | Show prev/next buttons |
| `indicators` | boolean | false | Show dot indicators |
| `fade` | boolean | false | Crossfade transition |
| `ride` | `carousel\|false` | false | Autoplay on load |
| `interval` | number | 5000 | Slide interval (ms) |
| `pause` | `hover\|false` | `hover` | Pause on hover |

**Methods:** `next()`, `prev()`, `to(index)`, `cycle()`, `pause()`

**Events:** `tc-slide`, `tc-slid`

```html
<tc-carousel controls indicators ride="carousel" interval="3000">
    <div>Slide 1</div>
    <div>Slide 2</div>
    <div>Slide 3</div>
</tc-carousel>
```

---