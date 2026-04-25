#!/usr/bin/env node
/**
 * Pre-build link checker — validates markdown links and [[wikilinks]].
 *
 * Algorithm
 *   Phase 1  O(F)   single recursive walk; build fileSet, dirSet, nameIndex,
 *                   and per-file content hashes for the diff cache
 *   Phase 2  O(D)   parse only the files that changed since the last passing run
 *                   (D ≤ F; D ≈ 1 in a typical single-file edit)
 *   Phase 3  O(L)   validate each link with O(1) set/map lookups — no fs calls
 *   Phase 4  O(B)   report and persist cache
 *
 *   F = vault files   D = dirty (changed) files   L = total links   B = broken
 *
 * Diff cache (.link-check-cache.json)
 *   Stores { indexHash, fileHashes }.  indexHash is a digest of all vault file
 *   paths; if it changes (file added, deleted, renamed) the whole cache is
 *   discarded because a new/deleted file can resolve or break wikilinks
 *   anywhere.  When the index is stable, only files whose content hash differs
 *   from the cached value are re-checked.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs"
import { join, dirname, resolve, extname, basename } from "path"
import { fileURLToPath } from "url"
import { createHash } from "crypto"

const root     = join(dirname(fileURLToPath(import.meta.url)), "..")
const CACHE_PATH = join(root, ".link-check-cache.json")

// Directories that are tooling / build artifacts — not vault content.
// NOTE: Templates is intentionally absent; links to template files are
// legitimate vault references even though Quartz doesn't publish them.
const SKIP_DIRS = new Set([
  "node_modules", "quartz", "meridian", "scripts", "public",
  ".quartz-cache", ".github", "assets",
])

// ── Phase 1: build index (always runs) ───────────────────────────────────────
//
// fileSet   — absolute path of every .md file in the vault      (O(1) lookup)
// dirSet    — absolute path of every directory encountered       (O(1) lookup)
// nameIndex — lowercase stem → Set<absPath>                      (O(1) wikilink)
// contentHashes — absPath → hex digest of file content

const fileSet      = new Set()
const dirSet       = new Set()
const nameIndex    = new Map()
const contentHashes = new Map()
const files        = []   // ordered list for Phase 2

function walkIndex(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      dirSet.add(full)
      if (!SKIP_DIRS.has(entry.name)) walkIndex(full)
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full)
      fileSet.add(full)
      const stem = basename(full, ".md").toLowerCase()
      if (!nameIndex.has(stem)) nameIndex.set(stem, new Set())
      nameIndex.get(stem).add(full)
      // Hash content now; we need the bytes anyway for Phase 2
      const raw = readFileSync(full, "utf8")
      contentHashes.set(full, createHash("sha256").update(raw).digest("hex"))
    }
  }
}

walkIndex(root)

// ── Diff cache ────────────────────────────────────────────────────────────────

// indexHash lets us detect when files are added, deleted, or renamed.
// Any such change invalidates wikilink resolution results for every file,
// so we discard the cached file-level hashes and re-check everything.
const indexHash = createHash("sha256")
  .update([...fileSet].sort().join("\n"))
  .digest("hex")

let cache = { indexHash: null, fileHashes: {} }
try { cache = JSON.parse(readFileSync(CACHE_PATH, "utf8")) } catch { /* cold start */ }

const indexStable = cache.indexHash === indexHash
const prevHashes  = indexStable ? (cache.fileHashes ?? {}) : {}

function saveCache(passedHashes) {
  try { mkdirSync(dirname(CACHE_PATH), { recursive: true }) } catch { /* exists */ }
  writeFileSync(CACHE_PATH, JSON.stringify({
    indexHash,
    fileHashes: { ...prevHashes, ...passedHashes },
  }, null, 2))
}

// ── Phase 2: parse links (only dirty files) ───────────────────────────────────

// Blanking code spans with same-length spaces preserves regex index positions.
function stripCode(raw) {
  return raw.replace(/(`+)([\s\S]*?)\1/g, m => " ".repeat(m.length))
}

// [text](target) — paren-depth counter handles filenames that contain parens
function* markdownLinks(content) {
  const opener = /\[[^\]]*\]\(/g
  let m
  while ((m = opener.exec(content)) !== null) {
    let depth = 1, i = m.index + m[0].length, href = ""
    while (i < content.length && depth > 0) {
      const ch = content[i]
      if (ch === "(") depth++
      else if (ch === ")") { if (--depth === 0) break }
      if (depth > 0) href += ch
      i++
    }
    const target = href.split("#")[0].trim()
    if (target && !/^https?:|^mailto:/.test(target)) yield { target, kind: "md" }
  }
}

// [[target]], [[target|alias]], [[target#frag]], [[target#frag|alias]]
function* wikiLinks(content) {
  const re = /\[\[([^\]#|]+)(?:[#|][^\]]*)?\]\]/g
  let m
  while ((m = re.exec(content)) !== null) {
    const target = m[1].trim()
    if (target) yield { target, kind: "wiki" }
  }
}

// ── Phase 3: validate — O(1) per link ─────────────────────────────────────────

function checkMarkdownLink(fromFile, target) {
  const decoded = decodeURIComponent(target)
  const abs     = decoded.startsWith("/")
    ? join(root, decoded)
    : resolve(dirname(fromFile), decoded)
  const clean = abs.replace(/\/$/, "")

  if (fileSet.has(clean))                              return true
  if (!extname(clean) && fileSet.has(clean + ".md"))   return true
  if (dirSet.has(clean))                               return true
  return false
}

function checkWikiLink(fromFile, target) {
  // Relative-path wikilinks: delegate to the markdown checker
  if (target.startsWith("./") || target.startsWith("../")) {
    return checkMarkdownLink(fromFile, target.replace(/ /g, "%20"))
  }

  // Path-qualified: [[2 - Projects/README]] — resolve from vault root
  if (target.includes("/")) {
    const abs = join(root, target)
    if (fileSet.has(abs) || fileSet.has(abs + ".md") || dirSet.has(abs)) return true
    // Fallback: bare stem match (Quartz resolves ambiguous paths by shortest)
    return nameIndex.has(basename(target, ".md").toLowerCase())
  }

  // Bare stem: [[ONBOARDING]] — Quartz "shortest" match, case-insensitive
  const stem = target.toLowerCase()
  if (nameIndex.has(stem)) return true
  if (stem.endsWith(".md") && nameIndex.has(stem.slice(0, -3))) return true
  return false
}

// ── Phase 4: report ───────────────────────────────────────────────────────────

const broken     = []
const newPassed  = {}   // hashes for files that passed this run
let   skipped    = 0

for (const file of files) {
  const hash = contentHashes.get(file)

  if (prevHashes[file] === hash) {
    skipped++
    continue   // unchanged since last passing run — skip
  }

  const content = stripCode(readFileSync(file, "utf8"))
  const fileBroken = []

  for (const { target, kind } of [...markdownLinks(content), ...wikiLinks(content)]) {
    const ok = kind === "wiki"
      ? checkWikiLink(file, target)
      : checkMarkdownLink(file, target)
    if (!ok) fileBroken.push({ target, kind })
  }

  if (fileBroken.length === 0) {
    newPassed[file] = hash   // record passing hash so we can skip next run
  } else {
    for (const { target, kind } of fileBroken) {
      broken.push({ file: file.slice(root.length + 1), target, kind })
    }
  }
}

if (broken.length) {
  console.error("\nBroken links found:\n")
  for (const { file, target, kind } of broken) {
    const label = kind === "wiki" ? `[[${target}]]` : target
    console.error(`  ${file}\n    → ${label}\n`)
  }
  console.error(`${broken.length} broken link(s). Fix before building.`)
  // Don't persist cache — failed files must be re-checked next run
  process.exit(1)
} else {
  saveCache(newPassed)
  const checked = files.length - skipped
  console.log(
    `Link check passed — ${files.length} file(s) in vault, ` +
    `${checked} checked, ${skipped} skipped (unchanged).`
  )
}
