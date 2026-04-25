/**
 * The Quartz CLI in node_modules imports ../../quartz/.quartz-cache/... from *inside* the
 * @jackyzha0/quartz package, which resolves to node_modules/.../quartz/quartz/.quartz-cache.
 * esbuild writes the bundle to the repo root's quartz/.quartz-cache instead.
 * Link the two so the dynamic import finds the file.
 */
import { existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const target = join(root, "quartz", ".quartz-cache");
const linkPath = join(root, "node_modules", "@jackyzha0", "quartz", "quartz", ".quartz-cache");

// If vendored quartz accidentally contains a symlinked cache dir, remove it to avoid loops.
if (existsSync(target)) {
  try {
    const st = lstatSync(target);
    if (st.isSymbolicLink()) rmSync(target, { recursive: true, force: true });
  } catch {
    rmSync(target, { recursive: true, force: true });
  }
}
mkdirSync(target, { recursive: true });
mkdirSync(dirname(linkPath), { recursive: true });

function isOurLink() {
  if (!existsSync(linkPath)) return false;
  try {
    const st = lstatSync(linkPath);
    if (process.platform === "win32" && st.isDirectory() && st.isSymbolicLink() === false) {
      return false;
    }
    if (st.isSymbolicLink()) {
      const t = readlinkSync(linkPath);
      const rel = relative(dirname(linkPath), target);
      return t === rel || t === target || join(dirname(linkPath), t) === target;
    }
  } catch {
    return false;
  }
  return false;
}

if (existsSync(linkPath) && !isOurLink()) {
  rmSync(linkPath, { recursive: true, force: true });
}
if (!existsSync(linkPath)) {
  if (process.platform === "win32") {
    symlinkSync(target, linkPath, "junction");
  } else {
    const relT = relative(dirname(linkPath), target);
    symlinkSync(relT, linkPath, "dir");
  }
  console.log("Linked Quartz cache for CLI:", linkPath, "->", target);
}
