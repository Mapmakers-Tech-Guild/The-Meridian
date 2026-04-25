#!/usr/bin/env node
/**
 * the-equator — real-time Discord ingestion for The Meridian KB.
 *
 * Listens for new messages and audit log events, writing structured
 * notes into the KB as they happen. Run `npm run export:all` for a
 * full historical backfill.
 *
 * Required env vars:
 *   DISCORD_TOKEN      Bot token
 *   DISCORD_GUILD_ID   Target guild snowflake
 *   KB_PATH            Path to The-Meridian repo root (default: "../")
 *
 * Optional:
 *   IGNORE_CHANNEL_IDS  Comma-separated channel IDs to skip
 *   EXPORT_ON_START     "true" to run full historical export on startup
 */

import { Client, GatewayIntentBits, Events, AuditLogEvent } from "discord.js"
import { resolve } from "path"
import { mkdirSync } from "fs"
import { collectUrlsFromMessage, writeLinkNote, writeAuditNote, kbPaths } from "./kb.mjs"

const TOKEN = process.env.DISCORD_TOKEN
const GUILD_ID = process.env.DISCORD_GUILD_ID
const KB_ROOT = resolve(process.env.KB_PATH ?? "../")
const IGNORE_IDS = new Set((process.env.IGNORE_CHANNEL_IDS ?? "").split(",").filter(Boolean))
const EXPORT_ON_START = process.env.EXPORT_ON_START === "true"

if (!TOKEN || !GUILD_ID) {
  console.error("DISCORD_TOKEN and DISCORD_GUILD_ID are required.")
  process.exit(1)
}

// Ensure KB dirs exist
const paths = kbPaths(KB_ROOT)
mkdirSync(paths.links, { recursive: true })
mkdirSync(paths.audit, { recursive: true })

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,  // privileged — must be enabled in Dev Portal
    GatewayIntentBits.GuildModeration, // for audit log events
  ],
})

// ── Ready ──────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, async c => {
  console.log(`the-equator online as ${c.user.tag}`)
  console.log(`KB path: ${KB_ROOT}`)

  if (EXPORT_ON_START) {
    console.log("EXPORT_ON_START=true — running full historical export…")
    const { runExport } = await import("./export.mjs")
    await runExport({ kbRoot: KB_ROOT, guildId: GUILD_ID, token: TOKEN })
  }
})

// ── Real-time link capture ─────────────────────────────────────────────────────

client.on(Events.MessageCreate, msg => {
  if (msg.author?.bot) return
  if (msg.guildId !== GUILD_ID) return
  if (IGNORE_IDS.has(msg.channelId)) return

  const urls = collectUrlsFromMessage(msg)
  if (!urls.length) return

  const channelName = msg.channel?.name ?? msg.channelId
  const sharedAt = msg.createdAt.toISOString().slice(0, 10)
  const sharedBy = msg.author?.username ?? "unknown"

  for (const url of urls) {
    try {
      const notePath = writeLinkNote(KB_ROOT, { url, sharedBy, channelName, sharedAt })
      console.log(`+ link  ${url.slice(0, 80)}`)
    } catch (err) {
      console.error(`  Failed to write note for ${url}: ${err.message}`)
    }
  }
})

// ── Real-time audit log capture ────────────────────────────────────────────────

// GuildAuditLogEntryCreate fires for each new audit log entry (requires
// GUILD_MODERATION intent + View Audit Log permission).
client.on(Events.GuildAuditLogEntryCreate, (entry, guild) => {
  if (guild.id !== GUILD_ID) return

  try {
    const username = entry.executor?.username ?? entry.executorId
    const notePath = writeAuditNote(KB_ROOT, {
      id: entry.id,
      action_type: entry.action,
      user_id: entry.executorId,
      target_id: entry.targetId,
      reason: entry.reason,
      changes: entry.changes,
    }, username)

    if (notePath) console.log(`+ audit ${entry.actionType} by ${username}`)
  } catch (err) {
    console.error(`  Failed to write audit note: ${err.message}`)
  }
})

// ── Graceful shutdown ──────────────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down.`)
  client.destroy()
  process.exit(0)
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))

client.login(TOKEN)
