---
component: tc-faq-list
---

### tc-faq-list

Collapsible FAQ accordion with optional JSON-LD `FAQPage` schema generation for SEO. Items are fully independent — multiple panels may be open simultaneously. The chevron rotates with a CSS transition that honours `prefers-reduced-motion`.

**Tag:** `tc-faq-list`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `schema` | boolean | false | When present, renders an inline `<script type="application/ld+json">` containing a `FAQPage` JSON-LD object built from `items` |
| `title` | string | — | Text title rendered as an `<h2>` above the list. When absent, slotted children fill the title region instead |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `items` | `FAQItem[]` | FAQ entries — set via JS property (not attribute) |
| `defaultOpen` | `number[]` | Indices of items expanded on first render |
| `onToggle` | `((index: number, open: boolean) => void) \| null` | Optional callback fired alongside `tc-toggle` |

Each `FAQItem`:

| Field | Type | Description |
|-------|------|-------------|
| `question` | string | The question text shown in the collapsible header button |
| `answer` | string | The answer text shown in the collapsible panel |

**Events:** `tc-toggle` with `{ detail: { index: number, open: boolean } }`

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Title content rendered above the FAQ list when the `title` attribute is absent. Preserved across re-renders. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-faq-list-border` | `var(--tc-border)` | Outer border and separator colour |
| `--bs-faq-list-bg` | `var(--tc-surface)` | Background colour |
| `--bs-faq-list-question-color` | `var(--tc-text)` | Question text and chevron colour |
| `--bs-faq-list-answer-color` | `var(--tc-text-muted)` | Answer text colour |
| `--bs-faq-list-hover-bg` | `var(--tc-surface-muted)` | Question row hover fill |
| `--bs-faq-list-question-font-size` | `0.8125rem` | Question font size |
| `--bs-faq-list-answer-font-size` | `0.78125rem` | Answer font size |
| `--bs-faq-list-padding-x` | `0.875rem` | Horizontal padding |
| `--bs-faq-list-padding-y` | `0.6875rem` | Vertical padding |
| `--bs-faq-list-chevron-size` | `1rem` | Chevron icon size |

```html
<!-- Basic FAQ list with title attribute -->
<tc-faq-list id="faq" title="Frequently Asked Questions"></tc-faq-list>
<script>
  document.getElementById('faq').items = [
    { question: 'What is this?', answer: 'A collapsible FAQ component.' },
    { question: 'Is it accessible?', answer: 'Yes — aria-expanded, aria-controls, role="region", and visible focus.' },
  ]
</script>

<!-- With JSON-LD schema for SEO -->
<tc-faq-list id="faq-schema" title="FAQ" schema></tc-faq-list>
<script>
  document.getElementById('faq-schema').items = [
    { question: 'Do I need a framework?', answer: 'No — use plain HTML.' },
  ]
</script>

<!-- Default-open items and tc-toggle event -->
<tc-faq-list id="faq-open" title="FAQ"></tc-faq-list>
<script>
  const el = document.getElementById('faq-open')
  el.items = [
    { question: 'First item', answer: 'Open by default.' },
    { question: 'Second item', answer: 'Closed by default.' },
  ]
  el.defaultOpen = [0]
  el.addEventListener('tc-toggle', e => console.log(e.detail.index, e.detail.open))
</script>

<!-- Slotted title -->
<tc-faq-list id="faq-slot">
  <span>Custom <strong>slotted</strong> title</span>
</tc-faq-list>
<script>
  document.getElementById('faq-slot').items = [
    { question: 'Question', answer: 'Answer.' },
  ]
</script>
```

---