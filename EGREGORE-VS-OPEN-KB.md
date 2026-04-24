# Egregore (private) vs this knowledge base (open)

| | **Egregore `memory` repo** (`the-mapper-s-ego-memory`) | **Mapmakers open KB** (this git repo) |
| --- | --- | --- |
| **Role** | **Private shared mind** for the Egregore stack: Claude Code sessions, `/handoff`, graph sync, team continuity, whatever the org decides stays private. | **Open knowledge** — shareable, publishable, safe to show people outside your private session. |
| **Tooling** | Tied to `egregore.json` → `memory_repo`; skills write here; do not rename top-level layout lightly. | Plain markdown + this repo (GitHub: **Mapmakers-Knowledgebase**). **Not** a substitute for the memory symlink. |
| **Content** | Operational memory: handoffs, private decisions, `people/{github}.md` profiles, etc., per Egregore conventions. | Curated **patterns**, **guides**, **public personas** (redacted), project pages you want the world to see. |
| **Where it lives** | Its own private git repository. | **Only** the Mapmakers-Knowledgebase repo and your local clone of it. |

**Rule of thumb:** if it powers **Egregore commands** or should stay **team-only**, it belongs in the memory repo. If it is **educational or community-facing** and you are happy for it to leak, it belongs here (or downstream of here).

**Promotion paths:**

- **Private → open:** When something matures, **summarize or copy** the safe slice *out* of Egregore into this knowledge base for publication.  
- **Open → Egregore:** Anything here can be **pulled into** the private `memory/` tree **as long as** you only use [mandated Egregore paths](EGREGORE-INTEROP.md) — do not change the memory layout. Do not rely on a “private branch” of a *public* repo to hide draft — see [MEMBRANES-BRANCHES-AND-PUBLISHING.md](./MEMBRANES-BRANCHES-AND-PUBLISHING.md).
