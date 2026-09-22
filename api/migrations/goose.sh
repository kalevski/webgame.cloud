#!/bin/sh
set -e

. "$(dirname "$0")/env.sh"

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-starter}"

DSN="host=$DB_HOST port=$DB_PORT dbname=$DB_NAME sslmode=${DATABASE_SSLMODE:-disable}"
[ -n "$DATABASE_USER" ] && DSN="$DSN user=$DATABASE_USER"
[ -n "$DATABASE_PASS" ] && DSN="$DSN password=$DATABASE_PASS"

if [ "$1" = "up" ]; then
    CREATEDB_ARGS="-h $DB_HOST -p $DB_PORT"
    [ -n "$DATABASE_USER" ] && CREATEDB_ARGS="$CREATEDB_ARGS -U $DATABASE_USER"
    [ -n "$DATABASE_PASS" ] && export PGPASSWORD="$DATABASE_PASS"
    createdb $CREATEDB_ARGS "$DB_NAME" 2>/dev/null || true
fi

exec goose -dir "$(dirname "$0")/sql" postgres "$DSN" "$@"
