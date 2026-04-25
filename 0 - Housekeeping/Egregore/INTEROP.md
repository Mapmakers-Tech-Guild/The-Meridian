# Interop: shared knowledge base → Egregore `memory/`

**Direction:** Copy from this **Mapmakers** knowledge base into the **private** Egregore memory repo (`the-mapper-s-ego-memory`, `memory/` in `the-mapper-s-ego`). Destinations must stay the **standard Egregore `memory/` layout** — add no nonstandard top-level folders.

**Repositories:** this [Mapmakers-Knowledgebase](https://github.com/Mapmakers-Tech-Guild/Mapmakers-Knowledgebase) · Egregore: `egregore.json` → `memory_repo`.

A **publications** export is separate — see [../Publication/PUBLICATION-AND-RELEASE.md](../Publication/PUBLICATION-AND-RELEASE.md).

## Path map (this repo → `memory/`)

| Shared KB source (this tree) | Egregore `memory/` destination | Notes |
| --- | --- | --- |
| `3 - Knowledge/patterns/*.md` | `knowledge/patterns/*.md` | Copy/merge; add private frontmatter in memory as needed. |
| Decision in shared KB | `knowledge/decisions/YYYY-MM-DD-topic.md` | [DEVELOPMENT.md](https://github.com/Mapmakers-Tech-Guild/the-mapper-s-ego/blob/main/DEVELOPMENT.md) |
| `3 - Knowledge/…` findings | `knowledge/findings/…` | |
| `0 - Housekeeping/Guides/*` or long writeups | `artifacts/…` or `knowledge/patterns/*` | One canonical home. |
| `2 - Projects/*` | `projects/*.md` | |
| `1 - People/*.md` (humans) | Summarize to **`people/{github}.md`** as needed | No duplicate `personas/` tree in `memory/`. |
| `4 - Guild/ops/personas/*` (agent packs) | **Avoid** a separate `ops/` tree in Egregore — distil into `people/{github}.md` or a pattern note. |
| `infrastructure` (if you add) | `infrastructure/` | No secrets. |
| — | `handoffs/`, `wraps/`, `quests/`, `meetings/`, `research/` | Egregore-native; private record stays in memory. |

## How to pull in

1. Copy from this clone into `the-mapper-s-ego-memory/…`  
2. Fix frontmatter per Egregore subfolder.  
3. Skills (`/save`, `/add`, …) remain the app’s interface.  
4. Optional: `source: Mapmakers-Knowledgebase/<path>` in the private file.

## What not to do

- Do **not** symlink this whole repo into `memory/`.  
- Do **not** use `personas/` folders in `memory/`.  
- **Shared → Egregore:** keep content appropriate for `memory/` when you copy; trim what should stay private.

[← Egregore index](./README.md) · [VS-SHARED-KB](./VS-SHARED-KB.md) · [Redirect](./VS-OPEN-REDIRECT.md)
