#!/usr/bin/env bash
# CruiseFeed API — curl quickstart.
#   export CRUISEFEED_API_KEY=...
#   ./list_cruises.sh
set -euo pipefail

: "${CRUISEFEED_API_KEY:?Set CRUISEFEED_API_KEY in your environment}"
BASE="https://api.cruisefeed.io"
AUTH=(-H "Authorization: Bearer ${CRUISEFEED_API_KEY}")

echo "# Caribbean sailings under \$1,200 (first 5)"
curl -s "${BASE}/v1/cruises?region=Caribbean&max_price=1200&limit=5" "${AUTH[@]}"
echo

echo "# One ship by IMO (MSC World Europa)"
curl -s "${BASE}/v1/ships/9839419" "${AUTH[@]}"
echo

echo "# Catalogue totals"
curl -s "${BASE}/v1/stats" "${AUTH[@]}"
echo
