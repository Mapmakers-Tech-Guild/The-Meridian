/**
 * Vendors the `quartz/` build directory from the installed @jackyzha0/quartz package.
 * Required so `npx quartz build` can resolve `./quartz/build.ts` (see node_modules @jackyzha0/quartz constants).
 */
import { cpSync, existsSync, lstatSync, mkdirSync, rmSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "node_modules", "@jackyzha0", "quartz", "quartz");
const dest = join(root, "quartz");

if (!existsSync(src)) {
  console.error("Missing", src, "— run: npm install");
  process.exit(1);
}
if (!statSync(src).isDirectory()) {
  console.error("Expected directory at", src);
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });
if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}
cpSync(src, dest, { recursive: true, force: true });

// Important: avoid copying any existing symlinked cache dir from node_modules.
// The CLI expects to write into repo-local `quartz/.quartz-cache`.
const cacheDir = join(dest, ".quartz-cache");
if (existsSync(cacheDir)) {
  try {
    const st = lstatSync(cacheDir);
    if (st.isSymbolicLink()) rmSync(cacheDir, { recursive: true, force: true });
    else if (!st.isDirectory()) rmSync(cacheDir, { force: true });
  } catch {
    rmSync(cacheDir, { recursive: true, force: true });
  }
}
mkdirSync(cacheDir, { recursive: true });
console.log("Vendored Quartz engine into", dest);
