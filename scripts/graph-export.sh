#!/bin/sh
# Exports the whole notegraph — every node under root, tags and labels included — to a
# local .notegraph file, on demand, for handing this graph to a project being derived
# from this one via scripts/graph-import.sh. The graph itself is reached live and is
# authoritative, so this is never run as a step after every edit and its output is
# never committed to this repo — the default location is outside it entirely.
# Pass GRAPH_EXPORT_OUT to choose where the file lands.
#
#   sh scripts/graph-export.sh
#   GRAPH_EXPORT_OUT=/path/to/webgame-cloud.notegraph sh scripts/graph-export.sh
set -eu

OUT="${GRAPH_EXPORT_OUT:-$(mktemp -d)/appkit.notegraph}"

mkdir -p "$(dirname "$OUT")"
notegraph export --out "$OUT"
printf 'exported to %s\n' "$OUT"
