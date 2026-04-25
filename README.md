# The Meridian

<p align="center">
  <img src="assets/kb-graph/kb-graph-snapshot-edges.svg" width="440" alt="Force-directed knowledge graph, edges only, same d3 layout as the full map" />
  <br />
  <img src="assets/readme-brand/the-meridian-title.svg" width="520" alt="The Meridian — Mapmakers knowledge base" />
</p>

This place used to be named like a file cabinet. We call it **The Meridian** now: in cartography, a **meridian** is the line between the poles — the north–south thread that every longitude shares, so *east* and *west* can mean something when the world is too wide to see all at once.

*Knowledge base* — two words, not a product slug. A friend, **christinab**, said it so it would stick: a **knowledge base** by the **knowledge gardens**, in the hush of the **knowledge forest** — the beds you tend, the wild you walk through, the clearing you come back to when your hands are full of something worth keeping.

**We’re walking the line, aren’t we?** You leave it on purpose when you explore — the beyond needs distance — but we all need **a point of reference**: a place to set **noon**, to measure a day against, to say *this* is the spine I’m measuring from, even when the path bends.

**New tools, new map, for new landscapes.** The graph above is that mesh — the same d3 *gravity* as the [full map](assets/kb-graph/kb-graph-snapshot.svg), drawn [without nodes](assets/kb-graph/kb-graph-snapshot-edges.svg) in the banner so the strokes stay light. Titles: [`the-meridian-title.svg`](assets/readme-brand/the-meridian-title.svg). Build: [`build-kb-graph.mjs`](scripts/build-kb-graph.mjs) · [`kb-graph.yml`](.github/workflows/kb-graph.yml).

*Thread that seeded this, late one evening — The Explorer & christinab, with coffee or close enough to it.*

---

**Start here:** [0 - Housekeeping/NAV.md](0%20-%20Housekeeping/NAV.md) — the table of contents and quick links.

The **Mapmakers** guild’s shared vault: Zettel-style **0–6** (Housekeeping, People, Projects, Knowledge, Guild, **Operations**, **Archive**). Nothing else at repo root.

**Numbered rooms** (real TeX → SVG, so it renders everywhere you read this file):

<p align="center">
  <img src="assets/readme-math/index-set.svg" width="420" alt="The set of area indices 0 through 6" />
</p>

---

## Geometric map (precompiled on `main`)

Each push to **`main`** runs [`kb-graph.yml`](.github/workflows/kb-graph.yml): **d3-force** → committed **SVG** + **edges-only** + **HTML** (animation staggers by rough git order for `0–6`, then satellites). No Mermaid — ship real layout, not a diagram spec.

**Snapshot:**

<p align="center">
  <img src="assets/kb-graph/kb-graph-snapshot.svg" width="520" alt="Map of areas 0–6 and Housekeeping satellites" />
</p>

**Animated** — GitHub won’t run your `<iframe>` in a README, so the live canvas lives off-site: **[GitHub Pages](https://mapmakers-tech-guild.github.io/The-Meridian/)** (from [`pages.yml`](.github/workflows/pages.yml), or a clone: [`kb-graph-animated.html`](assets/kb-graph/kb-graph-animated.html)). *Pages needs the repo’s **Settings → Pages → GitHub Actions** one-time; public or paid private.* Build with `npm ci`, `CHRONO=git`, `npm run build:graph`. Playground: [`kb-graph.html`](kb-graph.html).

---

## Fancy math (actually rendered)

` ```math ` only paints on **github.com**; your editor may show **raw LaTeX**. These are **CodeCogs → SVG** in [`assets/readme-math/`](assets/readme-math/).

**Shannon entropy** — how “surprising” a distribution is.

<p align="center">
  <img src="assets/readme-math/entropy.svg" width="360" alt="H of X equals negative sum p_i log p_i" />
</p>

**Cauchy–Schwarz**

<p align="center">
  <img src="assets/readme-math/cauchy-schwarz.svg" width="520" alt="Cauchy–Schwarz inequality" />
</p>

**Euler (planar graph)** — count the outer face. Link-closure invariants, if you like that kind of story.

<p align="center">
  <img src="assets/readme-math/euler.svg" width="200" alt="V minus E plus F equals 2" />
</p>

<details>
<summary>LaTeX (renders on github.com with MathJax)</summary>

```math
H(X) = - \sum_{i} p_i \log p_i
```

```math
\bigg( \sum_{k=1}^{n} a_k b_k \bigg)^{\!2} \;\le\; \Big( \sum_{k=1}^{n} a_k^2 \Big) \Big( \sum_{k=1}^{n} b_k^2 \Big)
```

```math
V - E + F = 2
```

[Mathematical expressions on GitHub](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions)

</details>

---

*In the same spirit as the [ARX Foundation](https://github.com/The-ARX-Foundation)’s public work — open by default.*
