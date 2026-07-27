---
component: tc-code-snippet
---

### tc-code-snippet

Syntax-highlighted code block with a copy button, language label, optional title, and loading skeleton. Dark ink surface; JetBrains Mono throughout; sharp corners everywhere.

**Tag:** `tc-code-snippet`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `code` | string | `''` | Source code to display. Also settable via the JS `code` property or via text content (slotted fallback on first connect). |
| `language` | `'javascript' \| 'typescript' \| 'bash'` | `'javascript'` | Syntax-highlight language and label shown in the header. |
| `title` | string | — | Optional filename / label shown on the left of the header. When absent, the language name is shown instead. |
| `show-copy-button` | `'false'` to hide | `true` (shown by default) | Set `show-copy-button="false"` to hide the copy button. |
| `loading` | boolean (presence) | `false` | Renders a shimmer skeleton instead of the code block. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `code` | `string` | Reflects the `code` attribute. Setting this is equivalent to `setAttribute('code', value)`. |
| `language` | `CodeSnippetLanguage` | Reflects the `language` attribute. |
| `title` | `string` | Native `HTMLElement.title` — reflects the `title` attribute. |
| `showCopyButton` | `boolean` | Reflects `show-copy-button`. Set to `false` to remove `show-copy-button="false"` attribute. |
| `loading` | `boolean` | Reflects the `loading` boolean attribute. |
| `onCopy` | `((code: string) => void) \| null` | Optional callback invoked after a successful clipboard write (alongside the `tc-copy` event). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-copy` | `{ code: string }` | Fired (bubbles, composed) when the user successfully copies code to the clipboard. |

**Slots**

| Slot | Description |
|------|-------------|
| *(default / text content)* | When no `code` attribute is present on first connect, the element's `textContent` is captured as the initial code. Setting the `code` attribute or JS property after that takes precedence. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-code-snippet-border` | `1px solid var(--tc-border)` | Outer border. |
| `--bs-code-snippet-header-bg` | `var(--tc-ink-2)` | Header strip background. |
| `--bs-code-snippet-header-padding` | `0.375rem 0.5rem 0.375rem 0.75rem` | Header padding. |
| `--bs-code-snippet-title-color` | `var(--tc-text-muted)` | Title/label text color. |
| `--bs-code-snippet-copy-color` | `var(--tc-text-muted)` | Copy-button icon color. |
| `--bs-code-snippet-copy-hover-bg` | `rgba(255,255,255,0.08)` | Copy-button hover fill. |
| `--bs-code-snippet-code-bg` | `var(--tc-ink)` | Code surface background. |
| `--bs-code-snippet-code-color` | `var(--tc-text-inverse)` | Code text color. |
| `--bs-code-snippet-code-font-size` | `0.875rem` | Code font size. |
| `--bs-code-snippet-tok-keyword` | `#88aacc` | Token color — keywords. |
| `--bs-code-snippet-tok-string` | `#99cc88` | Token color — strings. |
| `--bs-code-snippet-tok-comment` | `#6a7a8c` | Token color — comments. |
| `--bs-code-snippet-tok-number` | `#cc9966` | Token color — numbers. |
| `--bs-code-snippet-tok-variable` | `#cc88aa` | Token color — bash variables. |

```html
<!-- JavaScript snippet (attribute) -->
<tc-code-snippet language="javascript" code="const x = 42;"></tc-code-snippet>

<!-- TypeScript with filename title -->
<tc-code-snippet language="typescript" title="src/index.ts" code="type ID = string | number;"></tc-code-snippet>

<!-- Bash, copy button hidden -->
<tc-code-snippet language="bash" show-copy-button="false" code="npm install"></tc-code-snippet>

<!-- Slotted text content fallback -->
<tc-code-snippet language="javascript">
const answer = 42;
</tc-code-snippet>

<!-- Loading skeleton -->
<tc-code-snippet loading></tc-code-snippet>
```

```js
// JS-property usage + event listener
const el = document.querySelector('tc-code-snippet')
el.code = 'console.log("hello")'
el.onCopy = (code) => console.log('Copied:', code)
el.addEventListener('tc-copy', (e) => console.log('detail:', e.detail.code))
```

---