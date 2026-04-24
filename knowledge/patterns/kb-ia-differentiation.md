---
title: Personal, Egregore, open KB, and company
author: arx-foundation
date: 2026-04-24
type: pattern
---

# Membranes between knowledge stores

**Anti-pattern:** One folder for everything (private relay, Egregore session state, and public website drafts) in a **public** git remote — you will leak or confuse boundaries.

**What works:**

- **Personal (private)** — draft zettel, relay, transcripts; *location* on personal OneDrive.  
- **Egregore memory** (private repo) — **private shared mind**; keep upstream `memory/` shape; see [EGREGORE-VS-OPEN-KB.md](../../EGREGORE-VS-OPEN-KB.md).  
- **This open KB** — curated, publishable material.  
- **Company** `03-Ops/knowledgebase` (if used) — policy and SOP, not a substitute for personal relay.

**The fix:** Promote with **summary + source line**, not raw transcript. **Branches** on a *public* repo do not hide work — see [MEMBRANES-BRANCHES-AND-PUBLISHING.md](../../MEMBRANES-BRANCHES-AND-PUBLISHING.md).

**Related:** [Cross_Context relay](../../cross-context-relay/ENTER_HERE.md) (sibling of this `knowledgebase/` folder).