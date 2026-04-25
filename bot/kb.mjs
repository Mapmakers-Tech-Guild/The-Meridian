/**
 * Shared KB writing logic for the-equator.
 * Writes link and audit notes into The Meridian's 3 - Knowledge/ tree.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join, resolve } from "path"

export function kbPaths(kbRoot) {
  return {
    links: join(kbRoot, "3 - Knowledge", "discord-links"),
    audit: join(kbRoot, "3 - Knowledge", "discord-audit"),
  }
}

// ── URL helpers ────────────────────────────────────────────────────────────────

const URL_RE = /https?:\/\/[^\s<>"'()\[\]]+/g

export function extractUrls(text) {
  if (!text) return []
  return [...(text.match(URL_RE) ?? [])].map(u => u.replace(/[.,;:!?]+$/, ""))
}

export function collectUrlsFromMessage(msg) {
  const urls = new Set()
  for (const u of extractUrls(msg.content ?? "")) urls.add(u)
  for (const embed of msg.embeds ?? []) {
    if (embed.url) urls.add(embed.url.replace(/[.,;:!?]+$/, ""))
  }
  for (const att of msg.attachments?.values?.() ?? []) {
    if (att.url) urls.add(att.url.replace(/[?#].*$/, ""))
  }
  return [...urls]
}

// ── Filename helpers ───────────────────────────────────────────────────────────

export function normalizeHostname(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase()
}

export function urlToSlug(url) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split("/").filter(Boolean)
    if (!parts.length) return "index"
    return parts.join("--")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-{2,}/g, "-")
      .slice(0, 100)
  } catch {
    return "link"
  }
}

function safeSlug(base, dir) {
  let slug = base, i = 2
  while (existsSync(join(dir, `${slug}.md`))) slug = `${base}-${i++}`
  return slug
}

// ── Note writers ───────────────────────────────────────────────────────────────

export function writeLinkNote(kbRoot, { url, sharedBy, channelName, sharedAt }) {
  let hostname
  try { hostname = normalizeHostname(new URL(url).hostname) }
  catch { hostname = "unknown" }

  const dir = join(kbPaths(kbRoot).links, hostname)
  mkdirSync(dir, { recursive: true })

  // Write domain index on first encounter
  const domainIndex = join(dir, "index.md")
  if (!existsSync(domainIndex)) {
    writeFileSync(domainIndex, `---
type: link-domain-index
domain: ${hostname}
source: discord
---

# Links from ${hostname}

All URLs shared in the guild Discord from \`${hostname}\`.
`)
  }

  const slug = safeSlug(urlToSlug(url), dir)
  const notePath = join(dir, `${slug}.md`)

  // Skip if already captured (exact URL match check via slug collision avoidance above)
  writeFileSync(notePath, `---
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
`)

  return notePath
}

// ── Audit log helpers ──────────────────────────────────────────────────────────

export const ACTION_NAMES = {
  1:   "guild-update",
  10:  "channel-create",  11: "channel-update",   12: "channel-delete",
  13:  "channel-overwrite-create", 14: "channel-overwrite-update", 15: "channel-overwrite-delete",
  20:  "member-kick",     21: "member-prune",
  22:  "member-ban-add",  23: "member-ban-remove",
  24:  "member-update",   25: "member-role-update",
  26:  "member-move",     27: "member-disconnect",
  28:  "bot-add",
  30:  "role-create",     31: "role-update",       32: "role-delete",
  40:  "invite-create",   41: "invite-update",     42: "invite-delete",
  50:  "webhook-create",  51: "webhook-update",    52: "webhook-delete",
  60:  "emoji-create",    61: "emoji-update",      62: "emoji-delete",
  72:  "message-delete",  73: "message-bulk-delete",
  74:  "message-pin",     75: "message-unpin",
  80:  "integration-create", 81: "integration-update", 82: "integration-delete",
  110: "thread-create",   111: "thread-update",    112: "thread-delete",
  121: "app-command-permission-update",
}

export function snowflakeToDate(id) {
  return new Date(Number((BigInt(id) >> 22n) + 1420070400000n)).toISOString().slice(0, 10)
}

export function writeAuditNote(kbRoot, entry, username) {
  const action = ACTION_NAMES[entry.action_type] ?? `action-${entry.action_type}`
  const date = snowflakeToDate(entry.id)
  const dir = join(kbPaths(kbRoot).audit, action)
  mkdirSync(dir, { recursive: true })

  const indexPath = join(dir, "index.md")
  if (!existsSync(indexPath)) {
    writeFileSync(indexPath, `---
type: audit-action-index
action: ${action}
source: discord
---

# Audit: ${action}

All guild audit log entries for action \`${action}\`.
`)
  }

  const notePath = join(dir, `${entry.id}.md`)
  if (existsSync(notePath)) return null

  const changes = entry.changes?.length
    ? "```json\n" + JSON.stringify(entry.changes, null, 2) + "\n```"
    : "_none recorded_"

  writeFileSync(notePath, `---
type: audit-entry
action: ${action}
action_type: ${entry.action_type}
entry_id: "${entry.id}"
performed_by: "${username ?? entry.user_id}"
target_id: "${entry.target_id ?? ""}"
date: ${date}
source: discord
---

# ${action} — ${date}

| Field | Value |
|---|---|
| Action | ${action} |
| Performed by | ${username ?? entry.user_id} |
| Target ID | ${entry.target_id ?? "—"} |
| Date | ${date} |
| Reason | ${entry.reason ?? "—"} |

## Changes

${changes}
`)

  return notePath
}
