# Egregore (private) vs this knowledge base (open)

| | **Egregore `memory` repo** (`the-mapper-s-ego-memory`) | **This `knowledgebase/`** (Mapmakers *open* KB) |
| --- | --- | --- |
| **Role** | **Private shared mind** for the Egregore stack: Claude Code sessions, `/handoff`, graph sync, team continuity, whatever the org decides stays private. | **Open knowledge** meant to be shareable, publishable, and safe for strangers or a wider community without exposing session plumbing. |
| **Tooling** | Tied to `egregore.json` → `memory_repo`; skills write here; do not rename top-level layout lightly. | Plain markdown + your publishing flow (static site, public GitHub, docs portal). **Not** a substitute for the memory symlink. |
| **Content** | Operational memory: handoffs, private decisions, `people/{github}.md` profiles, etc., per Egregore conventions. | Curated **patterns**, **guides**, **public personas** (redacted), project pages you want the world to see. |
| **This folder’s name** | Lives next to the app in its own git repo. | Sits in **a private work area** (and may later mirror to a **public** git repo of your choice). |

**Rule of thumb:** if it powers **Egregore commands** or should stay **team-only**, it belongs in the memory repo. If it is **educational or community-facing** and you are happy for it to leak, it belongs here (or downstream of here).

**Promotion paths:**

- **Private → open:** When something matures, **summarize or copy** the safe slice *out* of Egregore into this knowledge base for publication.  
- **Open → Egregore:** Anything here can be **pulled into** the private `memory/` tree **as long as** you only use [mandated Egregore paths](EGREGORE-INTEROP.md) — do not change the memory layout. Do not rely on a “private branch” of a *public* repo to hide draft — see [MEMBRANES-BRANCHES-AND-PUBLISHING.md](./MEMBRANES-BRANCHES-AND-PUBLISHING.md).
