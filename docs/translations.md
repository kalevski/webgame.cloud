# Translations

A Tools page (`/projects/:id/tools/translations`) for writing game copy: **words organized into groups**
(UI, dialogue, items, …), each word translated into **any number of languages**. It is not asset-based —
translations are project data, stored server-side and edited in place, closest in spirit to config data
(change the game's text without touching a build).

## Data model — one document per project

One row per project in **`project_translations`** (`project_id` unique among live rows), holding the whole
document as jsonb:

```
{ languages: ['en', 'de'], groups: [ { id, name, terms: [ { id, term, values: { en: 'Play' } } ] } ] }
```

Types live in `contracts/translations.ts` (`TranslationDoc`, `TranslationGroup`, `TranslationTerm`), along
with `TRANSLATION_LIMITS` (16 languages, 64 groups, 500 terms per group, capped term/value lengths),
`LANGUAGE_CODE_PATTERN` (`en`, `pt-BR` style codes) and the `COMMON_LANGUAGES` picker catalog. The editor
edits a client-side copy and writes the whole document on Save — last write wins, no per-cell endpoints.

## API

- `GET /api/projects/:id/translations` — any member; returns the document (an empty one before first save).
- `PUT /api/projects/:id/translations` — requires the **`config.write`** project permission (translations
  are live game data, same plane as configs). Body is `{ doc }`, schema-validated for shape and caps;
  `TranslationService.sanitize` then enforces language codes, unique group names, unique terms per group,
  and drops values for languages no longer in the list (so removing a language clears its column on save).
  Rejections use the `translations_invalid` code with a detail param.

`TranslationRepository.saveDoc` upserts against the partial unique index
(`ON CONFLICT (project_id) WHERE deleted_at IS NULL`).

## The editor (`modules/TranslationsTool.tsx`)

State flows through `state/translations.slice.ts`: `translationsDoc` (working copy), `translationsSaved`
(last server state), plus fetch/update/discard/save actions. Dirty = deep compare of the two; Save and
Discard only appear when they differ.

Layout: a toolbar (overall **coverage meter** — filled cells over terms × languages — the language chip
row with an add-language searchable select, and Save/Discard), a **groups rail** (per-group word count and
coverage %, Enter-to-add group input), and the **matrix**: one row per word, one column per language.

The matrix is built for fast entry:

- every cell is an **uncontrolled input** committing on blur — nothing re-renders while typing;
- **Enter commits and jumps to the next empty cell in that language**, so a pass down a column skips what
  is already translated and stops only where work is left; when the column is finished it falls through to
  the add-word input at the bottom;
- the add-word row keeps focus after Enter for rapid word capture;
- the **word column is sticky** — it stays pinned while the language columns scroll sideways, so a wide
  document never leaves you guessing which row you are typing into;
- each language column header carries a micro **coverage bar** plus a `filled/total` count; a fully
  translated row gets a green left accent; an empty cell carries a hairline underline and an em-dash
  placeholder;
- **Missing only** in the matrix header filters the group down to words that still have a gap, and shows
  how many there are; with nothing missing it says so instead of reading as "no matches";
- the filter box matches **words and translations**, so you can find a row by the German you typed into it;
- the word column doubles as inline rename; a hover-revealed × removes a word (staged, like every other
  edit, until Save); the group title above the matrix renames the group the same way;
- **⌘/Ctrl + S saves** whenever there are unsaved changes, and leaving the page with unsaved changes asks
  the browser to confirm;
- with no languages yet the matrix shows the add-language picker inline rather than only naming the
  problem.

Callers without `config.write` see everything read-only with a hint (`strings.tools.translationsReadonly`).
All copy lives in `strings.tools`; styles in `styles/modules/_translations.scss`.
