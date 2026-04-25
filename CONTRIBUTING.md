# Contributing

Welcome. Keep it small, keep it linked, keep it kind to a future reader.

- **Start here**: [`ONBOARDING.md`](ONBOARDING.md)
- **Navigation**: [`0 - Housekeeping/NAV.md`](0%20-%20Housekeeping/NAV.md)
- **License**: [`LICENSE.md`](LICENSE.md)
- **MOU + CLAs**: [`LEGAL/`](LEGAL/)

---

## Link best practices

Broken links are caught automatically — `npm run check:links` runs before every build and is a required CI step on every PR.

**Internal links (between notes)**

- Always use relative paths from the current file: `` [text](../2%20-%20Projects/README.md) ``
- URL-encode spaces as `%20` — GitHub renders them, Quartz resolves them, and the link checker validates them
- For directory links (no filename), append a trailing slash: `` [Projects](../2%20-%20Projects/) `` — the checker accepts them if a `README.md` or `index.md` exists inside
- Prefer `` [display text](path/to/file.md) `` over bare wikilinks `[[file]]` for anything that needs to survive outside an Obsidian/Quartz context
- Include the `.md` extension — omitting it works in Quartz but breaks the pre-build link checker and raw GitHub rendering

**Anchors / fragments**

- Fragment targets (`#section-heading`) are not validated by the link checker — keep headings stable once linked, or update both ends when renaming
- Use lowercase-hyphenated slugs for headings you intend to link to

**External links**

- External URLs are not checked at build time — verify them manually before committing
- Avoid wrapping bare URLs in backticks (`` `https://...` ``) when you mean to create a clickable link; use `[label](https://...)` instead

**Do not add** `README.md` back to `ignorePatterns` in `quartz.config.ts` — it is intentionally published so that `…/The-Meridian/README` resolves on the live site.

