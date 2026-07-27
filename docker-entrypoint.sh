#!/bin/sh
set -e
: "${DATABASE_HOST:?DATABASE_HOST is required (plus optional DATABASE_PORT, DATABASE_USER, DATABASE_PASS, DATABASE_NAME, DATABASE_SSLMODE)}"

DSN="host=$DATABASE_HOST port=${DATABASE_PORT:-5432} dbname=${DATABASE_NAME:-starter} sslmode=${DATABASE_SSLMODE:-disable}"
[ -n "$DATABASE_USER" ] && DSN="$DSN user=$DATABASE_USER"
[ -n "$DATABASE_PASS" ] && DSN="$DSN password=$DATABASE_PASS"

echo "applying migrations..."
goose -dir /app/migrations postgres "$DSN" up

exec node /app/dist/index.js
