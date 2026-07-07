# CruiseFeed Skill

An [Agent Skill](https://www.skillsdirectory.com/learn/how-to-write-a-skill-md)
that teaches an AI agent (Claude, Claude Code, or any agent runtime that loads
`SKILL.md` files) how to query the **[CruiseFeed API](https://cruisefeed.io)** —
live, normalized cruise data across 60+ cruise lines: sailings, prices,
itineraries, ships, cruise lines and ports.

## What it does

Drop this skill into your agent and it can answer real cruise questions against
live data — *"Caribbean cruises under $1,200 in December"*, *"7-night
Mediterranean sailings on MSC"*, *"specs for MSC World Europa"*, *"which fares
dropped this week"* — by calling the right endpoint, filtering correctly,
paginating, and reading only fields the API actually returns.

## Contents

```
cruisefeed-skill/
├── SKILL.md              # the skill: triggers, workflow, endpoints, rules
├── references/
│   └── api.md            # full endpoint + field reference (schema, errors, examples)
├── examples/
│   ├── list_cruises.sh   # curl quickstart
│   ├── cruises.py        # Python: paginate + filter /v1/cruises
│   └── fare_drops.js     # Node: recent fare changes via /v1/changes
└── LICENSE               # MIT (skill + examples)
```

## Quick start

```bash
export CRUISEFEED_API_KEY=...   # get a key at https://cruisefeed.io

curl "https://api.cruisefeed.io/v1/cruises?region=Caribbean&max_price=1200&limit=5" \
  -H "Authorization: Bearer $CRUISEFEED_API_KEY"
```

- **Base URL:** `https://api.cruisefeed.io` · endpoints under `/v1/`
- **Auth:** `Authorization: Bearer <CRUISEFEED_API_KEY>`
- **Interactive docs:** <https://api.cruisefeed.io/docs> ·
  **OpenAPI:** <https://api.cruisefeed.io/openapi.json>

## Install as a Claude / Claude Code skill

Copy the `SKILL.md` (and its `references/` + `examples/`) into your skills
directory — e.g. `~/.claude/skills/cruisefeed/` for Claude Code, or upload the
folder wherever your agent loads skills. The agent picks it up automatically when
a prompt matches the `description` triggers.

## Alternative front door: Apify

The same dataset is also published as an **Apify Standby Actor** for the Apify
ecosystem (root paths, Apify-token auth). See the "Alternative front door"
section of [`SKILL.md`](SKILL.md).

## License

MIT for the skill definition and examples. The CruiseFeed data/API service is
provided under separate subscription terms at <https://cruisefeed.io>. This is an
independent project; cruise-line and ship names are trademarks of their owners
and are used only to describe the data.
