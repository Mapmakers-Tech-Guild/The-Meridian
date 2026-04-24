# Membranes, branches, and what hosts can (and can’t) hide

## The “private branch” question

If a **repository** is **public** on GitHub / GitLab, **all branches** on that remote are generally visible. There is no first-class “private branch on a public repo.”

**Branch per topic** is good for **review and merge**; it is not a substitute for a **private** repository when drafts must stay internal.

## What enforces a real membrane

| Need | Pattern |
| --- | --- |
| **Drafts private** | Private repository, or no push. |
| **Share with guild only** | This Mapmakers shared KB — org repo visibility is your choice. |
| **External / publication** | **Separate** publications or vault-snippets repo, or per-project publish repos — [PUBLICATION-AND-RELEASE.md](./PUBLICATION-AND-RELEASE.md). |
| **Egregore operations** | Private `the-mapper-s-ego-memory` only. |

## Egregore vs this shared KB vs publication

- **Egregore `memory/`** — private shared mind; folder contract from upstream.  
- **This repository** — **shared** knowledge base; not the same as a dedicated **export** line.  
- **Public or semi-public bundles** — own release process, **link closure** and **redaction** so internal wikilinks do not break when only part of the tree ships.
