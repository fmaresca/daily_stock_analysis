#!/usr/bin/env bash
# Trigger Morning Digest manually or via cron
# Usage: ./scripts/trigger_morning_digest.sh [--force]

set -e

APP_URL="${APP_URL:-https://deltaharvest.pages.dev}"
FORCE_FLAG=""

if [ "$1" == "--force" ]; then
  FORCE_FLAG="?force=true"
fi

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET environment variable is not set."
  exit 1
fi

echo "Triggering Morning Digest on ${APP_URL}/api/scheduled/morning-digest${FORCE_FLAG}..."
curl -s -X POST "${APP_URL}/api/scheduled/morning-digest${FORCE_FLAG}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" | jq .
