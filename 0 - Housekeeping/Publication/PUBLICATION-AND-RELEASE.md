# Publication, release, and interop (ideation)

**Context:** This repo is the **Mapmakers shared** knowledge base. A **separate** repository (or per-project repos) can hold **publications**, **vault snippets**, or outward exports. This doc sketches **protocols and frontmatter** for possible automation; humans can use the same fields for review.

---

## 1. Link closure and redaction

*Export and cross-KB interop use the same idea.*

**Obsidian-style links** (`[[Note]]`, relative `../other-project/foo`) assume a **known tree**. When you **publish a subset**, you have two normal jobs:

1. **Link closure** — every link in the bundle points at something that **is** in the bundle (or you log an explicit exception).

2. **Redaction (cross-store, not “secrecy”)** — a published note may **reference** a target that **is not** in the published set: a private vault note, Egregore-only material, a note you have not released yet, or a path in another store. You **do not** ship the private file; you **rewrite** the link (summary, placeholder, or “publishing TBD”) so the reader gets a **coherent** page instead of a broken link. That is standard **interop** between personal KB, shared repo, and outward bundles. Intentional stubs can also **tease** later notes — *here is the idea; full write-up ships with the next drop.*

**Check:** a release is a **closed bundle** where possible, plus a **redaction / rewrite list** for every out-of-bundle target (or a tracked decision to leave a deliberate teaser).

---

## 2. Future automation (sketch)

1. Select by `status` / `release_track` / manifest.  
2. Resolve wikilinks against the **bundle**; flag out-of-bundle targets (candidates for closure or **redaction** / teaser copy).  
3. **Path / section filters** (prefixes, internal-only sections) as needed for the **surface** you are shipping.  
4. **Redaction pass:** rewrite or stub links to unpublished notes, private paths, and cross-membrane targets ([§1](#1-link-closure-and-redaction)).  
5. Emit to publications repo, `dist/`, or per-project remote.

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
| **Publications / vault (future repo)** | Wider audience; **link closure** and **redaction** of unpublished / cross-store targets ([§1 above](#1-link-closure-and-redaction)). |
| **Per-project publish repos** | When cross-link surface is small. |

See [../Egregore/VS-SHARED-KB.md](../Egregore/VS-SHARED-KB.md) and [../Egregore/INTEROP.md](../Egregore/INTEROP.md).

[Housekeeping home](../README.md) · [NAV](../NAV.md)
