# Egregore (private) vs this shared knowledge base

| | **Egregore `memory` repo** (`the-mapper-s-ego-memory`) | **This repo** — [Mapmakers-Knowledgebase](https://github.com/Mapmakers-Tech-Guild/Mapmakers-Knowledgebase) |
| --- | --- | --- |
| **Role** | **Private shared mind** for the Egregore stack: Claude Code sessions, `/handoff`, graph sync, team continuity, org-only material. | **Shared** team knowledge: patterns, guides, personas, project context — *not* automatically “publication-ready”; see [PUBLICATION-AND-RELEASE.md](./PUBLICATION-AND-RELEASE.md). |
| **Tooling** | Tied to `egregore.json` → `memory_repo`; skills write here; keep upstream `memory/` layout. | Git + markdown; not a substitute for the memory symlink. |
| **Content** | Handoffs, private decisions, `people/{github}.md`, per Egregore conventions. | Durable, cross-session material the guild is willing to **share in-repo**; redact as needed. |
| **Where it lives** | Its own private git repository. | This repository only (clone it wherever you work). |

**Rule of thumb:** if it powers **Egregore commands** or is **operationally private**, it belongs in the memory repo. If it is **durable and shared** across the guild, it belongs here. **Public-facing or vault snippets** for the outside world go in a **separate publications / snippets repo** (or per-project publish repos) — not conflated with this tree by default; use the release doc.

**Flows:**

- **Egregore → here:** Summarize or copy a **safe, redacted** slice from private memory when it should become shared.  
- **Here → Egregore:** [EGREGORE-INTEROP.md](./EGREGORE-INTEROP.md) — only mandated `memory/` paths.  
- **Here → publication:** [PUBLICATION-AND-RELEASE.md](./PUBLICATION-AND-RELEASE.md) — frontmatter, bundles, and link/redaction rules.
