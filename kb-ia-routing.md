# Membranes: where knowledge lives (personal, Egregore, open KB, company)

## Four membranes (explicit)

| Membrane | Where | What goes here | What does *not* go here |
| --- | --- | --- | --- |
| **Personal (private)** | `a private work area\` (e.g. `cross-context-relay/`, `Staging_Zettelkasten/`) on personal OneDrive | PII, dual-machine setup, pre-canonical notes, `inbox`/`outbox` relay | Company policy; public KB |
| **Egregore memory** (private) | `the-mapper-s-ego-memory` — [see differentiation](EGREGORE-VS-OPEN-KB.md) | **Private shared mind** for the org: handoffs, skills, `people/{github}.md`, team operational memory. Keep Egregore’s folder contract. | Public documentation you intend for the world; don’t use this as your public website. |
| **This open knowledge base** | `knowledgebase/` in this workspace (or a **public** git repo you connect later) | Curated **open** knowledge: patterns, public guides, redacted personas, project blurbs. | Egregore session state; private handoffs. |
| **Company / work** | `03-Ops\knowledgebase\` on work OneDrive (when applicable) | Onboarding, SOPs, Microsoft stack, HR-adjacent content | private relay; Egregore private mind |

**Design intent (from cross-context docs):** *location* is isolation when work OneDrive can’t ignore folders like `.gitignore` — personal relay stays on **personal** OneDrive; Egregore memory is its **own private repo**; this **`knowledgebase/`** is where **open** content lives so you are not tempted to stuff public guides into the memory repo.

**Dual laptop / Ollama:** See [cross-context-relay/ENTER_HERE.md](../cross-context-relay/ENTER_HERE.md) and `outbox` notes for work vs personal machine scope.

## Guild bot vs “firefly” (open KB)

- In the **open** KB, **firefly** still means the **context packet** (persona + relevant patterns) for a *public* or *guild-facing* agent — not the private Egregore session log.

## Open KB ↔ Egregore

- Pull open content into the private `memory/` repo [per EGREGORE-INTEROP.md](./EGREGORE-INTEROP.md) — **mandated paths only.**
