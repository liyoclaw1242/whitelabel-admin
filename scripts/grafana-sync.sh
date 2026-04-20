#!/usr/bin/env bash
#
# Sync docs/grafana/*.json to the Grafana Cloud stack declared in GRAFANA_URL.
# - Dashboards (`{dashboard: {...}, overwrite: true}` shape) → POST /api/dashboards/db
# - Alert rule groups (`{folder, interval, rules: [...]}` shape) → PUT per-rule by
#   uid when (folder, title) matches an existing rule; POST otherwise.
# - Any dashboard or rule in the target folder that ISN'T in the repo this run
#   gets deleted (orphan pruning). Run with `--no-prune` to disable.
#
# Required env:
#   GRAFANA_TOKEN  glsa_* token with dashboard + alert rule admin scope
#   GRAFANA_URL    e.g. https://liyoclaw1242.grafana.net
#
# Optional env:
#   GRAFANA_FOLDER       folder UID to place everything under (default: whitelabel-alerts)
#   DS_TEMPO_UID         Tempo datasource UID (default: grafanacloud-traces)
#   DS_LOKI_UID          Loki datasource UID  (default: grafanacloud-logs)

set -euo pipefail

: "${GRAFANA_TOKEN:?set GRAFANA_TOKEN (service account token with admin scope)}"
: "${GRAFANA_URL:?set GRAFANA_URL (e.g. https://liyoclaw1242.grafana.net)}"
GRAFANA_FOLDER=${GRAFANA_FOLDER:-whitelabel-alerts}
DS_TEMPO_UID=${DS_TEMPO_UID:-grafanacloud-traces}
DS_LOKI_UID=${DS_LOKI_UID:-grafanacloud-logs}

PRUNE=1
for arg in "$@"; do
  case "$arg" in
    --no-prune) PRUNE=0 ;;
    -h|--help)
      sed -n '1,25p' "$0"
      exit 0
      ;;
  esac
done

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SRC_DIR="$REPO_ROOT/docs/grafana"
[ -d "$SRC_DIR" ] || { echo "❌ $SRC_DIR not found"; exit 1; }

auth_curl() { curl -sS -H "Authorization: Bearer $GRAFANA_TOKEN" "$@"; }

# --- ensure folder exists (idempotent) ---
auth_curl -X POST "$GRAFANA_URL/api/folders" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg uid "$GRAFANA_FOLDER" --arg title "$GRAFANA_FOLDER" '{uid:$uid,title:$title}')" \
  > /dev/null || true   # returns 409 if already exists — fine

# --- collect uids touched this run, for prune step ---
TOUCHED_DASH_UIDS=()
TOUCHED_RULE_UIDS=()

substitute_placeholders() {
  sed -e "s|\${DS_TEMPO}|$DS_TEMPO_UID|g" -e "s|\${DS_LOKI}|$DS_LOKI_UID|g" "$1"
}

sync_dashboard() {
  local file="$1"
  local payload
  payload=$(substitute_placeholders "$file" \
    | jq --arg fuid "$GRAFANA_FOLDER" '. + {folderUid: $fuid, overwrite: true}')
  local resp
  resp=$(auth_curl -X POST "$GRAFANA_URL/api/dashboards/db" \
    -H "Content-Type: application/json" -d "$payload")
  local status uid title
  status=$(echo "$resp" | jq -r '.status // "error"')
  uid=$(echo "$resp" | jq -r '.uid // empty')
  title=$(substitute_placeholders "$file" | jq -r '.dashboard.title')
  if [ "$status" = "success" ] && [ -n "$uid" ]; then
    echo "  dashboard  ✓ $title  (uid=$uid)"
    TOUCHED_DASH_UIDS+=("$uid")
  else
    echo "  dashboard  ✗ $title  $(echo "$resp" | jq -r '.message // .')"
    return 1
  fi
}

sync_rule_group() {
  local file="$1"
  local resolved
  resolved=$(substitute_placeholders "$file")
  local count
  count=$(echo "$resolved" | jq '.rules | length')

  # Fetch current rules in target folder ONCE per file so we can look up uid by title.
  local existing
  existing=$(auth_curl "$GRAFANA_URL/api/v1/provisioning/alert-rules" \
    | jq --arg f "$GRAFANA_FOLDER" '[.[] | select(.folderUID == $f) | {uid, title}]')

  local i rule title existing_uid rule_payload resp http
  for i in $(seq 0 $((count - 1))); do
    rule=$(echo "$resolved" | jq ".rules[$i]")
    title=$(echo "$rule" | jq -r '.title')
    existing_uid=$(echo "$existing" | jq -r --arg t "$title" '.[] | select(.title==$t) | .uid' | head -1)

    rule_payload=$(echo "$rule" | jq --arg fuid "$GRAFANA_FOLDER" \
      '. + {folderUID:$fuid, ruleGroup:$fuid, execErrState:"Error", noDataState:"NoData", orgID:1}')

    if [ -n "$existing_uid" ]; then
      rule_payload=$(echo "$rule_payload" | jq --arg uid "$existing_uid" '. + {uid:$uid}')
      http=$(auth_curl -X PUT "$GRAFANA_URL/api/v1/provisioning/alert-rules/$existing_uid" \
        -H "X-Disable-Provenance: true" \
        -H "Content-Type: application/json" \
        -d "$rule_payload" -o /dev/null -w "%{http_code}")
      if [ "$http" = "200" ]; then
        echo "  alert rule ↻ $title  (uid=$existing_uid)"
        TOUCHED_RULE_UIDS+=("$existing_uid")
      else
        echo "  alert rule ✗ $title  HTTP $http"
        return 1
      fi
    else
      resp=$(auth_curl -X POST "$GRAFANA_URL/api/v1/provisioning/alert-rules" \
        -H "X-Disable-Provenance: true" \
        -H "Content-Type: application/json" \
        -d "$rule_payload")
      local new_uid
      new_uid=$(echo "$resp" | jq -r '.uid // empty')
      if [ -n "$new_uid" ]; then
        echo "  alert rule + $title  (uid=$new_uid)"
        TOUCHED_RULE_UIDS+=("$new_uid")
      else
        echo "  alert rule ✗ $title  $(echo "$resp" | jq -r '.message // .')"
        return 1
      fi
    fi
  done
}

# --- iterate src files, dispatch by shape ---
echo "→ Syncing $SRC_DIR → $GRAFANA_URL (folder=$GRAFANA_FOLDER)"
for f in "$SRC_DIR"/*.json; do
  [ -f "$f" ] || continue
  shape=$(substitute_placeholders "$f" | jq -r '
    if (.dashboard // null) != null then "dashboard"
    elif (.rules // null) != null then "rule-group"
    else "unknown"
    end')
  case "$shape" in
    dashboard)  sync_dashboard "$f" ;;
    rule-group) sync_rule_group "$f" ;;
    unknown)    echo "  skip       ? $(basename "$f")  (neither dashboard nor rule-group)" ;;
  esac
done

# --- prune orphans in target folder ---
if [ "$PRUNE" = "1" ]; then
  echo
  echo "→ Orphan prune (folder=$GRAFANA_FOLDER)"

  # Dashboards: list everything in folder, delete any whose uid isn't in touched
  touched_set=" ${TOUCHED_DASH_UIDS[*]:-} "
  while IFS=$'\t' read -r uid title; do
    [ -z "$uid" ] && continue
    if [[ "$touched_set" != *" $uid "* ]]; then
      http=$(auth_curl -X DELETE "$GRAFANA_URL/api/dashboards/uid/$uid" -o /dev/null -w "%{http_code}")
      echo "  dashboard  - $title  (uid=$uid  HTTP $http)"
    fi
  done < <(auth_curl -G "$GRAFANA_URL/api/search" --data-urlencode "folderUIDs=$GRAFANA_FOLDER" --data-urlencode "type=dash-db" \
            | jq -r '.[] | "\(.uid)\t\(.title)"')

  # Alert rules: same shape
  touched_set=" ${TOUCHED_RULE_UIDS[*]:-} "
  while IFS=$'\t' read -r uid title; do
    [ -z "$uid" ] && continue
    if [[ "$touched_set" != *" $uid "* ]]; then
      http=$(auth_curl -X DELETE "$GRAFANA_URL/api/v1/provisioning/alert-rules/$uid" \
        -H "X-Disable-Provenance: true" -o /dev/null -w "%{http_code}")
      echo "  alert rule - $title  (uid=$uid  HTTP $http)"
    fi
  done < <(auth_curl "$GRAFANA_URL/api/v1/provisioning/alert-rules" \
            | jq -r --arg f "$GRAFANA_FOLDER" '.[] | select(.folderUID==$f) | "\(.uid)\t\(.title)"')
fi

echo
echo "✓ Done. dashboards touched: ${#TOUCHED_DASH_UIDS[@]}  rules touched: ${#TOUCHED_RULE_UIDS[@]}"
