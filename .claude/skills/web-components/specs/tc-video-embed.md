---
component: tc-video-embed
---

### tc-video-embed

Responsive embedded video player. Detects the provider from the `src` URL: YouTube (`youtube.com` / `youtu.be`), Vimeo (`vimeo.com`), and Loom (`loom.com`) build the correct iframe embed URL (the video id is parsed robustly from the various URL forms); any other / native source (`.mp4`, `.webm`, …) renders a `<video>`. A responsive aspect-ratio frame (`--bs-video-embed-aspect`, default `16/9`) reserves the height and the media fills it. `autoplay` / `loop` / `muted` / `controls` are forwarded as the provider's query params (iframe) or as element attributes (native video). Sharp corners, a hairline frame, ink/muted backdrop while loading — no status color, no shadow beyond the optional small token. Presentational: no events.

**Tag:** `tc-video-embed`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | string | — | Required source URL. The provider (YouTube / Vimeo / Loom / native) is detected from it. |
| `poster` | string | — | Poster image for the native `<video>`. Ignored by iframe providers. |
| `aspect-ratio` | number | `1.7778` (`16/9`) | Numeric aspect ratio driving the responsive frame (width ÷ height). |
| `autoplay` | boolean | `false` | Autoplay the video. Implies `muted` (browser policy); suppressed under `prefers-reduced-motion`. |
| `loop` | boolean | `false` | Loop playback. For YouTube this also sets the required `playlist` param. |
| `muted` | boolean | `false` | Start muted. |
| `controls` | boolean | `true` | Show player controls. Set `controls="false"` to hide them. |
| `title` | string | `Video` (iframe) | Accessible title for the iframe / native `<video>`. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string \| null` | `null` | Reflects the `src` attribute. |
| `poster` | `string \| null` | `null` | Reflects the `poster` attribute. |
| `aspectRatio` | `number` | `1.7778` | Reflects the `aspect-ratio` attribute (parsed). |
| `autoplay` | `boolean` | `false` | Reflects the `autoplay` attribute. |
| `loop` | `boolean` | `false` | Reflects the `loop` attribute. |
| `muted` | `boolean` | `false` | Reflects the `muted` attribute. |
| `controls` | `boolean` | `true` | Reflects the `controls` attribute. |

**Events**

None — the component is presentational.

**Slots**

None.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-video-embed-aspect` | `1.7777777778` | Aspect ratio of the frame (overwritten inline from the `aspect-ratio` attribute). |
| `--bs-video-embed-bg` | `var(--tc-ink)` | Backdrop behind the media. |
| `--bs-video-embed-loading-bg` | `var(--tc-surface-muted)` | Frame fill shown while the media loads. |
| `--bs-video-embed-border` | `var(--tc-border)` | 1px hairline framing the media. |
| `--bs-video-embed-radius` | `0` | Corner radius (sharp by default). |
| `--bs-video-embed-shadow` | `none` | Optional shadow (e.g. `var(--tc-shadow-sm)`). |

**Example**

```html
<!-- YouTube -->
<tc-video-embed src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="Demo"></tc-video-embed>

<!-- Vimeo, autoplay + loop (autoplay implies muted) -->
<tc-video-embed src="https://vimeo.com/76979871" autoplay loop></tc-video-embed>

<!-- Native .mp4 with poster -->
<tc-video-embed
  src="https://example.com/clip.mp4"
  poster="https://example.com/clip.jpg"
  controls="true"
  title="Product walkthrough"
></tc-video-embed>

<!-- Square (non-16:9) frame -->
<tc-video-embed src="https://youtu.be/dQw4w9WgXcQ" aspect-ratio="1"></tc-video-embed>
```

---