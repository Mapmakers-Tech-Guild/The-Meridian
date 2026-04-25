/**
 * Precompiles a knowledge-base map: discover vault topology, force layout (d3) → SVG + JSON + HTML.
 * The graph is derived from the repo:
 *  - top-level "N - Name" area folders
 *  - Housekeeping subfolders (Egregore, Membranes, etc.) as satellites
 *  - optional inter-area / cross-membrane edges from markdown links in .md files
 * Run: npm run build:graph
 * CHRONO=git orders animation by first git commit touching each area (best-effort).
 */
import { writeFileSync, mkdirSync, readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative, resolve, normalize, sep, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { execSync } from "child_process";

const require = createRequire(import.meta.url);
const d3 = require("d3");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "assets", "kb-graph");

const COL = {
  bg: "#0a0c10",
  line: "rgba(90, 120, 100, 0.35)",
  lineHi: "rgba(160, 190, 170, 0.55)",
  accent: "rgba(180, 150, 90, 0.45)",
  core: "#6b7f72",
  area: "#5a8a9e",
  sat: "#b89a6a",
  text: "#d4ddd6",
  sub: "rgba(200, 210, 200, 0.55)",
};

/** Housekeeping subfolder name → short graph id (matches older satellite ids) */
const SATELLITE_IDS = {
  Egregore: "eg",
  "Work-context": "ctx",
  Publication: "pub",
  Membranes: "mem",
  Guides: "guides",
};

const AREA_RE = /^(\d+)\s*-\s+.+$/;
const WALK_BLOCK = new Set([
  "node_modules",
  ".git",
  "quartz",
  "public",
  "meridian",
  "scripts",
  ".github",
  "assets",
  ".quartz-cache",
  "content",
]);

function toPosix(p) {
  return p.split(sep).join("/");
}

function listAreaDirs() {
  const out = [];
  for (const name of readdirSync(root)) {
    const full = join(root, name);
    if (!statSync(full).isDirectory()) continue;
    if (WALK_BLOCK.has(name)) continue;
    const m = name.match(AREA_RE);
    if (m) {
      out.push({
        id: m[1],
        dirName: name,
        path: full,
        label: name.replace(/^\d+\s*-\s*/, "").trim() || name,
      });
    }
  }
  out.sort((a, b) => Number(a.id) - Number(b.id));
  return out;
}

function housekeepingPath(areas) {
  return areas.find((a) => a.id === "0")?.path || null;
}

function listSatelliteNodes(hkPath) {
  if (!hkPath || !existsSync(hkPath)) return [];
  const out = [];
  for (const name of readdirSync(hkPath)) {
    if (name === "Templates" || name.startsWith(".")) continue;
    const full = join(hkPath, name);
    if (!statSync(full).isDirectory()) continue;
    const short = SATELLITE_IDS[name] || `hk-${name.replace(/\s/g, "-").toLowerCase()}`;
    out.push({
      id: short,
      kind: "sat",
      label: name,
    });
  }
  return out;
}

/**
 * @param {string} relFromRoot posix path from repo root
 * @param {string} hkDirName e.g. "0 - Housekeeping"
 */
function regionKey(relFromRoot, hkDirName) {
  const p = relFromRoot;
  const areaMatch = p.match(/^(\d+)\s+-\s+[^/]+/);
  if (!areaMatch) return null;
  const n = areaMatch[1];
  if (n !== "0") return n;
  if (!p.startsWith(hkDirName + "/") && p !== hkDirName) return n;
  const rest = p.slice(hkDirName.length + 1);
  if (!rest) return "0";
  const sub = rest.split("/")[0];
  if (sub && SATELLITE_IDS[sub]) return SATELLITE_IDS[sub];
  return "0";
}

/**
 * @param {string} absFile
 * @param {string} hkDirName e.g. "0 - Housekeeping"
 */
function keyForFile(absFile, hkDirName) {
  const rel = toPosix(relative(root, absFile));
  return regionKey(rel, hkDirName);
}

const MD_LINK = /\[([^\]]*)\]\(([^)]+)\)/g;
const WIKI_LINK = /\[\[([^\]]+)\]\]/g;

function walkMarkdownFiles() {
  const out = [];
  const block = (name) => WALK_BLOCK.has(name) || name === "quartz" || name === "meridian";
  const walk = (dir, depth = 0) => {
    if (depth > 50) return;
    let items;
    try {
      items = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of items) {
      if (e.isDirectory() && e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (block(e.name)) continue;
        walk(full, depth + 1);
      } else if (e.isFile() && e.name.endsWith(".md")) {
        out.push(full);
      }
    }
  };
  walk(root, 0);
  return out;
}

function parseLinksFromText(text) {
  const out = [];
  const md = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = md.exec(text)) !== null) {
    out.push(m[2].trim());
  }
  const w = /\[\[([^\]]+)\]\]/g;
  while ((m = w.exec(text)) !== null) {
    const inner = m[1].split("|")[0].trim();
    if (inner.includes("/") || inner.includes(".")) out.push(inner);
  }
  return out;
}

function resolveMdTarget(sourceFile, target) {
  let t = target.split("#")[0].trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("mailto:")) return null;
  t = t.replace(/^\.\//, "");
  const dir = dirname(sourceFile);
  let resolved;
  try {
    resolved = resolve(dir, decodeURIComponent(t));
  } catch {
    return null;
  }
  const n = normalize(resolved);
  const rootN = normalize(root);
  if (n !== rootN && !n.startsWith(rootN + sep)) {
    if (!existsSync(n)) return null;
  }
  if (!n.endsWith(".md")) return null;
  if (!existsSync(n)) return null;
  return n;
}

/**
 * @param {string} hkDirName
 * @param {string[]} nodeIds
 */
function discoverCrossLinks(hkDirName, nodeIds) {
  const idSet = new Set(nodeIds);
  const seen = new Set();
  const edges = [];
  const files = walkMarkdownFiles();
  for (const file of files) {
    const srcK = keyForFile(file, hkDirName);
    if (srcK == null || !idSet.has(srcK)) continue;
    let text;
    try {
      text = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    for (const raw of parseLinksFromText(text)) {
      const tgt = resolveMdTarget(file, raw);
      if (!tgt) continue;
      const dstK = keyForFile(tgt, hkDirName);
      if (dstK == null || !idSet.has(dstK) || srcK === dstK) continue;
      const a = srcK < dstK ? srcK : dstK;
      const b = srcK < dstK ? dstK : srcK;
      const key = a + "→" + b;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([srcK, dstK]);
      if (edges.length > 200) return edges;
    }
  }
  return edges;
}

function buildNodeSet(areas, satellites) {
  const nodes = [];
  let o = 0;
  for (const a of areas) {
    nodes.push({
      id: a.id,
      kind: a.id === "0" ? "core" : "area",
      label: `${a.id} · ${a.label}`,
      order: o++,
    });
  }
  for (const s of satellites) {
    nodes.push({
      id: s.id,
      kind: "sat",
      label: s.label,
      order: o++,
    });
  }
  return nodes;
}

function buildStaticEdges(areas, satellites) {
  const edges = [];
  for (const a of areas) {
    if (a.id === "0") continue;
    edges.push(["0", a.id]);
  }
  for (const s of satellites) {
    edges.push(["0", s.id]);
  }
  const has = (a, b) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  if (areas.some((x) => x.id === "1") && areas.some((x) => x.id === "4") && !has("1", "4")) {
    edges.push(["1", "4"]);
  }
  if (areas.some((x) => x.id === "3") && areas.some((x) => x.id === "2") && !has("3", "2")) {
    edges.push(["3", "2"]);
  }
  return edges;
}

function gitChronoOrder() {
  if (process.env.CHRONO !== "git") return;
  const nodeIds = NODES_G.map((n) => n.id);
  try {
    const out = execSync("git log --reverse --name-only --pretty=format:---%n%H", {
      cwd: root,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    const first = Object.create(null);
    for (const line of out.split("\n")) {
      const t = line.trim().toLowerCase();
      for (const id of nodeIds) {
        if (first[id] != null) continue;
        if (/^\d+$/.test(id)) {
          if (t.includes(`${id} -`)) first[id] = 1;
        } else {
          if (t.includes(id)) first[id] = 1;
        }
      }
    }
    const known = nodeIds.filter((id) => first[id] != null);
    const rest = nodeIds.filter((id) => first[id] == null);
    let seq = 0;
    for (const id of [...known, ...rest]) {
      const n = NODES_G.find((x) => x.id === id);
      if (n) n.order = seq++;
    }
  } catch {
    /* */
  }
}

let NODES_G = [];

function runLayout() {
  const nodes = NODES_G.map((d) => ({ ...d }));
  const links = EDGES_G.map(([s, t]) => ({ source: s, target: t })).filter(
    (l) => nodes.some((n) => n.id === l.source) && nodes.some((n) => n.id === l.target),
  );

  nodes.forEach((d, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, nodes.length);
    d.x = 140 * Math.cos(a);
    d.y = 140 * Math.sin(a);
  });

  const sim = d3
    .forceSimulation(nodes)
    .alpha(0.9)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(90).strength(0.55))
    .force("charge", d3.forceManyBody().strength(-480))
    .force("center", d3.forceCenter(0, 0))
    .force("collide", d3.forceCollide(36))
    .stop();

  for (let i = 0; i < 400; i++) sim.tick();

  const nref = (x) => (typeof x === "object" && x != null && "id" in x ? x : nodes[x]);

  let xMin = Infinity,
    xMax = -Infinity,
    yMin = Infinity,
    yMax = -Infinity;
  for (const n of nodes) {
    xMin = Math.min(xMin, n.x);
    xMax = Math.max(xMax, n.x);
    yMin = Math.min(yMin, n.y);
    yMax = Math.max(yMax, n.y);
  }
  const pad = 70;
  const w = xMax - xMin + 2 * pad;
  const h = yMax - yMin + 2 * pad;
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

let EDGES_G = [];

function buildEdgesOnlySvg({ nodes, links, w, h, nref }) {
  let s = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(
    h
  )}" viewBox="0 0 ${w} ${h}" role="img" aria-label="The Meridian — knowledge graph edges, derived from the vault at build time">
<rect width="100%" height="100%" fill="${COL.bg}"/>`;
  for (const l of links) {
    const a = nref(l.source);
    const b = nref(l.target);
    s += `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="${COL.line}" stroke-width="1.2" stroke-linecap="round"/>\n`;
  }
  s += `</svg>`;
  return s;
}

function buildSnapshotSvg({ nodes, links, w, h, nref }) {
  const E = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  let s = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(
    h
  )}" viewBox="0 0 ${w} ${h}">
<rect width="100%" height="100%" fill="${COL.bg}"/>`;
  for (const l of links) {
    const a = nref(l.source);
    const b = nref(l.target);
    s += `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="${COL.line}" stroke-width="1.2"/>\n`;
  }
  for (const n of nodes) {
    const r = n.kind === "core" ? 12 : 9;
    s += `<circle cx="${n.px}" cy="${n.py}" r="${r}" fill="${kindColor(n.kind)}"/>\n`;
    s += `<text x="${n.px}" y="${n.py + 22}" text-anchor="middle" fill="${COL.sub}" font-size="9" font-family="ui-sans-serif,system-ui,sans-serif">${E(
      n.label
    )}</text>\n`;
  }
  s += `</svg>`;
  return s;
}

function buildTopologyJson(layout, builtAt) {
  const nSorted = [...layout.nodes].sort((a, b) => a.order - b.order);
  const orderRank = Object.fromEntries(nSorted.map((n, i) => [n.id, i]));
  const { nodes, links, w, h, nref } = layout;
  const lines = [];
  for (const l of links) {
    const a = nref(l.source);
    const b = nref(l.target);
    const L = Math.hypot(b.px - a.px, b.py - a.py) || 1;
    const delay = 0.35 + Math.max(orderRank[a.id], orderRank[b.id]) * 0.06;
    lines.push({ x1: a.px, y1: a.py, x2: b.px, y2: b.py, L, delay });
  }
  return {
    builtAt,
    w,
    h,
    bg: COL.bg,
    stroke: COL.lineHi,
    lines,
    nodeCount: nodes.length,
    edgeCount: links.length,
  };
}

const SITE_BASE = (process.env.SITE_BASE || "/The-Meridian/").replace(/\/?$/, "/");

function siteHref(name) {
  if (!name) return "./";
  return join(SITE_BASE, name)
    .split(sep)
    .join("/");
}

function buildPreviewHtml(layout, builtAt) {
  const nSorted = [...layout.nodes].sort((a, b) => a.order - b.order);
  const orderRank = Object.fromEntries(nSorted.map((n, i) => [n.id, i]));
  const { nodes, links, w, h, nref } = layout;

  let edgesSvg = "";
  for (const l of links) {
    const a = nref(l.source);
    const b = nref(l.target);
    const L = Math.hypot(b.px - a.px, b.py - a.py) || 1;
    const delay = 0.35 + Math.max(orderRank[a.id], orderRank[b.id]) * 0.06;
    edgesSvg += `<line class="edge" x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="${COL.lineHi}" stroke-width="1.2" style="--len:${L}; animation-delay:${delay}s"/>\n`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>The Meridian — map</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:${COL.bg}; color:${COL.text}; font-family: "Source Sans 3", "Spectral", ui-sans-serif, system-ui, sans-serif; }
  a { color: #9eb8a4; text-decoration: none; }
  a:hover { text-decoration: underline; color: #c8dbcc; }
  @keyframes draw { from { stroke-dashoffset: 120; } to { stroke-dashoffset: 0; } }
  .edge { stroke-dasharray: 120; stroke-dashoffset: 120; animation: draw 0.5s ease-out both; }
  .intro { min-height: 100vh; display: grid; place-items: center; padding: 32px 16px; }
  .inner { width: min(860px, 96vw); }
  .topo { background-image:
      repeating-linear-gradient(0deg, rgba(100,120,100,0.04) 0 1px, transparent 1px 22px),
      repeating-linear-gradient(90deg, rgba(100,120,100,0.03) 0 1px, transparent 1px 32px);
    border: 1px solid rgba(120,150,130,0.2); border-radius: 14px; padding: 18px; box-shadow: 0 16px 60px rgba(0,0,0,.4); }
  .kicker { font-size: 0.8rem; letter-spacing: 0.16em; text-transform: uppercase; color: ${COL.sub}; margin: 0 0 8px; }
  .meta { font-size: 0.8rem; color: ${COL.sub}; margin: 0 0 12px; }
  svg { display: block; width: 100%; height: auto; }
  @media (prefers-reduced-motion: reduce) { .edge { animation: none; stroke-dashoffset: 0; } }
</style>
</head>
<body>
<section class="intro">
  <div class="inner">
    <p class="kicker">The Meridian</p>
    <p class="meta">Vault map · auto-built ${builtAt} · edges & topology match the current KB tree and links. <a href="https://github.com/Mapmakers-Tech-Guild/The-Meridian">GitHub</a> · <a href="${siteHref(
      ""
    )}">Quartz home</a></p>
    <div class="topo" aria-label="Meridian — edges-only">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${Math.round(w)}" height="${Math.round(
        h
      )}">
        <rect width="100%" height="100%" fill="${COL.bg}"/>
        ${edgesSvg}
      </svg>
    </div>
  </div>
</section>
</body>
</html>`;
}

function main() {
  const areas = listAreaDirs();
  if (areas.length === 0) {
    console.error("No 'N - Name' top-level area folders found; graph not generated.");
    process.exit(1);
  }
  const hk = housekeepingPath(areas);
  const sats = listSatelliteNodes(hk);
  const hkDirName = (areas.find((a) => a.id === "0")?.dirName ?? "0 - Housekeeping").split("/").join("/");
  NODES_G = buildNodeSet(areas, sats);
  let edges = buildStaticEdges(areas, sats);
  const nodeIdList = NODES_G.map((n) => n.id);
  const cross = discoverCrossLinks(hkDirName, nodeIdList);
  const edgeSet = new Set(edges.map(([a, b]) => (a < b ? a + ":" + b : b + ":" + a)));
  for (const [a, b] of cross) {
    const k = a < b ? a + ":" + b : b + ":" + a;
    if (edgeSet.has(k)) continue;
    edgeSet.add(k);
    edges.push([a, b]);
  }
  EDGES_G = edges;
  gitChronoOrder();
  mkdirSync(outDir, { recursive: true });
  const layout = runLayout();
  const builtAt = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const svg = buildSnapshotSvg(layout);
  const edgesOnly = buildEdgesOnlySvg(layout);
  const html = buildPreviewHtml(layout, builtAt);
  const topology = buildTopologyJson(layout, builtAt);
  writeFileSync(join(outDir, "kb-graph-snapshot.svg"), svg, "utf-8");
  writeFileSync(join(outDir, "kb-graph-snapshot-edges.svg"), edgesOnly, "utf-8");
  writeFileSync(join(outDir, "kb-graph-animated.html"), html, "utf-8");
  writeFileSync(join(outDir, "meridian-topology.json"), JSON.stringify(topology, null, 2), "utf-8");
  const meta = {
    builtAt,
    nodeCount: layout.nodes.length,
    edgeCount: layout.links.length,
    areas: areas.map((a) => a.dirName),
    satellites: sats.length,
  };
  writeFileSync(join(outDir, "kb-graph.json"), JSON.stringify(meta, null, 2), "utf-8");
  console.log("Wrote", outDir, meta);
}

main();
