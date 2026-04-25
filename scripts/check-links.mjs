#!/usr/bin/env node
/**
 * Pre-build link checker.
 * Scans all .md files and verifies every relative internal link resolves
 * to an existing file or directory on disk. Exits non-zero on failure.
 *
 * Run: node scripts/check-links.mjs
 */
import { readFileSync, existsSync, readdirSync } from "fs"
import { join, dirname, resolve, extname } from "path"
import { fileURLToPath } from "url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// Mirror quartz.config.ts ignorePatterns (directory names only)
const IGNORE_DIRS = new Set([
  "node_modules", "quartz", "meridian", "scripts", "public",
  ".quartz-cache", ".github", "assets", "Templates",
])

function* walkMd(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) yield* walkMd(full)
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      yield full
    }
  }
}

// Extract relative link targets from markdown, stripping fragments.
// Handles balanced parentheses in link targets (e.g. filenames with parens).
// Skips links inside fenced code blocks and inline code spans.
function extractLinks(raw) {
  // Blank out all code spans/blocks (any run of backticks) so we don't chase examples
  const content = raw.replace(/(`+)([\s\S]*?)\1/g, m => " ".repeat(m.length))

  const links = []
  const opener = /\[[^\]]*\]\(/g
  let m
  while ((m = opener.exec(content)) !== null) {
    let depth = 1
    let i = m.index + m[0].length
    let href = ""
    while (i < content.length && depth > 0) {
      const ch = content[i]
      if (ch === "(") depth++
      else if (ch === ")") { depth--; if (depth === 0) break }
      if (depth > 0) href += ch
      i++
    }
    const target = href.split("#")[0].trim()
    if (!target || /^https?:|^mailto:/.test(target)) continue
    links.push(target)
  }
  return links
}

function resolveTarget(from, href) {
  const decoded = decodeURIComponent(href)
  return href.startsWith("/")
    ? join(root, decoded)
    : resolve(dirname(from), decoded)
}

function targetExists(target) {
  if (existsSync(target)) return true
  // bare path with no extension → try .md
  if (!extname(target) && existsSync(target + ".md")) return true
  // directory link → accept if README.md or index.md is present
  if (existsSync(join(target, "README.md")) || existsSync(join(target, "index.md"))) return true
  return false
}

const files = [...walkMd(root)]
const broken = []

for (const file of files) {
  const content = readFileSync(file, "utf8")
  for (const href of extractLinks(content)) {
    if (!targetExists(resolveTarget(file, href))) {
      broken.push({ file: file.slice(root.length + 1), href })
    }
  }
}

if (broken.length) {
  console.error("\nBroken links found:\n")
  for (const { file, href } of broken) {
    console.error(`  ${file}\n    → ${href}\n`)
  }
  console.error(`${broken.length} broken link(s). Fix before building.`)
  process.exit(1)
} else {
  console.log(`Link check passed — ${files.length} file(s) scanned, all internal links valid.`)
}
