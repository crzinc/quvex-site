#!/usr/bin/env bash
# Applies every migration to a throwaway local Postgres and runs the SQL tests.
# Needs a local Postgres (e.g. Postgres.app): PG_BIN=/Applications/Postgres.app/Contents/Versions/latest/bin
# Usage: supabase/tests/run-local.sh            (prints NOTICE lines and query results; read them)
set -euo pipefail
cd "$(dirname "$0")/../.."
PG_BIN="${PG_BIN:-/Applications/Postgres.app/Contents/Versions/latest/bin}"
export PATH="$PG_BIN:$PATH" PGHOST=127.0.0.1 PGPORT="${PGPORT:-54329}" PGUSER=postgres
DATA="$(mktemp -d)/pg"
initdb -D "$DATA" -U postgres >/dev/null
pg_ctl -D "$DATA" -o "-p $PGPORT -k '' -c listen_addresses=127.0.0.1" -l "$DATA.log" start >/dev/null
trap 'pg_ctl -D "$DATA" stop >/dev/null; rm -rf "$(dirname "$DATA")"' EXIT
sleep 2

for test in supabase/tests/[a-z]*.sql; do
  echo "═══ $test"
  psql -q -c "drop database if exists q" -c "create database q"
  args=(-f supabase/tests/00_auth_stub.sql)
  for m in supabase/migrations/*.sql; do args+=(-f "$m"); done
  psql -d q -q -v ON_ERROR_STOP=1 "${args[@]}"
  psql -d q -v ON_ERROR_STOP=1 -f "$test" 2>&1 | grep -vE '^$|^-+$|^\([0-9]+ rows?\)' | sed 's/.*NOTICE:/NOTICE:/'
done
