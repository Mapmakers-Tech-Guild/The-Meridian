# Publication, release, and interop (ideation)

**Context:** This repo is the **Mapmakers shared** knowledge base. A **separate** repository (or per-project repos) can hold **publications**, **vault snippets**, or outward exports. This doc sketches **protocols and frontmatter** for possible automation; humans can use the same fields for review.

---

## 1. Link closure on export

**Obsidian-style links** (`[[Note]]`, relative `../other-project/foo`) assume a **known tree**. Exporting a **subset** without its targets breaks links.

- **Bundle:** include link targets, or **rewrite** links and list what changed.

**Check:** a release is either a **closed bundle** (in-bundle links resolve) or an explicit list of **rewritten** / **dropped** targets.

---

## 2. Future automation (sketch)

1. Select by `status` / `release_track` / manifest.  
2. Resolve wikilinks against the **bundle**; warn on out-of-bundle targets.  
3. **Path / section filters** (prefixes, strip internal sections if needed).  
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
| **Publications / vault (future repo)** | Wider audience; material edited for that surface. |
| **Per-project publish repos** | When cross-link surface is small. |

See [../Egregore/VS-SHARED-KB.md](../Egregore/VS-SHARED-KB.md) and [../Egregore/INTEROP.md](../Egregore/INTEROP.md).

[Housekeeping home](../README.md) · [NAV](../NAV.md)
