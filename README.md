# Mapmakers Knowledgebase

**Start here:** [0 - Housekeeping/NAV.md](0%20-%20Housekeeping/NAV.md) — full map and table of contents.

This repository is the **Mapmakers shared knowledge base** (Zettel-style **0–6** areas: Housekeeping, People, Projects, Knowledge, Guild, **Operations**, **Archive**). No other files on repo root.

**Index set** (the numbered “rooms”): $\{0,1,2,3,4,5,6\}$ with Housekeeping as the hub. Nothing deep — just a consistent addressing scheme the whole tree agrees on.

---

## Some fancy math (why not)

GitHub renders this via MathJax; see [Writing mathematical expressions](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions) if you want the delimiter rules.

**Shannon entropy** (how “surprising” a distribution of topics is). Low entropy: everything lives in one folder. High entropy: mass is spread — that can be healthy *if* the graph still closes.

```math
H(X) = - \sum_{i} p_i \log p_i
```

**Cauchy–Schwarz** (a classic: inner products don’t grow faster than the norms allow). A good sanity check when you’re mixing *many* small links between notes:

```math
\bigg( \sum_{k=1}^{n} a_k b_k \bigg)^{\!2} \;\le\; \Big( \sum_{k=1}^{n} a_k^2 \Big) \Big( \sum_{k=1}^{n} b_k^2 \Big)
```

**Euler’s formula** (planar simple connected graph: vertices $V$, edges $E$, faces $F$ — including the outer “sea”). Mapmakers is *not* a graph algorithm repo, but any navigable “map” of notes secretly wants its planar invariants to work out if you ever draw the vault:

```math
V - E + F = 2
```

*Optional vibecheck:* after ideas spread, *close the bundle* (link targets included) or pay the *boundary terms* in your publication pass — the same game as making $V-E+F$ make sense for whatever face-count you’re shipping.

**Live graph toy:** open [kb-graph.html](kb-graph.html) locally (or from your clone) for a draggable force layout — the README is still just markdown; the browser does the fun part.

---

*Courtesy of the ARX Foundation* — the maintainer’s non-profit; it holds the IP for work contributed here.
