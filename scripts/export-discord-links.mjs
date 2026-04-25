#!/usr/bin/env node
/**
 * Exports every URL ever shared in a Discord server into the KB.
 *
 * Output layout:
 *   3 - Knowledge/discord-links/
 *     <hostname>/          one dir per domain (e.g. github.com/)
 *       <slug>.md          one note per unique URL
 *     index.md             summary of all domains + counts
 *
 * Usage:
 *   DISCORD_TOKEN=<bot-token> DISCORD_GUILD_ID=<guild-id> \
 *     node scripts/export-discord-links.mjs [--dry-run]
 *
 * Flags:
 *   --dry-run   Scan and report counts without writing any files.
 *   --overwrite Overwrite notes that already exist (default: skip).
 *
 * Requirements:
 *   - Bot must have Read Message History + View Channels permissions.
 *   - Node >= 22 (uses built-in fetch).
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")
const OUTPUT_DIR = join(REPO_ROOT, "3 - Knowledge", "discord-links")

const TOKEN = process.env.DISCORD_TOKEN
const GUILD_ID = process.env.DISCORD_GUILD_ID
const DRY_RUN = process.argv.includes("--dry-run")
const OVERWRITE = process.argv.includes("--overwrite")

if (!TOKEN || !GUILD_ID) {
  console.error(
    "Error: DISCORD_TOKEN and DISCORD_GUILD_ID environment variables are required.\n\n" +
    "Usage:\n  DISCORD_TOKEN=<bot-token> DISCORD_GUILD_ID=<guild-id> \\\n" +
    "    node scripts/export-discord-links.mjs [--dry-run] [--overwrite]\n\n" +
    "The bot needs: View Channels + Read Message History permissions."
  )
  process.exit(1)
}

// ── Discord REST helpers ───────────────────────────────────────────────────────

const API_BASE = "https://discord.com/api/v10"
const HEADERS = {
  Authorization: `Bot ${TOKEN}`,
  "User-Agent": "MapmakersKB-LinkExport/1.0 (github.com/mapmakers-tech-guild/The-Meridian)",
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function api(path, attempt = 0) {
  const res = await fetch(`${API_BASE}${path}`, { headers: HEADERS })

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}))
    const wait = Math.ceil((body.retry_after ?? 1) * 1000)
    console.warn(`  Rate limited — waiting ${wait}ms…`)
    await sleep(wait)
    return api(path, attempt)
  }

  // 403 = missing access (thread/private channel) — caller handles
  if (res.status === 403) return null

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Discord API ${path} → HTTP ${res.status}: ${text}`)
  }

  return res.json()
}

// Channel types that can have message history
// 0 = GUILD_TEXT, 2 = GUILD_VOICE (can have chat), 5 = GUILD_ANNOUNCEMENT
// 10/11/12 = thread types, 15 = GUILD_FORUM
const READABLE_CHANNEL_TYPES = new Set([0, 2, 5, 10, 11, 12, 15])

async function fetchChannels(guildId) {
  const channels = await api(`/guilds/${guildId}/channels`)
  if (!channels) throw new Error("Could not fetch channel list — check bot permissions.")

  const readable = channels.filter(c => READABLE_CHANNEL_TYPES.has(c.type))

  // Also fetch active threads for forum/announcement channels
  const threadsRes = await api(`/guilds/${guildId}/threads/active`)
  if (threadsRes?.threads) readable.push(...threadsRes.threads)

  return readable
}

async function fetchMessagesInChannel(channelId, channelName) {
  const messages = []
  let before = null

  while (true) {
    const qs = before ? `?limit=100&before=${before}` : "?limit=100"
    const batch = await api(`/channels/${channelId}/messages${qs}`)

    if (batch === null) {
      console.warn(`    No access to #${channelName} — skipping.`)
      break
    }

    if (!batch.length) break
    messages.push(...batch)
    before = batch[batch.length - 1].id

    // Polite delay — Discord burst limit is ~50 req/s but message history
    // endpoints have a separate per-channel bucket; 300 ms keeps us safe.
    await sleep(300)

    if (batch.length < 100) break
  }

  return messages
}

// ── URL extraction ─────────────────────────────────────────────────────────────

// Matches http/https URLs; stops at whitespace and common markdown delimiters.
const URL_RE = /https?:\/\/[^\s<>"'()\[\]]+/g

function extractUrls(text) {
  if (!text) return []
  return [...(text.match(URL_RE) ?? [])].map(u =>
    // Strip trailing punctuation that often bleeds into URLs in prose
    u.replace(/[.,;:!?]+$/, "")
  )
}

function collectUrlsFromMessage(msg) {
  const urls = new Set()

  for (const u of extractUrls(msg.content)) urls.add(u)

  // Embeds sometimes surface URLs not in the raw content (e.g. unfurled links)
  for (const embed of msg.embeds ?? []) {
    if (embed.url) urls.add(embed.url.replace(/[.,;:!?]+$/, ""))
  }

  // Attachments (direct file links)
  for (const att of msg.attachments ?? []) {
    if (att.url) urls.add(att.url.replace(/[?#].*$/, "")) // strip CDN query params
  }

  return [...urls]
}

// ── Filename / path helpers ────────────────────────────────────────────────────

function normalizeHostname(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase()
}

function urlToSlug(url) {
  try {
    const u = new URL(url)
    const pathParts = u.pathname.split("/").filter(Boolean)
    if (!pathParts.length) return "index"
    const raw = pathParts.join("--")
    // Replace anything that isn't safe in a filename
    return raw.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-{2,}/g, "-").slice(0, 100)
  } catch {
    return "link"
  }
}

function uniqueSlug(baseSlug, usedInDir) {
  if (!usedInDir.has(baseSlug)) { usedInDir.add(baseSlug); return baseSlug }
  let i = 2
  while (usedInDir.has(`${baseSlug}-${i}`)) i++
  const slug = `${baseSlug}-${i}`
  usedInDir.add(slug)
  return slug
}

// ── Note generation ────────────────────────────────────────────────────────────

function buildNote({ url, hostname, sharedBy, channelName, sharedAt }) {
  const escapedUrl = url.replace(/"/g, '\\"')
  return `---
type: link
url: "${escapedUrl}"
domain: ${hostname}
shared_by: "${sharedBy}"
shared_in: "#${channelName}"
shared_at: ${sharedAt}
source: discord
---

# ${url}

| Field | Value |
|---|---|
| URL | <${url}> |
| Domain | ${hostname} |
| Shared by | ${sharedBy} |
| Channel | #${channelName} |
| Date | ${sharedAt} |
`
}

function buildIndex(domainCounts, totalLinks, exportedAt) {
  const rows = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => `| [[${domain}/index|${domain}]] | ${count} |`)
    .join("\n")

  return `---
type: link-index
source: discord
exported_at: ${exportedAt}
total_links: ${totalLinks}
---

# Discord Links

All URLs shared in the guild Discord, exported and organised by domain.

| Domain | Links |
|---|---|
${rows}

---

*Re-run \`scripts/export-discord-links.mjs\` to refresh.*
`
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Discord link exporter — guild ${GUILD_ID}${DRY_RUN ? " [DRY RUN]" : ""}`)

  const channels = await fetchChannels(GUILD_ID)
  console.log(`Found ${channels.length} readable channels/threads.\n`)

  // Map<url, firstSeen>  where firstSeen = { sharedBy, channelName, sharedAt }
  const seen = new Map()

  for (const ch of channels) {
    const name = ch.name ?? ch.id
    process.stdout.write(`Scanning #${name}… `)

    const messages = await fetchMessagesInChannel(ch.id, name)
    let newInChannel = 0

    for (const msg of messages) {
      const timestamp = msg.timestamp?.slice(0, 10) ?? "unknown"
      const author = msg.author?.username ?? "unknown"

      for (const url of collectUrlsFromMessage(msg)) {
        if (!seen.has(url)) {
          seen.set(url, { sharedBy: author, channelName: name, sharedAt: timestamp })
          newInChannel++
        }
      }
    }

    console.log(`${messages.length} msgs, ${newInChannel} new URLs (${seen.size} total)`)
  }

  console.log(`\nTotal unique URLs: ${seen.size}`)
  if (DRY_RUN) { console.log("Dry run — no files written."); return }

  // ── Write notes ──────────────────────────────────────────────────────────────

  mkdirSync(OUTPUT_DIR, { recursive: true })

  // usedSlugs: Map<hostname, Set<slug>> — prevents filename collisions per domain
  const usedSlugs = new Map()
  const domainCounts = new Map()
  let written = 0
  let skipped = 0

  for (const [url, meta] of seen) {
    let hostname
    try { hostname = normalizeHostname(new URL(url).hostname) }
    catch { hostname = "unknown" }

    const domainDir = join(OUTPUT_DIR, hostname)
    mkdirSync(domainDir, { recursive: true })

    if (!usedSlugs.has(hostname)) {
      // Seed from files already on disk so re-runs don't collide with prior output
      const existing = new Set()
      try {
        for (const f of readdirSync(domainDir)) {
          if (f.endsWith(".md") && f !== "index.md") existing.add(f.slice(0, -3))
        }
      } catch { /* dir is brand new */ }
      usedSlugs.set(hostname, existing)
    }

    domainCounts.set(hostname, (domainCounts.get(hostname) ?? 0) + 1)

    const baseSlug = urlToSlug(url)
    const slug = uniqueSlug(baseSlug, usedSlugs.get(hostname))
    const notePath = join(domainDir, `${slug}.md`)

    if (!OVERWRITE && existsSync(notePath)) { skipped++; continue }

    writeFileSync(notePath, buildNote({ url, hostname, ...meta }))
    written++
  }

  // Write domain index notes (one per domain dir)
  for (const [hostname] of domainCounts) {
    const indexPath = join(OUTPUT_DIR, hostname, "index.md")
    if (!OVERWRITE && existsSync(indexPath)) continue
    writeFileSync(indexPath, `---
type: link-domain-index
domain: ${hostname}
source: discord
---

# Links from ${hostname}

All URLs shared in the guild Discord originating from \`${hostname}\`.
`)
  }

  // Write top-level index
  const exportedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(
    join(OUTPUT_DIR, "index.md"),
    buildIndex(domainCounts, seen.size, exportedAt)
  )

  console.log(`\nWrote ${written} note(s), skipped ${skipped} existing. Output: ${OUTPUT_DIR}`)
  console.log(`Domains: ${domainCounts.size}`)
  if (skipped > 0) console.log("  Re-run with --overwrite to refresh existing notes.")
}

main().catch(err => {
  console.error("Fatal:", err.message ?? err)
  process.exit(1)
})
