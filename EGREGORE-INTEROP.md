# Interop: shared knowledge base → Egregore `memory/`

**Direction:** You can **copy** material **from** this **shared** Mapmakers knowledge base **into** the **private** Egregore memory repository (`the-mapper-s-ego-memory`, symlinked as `memory/` in `the-mapper-s-ego`). The destination must stay the **standard Egregore `memory/` layout** — do not add nonstandard top-level folders; use the table.

**Repositories:**

- **This shared KB:** this git repo — [Mapmakers-Tech-Guild/Mapmakers-Knowledgebase](https://github.com/Mapmakers-Tech-Guild/Mapmakers-Knowledgebase) (any clone is fine; no canonical path on disk in docs).  
- **Egregore memory (private):** the repo in `egregore.json` → `memory_repo`, usually checked out with `the-mapper-s-ego` and exposed as the `memory/` path.

A future **publications** or per-project export repo is **out of scope** for this interop file — see [PUBLICATION-AND-RELEASE.md](./PUBLICATION-AND-RELEASE.md).

## Path map (source → destination)

| Shared KB source | Egregore `memory/` destination | Notes |
| --- | --- | --- |
| `knowledge/patterns/*.md` | `knowledge/patterns/*.md` | Copy/merge; add private frontmatter in memory if the private copy is richer. |
| A decision you want in the org’s private record | `knowledge/decisions/YYYY-MM-DD-topic.md` | Egregore frontmatter per [DEVELOPMENT.md](https://github.com/Mapmakers-Tech-Guild/the-mapper-s-ego/blob/main/DEVELOPMENT.md). |
| `knowledge/` (findings, if any) | `knowledge/findings/YYYY-MM-DD-topic.md` | |
| `guides/*` and long writeups | `artifacts/YYYY-MM-DD-github-title.md` *or* `knowledge/patterns/*` | Pick one home; link the other in frontmatter. |
| `projects/*` | `projects/*.md` | |
| `people/personas/*/` | **`people/{github}.md` is canonical in Egregore** | Summarize into the single file; do **not** add `personas/` under `memory/`. |
| Other persona slug | `people/choose-a-slug.md` | |
| `infrastructure` blurbs (non-secret) | `infrastructure/` | No secrets. |
| — | `handoffs/`, `wraps/`, `quests/`, `meetings/`, `research/` | **Egregore-native**; quote here if needed, but private record stays in `the-mapper-s-ego-memory`. |

## How to pull in (practical)

1. **Copy** from a clone of this repo into the matching `the-mapper-s-ego-memory/…` path.  
2. **Frontmatter** per Egregore for that subfolder.  
3. Egregore **skills** (`/save`, `/add`, etc.) are still the app’s interface; interop is **intentional** until you script it.  
4. Optional: `source: Mapmakers-Knowledgebase/<path>` in the private file for traceability.

## What not to do

- Do **not** symlink this repo into `memory/`.  
- Do **not** replace `people/{github}.md` with a folder per person in `memory/`.  
- Do **not** use the shared repo as a staging ground for private relay/HR first — when copying **into** Egregore, flow is **shared (already ok for guild) → private**, with redaction as needed.

## Related

- [EGREGORE-VS-SHARED-KB.md](./EGREGORE-VS-SHARED-KB.md)  
- Redirect stub: [EGREGORE-VS-OPEN-KB.md](./EGREGORE-VS-OPEN-KB.md) (old name)
