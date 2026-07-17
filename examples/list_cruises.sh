#!/usr/bin/env bash
# CruiseFeed API — curl quickstart.
#   export CRUISEFEED_API_KEY=...
#   ./list_cruises.sh
set -euo pipefail

: "${CRUISEFEED_API_KEY:?Set CRUISEFEED_API_KEY in your environment}"
# Override with CRUISEFEED_API_BASE to run against a staging host.
BASE="${CRUISEFEED_API_BASE:-https://api.cruisefeed.io}"
AUTH=(-H "Authorization: Bearer ${CRUISEFEED_API_KEY}")

echo "# Caribbean sailings under \$1,200, cheapest first (first 5)"
# sort takes departure_date|-departure_date|price|-price — 'price_amount' is a 400.
# The listing returns upcoming sailings only; add include_past=true for history.
curl -s "${BASE}/v1/cruises?region=Caribbean&max_price=1200&sort=price&limit=5" "${AUTH[@]}"
echo

echo "# One ship by IMO (MSC World Europa)"
curl -s "${BASE}/v1/ships/9837420" "${AUTH[@]}"
echo

echo "# Catalogue totals"
curl -s "${BASE}/v1/stats" "${AUTH[@]}"
echo
