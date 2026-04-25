/**
 * Precompiles a stylized knowledge-base map: force layout (d3) → SVG + animated HTML.
 * Run: npm run build:graph
 * Optional: set CHRONO=git to order animation by first git commit touching each area (best-effort).
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { execSync } from "child_process";

const require = createRequire(import.meta.url);
const d3 = require("d3");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "assets", "kb-graph");

// Topology: Mapmakers numbered areas + housekeeping satellites (tweak when tree changes)
const NODES = [
  { id: "0", label: "0 · Housekeeping", kind: "core", order: 0 },
  { id: "1", label: "1 · People", kind: "area", order: 1 },
  { id: "2", label: "2 · Projects", kind: "area", order: 2 },
  { id: "3", label: "3 · Knowledge", kind: "area", order: 3 },
  { id: "4", label: "4 · Guild", kind: "area", order: 4 },
  { id: "5", label: "5 · Operations", kind: "area", order: 5 },
  { id: "6", label: "6 · Archive", kind: "area", order: 6 },
  { id: "eg", label: "Egregore", kind: "sat", order: 7 },
  { id: "ctx", label: "Work context", kind: "sat", order: 8 },
  { id: "pub", label: "Publication", kind: "sat", order: 9 },
  { id: "mem", label: "Membranes", kind: "sat", order: 10 },
];

const EDGES = [
  ["0", "1"], ["0", "2"], ["0", "3"], ["0", "4"], ["0", "5"], ["0", "6"],
  ["0", "eg"], ["0", "ctx"], ["0", "pub"], ["0", "mem"],
  ["1", "4"], ["3", "2"],
];

const COL = {
  bg: "#0b0d12",
  line: "rgba(100, 130, 180, 0.45)",
  lineHi: "rgba(139, 124, 255, 0.6)",
  core: "#4f6fff",
  area: "#3dd6c3",
  sat: "#e8a36c",
  text: "#c8cfdd",
  sub: "rgba(200, 210, 230, 0.5)",
};

function gitChronoOrder() {
  if (process.env.CHRONO !== "git") return null;
  try {
    const out = execSync(
      "git log --reverse --name-only --pretty=format:---%n%H",
      { cwd: root, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );
    const prefix = [
      ["0", "0 - Housekeeping"],
      ["1", "1 - People"],
      ["2", "2 - Projects"],
      ["3", "3 - Knowledge"],
      ["4", "4 - Guild"],
      ["5", "5 - Operations"],
      ["6", "6 - Archive"],
    ];
    const first = Object.create(null);
    for (const line of out.split("\n")) {
      const t = line.trim();
      for (const [id, p] of prefix) {
        if (first[id] == null && (t === p || t.startsWith(p + "/"))) first[id] = 1;
      }
    }
    const ids = ["0", "1", "2", "3", "4", "5", "6", "eg", "ctx", "pub", "mem"];
    const known = ids.filter((id) => first[id] != null);
    const rest = ids.filter((id) => first[id] == null);
    let seq = 0;
    for (const id of [...known, ...rest]) {
      const n = NODES.find((x) => x.id === id);
      if (n) n.order = seq++;
    }
  } catch {
    // not a git repo or no git: keep default order
  }
  return null;
}

function runLayout() {
  const nodes = NODES.map((d) => ({ ...d }));
  const links = EDGES.map(([s, t]) => ({ source: s, target: t })).filter(
    (l) => nodes.some((n) => n.id === l.source) && nodes.some((n) => n.id === l.target)
  );

  // Deterministic seed layout (d3 default random x/y can differ per OS/Node)
  nodes.forEach((d, i) => {
    const a = (2 * Math.PI * i) / nodes.length;
    d.x = 140 * Math.cos(a);
    d.y = 140 * Math.sin(a);
  });

  const sim = d3
    .forceSimulation(nodes)
    .alpha(0.9)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(90).strength(0.55))
    .force("charge", d3.forceManyBody().strength(-480))
    .force("center", d3.forceCenter(0, 0))
    .force("collide", d3.forceCollide(38))
    .stop();

  for (let i = 0; i < 400; i++) sim.tick();

  const nref = (x) => (typeof x === "object" && x != null && "id" in x ? x : nodes[x]);

  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const n of nodes) {
    xMin = Math.min(xMin, n.x);
    xMax = Math.max(xMax, n.x);
    yMin = Math.min(yMin, n.y);
    yMax = Math.max(yMax, n.y);
  }
  const pad = 70;
  const w = (xMax - xMin) + 2 * pad;
  const h = (yMax - yMin) + 2 * pad;
  const offX = -xMin + pad;
  const offY = -yMin + pad;
  for (const n of nodes) {
    n.px = n.x + offX;
    n.py = n.y + offY;
  }
  return { nodes, links, w, h, offX, offY, nref };
}

function kindColor(k) {
  if (k === "core") return COL.core;
  if (k === "area") return COL.area;
  return COL.sat;
}

function buildEdgesOnlySvg({ nodes, links, w, h, nref }) {
  let s = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(
    h
  )}" viewBox="0 0 ${w} ${h}" role="img" aria-label="The Meridian — knowledge graph edges only, same d3 force layout as the full snapshot">
<rect width="100%" height="100%" fill="${COL.bg}"/>`;
  for (const l of links) {
    const a = nref(l.source);
    const b = nref(l.target);
    s += `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="${
      COL.line
    }" stroke-width="1.2" stroke-linecap="round"/>\n`;
  }
  s += `</svg>`;
  return s;
}

function buildSnapshotSvg({ nodes, links, w, h, nref }) {
  const E = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  let s = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(
    h
  )}" viewBox="0 0 ${w} ${h}">
<rect width="100%" height="100%" fill="${COL.bg}"/>`;
  for (const l of links) {
    const a = nref(l.source);
    const b = nref(l.target);
    s += `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="${
      COL.line
    }" stroke-width="1.2"/>\n`;
  }
  for (const n of nodes) {
    const r = n.kind === "core" ? 12 : 9;
    s += `<circle cx="${n.px}" cy="${n.py}" r="${r}" fill="${kindColor(
      n.kind
    )}"/>\n`;
    s += `<text x="${n.px}" y="${n.py + 22}" text-anchor="middle" fill="${
      COL.sub
    }" font-size="9" font-family="ui-sans-serif,system-ui,sans-serif">${E(
      n.label
    )}</text>\n`;
  }
  s += `</svg>`;
  return s;
}

function buildPreviewHtml({ nodes, links, w, h, nref }, builtAt) {
  const nSorted = [...nodes].sort((a, b) => a.order - b.order);
  const orderRank = Object.fromEntries(nSorted.map((n, i) => [n.id, i]));

  let edgesSvg = "";
  for (const l of links) {
    const a = nref(l.source);
    const b = nref(l.target);
    const L = Math.hypot(b.px - a.px, b.py - a.py) || 1;
    const delay = 0.35 + Math.max(orderRank[a.id], orderRank[b.id]) * 0.06;
    edgesSvg += `<line class="edge" x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="${COL.lineHi}" stroke-width="1.2" style="--len:${L}; animation-delay:${delay}s"/>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>The Meridian</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:${COL.bg}; color:${COL.text}; font-family: ui-sans-serif, system-ui, sans-serif; }
  a { color: #8b7cff; text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* Intro (loading) overlay */
  .intro {
    position: fixed; inset: 0;
    display: grid; place-items: center;
    background: radial-gradient(1200px 700px at 50% 40%, rgba(139,124,255,0.12), rgba(11,13,18,0.0) 60%), ${COL.bg};
    z-index: 10;
    transition: opacity 650ms ease, visibility 650ms ease;
  }
  body.is-loaded .intro { opacity: 0; visibility: hidden; pointer-events: none; }
  .introInner { width: min(820px, 92vw); padding: 20px; }
  .introTitle { margin: 0 0 10px; font-size: 0.9rem; letter-spacing: 0.14em; font-weight: 650; color: rgba(220,230,250,0.9); }
  .introMeta { margin: 0 0 16px; color: ${COL.sub}; font-size: 0.78rem; }
  .stage {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(120,150,200,.14);
    box-shadow: 0 12px 56px rgba(0,0,0,.55);
    background: rgba(0,0,0,0.08);
  }
  svg { display: block; width: 100%; height: auto; }

  @keyframes draw {
    from { stroke-dashoffset: 120; }
    to { stroke-dashoffset: 0; }
  }
  .edge {
    stroke-dasharray: 120; stroke-dashoffset: 120;
    animation: draw 0.5s ease-out both;
  }

  /* Landing */
  main { min-height: 100vh; display: grid; place-items: center; padding: 46px 18px; }
  .card {
    width: min(920px, 92vw);
    border-radius: 14px;
    border: 1px solid rgba(120,150,200,.14);
    background: rgba(18,22,31,0.45);
    box-shadow: 0 18px 80px rgba(0,0,0,.55);
    padding: 26px 22px;
    backdrop-filter: blur(10px);
  }
  .hero { display: grid; gap: 14px; align-items: center; grid-template-columns: 1fr; }
  .hero h1 { margin: 0; font-size: 1.6rem; letter-spacing: 0.03em; }
  .sub { margin: 0; color: ${COL.sub}; line-height: 1.6; }
  .links { margin-top: 16px; display: grid; gap: 10px; }
  .links a {
    display: block;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(0,0,0,0.18);
    border: 1px solid rgba(120,150,200,.12);
  }
  .links a span { color: rgba(220,230,250,0.92); font-weight: 600; }
  .links a small { display: block; margin-top: 4px; color: ${COL.sub}; font-size: 0.82rem; }
  .footer { margin-top: 14px; font-size: 0.78rem; color: ${COL.sub}; display:flex; gap:10px; flex-wrap: wrap; }

  @media (prefers-reduced-motion: reduce) {
    .edge { animation: none; stroke-dashoffset: 0; }
    .intro { transition: none; }
  }
</style>
</head>
<body>
<div class="intro" id="intro">
  <div class="introInner">
    <p class="introTitle">THE MERIDIAN</p>
    <p class="introMeta">Loading map · ${builtAt} · <a href="https://github.com/Mapmakers-Tech-Guild/The-Meridian">Repo</a></p>
    <div class="stage" aria-label="The Meridian — edges-only intro">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${Math.round(
        w
      )}" height="${Math.round(h)}">
        <rect width="100%" height="100%" fill="${COL.bg}"/>
        ${edgesSvg}
      </svg>
    </div>
    <p class="introMeta" style="margin-top:12px">Tip: click to skip.</p>
  </div>
</div>

<main>
  <section class="card">
    <div class="hero">
      <h1>The Meridian</h1>
      <p class="sub">
        A shared map: a knowledge garden at the edge of a knowledge forest.
        If you want to build with us, you’re welcome here.
      </p>
    </div>

    <div class="links" role="navigation" aria-label="Start here">
      <a href="https://github.com/Mapmakers-Tech-Guild/The-Meridian/blob/main/ONBOARDING.md">
        <span>Onboarding</span>
        <small>Start small; learn the membranes; make your first PR.</small>
      </a>
      <a href="https://github.com/Mapmakers-Tech-Guild/The-Meridian/blob/main/0%20-%20Housekeeping/NAV.md">
        <span>NAV</span>
        <small>Table of contents + quick links.</small>
      </a>
      <a href="https://github.com/Mapmakers-Tech-Guild/The-Meridian/blob/main/CONTRIBUTING.md">
        <span>Contributing</span>
        <small>How we collaborate.</small>
      </a>
      <a href="https://github.com/Mapmakers-Tech-Guild/The-Meridian/blob/main/LICENSE.md">
        <span>License (AFPP)</span>
        <small>The ARX Foundation Public Pact (values-based license).</small>
      </a>
    </div>

    <div class="footer">
      <span>Contact: <a href="mailto:60dayrunway@hopefullyabysmal.com">60dayrunway@hopefullyabysmal.com</a></span>
      <span>·</span>
      <span><a href="snapshot.svg">Snapshot</a></span>
    </div>
  </section>
</main>

<script>
  (function () {
    const INTRO_MS = 2400;
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function done() { document.body.classList.add("is-loaded"); }
    if (prefersReduced) done();
    else window.setTimeout(done, INTRO_MS);
    document.getElementById("intro")?.addEventListener("click", done, { once: true });
  })();
</script>
</body>
</html>`;
}

function main() {
  gitChronoOrder();
  mkdirSync(outDir, { recursive: true });
  const layout = runLayout();
  const builtAt = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const svg = buildSnapshotSvg(layout);
  const edgesOnly = buildEdgesOnlySvg(layout);
  const html = buildPreviewHtml(layout, builtAt);
  writeFileSync(join(outDir, "kb-graph-snapshot.svg"), svg, "utf-8");
  writeFileSync(join(outDir, "kb-graph-snapshot-edges.svg"), edgesOnly, "utf-8");
  writeFileSync(join(outDir, "kb-graph-animated.html"), html, "utf-8");
  const meta = { builtAt, nodeCount: layout.nodes.length, edgeCount: layout.links.length };
  writeFileSync(join(outDir, "kb-graph.json"), JSON.stringify(meta, null, 2), "utf-8");
  console.log("Wrote", outDir, meta);
}

main();
