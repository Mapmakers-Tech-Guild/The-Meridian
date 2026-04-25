---
type: audit-index
source: discord
exported_at: never
total_entries: 0
---

# Discord Audit Log

Full guild audit log, organised by action type.

Run the export script to populate this directory:

```bash
DISCORD_TOKEN=<bot-token> DISCORD_GUILD_ID=<guild-id> \
  npm run export:discord-links
```

Use `--audit-only` to skip the link export and only run the audit log.
