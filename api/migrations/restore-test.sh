#!/bin/sh
set -e

. "$(dirname "$0")/env.sh"

DUMP_FILE="$1"
if [ -z "$DUMP_FILE" ]; then
    echo "usage: sh restore-test.sh <dump-file> [test-db-name]" >&2
    exit 1
fi

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
TEST_DB_NAME="${2:-${DATABASE_NAME:-starter}_restore_test}"

[ -n "$DATABASE_USER" ] && export PGUSER="$DATABASE_USER"
[ -n "$DATABASE_PASS" ] && export PGPASSWORD="$DATABASE_PASS"

CONN_ARGS="-h $DB_HOST -p $DB_PORT"

dropdb $CONN_ARGS --if-exists "$TEST_DB_NAME"
createdb $CONN_ARGS "$TEST_DB_NAME"

pg_restore $CONN_ARGS -d "$TEST_DB_NAME" --no-owner --no-privileges "$DUMP_FILE"

echo "restored into $TEST_DB_NAME — running smoke check..."

for TABLE in users recipes diets; do
    COUNT=$(psql $CONN_ARGS -d "$TEST_DB_NAME" -tAc "SELECT count(*) FROM $TABLE")
    if [ "$COUNT" -eq 0 ]; then
        echo "smoke check FAILED: $TABLE is empty in the restored database" >&2
        exit 1
    fi
    echo "  $TABLE: $COUNT rows"
done

echo "restore smoke check passed"
