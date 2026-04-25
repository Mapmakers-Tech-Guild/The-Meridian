# Mapmakers Knowledgebase

**Start here:** [0 - Housekeeping/NAV.md](0%20-%20Housekeeping/NAV.md) — full map and table of contents.

This repository is the **Mapmakers shared knowledge base** (Zettel-style **0–6** areas: Housekeeping, People, Projects, Knowledge, Guild, **Operations**, **Archive**). No other files on repo root.

**Numbered “rooms”** (same idea as an index set — these are **real** TeX renders, stored as SVG in-repo so they show in the IDE, on mobile, and on GitHub):

<p align="center">
  <img src="assets/readme-math/index-set.svg" width="420" alt="The set of area indices 0 through 6, labeled as numbered areas" />
</p>

---

## Fancy math (actually rendered)

` ```math ` blocks only draw on **github.com**; your editor preview often shows **raw LaTeX**.  
So: the good stuff below is **[CodeCogs](https://www.codecogs.com/latex/eqneditor.php) → SVG**, committed under [`assets/readme-math/`](assets/readme-math/) — **vector math, not Unicode hacks.**

**Shannon entropy** — how “surprising” a distribution of topics is. Low: everything piles in one bucket. High: mass is spread (fine if the **graph still closes**).

<p align="center">
  <img src="assets/readme-math/entropy.svg" width="360" alt="H of X equals negative sum over i of p_i log p_i" />
</p>

**Cauchy–Schwarz** — inner products don’t outrun the norms.

<p align="center">
  <img src="assets/readme-math/cauchy-schwarz.svg" width="520" alt="Cauchy-Schwarz inequality: sum a_k b_k squared leq sum a_k squared times sum b_k squared" />
</p>

**Euler (planar graph)** — Vertices, edges, faces: **V, E, F** (count the outer face too). A silly reason to like **link closure**: your drawn map of notes ought to be **embeddable** if you want classical planar invariants to line up.

<p align="center">
  <img src="assets/readme-math/euler.svg" width="200" alt="V minus E plus F equals 2" />
</p>

*Optional vibecheck:* ship a **closed bundle** of notes or pay the **boundary** cost on export — same energy as keeping **V − E + F** honest for the face-count you’re actually publishing.

**Live graph toy:** open [kb-graph.html](kb-graph.html) in a browser from your clone (draggable force layout). The README can’t run JS; the HTML file can.

<details>
<summary>LaTeX source (for copy-paste; renders on <strong>github.com</strong> with MathJax)</summary>

```math
H(X) = - \sum_{i} p_i \log p_i
```

```math
\bigg( \sum_{k=1}^{n} a_k b_k \bigg)^{\!2} \;\le\; \Big( \sum_{k=1}^{n} a_k^2 \Big) \Big( \sum_{k=1}^{n} b_k^2 \Big)
```

```math
V - E + F = 2
```

[Writing mathematical expressions](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions) · MathJax

</details>

---

*Courtesy of the ARX Foundation* — the maintainer’s non-profit; it holds the IP for work contributed here.
