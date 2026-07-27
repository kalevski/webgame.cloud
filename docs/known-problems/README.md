# Known problems

Bugs and sharp edges that are understood but not fully fixed everywhere. Each file describes one problem:
what you see, why it happens, where it bites, and the proposed fix. When you fix one everywhere, delete
its file.

These are deliberately separate from `docs/<feature>.md` — a feature doc describes what ships and works, a
known problem describes a trap you will otherwise re-discover the hard way.

| Problem | Status |
| --- | --- |
| [filter-input-loses-focus.md](filter-input-loses-focus.md) | Fixed in `RetentionAdmin`; the same pattern is still present in six other modules. |
