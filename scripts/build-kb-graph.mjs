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
  )}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Mapmakers knowledge graph — edges only, same d3 force layout as the full snapshot">
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

  let nodesSvg = "";
  for (const n of nSorted) {
    const r = n.kind === "core" ? 12 : 9;
    const delay = 0.08 * n.order;
    nodesSvg += `<g class="node" style="--d:${delay}s" transform="translate(${n.px},${n.py})">
<circle r="${r}" fill="${kindColor(n.kind)}" class="n-dot"/>
<text y="20" text-anchor="middle" fill="${COL.sub}" font-size="9" font-family="ui-sans-serif,system-ui,sans-serif">${n.label
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</text>
</g>\n`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Mapmakers KB — generated map</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:${COL.bg}; color:${COL.text}; font-family: ui-sans-serif, system-ui, sans-serif; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 1rem; }
  h1 { font-size: 0.9rem; font-weight: 600; letter-spacing: 0.04em; }
  p.meta { color: ${COL.sub}; font-size: 0.75rem; margin: 0.2rem 0 1rem; }
  .stage { border-radius: 10px; overflow: hidden; border: 1px solid rgba(120,150,200,.15);
    box-shadow: 0 12px 48px rgba(0,0,0,.45); }
  svg { display: block; width: 100%; height: auto; }
  @keyframes pop { from { opacity: 0; transform: scale(0.35); } to { opacity: 1; transform: scale(1); } }
  .node { transform-box: fill-box; transform-origin: center; animation: pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) var(--d) both; }
  @keyframes draw {
    from { stroke-dashoffset: 120; }
    to { stroke-dashoffset: 0; }
  }
  .edge {
    stroke-dasharray: 120; stroke-dashoffset: 120;
    animation: draw 0.5s ease-out both;
  }
</style>
</head>
<body>
<div class="wrap">
  <h1>Mapmakers knowledge base — precompiled map</h1>
  <p class="meta">Regenerated on push to <code>main</code> · ${builtAt} · <a style="color:#8b7cff" href="https://github.com/Mapmakers-Tech-Guild/Mapmakers-Knowledgebase#readme">README</a></p>
  <div class="stage">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${Math.round(
    w
  )}" height="${Math.round(h)}">
<rect width="100%" height="100%" fill="${COL.bg}"/>
${edgesSvg}
${nodesSvg}
</svg>
  </div>
  <p class="meta" style="margin-top:0.8rem">Replay: hard refresh. Chronological order: Housekeeping first, then areas 1–6, then satellites; optional <code>CHRONO=git</code> in the build script to bias order by first git touch.</p>
</div>
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
