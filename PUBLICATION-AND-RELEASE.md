# Publication, release, and interop (ideation)

**Context:** This repo is the **shared knowledge base** for the guild. A **separate** repository (or repositories) will hold **publications**, **vault snippets**, or other outward-facing exports. You may also **split projects into their own repos** for publication later. This document sketches **protocols and frontmatter** so that process can be automated; if automation never lands, the same fields still help humans run a consistent release and avoid broken links.

---

## 1. Why interop and redaction matter

- **Obsidian-style links** (`[[Note]]`, `[[path/to/Note|alias]]`, or relative `../other-project/foo`) assume a **single vault** or a known tree. Publishing **only a subset** (one project, one folder) to another repo or a static site **breaks** any link whose target is not in the same publish bundle.
- **Cross-project references** in this shared repo are convenient for day-to-day work; they are **not** safe to copy verbatim into a publication without either:
  - including the **closure** of all linked notes in the same release, or
  - **redacting** / replacing links with plain text, external URLs, or “see also” lists that point to already-published material.

**Rule:** treat every release as a **bundle** with an explicit **link closure** (all targets included or links rewritten) or run a **redaction pass** that lists broken targets for manual fix.

---

## 2. Future automation (sketch)

A release job (CI, local script, or static-site generator) could:

1. Select files by `release_track`, `status`, or a manifest.
2. Resolve wikilinks and markdown links against the **bundle**; fail or warn on external-to-bundle targets.
3. Apply a **redaction map** (replace path prefixes, strip internal-only sections).
4. Emit to a `publications` repo, a `dist/` folder, or a per-project publish repo.

Until that exists, use the same frontmatter **manually** in reviews.

---

## 3. Proposed frontmatter (per note)

Use optional fields; tools can ignore unknown keys.

```yaml
# Proposed — not all files need every key
title: "Human-readable title"
status: draft | review | shared | release-candidate | published-externally
audience: internal | shared | public

# Release / bundling
release_track: none | publications | project-<slug> | vault-snippets
publish_bundle: null | string   # e.g. "mapmakers-onboarding-2026" — all notes with same value ship together
link_closure_required: true     # if true, automation should check wikilinks sit inside bundle

# Redaction
redaction_level: none | names | internal-paths | full-pass
publishing_notes: "Replace [[SecretProject]] with public name X before export"

# Interop / dependencies (for checklists)
depends_on_published: []         # list of slugs/URLs that must exist before this note is valid on the public site
replaces_link_to: []             # explicit “this note supersedes broken link to …”
```

**`status`**

- `shared` — lives in this repo, guild-visible; not necessarily on a public site.  
- `release-candidate` — reviewed for export.  
- `published-externally` — also copied to a publication repo or site; keep in sync or link to canonical URL.

**`release_track`**

- `none` — not slated for a publication pipeline.  
- `publications` — staged for the separate publications / snippets repo.  
- `project-<slug>` — staged for a **project-scoped** publish repo (e.g. one repo per product).

---

## 4. Alternatives if you never automate

- **Per-project git repos** for public docs: copy or subtree only the folders that belong; fix links in the smaller tree by hand.  
- **One manifest** (`release-manifest.json`) listing paths to copy per release, maintained next to this doc.  
- **Chunk size:** smaller publish repos = fewer cross-links to resolve; more repos = more boundary maintenance.

---

## 5. Relationship to this repo and Egregore

| Store | Role |
| --- | --- |
| Egregore `memory/` | Private operational mind. |
| **This repo (shared KB)** | Durable guild knowledge; may still be private to the org on GitHub. |
| **Publications / vault snippets (future repo)** | Material explicitly prepared for a wider or external audience. |
| **Per-project publish repos** | Optional; good when interop with other projects is small. |

See also [EGREGORE-VS-SHARED-KB.md](./EGREGORE-VS-SHARED-KB.md) and [EGREGORE-INTEROP.md](./EGREGORE-INTEROP.md).
