#!/bin/sh
set -e

. "$(dirname "$0")/env.sh"

DUMP_FILE="$1"
if [ -z "$DUMP_FILE" ]; then
    echo "usage: sh corrupt-drill.sh <dump-file> [test-db-name] [table-to-corrupt]" >&2
    exit 1
fi

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
TEST_DB_NAME="${2:-${DATABASE_NAME:-starter}_restore_test}"
TABLE="${3:-ingredients}"

[ -n "$DATABASE_USER" ] && export PGUSER="$DATABASE_USER"
[ -n "$DATABASE_PASS" ] && export PGPASSWORD="$DATABASE_PASS"

CONN_ARGS="-h $DB_HOST -p $DB_PORT"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

sh "$SCRIPT_DIR/restore-test.sh" "$DUMP_FILE" "$TEST_DB_NAME"

echo "corrupting $TABLE in $TEST_DB_NAME to simulate data loss..."
psql $CONN_ARGS -d "$TEST_DB_NAME" -c "TRUNCATE $TABLE CASCADE"
BROKEN_COUNT=$(psql $CONN_ARGS -d "$TEST_DB_NAME" -tAc "SELECT count(*) FROM $TABLE")
if [ "$BROKEN_COUNT" -ne 0 ]; then
    echo "corruption step did not take effect — $TABLE still has $BROKEN_COUNT rows" >&2
    exit 1
fi

pg_restore $CONN_ARGS -d "$TEST_DB_NAME" --no-owner --no-privileges --clean --if-exists "$DUMP_FILE"

RECOVERED_COUNT=$(psql $CONN_ARGS -d "$TEST_DB_NAME" -tAc "SELECT count(*) FROM $TABLE")
if [ "$RECOVERED_COUNT" -eq 0 ]; then
    echo "restore did NOT repair $TABLE — corrupt-and-restore drill FAILED" >&2
    exit 1
fi

echo "corrupt-and-restore drill passed: $TABLE recovered ($RECOVERED_COUNT rows)"
