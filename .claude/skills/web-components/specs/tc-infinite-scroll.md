---
component: tc-infinite-scroll
---

### tc-infinite-scroll

Intersection Observer wrapper that dispatches `tc-load-more` when its sentinel element enters the viewport. Compose your scrolled content as light-DOM children; use `data-slot="loading"` and `data-slot="end"` to provide custom slot content for the loading and end states. When `has-more` is absent, the sentinel stops observing and the end region appears. While `loading` is present, further `tc-load-more` dispatches are suppressed and the loading region is shown. Sharp corners; slate neutrals only.

**Tag:** `tc-infinite-scroll`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `has-more` | boolean | absent | When present, the sentinel is observed and `tc-load-more` can fire. When absent, observing stops and the end region is revealed. |
| `loading` | boolean | absent | When present, `tc-load-more` dispatches are suppressed and the loading region is shown. Remove when the fetch completes to resume. |
| `threshold` | number | `0` | IntersectionObserver `threshold` — fraction of the sentinel that must be visible to trigger (0–1). |
| `root-margin` | string | `'0px'` | IntersectionObserver `rootMargin` — margin around the root for intersection calculation (e.g. `'200px'` for early loading). |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hasMore` | `boolean` | `false` | Reflects the `has-more` boolean attribute. |
| `loading` | `boolean` | `false` | Reflects the `loading` boolean attribute. |
| `threshold` | `number` | `0` | Reflects the `threshold` attribute. |
| `rootMargin` | `string` | `'0px'` | Reflects the `root-margin` attribute. |
| `onLoadMore` | `(() => void) \| null` | `null` | Optional callback fired alongside the `tc-load-more` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-load-more` | `{}` | Dispatched once when the sentinel enters the viewport and both `has-more` is set and `loading` is not. Resets after `loading` is removed. |

**Slots (light DOM via `data-slot`)**

| Slot | Selector | Description |
|------|----------|-------------|
| loading | `[data-slot="loading"]` | Custom content shown while the `loading` attribute is present. Falls back to a small slate spinner and a visually-hidden "Loading…" label. |
| end | `[data-slot="end"]` | Custom content shown when `has-more` is absent (all pages loaded). Falls back to an uppercase mono "End" micro-label. |
| *(default)* | any child without `data-slot` | Scrolled list items placed in the content container before the sentinel. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-infinite-scroll-row-gap` | `0.5rem` | Gap between items inside the loading/end rows. |
| `--bs-infinite-scroll-row-padding` | `0.75rem 0` | Padding of the loading and end rows. |
| `--bs-infinite-scroll-loading-color` | `var(--tc-text-muted)` | Color of the loading row content. |
| `--bs-infinite-scroll-end-color` | `var(--tc-text-faint)` | Color of the end row content. |
| `--bs-infinite-scroll-end-font-size` | `0.6875rem` | Font size of the default "End" micro-label. |
| `--bs-infinite-scroll-spinner-size` | `1rem` | Width/height of the default loading spinner. |
| `--bs-infinite-scroll-spinner-border-width` | `2px` | Border width of the default loading spinner ring. |

**Example**

```html
<div style="max-height: 400px; overflow-y: auto;">
  <tc-infinite-scroll id="feed" has-more="">
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>
    <!-- more items appended here -->
    <div data-slot="loading">Fetching…</div>
    <div data-slot="end">All caught up!</div>
  </tc-infinite-scroll>
</div>

<script>
  const feed = document.getElementById('feed')
  let page = 0

  feed.addEventListener('tc-load-more', async () => {
    feed.setAttribute('loading', '')
    const newItems = await fetchPage(++page)
    newItems.forEach(text => {
      const div = document.createElement('div')
      div.className = 'item'
      div.textContent = text
      // insert before the sentinel (first child of the content container)
      feed.querySelector('.tc-infinite-scroll-content').appendChild(div)
    })
    if (page >= 4) feed.removeAttribute('has-more')
    feed.removeAttribute('loading')
  })

  // Or use the callback property:
  feed.onLoadMore = () => console.log('load more triggered')
</script>
```

---