# CruiseFeed API — full reference

Base URL: `https://api.cruisefeed.io` · All data endpoints under `/v1/` ·
Auth: `Authorization: Bearer <CRUISEFEED_API_KEY>` · Current API version: `1.3.0`.

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

Every error uses this envelope, including a 404 for an unrouted path. Common
statuses:

| Status | `error.code` | When |
|--------|--------------|------|
| `400` | `bad_request` | A parameter is well-formed but not allowed — e.g. an unsupported `sort` |
| `401` | `unauthorized` | Missing/invalid key. Fix the key; don't retry |
| `404` | `not_found` | Unknown `cruise_id` / `ship_id`, or an endpoint that doesn't exist (the message names the real ones) |
| `422` | `validation_error` | A parameter is the wrong type, e.g. `min_price=cheap` |
| `429` | `rate_limited` | Rate limit or monthly quota exhausted; see `Retry-After` |

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
| `include_past` | boolean | Default `false` — see "Upcoming by default" below |
| `sort` | string | One of `departure_date` (default), `-departure_date`, `price`, `-price`. Anything else is a `400`. Note it is `price`, **not** `price_amount` |
| `limit` | integer | 1–500, default 50 |
| `offset` | integer | Pagination offset |

`-` prefix = descending. NULLs always sort last, so `-price` opens on the most
expensive sailing that actually has a price rather than on unpriced rows.

#### Upcoming by default

The catalogue holds sailings back to 2015, and only ~2% of departed ones carry a
price. So `/v1/cruises` and `/v1/cruises.csv` return **sailings that haven't
departed yet** unless you ask otherwise:

- `include_past=true` — include departed sailings (the whole catalogue).
- Setting `departure_from` or `departure_to` hands the date window to you and
  overrides the default on its own; `include_past` is then ignored.

Sailings with a `null` departure_date (product-level listings) haven't departed,
so they are always included and sort last.

### `GET /v1/cruises.csv`
Same filters as `/v1/cruises`, streamed as CSV (one row per sailing).

### `GET /v1/cruises/{cruise_id}`
One sailing by its opaque `id`. Includes a nested `ship` object with full specs.

### `GET /v1/cruises/{cruise_id}/history`
Price / availability history for one sailing (for change tracking).

### `GET /v1/changes`
Recent price changes — good for fare-drop alerts. Params: `since` (date),
`cruise_line`, `limit`, `offset`.

A change item is a **before/after record, not a cruise**. It has its own shape:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | The sailing's opaque id — pass to `/v1/cruises/{id}` for the full record |
| `cruise_line` | string | |
| `ship_name` | string | |
| `departure_date` | date | The sailing's departure |
| `old_price` | number | Fare before the change |
| `new_price` | number | Fare after; the drop is `old_price - new_price` |
| `price_currency` | string | ISO currency |
| `old_date` | date | When the old fare was observed |
| `new_date` | date | When the new fare was observed |

There is **no `title` and no `price_amount`** on a change item — reading those
(the names used on `/v1/cruises`) yields `undefined`/`None` for every row.

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
| `id` | string | Opaque, source-agnostic id, unique per sailing (e.g. `cru_27fad303985bed3f`). Not guessable — take it from a listing response |
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
| `ship_code` | string | Line's own ship code; often `null` |
| `destination_code` | string | Line's own destination code; often `null` |
| `sea_days` | integer | Days at sea; may be `null` |
| `port_count` | integer | Ports of call; may be `null` |
| `price_amount` | number | Lead-in fare; **`null` on ~58% of the catalogue** |
| `price_currency` | string | ISO currency, e.g. `EUR` |
| `price_per_night` | number | Derived; may be `null` |
| `taxes_and_fees` | number | May be `null` |
| `taxes_currency` | string | May be `null` |
| `obc_amount` | number | Onboard credit; may be `null` |
| `sold_out` | boolean | May be `null` (unknown), which is not the same as `false` |
| `itinerary` | array | Per stop — see below |
| `fares` | array | Per-cabin-class breakdown **only when >1 fare is published**; else empty |
| `booking_url` | string | Deep link to the line's booking flow; may be `null` |
| `detail_url` | string | Line's own sailing page; may be `null` |
| `image_url` | string | May be `null` |
| `scraped_at` | datetime | ISO 8601 freshness timestamp |

### Itinerary stops

`itinerary` is a passthrough array whose richness **varies by source** — treat
every key except `seq` and `port` as optional and absent, not merely `null`:

`seq`, `port`, `date_raw`, `is_embark`, `is_disembark` appear on every stop.
Better-covered lines add `day_number`, `date`, `arrive`, `depart`, `port_code`,
`country`, `region`, `is_sea_day`, `overnight`, `tender`.

Use `.get()` / optional chaining. A stop on a sea day may have no `port`.

## Ship schema

`/v1/ships` records add vessel specs. The IMO/MMSI fields are `imo_number` and
`mmsi_number` — **not** `imo`/`mmsi`:

`ship_name`, `imo_number`, `mmsi_number`, `source_id`, `operator`, `owner`,
`year_built`, `last_refurbishment`, `passengers`, `passengers_max`, `crew`,
`passengers_to_space_ratio`, `gross_tonnage`, `length_m`, `beam_m`,
`speed_knots`, `decks`, `cabins`, `decks_with_cabins`, `ship_class`, `builder`,
`building_cost`, `christened_by`, `engines_power`, `propulsion_power`,
`flag_state`, `sister_ships[]`, `former_names[]`, `cover_image`, `ship_url`,
`scraped_at`.

`{ship_id}` in `/v1/ships/{ship_id}` is the IMO number (e.g. `9837420` for MSC
World Europa).

## Example: `GET /v1/cruises?cruise_line=MSC%20Cruises&min_price=1&min_nights=5&limit=1`

A real response, trimmed to two itinerary stops. Note how much of a typical
record is `null` — code defensively.

```json
{
  "items": [
    {
      "id": "cru_27fad303985bed3f",
      "cruise_line": "MSC Cruises",
      "ship_name": "MSC Seaview",
      "title": "7 days, round-trip Mediterranean",
      "departure_date": "2026-06-01",
      "return_date": "2026-06-08",
      "duration_days": 7,
      "nights": 7,
      "round_trip": true,
      "embark_port": "Palermo, Sicily Italy",
      "disembark_port": "Palermo, Sicily Italy",
      "region": "Mediterranean",
      "ship_code": null,
      "destination_code": null,
      "sea_days": 0,
      "port_count": 6,
      "price_amount": 1028.0,
      "price_currency": "USD",
      "price_per_night": 146.86,
      "taxes_and_fees": null,
      "taxes_currency": null,
      "obc_amount": null,
      "sold_out": null,
      "fares": [],
      "itinerary": [
        {
          "seq": 1, "day_number": 1, "date": "2026-06-01",
          "port": "Palermo, Sicily Italy", "port_code": null, "country": null,
          "region": null, "date_raw": "01 Jun 20:00", "arrive": null,
          "depart": "01 Jun 20:00", "is_embark": true, "is_disembark": false,
          "is_sea_day": false, "overnight": false, "tender": null
        },
        {
          "seq": 2, "day_number": 3, "date": "2026-06-03",
          "port": "Ibiza, Ibiza Island Balearic Spain", "port_code": null,
          "country": null, "region": null, "date_raw": "03 Jun 11:30 - 23:00",
          "arrive": "03 Jun 11:30", "depart": "23:00", "is_embark": false,
          "is_disembark": false, "is_sea_day": false, "overnight": false,
          "tender": null
        }
      ],
      "booking_url": null,
      "detail_url": null,
      "image_url": null,
      "scraped_at": "2026-07-12T04:04:32.444119"
    }
  ],
  "total": 6122,
  "limit": 1,
  "offset": 0
}
```
