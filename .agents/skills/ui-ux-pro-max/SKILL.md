---
name: ui-ux-pro-max
description: Short UI/UX lookup. Use only when the user asks for a design or UX pass.
---

# ui-ux-pro-max

Do not read the CSV files or paste search dumps into the chat. Run one search, then follow this project's components and tokens.

```bash
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<product> <keywords>" --design-system -f markdown -n 1
```

If `python` is missing on Windows, use `py`. Do not install Python unless the user asks.

Run a second search only when the first result does not answer the question:

```bash
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain ux -n 2
```

Keep cursor, hover, focus, contrast, and reduced motion. Do not add a new palette, font, or UI library. Do not write `design-system/MASTER.md` unless the user asks to save it.
