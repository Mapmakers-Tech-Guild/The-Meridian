# Membranes, branches, and what GitHub can (and can’t) hide

## The “private branch” question

On **GitHub / GitLab / most hosts**, if the **repository** is **public**, then **every branch, tag, and the full object database** is generally visible. There is **no** supported “this branch is private, that branch is public” on a single public repo. Anyone can `git fetch` a branch name they guess.

So: **branch per project, merge to `main` when ready** is a great **workflow** (review, CI, feature isolation). It is **not** a secrecy membrane for a public remote.

## What actually enforces a membrane

| Need | Pattern |
| --- | --- |
| **Drafts must stay private** | **Private repository** (or uncommitted local work) until you intentionally publish. |
| **One day open** | New **public** repo, or `main` in a new public repo, and copy/merge only reviewed files; or use a **static site** build that only uploads `public/`. |
| **Team-only vs world** | **Private** org repo (Egregore memory) vs **public** KB repo, not two branch “zones” in one public repo. |
| **You** keep writing in one place for convenience | [Obsidian/ local folder] **excluded** from the public remote via not pushing it, or a **submodule** / build step that only promotes chosen paths. |

## Branch-per-project (still useful)

- `project/xyz` for a batch of related docs, **PR into `main`** when the narrative is review-ready.  
- Works for **public** repo hygiene and review — just assume **anything pushed** to a public remote could be read.

## Egregore vs public KB (again)

- **Egregore memory** = private shared mind; keep the upstream folder contract intact.  
- **This knowledge base** = open; merge story here is about **quality and release**, not hiding work from a public `git clone` — because when the KB lives in a **public** remote, the whole thing is the product.
