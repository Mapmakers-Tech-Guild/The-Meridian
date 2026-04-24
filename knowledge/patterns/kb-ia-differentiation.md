---
title: Membranes between knowledge stores
author: mapmakers-kb
date: 2026-04-24
type: pattern
---

# Membranes between knowledge stores

**Anti-pattern:** One folder for everything (private relay, Egregore session state, and public site drafts) in a **public** git remote — you will leak or confuse boundaries.

**What works:**

- **Personal (private tree)** — draft zettel, relay, transcripts; stays on *your* private disk / OneDrive, not in this repo.  
- **Egregore memory** (private repo) — **private shared mind**; keep upstream `memory/` shape; see [EGREGORE-VS-OPEN-KB.md](../../EGREGORE-VS-OPEN-KB.md).  
- **Mapmakers open KB** (this repository) — curated, publishable material.  
- **Company** `03-Ops\knowledgebase\` (if you use it) — policy and SOP, not a substitute for a personal relay.

**The fix:** Promote with **summary + source line**, not raw transcript. **Branches** on a *public* repo do not hide work — see [MEMBRANES-BRANCHES-AND-PUBLISHING.md](../../MEMBRANES-BRANCHES-AND-PUBLISHING.md).

**Cross-context / relay** (if you run it): that documentation lives in **your** private tree, not next to this clone on disk by default.
