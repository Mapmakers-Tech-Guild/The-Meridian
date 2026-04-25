# Quartz implementation notes (for The Meridian + ARX KB)

These notes are written so you can replicate the same setup in another vault/repo (e.g. the ARX KB) with minimal choices.

## What Quartz is (pragmatic)

- Quartz takes an Obsidian-ish markdown vault and publishes it as a static site.
- It handles wikilinks, backlinks, graph view, theming, and search.
- GitHub Pages is an easy default host.

## Implementation (recommended path)

### 1) Pick the publishing boundary

Decide one of:

- **Publish this whole repo** (simple, higher leak risk)
- **Publish a subfolder** like `public/` (safer; requires curation)
- **Publish a separate “publication” repo** fed by exports (best boundary; more moving parts)

For ARX + Meridian, I’d default to **separate publication repos** so the knowledgebase can stay “working,” and the site is a curated export.

### 2) Create a Quartz site repo

Create a new repo:

- `The-Meridian-Site` (public)
- `The-ARX-KB-Site` (public)

Then bootstrap Quartz by following Quartz’s upstream instructions (their commands change over time, so always use the upstream README).

### 3) Content sync strategy

Pick one:

- **Subtree / copy**: copy vault markdown into the Quartz repo on a schedule (simple)
- **Git submodule**: Quartz repo points at a specific commit of the vault (clean, but adds git complexity)
- **Export job**: a script builds an export bundle with link-closure/redaction, then commits to the site repo (best long-term)

If you already care about membranes, do **export job**.

### 4) GitHub Pages deploy

Use one workflow that:

- builds Quartz
- uploads the output folder as a Pages artifact
- deploys with `actions/deploy-pages`

This is the same pattern already used in `.github/workflows/pages.yml` here.

### 5) “Map loader → landing page” concept

Keep the map animation as a *brand intro*:

- render **edges-only** (no labels/nodes)
- treat it as a **loading overlay**
- fade into the landing content (onboarding links, NAV, etc.)

That approach keeps the vibe but avoids the “this page is a graph demo” problem.

## How to replicate what I did here (graph intro)

In this repo, the intro page comes from:

- `scripts/build-kb-graph.mjs` → generates `assets/kb-graph/kb-graph-animated.html`
- `.github/workflows/pages.yml` → publishes that file as `_site/index.html`

To do the same in ARX KB:

- port `scripts/build-kb-graph.mjs` (or adapt it to ARX topology)
- add a `pages.yml` that copies the generated HTML to `_site/index.html`

