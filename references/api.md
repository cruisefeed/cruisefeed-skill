# CruiseFeed API — full reference

Base URL: `https://api.cruisefeed.io` · All data endpoints under `/v1/` ·
Auth: `Authorization: Bearer <CRUISEFEED_API_KEY>` · Current API version: `1.2.2`.

Interactive docs and the machine-readable spec:

- Swagger UI: <https://api.cruisefeed.io/docs>
- OpenAPI JSON: <https://api.cruisefeed.io/openapi.json>

## Response envelope

List endpoints return:

```json
{ "items": [ /* ... */ ], "total": 1843, "limit": 50, "offset": 0 }
```

- `total` is the full match count (independent of the page).
- Paginate by advancing `offset` in steps of `limit` until `offset >= total`.

## Errors

```json
{ "error": { "code": "unauthorized", "message": "Invalid or missing API key. Send 'Authorization: Bearer <key>'." } }
```

Common statuses: `200` OK · `401` unauthorized (missing/invalid key) ·
`404` not found (unknown `cruise_id` / `ship_id`) · `422` invalid params.

## Endpoints

### `GET /v1/cruises`
List and filter sailings. Query params:

| Param | Type | Notes |
|-------|------|-------|
| `cruise_line` | string | Exact line name, e.g. `MSC Cruises` |
| `ship_name` | string | Filter by ship |
| `embark_port` | string | Departure port |
| `region` | string | Partial match, e.g. `Caribbean` |
| `departure_from` | date | `YYYY-MM-DD`, inclusive lower bound |
| `departure_to` | date | `YYYY-MM-DD`, inclusive upper bound |
| `min_price` / `max_price` | number | Lead-in fare bounds |
| `min_nights` / `max_nights` | integer | Sailing length bounds |
| `round_trip` | boolean | Round-trip only when `true` |
| `dedupe` | boolean | Default `true`; collapse duplicate sailings |
| `sort` | string | Default `departure_date`; also e.g. `price_amount` |
| `limit` | integer | 1–500, default 50 |
| `offset` | integer | Pagination offset |

### `GET /v1/cruises.csv`
Same filters as `/v1/cruises`, streamed as CSV (one row per sailing).

### `GET /v1/cruises/{cruise_id}`
One sailing by its opaque `id`. Includes a nested `ship` object with full specs.

### `GET /v1/cruises/{cruise_id}/history`
Price / availability history for one sailing (for change tracking).

### `GET /v1/changes`
Recent price changes — good for fare-drop alerts. Params: `since` (date),
`cruise_line`, `limit`, `offset`.

### `GET /v1/cruise-lines`
Distinct cruise-line names in the catalogue.

### `GET /v1/ships`
List and filter ships. Params: `q` (name search), `operator`, `flag_state`,
`limit`, `offset`.

### `GET /v1/ships/{ship_id}`
One ship by IMO number, full specs.

### `GET /v1/ports`
Distinct departure ports.

### `GET /v1/stats`
Catalogue totals (counts of cruises, ships, lines, ports).

### `GET /healthz`
Liveness probe. Open (no key). Returns `{"status":"ok"}`.

## Cruise (sailing) schema

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Opaque, source-agnostic id, unique per sailing (e.g. `cru_4f2a9c1b7e3d5068`) |
| `cruise_line` | string | Normalized line name |
| `ship_name` | string | Normalized ship name |
| `title` | string | Sailing title, e.g. `7-Night Western Mediterranean` |
| `departure_date` | date | `YYYY-MM-DD`; may be `null` for product-level sailings |
| `return_date` | date | `YYYY-MM-DD`; may be `null` |
| `duration_days` | integer | Days including embark/disembark |
| `nights` | integer | Nights aboard |
| `round_trip` | boolean | |
| `embark_port` | string | |
| `disembark_port` | string | |
| `region` | string | |
| `price_amount` | number | Lead-in fare; may be `null` |
| `price_currency` | string | ISO currency, e.g. `EUR` |
| `price_per_night` | number | Derived; may be `null` |
| `itinerary` | array | `{ seq, port, date_raw, is_embark, is_disembark }` per stop |
| `fares` | array | Per-cabin-class breakdown **only when >1 fare is published**; else empty |
| `scraped_at` | datetime | ISO 8601 freshness timestamp |

## Ship schema

`/v1/ships` records add vessel specs:

`imo`, `mmsi`, `operator`, `owner`, `year_built`, `passengers`, `passengers_max`,
`crew`, `gross_tonnage`, `length_m`, `beam_m`, `speed_knots`, `decks`, `cabins`,
`decks_with_cabins`, `ship_class`, `builder`, `building_cost`, `flag_state`,
`sister_ships[]`, `former_names[]`, `cover_image`, `ship_url`.

## Example: `GET /v1/cruises?cruise_line=MSC%20Cruises&max_price=1500&min_nights=5&limit=1`

```json
{
  "items": [
    {
      "id": "cru_4f2a9c1b7e3d5068",
      "cruise_line": "MSC Cruises",
      "ship_name": "MSC World Europa",
      "title": "7-Night Western Mediterranean",
      "departure_date": "2026-09-12",
      "return_date": "2026-09-19",
      "duration_days": 8,
      "nights": 7,
      "round_trip": true,
      "embark_port": "Barcelona",
      "disembark_port": "Barcelona",
      "region": "Western Mediterranean",
      "price_amount": 799,
      "price_currency": "EUR",
      "price_per_night": 114.14,
      "itinerary": [
        { "seq": 1, "port": "Barcelona", "date_raw": "12 Sep", "is_embark": true,  "is_disembark": false },
        { "seq": 2, "port": "Marseille", "date_raw": "13 Sep", "is_embark": false, "is_disembark": false }
      ],
      "fares": [],
      "scraped_at": "2026-06-28T04:12:00Z"
    }
  ],
  "total": 1843,
  "limit": 1,
  "offset": 0
}
```
