---
title: Membranes between knowledge stores
author: mapmakers-kb
date: 2026-04-24
type: pattern
---

# Membranes between knowledge stores

**Anti-pattern:** One **public** git remote containing private relay, Egregore session state, and unreviewed wikilinks you later publish — you will leak or break links on export.

**What works:**

- **Personal (private tree)** — draft and relay; not this repo.  
- **Egregore memory (private repo)** — keep upstream `memory/` shape; [EGREGORE-VS-SHARED-KB.md](../../EGREGORE-VS-SHARED-KB.md).  
- **This shared KB (this repository)** — durable, guild-shared content.  
- **Publications / per-project export** — separate track; [PUBLICATION-AND-RELEASE.md](../../PUBLICATION-AND-RELEASE.md) for **link closure** and **redaction** so `[[Obsidian]]` and cross-project refs do not 404 in a smaller published bundle.  
- **Company KB** (if any) — policy, not a substitute for personal or Egregore.

**The fix:** Promote with **summary + source**; for export, use **bundle + redaction** or per-project publish repos; see the publication doc.
