import { cpSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public", "meridian-assets");
const src = join(root, "assets", "kb-graph");

mkdirSync(pub, { recursive: true });
const files = [
  "meridian-topology.json",
  "kb-graph-animated.html",
  "kb-graph-snapshot.svg",
  "kb-graph-snapshot-edges.svg",
  "kb-graph.json",
];
for (const f of files) {
  const from = join(src, f);
  if (existsSync(from)) cpSync(from, join(pub, f), { force: true });
}
console.log("Meridian map assets →", pub);
