#!/usr/bin/env node
/**
 * Post-build smoke tests. Run after `npm run build:site`.
 * Exits non-zero on any failure so CI catches regressions.
 */
import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const pub = join(root, "public")

let failures = 0
function check(label, condition) {
  if (condition) {
    console.log(`  ok  ${label}`)
  } else {
    console.error(`  FAIL  ${label}`)
    failures++
  }
}

// ── HTML ──────────────────────────────────────────────────────────────────────
const html = readFileSync(join(pub, "index.html"), "utf8")
console.log("index.html")
check("overlay element present",            html.includes('id="meridian-intro"'))
check("hint is click-gate (no auto-wait)",  html.includes("Click anywhere to enter"))
check("no old 'or wait' hint text",         !html.includes("or wait"))
check("topology path is ./meridian-assets", html.includes('data-topology="./meridian-assets/meridian-topology.json"'))
check("body data-slug is 'index'",          html.includes('data-slug="index"'))

// ── Static assets ─────────────────────────────────────────────────────────────
console.log("\nmeridian-assets/")
check("meridian-topology.json exists",      existsSync(join(pub, "meridian-assets", "meridian-topology.json")))
check("kb-graph-animated.html exists",      existsSync(join(pub, "meridian-assets", "kb-graph-animated.html")))

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = readFileSync(join(pub, "index.css"), "utf8")
console.log("\nindex.css")
check("meridianHintPulse keyframe present", css.includes("meridianHintPulse"))
check("meridian-intro--done class present", css.includes("meridian-intro--done"))
check("meridian-reveal class present",      css.includes("meridian-reveal"))

// ── JS ────────────────────────────────────────────────────────────────────────
const js = readFileSync(join(pub, "postscript.js"), "utf8")
const mi = js.indexOf("meridianIntroSeen")
console.log("\npostscript.js (meridian section)")
check("meridian init function bundled",     mi !== -1)
if (mi !== -1) {
  const fn = js.slice(mi, mi + 3000)
  check("click listener registered",        fn.includes('addEventListener("click"'))
  check("no setTimeout auto-dismiss",       !fn.includes("setTimeout"))
  check("finish adds meridian-intro--done", fn.includes("meridian-intro--done"))
  check("finish adds meridian-reveal",      fn.includes("meridian-reveal"))
}

// ── Result ────────────────────────────────────────────────────────────────────
console.log()
if (failures > 0) {
  console.error(`${failures} check(s) failed.`)
  process.exit(1)
} else {
  console.log("All build checks passed.")
}
