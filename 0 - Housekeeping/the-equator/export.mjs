#!/usr/bin/env node
/**
 * Full historical export — usable as a module or run directly.
 *
 * As a module:
 *   import { runExport } from "./export.mjs"
 *   await runExport({ token, guildId, kbRoot, dryRun, overwrite })
 *
 * As a CLI:
 *   DISCORD_TOKEN=… DISCORD_GUILD_ID=… KB_PATH=…/The-Meridian \
 *     node export.mjs [--dry-run] [--overwrite] [--links-only] [--audit-only]
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync } from "fs"
import { join, resolve } from "path"
import {
  extractUrls, normalizeHostname, urlToSlug,
  writeLinkNote, writeAuditNote, kbPaths,
  ACTION_NAMES, snowflakeToDate,
} from "./kb.mjs"

// ── Discord REST ───────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function api(token, path) {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    headers: {
      Authorization: `Bot ${token}`,
      "User-Agent": "the-equator/0.1 (github.com/mapmakers-tech-guild/The-Meridian)",
    },
  })

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}))
    const wait = Math.ceil((body.retry_after ?? 1) * 1000)
    process.stderr.write(`  rate-limited — waiting ${wait}ms\n`)
    await sleep(wait)
    return api(token, path)
  }

  if (res.status === 403) return null
  if (!res.ok) throw new Error(`Discord API ${path} → ${res.status}: ${await res.text().catch(() => "")}`)
  return res.json()
}

// 0=GUILD_TEXT, 2=GUILD_VOICE, 5=GUILD_ANNOUNCEMENT, 10/11/12=threads, 15=GUILD_FORUM
const READABLE = new Set([0, 2, 5, 10, 11, 12, 15])

async function fetchChannels(token, guildId) {
  const channels = await api(token, `/guilds/${guildId}/channels`)
  if (!channels) throw new Error("Cannot list channels — check bot permissions.")
  const readable = channels.filter(c => READABLE.has(c.type))
  const threads = await api(token, `/guilds/${guildId}/threads/active`)
  if (threads?.threads) readable.push(...threads.threads)
  return readable
}

async function fetchAllMessages(token, channelId) {
  const all = []
  let before = null
  while (true) {
    const qs = before ? `?limit=100&before=${before}` : "?limit=100"
    const batch = await api(token, `/channels/${channelId}/messages${qs}`)
    if (!batch) break
    if (!batch.length) break
    all.push(...batch)
    before = batch[batch.length - 1].id
    await sleep(300)
    if (batch.length < 100) break
  }
  return all
}

async function fetchAuditLog(token, guildId) {
  const all = []
  let before = null
  while (true) {
    const qs = before ? `?limit=100&before=${before}` : "?limit=100"
    const page = await api(token, `/guilds/${guildId}/audit-logs${qs}`)
    if (!page) { process.stderr.write("  No audit log access — skipping.\n"); break }
    const batch = page.audit_log_entries ?? []
    if (!batch.length) break
    const userMap = Object.fromEntries((page.users ?? []).map(u => [u.id, u.username]))
    for (const e of batch) all.push({ ...e, _username: userMap[e.user_id] ?? e.user_id })
    before = batch[batch.length - 1].id
    await sleep(300)
    if (batch.length < 100) break
  }
  return all
}

// ── Core export ────────────────────────────────────────────────────────────────

export async function runExport({
  token = process.env.DISCORD_TOKEN,
  guildId = process.env.DISCORD_GUILD_ID,
  kbRoot = resolve(process.env.KB_PATH ?? "../../"),
  dryRun = false,
  overwrite = false,
  linksOnly = false,
  auditOnly = false,
} = {}) {
  const exportedAt = new Date().toISOString().slice(0, 10)
  const paths = kbPaths(kbRoot)

  // ── Links ──────────────────────────────────────────────────────────────────

  if (!auditOnly) {
    const channels = await fetchChannels(token, guildId)
    console.log(`Channels: ${channels.length}`)

    // Deduplicate across all channels; first-seen wins
    const seen = new Map()

    for (const ch of channels) {
      const name = ch.name ?? ch.id
      process.stdout.write(`  #${name}… `)
      const messages = await fetchAllMessages(token, ch.id)
      let n = 0

      for (const msg of messages) {
        const urls = [
          ...extractUrls(msg.content ?? ""),
          ...(msg.embeds ?? []).map(e => e.url).filter(Boolean),
          ...(msg.attachments ?? []).map(a => a.url?.replace(/[?#].*$/, "")).filter(Boolean),
        ].map(u => u.replace(/[.,;:!?]+$/, ""))

        for (const url of urls) {
          if (!seen.has(url)) {
            seen.set(url, {
              sharedBy: msg.author?.username ?? "unknown",
              channelName: name,
              sharedAt: msg.timestamp?.slice(0, 10) ?? exportedAt,
            })
            n++
          }
        }
      }

      console.log(`${messages.length} msgs, ${n} new (${seen.size} total)`)
    }

    console.log(`\nUnique URLs: ${seen.size}`)

    if (!dryRun) {
      mkdirSync(paths.links, { recursive: true })
      const domainCounts = new Map()
      let written = 0, skipped = 0

      for (const [url, meta] of seen) {
        let hostname
        try { hostname = normalizeHostname(new URL(url).hostname) }
        catch { hostname = "unknown" }

        const dir = join(paths.links, hostname)
        mkdirSync(dir, { recursive: true })
        domainCounts.set(hostname, (domainCounts.get(hostname) ?? 0) + 1)

        // Build slug; avoid collisions with existing files
        const base = urlToSlug(url)
        let slug = base, i = 2
        while (existsSync(join(dir, `${slug}.md`)) && !overwrite) slug = `${base}-${i++}`
        const notePath = join(dir, `${slug}.md`)

        if (!overwrite && existsSync(notePath)) { skipped++; continue }
        writeLinkNote(kbRoot, { url, ...meta })
        written++
      }

      // Domain index notes
      for (const [hostname] of domainCounts) {
        const p = join(paths.links, hostname, "index.md")
        if (!overwrite && existsSync(p)) continue
        writeFileSync(p, `---
type: link-domain-index
domain: ${hostname}
source: discord
---

# Links from ${hostname}

All URLs shared in the guild Discord from \`${hostname}\`.
`)
      }

      // Top-level index
      const rows = [...domainCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([d, c]) => `| ${d} | ${c} |`)
        .join("\n")

      writeFileSync(join(paths.links, "index.md"), `---
type: link-index
source: discord
exported_at: ${exportedAt}
total_links: ${seen.size}
---

# Discord Links

| Domain | Links |
|---|---|
${rows}

*Re-run \`npm run export:links\` to refresh.*
`)

      console.log(`Links: wrote ${written}, skipped ${skipped}, domains ${domainCounts.size}`)
    }
  }

  // ── Audit log ──────────────────────────────────────────────────────────────

  if (!linksOnly) {
    console.log("\nFetching audit log…")
    const entries = await fetchAuditLog(token, guildId)
    console.log(`Audit entries: ${entries.length}`)

    if (!dryRun && entries.length) {
      mkdirSync(paths.audit, { recursive: true })
      const actionCounts = new Map()
      let written = 0, skipped = 0

      for (const entry of entries) {
        const action = ACTION_NAMES[entry.action_type] ?? `action-${entry.action_type}`
        actionCounts.set(action, (actionCounts.get(action) ?? 0) + 1)
        const notePath = writeAuditNote(kbRoot, entry, entry._username)
        if (notePath) written++; else skipped++
      }

      const rows = [...actionCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([a, c]) => `| ${a} | ${c} |`)
        .join("\n")

      writeFileSync(join(paths.audit, "index.md"), `---
type: audit-index
source: discord
exported_at: ${exportedAt}
total_entries: ${entries.length}
---

# Discord Audit Log

| Action | Entries |
|---|---|
${rows}

*Re-run \`npm run export:audit\` to refresh.*
`)

      console.log(`Audit: wrote ${written}, skipped ${skipped}, action types ${actionCounts.size}`)
    }
  }

  if (dryRun) console.log("\nDry run — nothing written.")
}

// ── CLI entry point ────────────────────────────────────────────────────────────

// Run directly if this file is the entrypoint
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2)
  runExport({
    dryRun:    args.includes("--dry-run"),
    overwrite: args.includes("--overwrite"),
    linksOnly: args.includes("--links-only"),
    auditOnly: args.includes("--audit-only"),
  }).catch(err => { console.error("Fatal:", err.message); process.exit(1) })
}
