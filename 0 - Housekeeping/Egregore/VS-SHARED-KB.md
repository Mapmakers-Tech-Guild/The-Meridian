# Egregore (private) vs this shared knowledge base

| | **Egregore `memory` repo** (`the-mapper-s-ego-memory`) | **This repo** — [Mapmakers-Knowledgebase](https://github.com/Mapmakers-Tech-Guild/Mapmakers-Knowledgebase) |
| --- | --- | --- |
| **Role** | **Private shared mind** for the Egregore stack: Claude Code sessions, `/handoff`, graph sync, team continuity, org-only material. | **Shared** team knowledge: patterns, guides, personas, project context — *not* automatically “publication-ready”; see [Publication doc](../Publication/PUBLICATION-AND-RELEASE.md). |
| **Tooling** | Tied to `egregore.json` → `memory_repo`; skills write here; keep upstream `memory/` layout. | Git + markdown; not a substitute for the memory symlink. |
| **Content** | Handoffs, private decisions, `people/{github}.md`, per Egregore conventions. | Durable, cross-session material the guild is willing to **share in-repo**; scope and edit for audience. |
| **Where it lives** | Its own private git repository. | This repository (clone anywhere). |

**Rule of thumb:** if it powers **Egregore commands** or is **operationally private**, it belongs in the memory repo. If it is **durable and shared** across the guild, it belongs in this KB’s numbered areas. **Public-facing** bundles go to a **separate publications / snippets** repo (or per-project publish repos) — not conflated with this tree; see the publication doc.

**Flows:**

- **Egregore → here:** Summarize or copy a **non-sensitive** slice from private memory.  
- **Here → Egregore:** [INTEROP.md](./INTEROP.md) — only mandated `memory/` paths.  
- **Here → publication:** [../Publication/PUBLICATION-AND-RELEASE.md](../Publication/PUBLICATION-AND-RELEASE.md) — bundles, **link closure**, and **redaction** when shipped notes still reference unpublished or other-store material ([§1](../Publication/PUBLICATION-AND-RELEASE.md#1-link-closure-and-redaction)).

[← Egregore index](./README.md) · [Housekeeping root](../README.md) · [NAV](../NAV.md)
