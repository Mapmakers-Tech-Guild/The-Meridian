# Publication, release, and interop (ideation)

**Context:** This repo is the **Mapmakers shared** knowledge base. A **separate** repository (or per-project repos) can hold **publications**, **vault snippets**, or outward exports. This doc sketches **protocols and frontmatter** for possible automation; humans can use the same fields for review.

---

## 1. Why interop and redaction matter

- **Obsidian-style links** (`[[Note]]`, relative `../other-project/foo`) assume a **known tree**. Exporting a **subset** breaks links to notes **outside** the bundle.
- **Cross-project** references in this repo are fine for daily work; for export, use **link closure** (ship all targets) or **redaction** / rewrites.

**Rule:** every release = a **bundle** with explicit closure, or a **redaction pass** listing broken targets.

---

## 2. Future automation (sketch)

1. Select by `status` / `release_track` / manifest.  
2. Resolve wikilinks against the **bundle**; warn on out-of-bundle targets.  
3. **Redaction map** (path prefixes, strip internal sections).  
4. Emit to publications repo, `dist/`, or per-project remote.

---

## 3. Proposed frontmatter (per note)

```yaml
title: "Human-readable title"
status: draft | review | shared | release-candidate | published-externally
audience: internal | shared | public
release_track: none | publications | project-<slug> | vault-snippets
publish_bundle: null | string
link_closure_required: true
redaction_level: none | names | internal-paths | full-pass
publishing_notes: "Replace [[X]] with public name Y"
depends_on_published: []
replaces_link_to: []
```

(See full semantics in prior commits if you need the long version — `status` / `release_track` values unchanged.)

---

## 4. Alternatives without automation

- **Per-project git repos** for public docs.  
- **`release-manifest.json`** next to this file.  
- **Smaller publish repos** = fewer cross-links; **more repos** = more boundaries to maintain.

---

## 5. Relationship to this repo and Egregore

| Store | Role |
| --- | --- |
| Egregore `memory/` | Private operational mind. |
| **This repo (Mapmakers shared KB)** | Durable guild knowledge. |
| **Publications / vault (future repo)** | Wider audience, redacted. |
| **Per-project publish repos** | When cross-link surface is small. |

See [../Egregore/VS-SHARED-KB.md](../Egregore/VS-SHARED-KB.md) and [../Egregore/INTEROP.md](../Egregore/INTEROP.md).

[Housekeeping home](../README.md) · [NAV](../NAV.md)
