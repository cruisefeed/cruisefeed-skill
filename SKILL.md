---
name: cruisefeed
description: >-
  Query live, normalized cruise data — sailings, prices, itineraries, ships,
  cruise lines and ports — across 60+ cruise lines via the CruiseFeed REST API.
  Use when a user asks to search or filter cruises (by line, ship, region, port,
  date, price or length), look up a specific sailing or ship's specs, track fare
  drops / price changes, or export cruise inventory as JSON or CSV.
license: MIT
---

# CruiseFeed API

CruiseFeed is an always-on REST API for **normalized cruise inventory**: cruise
lines, ships, sailing dates, day-by-day itineraries, ports of call and lead-in
pricing, across 60+ cruise lines in one clean schema. Every sailing carries a
stable opaque `id` and the same shape regardless of source. The data is
**public cruise inventory only — no personal data.**

Use this skill to answer questions like *"Caribbean cruises under $1,200 in
December"*, *"7-night Mediterranean sailings on MSC"*, *"specs for MSC World
Europa"*, or *"which fares dropped this week"*.

## Setup

- **Base URL:** `https://api.cruisefeed.io`
- **All data endpoints are under `/v1/`.**
- **Auth:** every request needs `Authorization: Bearer <API_KEY>`. Read the key
  from the `CRUISEFEED_API_KEY` environment variable — never hard-code it.
- Get a key at <https://cruisefeed.io>.

```bash
curl "https://api.cruisefeed.io/v1/cruises?region=Caribbean&max_price=1200&limit=10" \
  -H "Authorization: Bearer $CRUISEFEED_API_KEY"
```

Check liveness (no key needed): `GET https://api.cruisefeed.io/healthz` → `{"status":"ok"}`.

## Workflow

1. **Pick the endpoint** for the question (see table below). `/v1/cruises` is the
   workhorse for any search/filter over sailings.
2. **Build the query** from the user's constraints using the documented filter
   names. Combine filters freely; unknown params are ignored, so use only the
   real ones.
3. **Send the request** with the Bearer header. Parse the JSON envelope
   `{ items, total, limit, offset }`.
4. **Paginate** when `total` exceeds what you've fetched: increase `offset` by
   `limit` and repeat until you have enough or `offset >= total`. `limit` is
   1–500 (default 50).
5. **Answer from real fields only** (see `references/api.md`). Cite concrete
   values — line, ship, dates, `price_amount` + `price_currency`, itinerary
   ports. Do not invent fields the API doesn't return.

## Endpoints

| Method | Path | Use for |
|--------|------|---------|
| GET | `/v1/cruises` | List & filter sailings (the workhorse) |
| GET | `/v1/cruises.csv` | Same filters, streamed as CSV |
| GET | `/v1/cruises/{cruise_id}` | One sailing, enriched with its `ship` object |
| GET | `/v1/cruises/{cruise_id}/history` | Price / availability history for a sailing |
| GET | `/v1/changes` | Recent price changes — fare-drop alerts |
| GET | `/v1/cruise-lines` | Distinct cruise-line names |
| GET | `/v1/ships` | List & filter ships (specs, capacity, build) |
| GET | `/v1/ships/{ship_id}` | One ship by IMO number, full specs |
| GET | `/v1/ports` | Distinct departure ports |
| GET | `/v1/stats` | Catalogue totals |
| GET | `/healthz` | Liveness probe (open, no key) |

### Filters for `GET /v1/cruises`

`cruise_line` · `ship_name` · `embark_port` · `region` (partial match) ·
`departure_from` · `departure_to` (dates, `YYYY-MM-DD`) · `min_price` ·
`max_price` · `min_nights` · `max_nights` · `round_trip` (bool) · `dedupe`
(default `true`) · `sort` (default `departure_date`) · `limit` (1–500, default
50) · `offset`.

`/v1/changes` takes `since` (date), `cruise_line`, `limit`, `offset`.
`/v1/ships` takes `q`, `operator`, `flag_state`, `limit`, `offset`.

Full field lists, the response envelope, and the ship schema are in
[`references/api.md`](references/api.md). Runnable examples are in
[`examples/`](examples/).

## Common recipes

```bash
# Cheapest Alaska sailings, 7+ nights
curl "https://api.cruisefeed.io/v1/cruises?region=Alaska&min_nights=7&sort=price_amount&limit=10" \
  -H "Authorization: Bearer $CRUISEFEED_API_KEY"

# One sailing with full itinerary + ship specs inline
curl "https://api.cruisefeed.io/v1/cruises/cru_4f2a9c1b7e3d5068" \
  -H "Authorization: Bearer $CRUISEFEED_API_KEY"

# Fare drops on MSC since a date (deal alerts)
curl "https://api.cruisefeed.io/v1/changes?since=2026-06-20&cruise_line=MSC%20Cruises" \
  -H "Authorization: Bearer $CRUISEFEED_API_KEY"

# Ship specs by IMO (tonnage, decks, cabins, capacity, sister ships)
curl "https://api.cruisefeed.io/v1/ships/9839419" \
  -H "Authorization: Bearer $CRUISEFEED_API_KEY"

# Bulk export as CSV
curl "https://api.cruisefeed.io/v1/cruises.csv?region=Caribbean&max_price=1200" \
  -H "Authorization: Bearer $CRUISEFEED_API_KEY" -o cruises.csv
```

## Rules

- Do not hard-code the API key. Read it from `CRUISEFEED_API_KEY` and send it as
  `Authorization: Bearer <key>`. The `x-api-key` header is **not** accepted (401).
- Do not report fields the API doesn't return. `price_amount`, `price_currency`
  and `price_per_night` can be `null`; `departure_date` / `return_date` may be
  `null` for product-level sailings. State "not available" rather than guessing.
- The `fares` array is per-cabin-class **only when the line publishes more than
  one fare** — it is empty when only a single "from" price exists. Never present
  an empty `fares` array as "no availability".
- Respect pagination — `limit` caps at 500. For large pulls, page through
  `offset` rather than assuming one response is complete.
- On errors the API returns `{"error":{"code","message"}}` with an HTTP status
  (e.g. 401 unauthorized, 404 not found). Surface `error.message`; don't retry a
  401 — fix the key.
- This is unofficial data describing public inventory. Cruise-line and ship
  names are trademarks of their owners; use them only to describe the data.

## Alternative front door: Apify

The same dataset is available as an Apify **Standby Actor** — a live HTTP API for
users who work in the Apify ecosystem:

```
https://<username>--cruise-data-api.apify.actor/<endpoint>
```

Differences from the direct API: paths are at the **root** (`/cruises`, not
`/v1/cruises`), and auth uses your **Apify token** —
`Authorization: Bearer <APIFY_TOKEN>` or `?token=<APIFY_TOKEN>`. Same schema and
filters otherwise. Find it in the Apify Store by searching "cruise data api".
Prefer the direct `api.cruisefeed.io/v1` endpoints above unless the user is
specifically on Apify.
