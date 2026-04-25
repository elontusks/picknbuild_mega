#!/usr/bin/env bash
# Run the Next.js app and the scraper orchestrator side-by-side.
# Both processes inherit env from picknbuild_mega/.env.local.
#
# Usage:  ./start-all.sh
# Stops:  Ctrl-C kills both children via the trap below.

set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env.local ]]; then
  echo "✗ .env.local missing — copy from .env.example and fill in keys" >&2
  exit 1
fi

if [[ ! -d scraper/node_modules ]]; then
  echo "→ scraper/node_modules missing; running 'npm run scraper:install'..."
  npm run scraper:install
fi

# Start scraper in background
npm run scraper:dev &
SCRAPER_PID=$!

# Start Next.js in foreground
npm run dev &
NEXT_PID=$!

trap 'echo; echo "→ shutting down"; kill "$SCRAPER_PID" "$NEXT_PID" 2>/dev/null || true; wait' INT TERM

wait
