#!/usr/bin/env node
/**
 * Exports every URL ever shared in a Discord server into the KB,
 * and exports the full guild audit log as structured notes.
 *
 * Output layout:
 *   3 - Knowledge/discord-links/
 *     <hostname>/          one dir per domain (e.g. github.com/)
 *       <slug>.md          one note per unique URL
 *     index.md             summary of all domains + counts
 *
 *   3 - Knowledge/discord-audit/
 *     <action-type>/       one dir per audit action (e.g. bot-add/)
 *       <entry-id>.md      one note per audit log entry
 *     index.md             summary of all action types + counts
 *
 * Usage:
 *   DISCORD_TOKEN=<bot-token> DISCORD_GUILD_ID=<guild-id> \
 *     node scripts/export-discord-links.mjs [--dry-run] [--overwrite]
 *
 * Flags:
 *   --dry-run        Scan and report counts without writing any files.
 *   --overwrite      Overwrite notes that already exist (default: skip).
 *   --links-only     Skip audit log export.
 *   --audit-only     Skip link export.
 *
 * Requirements:
 *   - Bot must have View Channels + Read Message History + View Audit Log.
 *   - Node >= 22 (uses built-in fetch).
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")
const LINKS_DIR = join(REPO_ROOT, "3 - Knowledge", "discord-links")
const AUDIT_DIR = join(REPO_ROOT, "3 - Knowledge", "discord-audit")

const TOKEN = process.env.DISCORD_TOKEN
const GUILD_ID = process.env.DISCORD_GUILD_ID
const DRY_RUN = process.argv.includes("--dry-run")
const OVERWRITE = process.argv.includes("--overwrite")
const LINKS_ONLY = process.argv.includes("--links-only")
const AUDIT_ONLY = process.argv.includes("--audit-only")

if (!TOKEN || !GUILD_ID) {
  console.error(
    "Error: DISCORD_TOKEN and DISCORD_GUILD_ID environment variables are required.\n\n" +
    "Usage:\n  DISCORD_TOKEN=<bot-token> DISCORD_GUILD_ID=<guild-id> \\\n" +
    "    node scripts/export-discord-links.mjs [--dry-run] [--overwrite]\n\n" +
    "The bot needs: View Channels + Read Message History + View Audit Log."
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

async function api(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: HEADERS })

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}))
    const wait = Math.ceil((body.retry_after ?? 1) * 1000)
    console.warn(`  Rate limited — waiting ${wait}ms…`)
    await sleep(wait)
    return api(path)
  }

  if (res.status === 403) return null

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Discord API ${path} → HTTP ${res.status}: ${text}`)
  }

  return res.json()
}

// ── Channel fetching ───────────────────────────────────────────────────────────

// 0=GUILD_TEXT, 2=GUILD_VOICE, 5=GUILD_ANNOUNCEMENT, 10/11/12=threads, 15=GUILD_FORUM
const READABLE_CHANNEL_TYPES = new Set([0, 2, 5, 10, 11, 12, 15])

async function fetchChannels(guildId) {
  const channels = await api(`/guilds/${guildId}/channels`)
  if (!channels) throw new Error("Could not fetch channel list — check bot permissions.")

  const readable = channels.filter(c => READABLE_CHANNEL_TYPES.has(c.type))

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
    await sleep(300)
    if (batch.length < 100) break
  }

  return messages
}

// ── Audit log fetching ─────────────────────────────────────────────────────────

// Human-readable names for Discord audit log action types
const ACTION_NAMES = {
  1:   "guild-update",
  10:  "channel-create",
  11:  "channel-update",
  12:  "channel-delete",
  13:  "channel-overwrite-create",
  14:  "channel-overwrite-update",
  15:  "channel-overwrite-delete",
  20:  "member-kick",
  21:  "member-prune",
  22:  "member-ban-add",
  23:  "member-ban-remove",
  24:  "member-update",
  25:  "member-role-update",
  26:  "member-move",
  27:  "member-disconnect",
  28:  "bot-add",
  30:  "role-create",
  31:  "role-update",
  32:  "role-delete",
  40:  "invite-create",
  41:  "invite-update",
  42:  "invite-delete",
  50:  "webhook-create",
  51:  "webhook-update",
  52:  "webhook-delete",
  60:  "emoji-create",
  61:  "emoji-update",
  62:  "emoji-delete",
  72:  "message-delete",
  73:  "message-bulk-delete",
  74:  "message-pin",
  75:  "message-unpin",
  80:  "integration-create",
  81:  "integration-update",
  82:  "integration-delete",
  83:  "stage-instance-create",
  84:  "stage-instance-update",
  85:  "stage-instance-delete",
  90:  "sticker-create",
  91:  "sticker-update",
  92:  "sticker-delete",
  100: "scheduled-event-create",
  101: "scheduled-event-update",
  102: "scheduled-event-delete",
  110: "thread-create",
  111: "thread-update",
  112: "thread-delete",
  121: "app-command-permission-update",
}

// Derive ISO date from a Discord snowflake ID (no external deps needed)
function snowflakeToDate(id) {
  const DISCORD_EPOCH = 1420070400000n
  const ms = (BigInt(id) >> 22n) + DISCORD_EPOCH
  return new Date(Number(ms)).toISOString().slice(0, 10)
}

async function fetchAuditLog(guildId) {
  const entries = []
  // Audit log entries are returned newest-first; paginate with `before`
  let before = null

  while (true) {
    const qs = before ? `?limit=100&before=${before}` : "?limit=100"
    const page = await api(`/guilds/${guildId}/audit-logs${qs}`)

    if (!page) {
      console.warn("  No access to audit log — skipping (needs View Audit Log permission).")
      break
    }

    const batch = page.audit_log_entries ?? []
    if (!batch.length) break

    // Build a user lookup from the sideloaded users array
    const userMap = {}
    for (const u of page.users ?? []) userMap[u.id] = u.username

    for (const entry of batch) {
      entries.push({ ...entry, _username: userMap[entry.user_id] ?? entry.user_id })
    }

    before = batch[batch.length - 1].id
    await sleep(300)
    if (batch.length < 100) break
  }

  return entries
}

// ── URL extraction ─────────────────────────────────────────────────────────────

const URL_RE = /https?:\/\/[^\s<>"'()\[\]]+/g

function extractUrls(text) {
  if (!text) return []
  return [...(text.match(URL_RE) ?? [])].map(u => u.replace(/[.,;:!?]+$/, ""))
}

function collectUrlsFromMessage(msg) {
  const urls = new Set()
  for (const u of extractUrls(msg.content)) urls.add(u)
  for (const embed of msg.embeds ?? []) {
    if (embed.url) urls.add(embed.url.replace(/[.,;:!?]+$/, ""))
  }
  for (const att of msg.attachments ?? []) {
    if (att.url) urls.add(att.url.replace(/[?#].*$/, ""))
  }
  return [...urls]
}

// ── Filename helpers ───────────────────────────────────────────────────────────

function normalizeHostname(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase()
}

function urlToSlug(url) {
  try {
    const u = new URL(url)
    const pathParts = u.pathname.split("/").filter(Boolean)
    if (!pathParts.length) return "index"
    return pathParts.join("--")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-{2,}/g, "-")
      .slice(0, 100)
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

// ── Note builders ──────────────────────────────────────────────────────────────

function buildLinkNote({ url, hostname, sharedBy, channelName, sharedAt }) {
  return `---
type: link
url: "${url.replace(/"/g, '\\"')}"
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

function buildLinksIndex(domainCounts, totalLinks, exportedAt) {
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

All URLs shared in the guild Discord, organised by domain.

| Domain | Links |
|---|---|
${rows}

---

*Re-run \`scripts/export-discord-links.mjs\` to refresh.*
`
}

function buildAuditNote(entry) {
  const action = ACTION_NAMES[entry.action_type] ?? `action-${entry.action_type}`
  const date = snowflakeToDate(entry.id)
  const changes = entry.changes?.length
    ? "```json\n" + JSON.stringify(entry.changes, null, 2) + "\n```"
    : "_none recorded_"

  return `---
type: audit-entry
action: ${action}
action_type: ${entry.action_type}
entry_id: "${entry.id}"
performed_by: "${entry._username}"
target_id: "${entry.target_id ?? ""}"
date: ${date}
source: discord
---

# ${action} — ${date}

| Field | Value |
|---|---|
| Action | ${action} |
| Performed by | ${entry._username} |
| Target ID | ${entry.target_id ?? "—"} |
| Date | ${date} |
| Reason | ${entry.reason ?? "—"} |

## Changes

${changes}
`
}

function buildAuditIndex(actionCounts, totalEntries, exportedAt) {
  const rows = [...actionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([action, count]) => `| [[${action}/index|${action}]] | ${count} |`)
    .join("\n")

  return `---
type: audit-index
source: discord
exported_at: ${exportedAt}
total_entries: ${totalEntries}
---

# Discord Audit Log

Full guild audit log, organised by action type.

| Action | Entries |
|---|---|
${rows}

---

*Re-run \`scripts/export-discord-links.mjs\` to refresh.*
`
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const flags = [DRY_RUN && "dry-run", LINKS_ONLY && "links-only", AUDIT_ONLY && "audit-only"]
    .filter(Boolean).join(", ")
  console.log(`Discord exporter — guild ${GUILD_ID}${flags ? ` [${flags}]` : ""}\n`)

  const exportedAt = new Date().toISOString().slice(0, 10)

  // ── Links ────────────────────────────────────────────────────────────────────

  if (!AUDIT_ONLY) {
    const channels = await fetchChannels(GUILD_ID)
    console.log(`Found ${channels.length} readable channels/threads.`)

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

    if (!DRY_RUN) {
      mkdirSync(LINKS_DIR, { recursive: true })

      const usedSlugs = new Map()
      const domainCounts = new Map()
      let written = 0, skipped = 0

      for (const [url, meta] of seen) {
        let hostname
        try { hostname = normalizeHostname(new URL(url).hostname) }
        catch { hostname = "unknown" }

        const domainDir = join(LINKS_DIR, hostname)
        mkdirSync(domainDir, { recursive: true })

        if (!usedSlugs.has(hostname)) {
          const existing = new Set()
          try {
            for (const f of readdirSync(domainDir)) {
              if (f.endsWith(".md") && f !== "index.md") existing.add(f.slice(0, -3))
            }
          } catch { /* new dir */ }
          usedSlugs.set(hostname, existing)
        }

        domainCounts.set(hostname, (domainCounts.get(hostname) ?? 0) + 1)

        const slug = uniqueSlug(urlToSlug(url), usedSlugs.get(hostname))
        const notePath = join(domainDir, `${slug}.md`)

        if (!OVERWRITE && existsSync(notePath)) { skipped++; continue }
        writeFileSync(notePath, buildLinkNote({ url, hostname, ...meta }))
        written++
      }

      for (const [hostname] of domainCounts) {
        const indexPath = join(LINKS_DIR, hostname, "index.md")
        if (!OVERWRITE && existsSync(indexPath)) continue
        writeFileSync(indexPath, `---
type: link-domain-index
domain: ${hostname}
source: discord
---

# Links from ${hostname}

All URLs shared in the guild Discord from \`${hostname}\`.
`)
      }

      writeFileSync(join(LINKS_DIR, "index.md"), buildLinksIndex(domainCounts, seen.size, exportedAt))
      console.log(`Links: wrote ${written}, skipped ${skipped}. Domains: ${domainCounts.size}`)
    }
  }

  // ── Audit log ────────────────────────────────────────────────────────────────

  if (!LINKS_ONLY) {
    console.log("\nFetching audit log…")
    const entries = await fetchAuditLog(GUILD_ID)
    console.log(`Total audit log entries: ${entries.length}`)

    if (!DRY_RUN && entries.length) {
      mkdirSync(AUDIT_DIR, { recursive: true })

      const actionCounts = new Map()
      let written = 0, skipped = 0

      for (const entry of entries) {
        const action = ACTION_NAMES[entry.action_type] ?? `action-${entry.action_type}`
        const actionDir = join(AUDIT_DIR, action)
        mkdirSync(actionDir, { recursive: true })

        actionCounts.set(action, (actionCounts.get(action) ?? 0) + 1)

        const notePath = join(actionDir, `${entry.id}.md`)
        if (!OVERWRITE && existsSync(notePath)) { skipped++; continue }
        writeFileSync(notePath, buildAuditNote(entry))
        written++
      }

      for (const [action] of actionCounts) {
        const indexPath = join(AUDIT_DIR, action, "index.md")
        if (!OVERWRITE && existsSync(indexPath)) continue
        writeFileSync(indexPath, `---
type: audit-action-index
action: ${action}
source: discord
---

# Audit: ${action}

All guild audit log entries for action \`${action}\`.
`)
      }

      writeFileSync(join(AUDIT_DIR, "index.md"), buildAuditIndex(actionCounts, entries.length, exportedAt))
      console.log(`Audit: wrote ${written}, skipped ${skipped}. Action types: ${actionCounts.size}`)
    }
  }

  if (DRY_RUN) console.log("\nDry run — no files written.")
  else console.log(`\nDone. Output:\n  ${LINKS_DIR}\n  ${AUDIT_DIR}`)
}

main().catch(err => {
  console.error("Fatal:", err.message ?? err)
  process.exit(1)
})
