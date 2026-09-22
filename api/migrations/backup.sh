#!/bin/sh
set -e

. "$(dirname "$0")/env.sh"

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-starter}"
OUT_DIR="${1:-.}"

[ -n "$DATABASE_USER" ] && export PGUSER="$DATABASE_USER"
[ -n "$DATABASE_PASS" ] && export PGPASSWORD="$DATABASE_PASS"

mkdir -p "$OUT_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT_FILE="$OUT_DIR/cookbook-$STAMP.dump"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -Fc -f "$OUT_FILE" "$DB_NAME"

echo "$OUT_FILE"
