#!/usr/bin/env python3
"""CruiseFeed API — paginate and filter /v1/cruises.

    pip install requests
    export CRUISEFEED_API_KEY=...        # Windows: set CRUISEFEED_API_KEY=...
    python cruises.py
"""
from __future__ import annotations

import os
import sys

import requests

# Override with CRUISEFEED_API_BASE to run against a staging host.
BASE = os.environ.get("CRUISEFEED_API_BASE", "https://api.cruisefeed.io").rstrip("/")


def get_cruises(**filters) -> list[dict]:
    """Return all matching sailings, following limit/offset pagination."""
    key = os.environ.get("CRUISEFEED_API_KEY")
    if not key:
        sys.exit("Set CRUISEFEED_API_KEY in your environment.")
    headers = {"Authorization": f"Bearer {key}"}
    out: list[dict] = []
    offset, page = 0, 200
    while True:
        params = {**filters, "limit": page, "offset": offset}
        r = requests.get(f"{BASE}/v1/cruises", headers=headers, params=params, timeout=30)
        r.raise_for_status()
        body = r.json()
        items = body["items"]
        out.extend(items)
        offset += len(items)
        if len(items) < page or offset >= body.get("total", 0):
            break
    return out


if __name__ == "__main__":
    # sort takes departure_date|-departure_date|price|-price (not `price_amount`).
    # The listing returns upcoming sailings only; pass include_past="true" for history.
    cruises = get_cruises(region="Alaska", min_nights=7, max_price=2000, sort="price")
    print(f"{len(cruises)} Alaska sailings (7+ nights, <= $2000), cheapest first\n")
    for c in cruises[:10]:
        # Itinerary richness varies by source and a sea day carries no port at all,
        # so read every stop key defensively.
        ports = " > ".join(s["port"] for s in c.get("itinerary") or [] if s.get("port"))
        price = c.get("price_amount")
        price_s = f"${price}" if price is not None else "n/a"
        print(f'{c.get("departure_date") or "?":<12} {c["cruise_line"]:<18} '
              f'{(c.get("title") or "")[:28]:<28} {price_s:<9} {ports}')
