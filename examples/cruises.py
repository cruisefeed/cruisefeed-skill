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

BASE = "https://api.cruisefeed.io"


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
    cruises = get_cruises(region="Alaska", min_nights=7, max_price=2000)
    print(f"{len(cruises)} Alaska sailings (7+ nights, <= $2000)\n")
    for c in cruises[:10]:
        ports = " > ".join(stop["port"] for stop in c.get("itinerary", []))
        price = c.get("price_amount")
        price_s = f"${price}" if price is not None else "n/a"
        print(f'{c.get("departure_date","?")}  {c["cruise_line"]:<18} '
              f'{c.get("title",""):<28} {price_s:<7} {ports}')
