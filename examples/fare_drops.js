#!/usr/bin/env node
// CruiseFeed API — recent fare changes (deal alerts) via /v1/changes.
//   export CRUISEFEED_API_KEY=...
//   node fare_drops.js [YYYY-MM-DD]
// Node 18+ (built-in fetch).
//
// A /v1/changes item is a before/after record, not a cruise: it carries
// old_price/new_price, and has no `title` or `price_amount`.

// Override with CRUISEFEED_API_BASE to run against a staging host.
const BASE = (process.env.CRUISEFEED_API_BASE || "https://api.cruisefeed.io").replace(/\/$/, "");
const KEY = process.env.CRUISEFEED_API_KEY;
if (!KEY) {
  console.error("Set CRUISEFEED_API_KEY in your environment.");
  process.exit(1);
}

const since = process.argv[2] || "2026-06-20";

const money = (n, currency) =>
  n == null ? "n/a" : `${n.toFixed(2)} ${currency ?? ""}`.trim();

async function main() {
  const url = new URL(`${BASE}/v1/changes`);
  url.searchParams.set("since", since);
  url.searchParams.set("limit", "100");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(`HTTP ${res.status}: ${body?.error?.message ?? res.statusText}`);
    process.exit(1);
  }
  const { items = [], total = 0 } = await res.json();

  // Keep only genuine drops, biggest saving first — a "change" can be a rise.
  const drops = items
    .filter((c) => c.old_price != null && c.new_price != null && c.new_price < c.old_price)
    .map((c) => ({ ...c, saving: c.old_price - c.new_price }))
    .sort((a, b) => b.saving - a.saving);

  console.log(
    `${drops.length} fare drops among ${items.length} changes since ${since} (${total} total)\n`
  );
  for (const c of drops.slice(0, 20)) {
    const pct = ((c.saving / c.old_price) * 100).toFixed(0);
    console.log(
      `-${money(c.saving, c.price_currency)} (${pct}%)  ` +
        `${money(c.old_price, c.price_currency)} -> ${money(c.new_price, c.price_currency)}  ` +
        `${c.cruise_line ?? "?"}  ${c.ship_name ?? ""}  ` +
        `departs ${c.departure_date ?? "?"}  ${c.id}`
    );
  }
  if (drops.length) {
    console.log(`\nFull sailing: ${BASE}/v1/cruises/${drops[0].id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
