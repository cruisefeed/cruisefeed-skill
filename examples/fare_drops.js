#!/usr/bin/env node
// CruiseFeed API — recent fare changes (deal alerts) via /v1/changes.
//   export CRUISEFEED_API_KEY=...
//   node fare_drops.js [YYYY-MM-DD]
// Node 18+ (built-in fetch).

const BASE = "https://api.cruisefeed.io";
const KEY = process.env.CRUISEFEED_API_KEY;
if (!KEY) {
  console.error("Set CRUISEFEED_API_KEY in your environment.");
  process.exit(1);
}

const since = process.argv[2] || "2026-06-20";

async function main() {
  const url = new URL(`${BASE}/v1/changes`);
  url.searchParams.set("since", since);
  url.searchParams.set("limit", "20");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(`HTTP ${res.status}: ${body?.error?.message ?? res.statusText}`);
    process.exit(1);
  }
  const { items = [] } = await res.json();
  console.log(`${items.length} changed fares since ${since}\n`);
  for (const c of items.slice(0, 20)) {
    console.log(`${c.cruise_line ?? "?"}  ${c.ship_name ?? ""}  ${c.title ?? ""}  ${c.price_amount ?? "n/a"} ${c.price_currency ?? ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
