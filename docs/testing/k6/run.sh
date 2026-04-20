#!/usr/bin/env bash
#
# One-shot runner for the k6 scripts in this directory.
# Usage:
#   ./run.sh [smoke|health-load|auth-flow|refresh-storm|all]
#
# Env overrides passed through to k6:
#   BASE_URL        target API origin
#   SEED_USERS      comma-sep email:password list
#   PCT_FULL_CYCLE  percent of auth-flow iterations doing login→logout

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Resolve `..` NOW so the path we mkdir is byte-for-byte the same one
# k6 will later hand to its summary-export. Unresolved `..` has caused
# "no such file or directory" on the summary write.
RUNS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/k6-runs"
mkdir -p "$RUNS_DIR"

SCENARIO=${1:-all}
STAMP=$(date -u +%Y%m%d-%H%M%S)

command -v k6 >/dev/null || { echo "❌ k6 not found; brew install k6"; exit 1; }

run_one() {
  local name="$1"
  local script="$SCRIPT_DIR/$name.js"
  [ -f "$script" ] || { echo "❌ no such scenario: $name"; return 1; }
  local out="$RUNS_DIR/${STAMP}-${name}.json"
  echo
  echo "=== scenario: $name → $out ==="
  k6 run --summary-export "$out" "$script"
}

case "$SCENARIO" in
  smoke|health-load|auth-flow|refresh-storm)
    run_one "$SCENARIO"
    ;;
  all)
    run_one smoke || { echo "smoke failed — aborting"; exit 1; }
    run_one health-load
    run_one auth-flow
    run_one refresh-storm
    ;;
  *)
    echo "Usage: $0 [smoke|health-load|auth-flow|refresh-storm|all]"
    exit 2
    ;;
esac

echo
echo "=== JSON outputs under $RUNS_DIR ==="
ls -1 "$RUNS_DIR" | tail -10
