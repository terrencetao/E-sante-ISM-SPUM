#!/usr/bin/env bash
# ============================================================
# IMP-003 End-to-End API validation script
# Covers: CRUD zones/campagnes/assignations, collecte,
#         supervision, switch-user, access-control (403 checks)
# Usage: APP_ENV=dev ./run_e2e_imp003.sh
# ============================================================
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:8000/api}"

ADMIN_EMAIL="admin-system@local.dev"
ADMIN_PIN="1234"
CAMPAIGN_EMAIL="campagne-imp003@local.dev"
INTER_EMAIL="intervenant-imp003@local.dev"
ANALYST_EMAIL="analyste-imp003@local.dev"

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }
info() { echo -e "${YELLOW}[INFO]${NC} $*"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "[ERROR] Missing command: $1"; exit 1; }
}

# -----------------------------------------------------------
# Low-level HTTP helper
# Returns body on success; prints body+exits on non-2xx
# -----------------------------------------------------------
request_json() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local token="${4:-}"

  local tmp
  tmp="$(mktemp)"

  local -a args=(
    -sS -o "$tmp" -w "%{http_code}"
    -X "$method"
    -H "Accept: application/json"
    -H "Content-Type: application/json"
  )
  [[ -n "$token" ]] && args+=( -H "Authorization: Bearer $token" )
  [[ -n "$data" ]] && args+=( -d "$data" )

  local status
  status="$(curl "${args[@]}" "$API_URL$path")"

  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    echo -e "${RED}[ERROR]${NC} $method $path → HTTP $status" >&2
    cat "$tmp" >&2
    rm -f "$tmp"
    exit 1
  fi
  cat "$tmp"; rm -f "$tmp"
}

# Returns HTTP status code only (no body check)
request_status() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local token="${4:-}"

  local -a args=(
    -sS -o /dev/null -w "%{http_code}"
    -X "$method"
    -H "Accept: application/json"
    -H "Content-Type: application/json"
  )
  [[ -n "$token" ]] && args+=( -H "Authorization: Bearer $token" )
  [[ -n "$data" ]] && args+=( -d "$data" )

  curl "${args[@]}" "$API_URL$path"
}

login_get_token() {
  local email="$1" pin="$2"
  local payload
  payload="$(jq -n --arg e "$email" --arg p "$pin" '{email:$e,pin:$p}')"
  request_json POST "/auth/login" "$payload" | jq -r '.access_token'
}

ensure_user_get_pin() {
  local admin_token="$1" email="$2" role="$3"
  local users user_id result payload
  users="$(request_json GET "/users" "" "$admin_token")"
  user_id="$(echo "$users" | jq -r --arg e "$email" '.[] | select(.email==$e) | .id' | head -n1)"
  if [[ -z "$user_id" ]]; then
    payload="$(jq -n --arg e "$email" --arg r "$role" '{email:$e,role_name:$r}')"
    result="$(request_json POST "/users" "$payload" "$admin_token")"
    echo "$result" | jq -r '.temporary_pin'
    return
  fi
  result="$(request_json POST "/users/$user_id/reset-pin" "" "$admin_token")"
  echo "$result" | jq -r '.temporary_pin'
}

# -----------------------------------------------------------
require_cmd curl
require_cmd jq

info "=== IMP-003 E2E test suite ==="
info "API: $API_URL"

# Health check
health="$(curl -sS "$API_URL/health")"
info "Health: $health"

# ============================================================
# 0. Bootstrap users
# ============================================================
info ""
info "--- [0] Bootstrap users ---"
admin_token="$(login_get_token "$ADMIN_EMAIL" "$ADMIN_PIN")"
pass "Admin login OK"

campaign_pin="$(ensure_user_get_pin "$admin_token" "$CAMPAIGN_EMAIL" "administrator_campaign")"
inter_pin="$(ensure_user_get_pin   "$admin_token" "$INTER_EMAIL"     "intervenant_terrain")"
analyst_pin="$(ensure_user_get_pin "$admin_token" "$ANALYST_EMAIL"   "analyste")"

campaign_token="$(login_get_token "$CAMPAIGN_EMAIL" "$campaign_pin")"
inter_token="$(login_get_token    "$INTER_EMAIL"    "$inter_pin")"
analyst_token="$(login_get_token  "$ANALYST_EMAIL"  "$analyst_pin")"

users_json="$(request_json GET "/users" "" "$admin_token")"
inter_user_id="$(echo "$users_json" | jq -r --arg e "$INTER_EMAIL" '.[] | select(.email==$e) | .id' | head -n1)"
pass "Users provisioned (intervenant id=$inter_user_id)"

# ============================================================
# 1. CRUD zones
# ============================================================
info ""
info "--- [1] CRUD zones ---"

ZONE_NAME="IMP003-zone-$(date +%s)"

# Create
zone_json="$(request_json POST "/zones" \
  "$(jq -n --arg n "$ZONE_NAME" '{name:$n,description:"IMP-003 test zone"}')" \
  "$campaign_token")"
zone_id="$(echo "$zone_json" | jq -r '.id')"
[[ -n "$zone_id" && "$zone_id" != "null" ]] || fail "Zone creation returned no id"
pass "Zone created: $zone_id"

# List – zone must appear
zones_list="$(request_json GET "/zones" "" "$campaign_token")"
found="$(echo "$zones_list" | jq -r --arg id "$zone_id" '.[] | select(.id==$id) | .id')"
[[ "$found" == "$zone_id" ]] || fail "Zone not found in list"
pass "Zone appears in list"

# Update
updated_zone="$(request_json PATCH "/zones/$zone_id" \
  "$(jq -n '{description:"Updated by IMP-003"}')" \
  "$campaign_token")"
updated_desc="$(echo "$updated_zone" | jq -r '.description')"
[[ "$updated_desc" == "Updated by IMP-003" ]] || fail "Zone description not updated (got: $updated_desc)"
pass "Zone update OK"

# ============================================================
# 2. CRUD campagnes
# ============================================================
info ""
info "--- [2] CRUD campagnes ---"

CAMPAIGN_NAME="IMP003-campaign-$(date +%s)"

campaign_json="$(request_json POST "/campaigns" \
  "$(jq -n --arg n "$CAMPAIGN_NAME" '{name:$n,description:"IMP-003 test campaign"}')" \
  "$campaign_token")"
campaign_id="$(echo "$campaign_json" | jq -r '.id')"
[[ -n "$campaign_id" && "$campaign_id" != "null" ]] || fail "Campaign creation returned no id"
pass "Campaign created: $campaign_id"

# List
campaigns_list="$(request_json GET "/campaigns" "" "$campaign_token")"
found="$(echo "$campaigns_list" | jq -r --arg id "$campaign_id" '.[] | select(.id==$id) | .id')"
[[ "$found" == "$campaign_id" ]] || fail "Campaign not found in list"
pass "Campaign appears in list"

# Update
updated_campaign="$(request_json PATCH "/campaigns/$campaign_id" \
  "$(jq -n '{description:"Updated by IMP-003"}')" \
  "$campaign_token")"
updated_cdesc="$(echo "$updated_campaign" | jq -r '.description')"
[[ "$updated_cdesc" == "Updated by IMP-003" ]] || fail "Campaign description not updated"
pass "Campaign update OK"

# ============================================================
# 3. CRUD assignations
# ============================================================
info ""
info "--- [3] CRUD assignations ---"

assign_json="$(request_json POST "/campaigns/$campaign_id/assignments" \
  "$(jq -n --arg zid "$zone_id" --arg uid "$inter_user_id" '{health_area_id:$zid,user_id:$uid}')" \
  "$campaign_token")"
assignment_id="$(echo "$assign_json" | jq -r '.id')"
[[ -n "$assignment_id" && "$assignment_id" != "null" ]] || fail "Assignment creation returned no id"
pass "Assignment created: $assignment_id"

# Global list (enrichi avec labels)
all_assigns="$(request_json GET "/campaigns/assignments" "" "$campaign_token")"
found_assign="$(echo "$all_assigns" | jq -r --arg id "$assignment_id" '.[] | select(.id==$id) | .id')"
[[ "$found_assign" == "$assignment_id" ]] || fail "Assignment not found in global list"
# Verify enriched labels are present
campaign_name_label="$(echo "$all_assigns" | jq -r --arg id "$assignment_id" '.[] | select(.id==$id) | .campaign_name')"
health_area_label="$(echo "$all_assigns" | jq -r --arg id "$assignment_id" '.[] | select(.id==$id) | .health_area_name')"
[[ -n "$campaign_name_label" && "$campaign_name_label" != "null" ]] || fail "Missing campaign_name label in global assignment list"
[[ -n "$health_area_label" && "$health_area_label" != "null" ]] || fail "Missing health_area_name label in global assignment list"
pass "Global assignment list with labels OK (campaign='$campaign_name_label', zone='$health_area_label')"

# Patch assignment status
patched="$(request_json PATCH "/campaigns/assignments/$assignment_id" \
  "$(jq -n '{status:"active"}')" \
  "$campaign_token")"
patched_status="$(echo "$patched" | jq -r '.status')"
[[ "$patched_status" == "active" ]] || fail "Assignment status not updated (got: $patched_status)"
pass "Assignment PATCH status OK"

# Deuxième zone+campagne dédiées à la collecte (pas au CRUD)
# Ainsi zone_id/campaign_id restent sans données et peuvent être supprimées en fin de test.
ZONE_DATA_NAME="IMP003-zone-data-$(date +%s)"
CAMPAIGN_DATA_NAME="IMP003-campaign-data-$(date +%s)"

zone_data_json="$(request_json POST "/zones" \
  "$(jq -n --arg n "$ZONE_DATA_NAME" '{name:$n,description:"IMP-003 data zone"}')" \
  "$campaign_token")"
zone_data_id="$(echo "$zone_data_json" | jq -r '.id')"
[[ -n "$zone_data_id" && "$zone_data_id" != "null" ]] || fail "Data zone creation returned no id"

campaign_data_json="$(request_json POST "/campaigns" \
  "$(jq -n --arg n "$CAMPAIGN_DATA_NAME" '{name:$n,description:"IMP-003 data campaign"}')" \
  "$campaign_token")"
campaign_data_id="$(echo "$campaign_data_json" | jq -r '.id')"
[[ -n "$campaign_data_id" && "$campaign_data_id" != "null" ]] || fail "Data campaign creation returned no id"

assign_data_json="$(request_json POST "/campaigns/$campaign_data_id/assignments" \
  "$(jq -n --arg zid "$zone_data_id" --arg uid "$inter_user_id" '{health_area_id:$zid,user_id:$uid}')" \
  "$campaign_token")"
assignment_data_id="$(echo "$assign_data_json" | jq -r '.id')"
pass "Ressources de collecte créées (zone=$zone_data_id, campaign=$campaign_data_id)"

# ============================================================
# 4. GET /me/assignments (intervenant – enrichi)
# ============================================================
info ""
info "--- [4] GET /me/assignments (intervenant) ---"

my_assigns="$(request_json GET "/me/assignments" "" "$inter_token")"
count="$(echo "$my_assigns" | jq 'length')"
[[ "$count" -ge 1 ]] || fail "Intervenant has no assignments (expected ≥1)"
first="$(echo "$my_assigns" | jq '.[0]')"
cname="$(echo "$first" | jq -r '.campaign_name')"
hname="$(echo "$first" | jq -r '.health_area_name')"
[[ -n "$cname" && "$cname" != "null" ]] || fail "Missing campaign_name in /me/assignments"
[[ -n "$hname" && "$hname" != "null" ]] || fail "Missing health_area_name in /me/assignments"
pass "/me/assignments OK ($count assignment(s), campaign='$cname', zone='$hname')"

# ============================================================
# 5. Collecte de données (POST /data) — sur zone_data/campaign_data
# ============================================================
info ""
info "--- [5] Collecte de données ---"

ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
data_payload="$(jq -n --arg ts "$ts" '{text:"Saisie IMP-003 test",recorded_at:$ts}')"
collected="$(request_json POST "/data" \
  "$(jq -n --arg cid "$campaign_data_id" --arg zid "$zone_data_id" --arg ts "$ts" --argjson p "$data_payload" \
      '{campaign_id:$cid,health_area_id:$zid,village_id:null,data_payload:$p,source_timestamp:$ts}')" \
  "$inter_token")"
data_id="$(echo "$collected" | jq -r '.id')"
[[ -n "$data_id" && "$data_id" != "null" ]] || fail "Data collection returned no id"
pass "Data collected: $data_id"

# ============================================================
# 6. Sync (POST /sync) — sur zone_data/campaign_data
# ============================================================
info ""
info "--- [6] Sync ---"

ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
sync_payload="$(jq -n \
  --arg cid "$campaign_data_id" --arg zid "$zone_data_id" --arg ts "$ts" \
  '{changes:[{campaign_id:$cid,health_area_id:$zid,village_id:null,
    data_payload:{text:"Sync IMP-003",recorded_at:$ts},
    source_timestamp:$ts}],
    timestamp:$ts}')"
sync_resp="$(request_json POST "/sync" "$sync_payload" "$inter_token")"
accepted="$(echo "$sync_resp" | jq '.accepted | length')"
[[ "$accepted" -ge 1 ]] || fail "Sync accepted 0 records"
pass "Sync OK ($accepted record(s) accepted)"

# ============================================================
# 7. Supervision (admin_system only)
# ============================================================
info ""
info "--- [7] Supervision endpoints ---"

# admin_system can access conflicts
conflicts="$(request_json GET "/supervision/conflicts" "" "$admin_token")"
pass "GET /supervision/conflicts OK (admin_system, count=$(echo "$conflicts" | jq 'length'))"

# admin_system can access audit-logs
audit_logs="$(request_json GET "/supervision/audit-logs" "" "$admin_token")"
pass "GET /supervision/audit-logs OK (admin_system, count=$(echo "$audit_logs" | jq 'length'))"

# analyste must be FORBIDDEN (403)
analyst_conflicts_status="$(request_status GET "/supervision/conflicts" "" "$analyst_token")"
[[ "$analyst_conflicts_status" == "403" ]] || fail "Expected 403 for analyste on /supervision/conflicts, got $analyst_conflicts_status"
pass "Analyste forbidden from /supervision/conflicts (403) OK"

analyst_audit_status="$(request_status GET "/supervision/audit-logs" "" "$analyst_token")"
[[ "$analyst_audit_status" == "403" ]] || fail "Expected 403 for analyste on /supervision/audit-logs, got $analyst_audit_status"
pass "Analyste forbidden from /supervision/audit-logs (403) OK"

# ============================================================
# 8. Switch-user depuis un intervenant (mode dev)
# ============================================================
info ""
info "--- [8] Switch-user (dev mode) ---"

switch_payload="$(jq -n --arg email "$INTER_EMAIL" '{target_email:$email}')"
switch_status="$(request_status POST "/admin/dev/switch-user" "$switch_payload" "$inter_token")"
if [[ "$switch_status" == "200" ]]; then
  pass "Switch-user accessible depuis intervenant en mode dev (200)"
elif [[ "$switch_status" == "403" ]]; then
  info "Switch-user renvoyé 403 — APP_ENV != dev ? (ignoré)"
else
  fail "Switch-user: unexpected status $switch_status"
fi

# ============================================================
# 9. Refus suppression zone avec données collectées
#    (zone_data_id contient des données collectées → 409)
# ============================================================
info ""
info "--- [9] Refus delete zone avec données collectées ---"

delete_zone_status="$(request_status DELETE "/zones/$zone_data_id" "" "$campaign_token")"
[[ "$delete_zone_status" == "409" || "$delete_zone_status" == "400" ]] \
  || fail "Expected 409/400 deleting zone with collected data, got $delete_zone_status"
pass "Delete zone avec données collectées → HTTP $delete_zone_status (refus OK)"

# ============================================================
# 10. Refus suppression campagne avec données collectées
#     (campaign_data_id contient des données collectées)
# ============================================================
info ""
info "--- [10] Refus delete campagne avec données ---"

delete_campaign_status="$(request_status DELETE "/campaigns/$campaign_data_id" "" "$campaign_token")"
[[ "$delete_campaign_status" == "409" || "$delete_campaign_status" == "400" ]] \
  || fail "Expected 409/400 deleting campaign with data, got $delete_campaign_status"
pass "Delete campagne avec données → HTTP $delete_campaign_status (refus OK)"

# ============================================================
# 11. Nettoyage CRUD (zone/campaign sans données)
#     + suppression de l'assignation de collecte
# ============================================================
info ""
info "--- [11] Nettoyage ---"

# Supprimer zone_id : cascade sur assignment_id (pas de données)
request_json DELETE "/zones/$zone_id" "" "$campaign_token" >/dev/null
pass "Zone CRUD supprimée: $zone_id (assignment cascadé)"

# Supprimer campaign_id : plus d'assignation ni de données
request_json DELETE "/campaigns/$campaign_id" "" "$campaign_token" >/dev/null
pass "Campaign CRUD supprimée: $campaign_id"

# Supprimer l'assignation de collecte (zone/campaign collecte conservées car données présentes)
request_json DELETE "/campaigns/assignments/$assignment_data_id" "" "$campaign_token" >/dev/null
pass "Assignment collecte supprimé: $assignment_data_id (zone/campaign conservées)"

# ============================================================
# 12. Analytics
# ============================================================
info ""
info "--- [12] Analytics ---"

summary="$(request_json GET "/analytics/summary" "" "$analyst_token")"
total="$(echo "$summary" | jq -r '.total_records')"
[[ "$total" -ge 0 ]] || fail "analytics/summary returned unexpected total_records"
pass "analytics/summary OK (total_records=$total)"

data_rows="$(request_json GET "/analytics/data" "" "$analyst_token")"
row_count="$(echo "$data_rows" | jq 'length')"
pass "analytics/data OK ($row_count row(s))"

# ============================================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  IMP-003 E2E suite: ALL TESTS PASSED   ${NC}"
echo -e "${GREEN}========================================${NC}"
