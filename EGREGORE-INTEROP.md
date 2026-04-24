# Interop: open KB → Egregore `memory/`

**Direction:** You can **pull** anything from this **open** `knowledgebase/` into the **private** Egregore memory repository (`the-mapper-s-ego-memory`, symlinked as `memory/` in `the-mapper-s-ego`). The **only** rule: the destination must stay the **standard Egregore `memory/` layout** — do not invent new top-level folders in the memory repo; use the table below.

**Workspace paths (local):**

- Open KB: `knowledgebase\` (this folder)  
- Egregore memory: `the-mapper-s-ego-memory\` (clone of `egregore.json` → `memory_repo`)

## Path map (source → destination)

| Open KB source | Egregore `memory/` destination | Notes |
| --- | --- | --- |
| `knowledge/patterns/*.md` | `knowledge/patterns/*.md` | Copy or move; add private fields to frontmatter if the private copy is richer. Filename in memory is often `topic.md` (evergreen) — same as upstream docs. |
| A **public** decision you also want in the org record | `knowledge/decisions/YYYY-MM-DD-topic.md` | Use the frontmatter Egregore expects (see `the-mapper-s-ego/DEVELOPMENT.md` memory section). |
| `knowledge/` (findings, if you add them here) | `knowledge/findings/YYYY-MM-DD-topic.md` | |
| `guides/*` and long writeups | `artifacts/YYYY-MM-DD-github-title.md` *or* `knowledge/patterns/*` for evergreen how-tos | Pick **one** home to avoid unbounded duplicates; link the other in frontmatter. |
| `projects/README.md` or `projects/*.md` | `projects/*.md` | Same name family as DEVELOPMENT.md. |
| `people/personas/*/` (public dossiers) | **`people/{github}.md` is canonical for Egregore** | Pull *facts* and short bullets into the profile file; keep long public narrative in the open KB only, or add a one-line link in `people/{github}.md` to a published URL if you mirror the open KB. Do **not** add `personas/` under `memory/` — not part of the mandated tree. |
| Public personas without a GitHub handle | `people/choose-a-slug.md` | Egregore local mode uses filenames under `people/`; match your team’s existing convention. |
| Infrastructure blurbs (non-secret) | `infrastructure/` — e.g. `services.yml` if you adopt that | Never push secrets; open KB should already be redacted. |
| N/A from open KB (usually) | `handoffs/`, `wraps/`, `quests/`, `meetings/`, `research/` | **Session- and run-generated**; these stay Egregore-first. You can **quote** a handoff in the open KB, but the system of record is still `the-mapper-s-ego-memory/`. |

## How to “pull in” (practical)

1. **Copy** the file (or a trimmed section) from `knowledgebase\…` into the matching `the-mapper-s-ego-memory\…` path.
2. Adjust **frontmatter** to Egregore conventions for that subfolder (see `the-mapper-s-ego/DEVELOPMENT.md` — Memory section, ~“Directory Details”).
3. If you use skills: **`/save`**, **`/add`** (for artifacts), **`/handoff`**, etc. on the Egregore side are still the app’s interface — the open KB is **not** wired in automatically; interop is **intentional copy/merge** until you add automation.
4. **Provenance:** optional `source: knowledgebase/relative/path` in private frontmatter so you can trace back to the public copy.

## What *not* to do

- Do **not** symlink the whole `knowledgebase/` into `memory/` (breaks the mandated tree and git boundaries).
- Do **not** replace `people/{github}.md` with a folder per person in `memory/` unless upstream Egregore changes — use **one file** per person there.
- Do **not** put **private** relay, HR, or session-only content in the open KB first “for interop” — flow is **redacted open → private**, not the reverse, when pulling into Egregore.

## Related

- [EGREGORE-VS-OPEN-KB.md](./EGREGORE-VS-OPEN-KB.md) — roles of each store.  
- Egregore memory spec: [../the-mapper-s-ego/DEVELOPMENT.md](../the-mapper-s-ego/DEVELOPMENT.md) (search for “Directory Details” in the Memory section).  