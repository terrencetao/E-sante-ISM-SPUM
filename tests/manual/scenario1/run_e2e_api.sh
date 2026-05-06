#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:8000/api}"

ADMIN_EMAIL="admin-system@local.dev"
ADMIN_PIN="1234"
CAMPAIGN_EMAIL="campagne-manager.scenario1@local.dev"
INTER1_EMAIL="intervenant-1.scenario1@local.dev"
INTER2_EMAIL="intervenant-2.scenario1@local.dev"
ANALYST_EMAIL="analyste.scenario1@local.dev"

ZONE_NORTH_NAME="Scenario1 Aire Nord"
ZONE_SOUTH_NAME="Scenario1 Aire Sud"
CAMPAIGN_NAME="Scenario1 Campaign"

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Missing command: $cmd"
    exit 1
  fi
}

request_json() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local token="${4:-}"

  local tmp_body
  tmp_body="$(mktemp)"

  local -a curl_args
  curl_args=(
    -sS
    -o "$tmp_body"
    -w "%{http_code}"
    -X "$method"
    -H "Accept: application/json"
    -H "Content-Type: application/json"
  )

  if [[ -n "$token" ]]; then
    curl_args+=( -H "Authorization: Bearer $token" )
  fi

  if [[ -n "$data" ]]; then
    curl_args+=( -d "$data" )
  fi

  local status
  status="$(curl "${curl_args[@]}" "$API_URL$path")"

  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    echo "[ERROR] API call failed: $method $path (HTTP $status)" >&2
    cat "$tmp_body" >&2
    rm -f "$tmp_body"
    exit 1
  fi

  cat "$tmp_body"
  rm -f "$tmp_body"
}

login_get_token() {
  local email="$1"
  local pin="$2"
  local payload
  payload="$(jq -n --arg email "$email" --arg pin "$pin" '{email: $email, pin: $pin}')"
  request_json POST "/auth/login" "$payload" | jq -r '.access_token'
}

ensure_user_and_reset_pin() {
  local admin_token="$1"
  local email="$2"
  local role="$3"

  local users user_id result payload
  users="$(request_json GET "/users" "" "$admin_token")"
  user_id="$(echo "$users" | jq -r --arg email "$email" '.[] | select(.email == $email) | .id' | head -n 1)"

  if [[ -z "$user_id" ]]; then
    payload="$(jq -n --arg email "$email" --arg role "$role" '{email: $email, role_name: $role}')"
    result="$(request_json POST "/users" "$payload" "$admin_token")"
    user_id="$(echo "$result" | jq -r '.user_id')"
    echo "$result" | jq -r '.temporary_pin'
    return
  fi

  result="$(request_json POST "/users/$user_id/reset-pin" "" "$admin_token")"
  echo "$result" | jq -r '.temporary_pin'
}

ensure_zone() {
  local campaign_token="$1"
  local zone_name="$2"

  local zones zone_id payload created
  zones="$(request_json GET "/zones" "" "$campaign_token")"
  zone_id="$(echo "$zones" | jq -r --arg name "$zone_name" '.[] | select(.name == $name) | .id' | head -n 1)"

  if [[ -n "$zone_id" ]]; then
    echo "$zone_id"
    return
  fi

  payload="$(jq -n --arg name "$zone_name" --arg description "Phase7 E2E" '{name: $name, description: $description}')"
  created="$(request_json POST "/zones" "$payload" "$campaign_token")"
  echo "$created" | jq -r '.id'
}

ensure_campaign() {
  local campaign_token="$1"
  local campaign_name="$2"

  local campaigns campaign_id payload created
  campaigns="$(request_json GET "/campaigns" "" "$campaign_token")"
  campaign_id="$(echo "$campaigns" | jq -r --arg name "$campaign_name" '.[] | select(.name == $name) | .id' | head -n 1)"

  if [[ -n "$campaign_id" ]]; then
    echo "$campaign_id"
    return
  fi

  payload="$(jq -n --arg name "$campaign_name" --arg description "Phase7 E2E" '{name: $name, description: $description}')"
  created="$(request_json POST "/campaigns" "$payload" "$campaign_token")"
  echo "$created" | jq -r '.id'
}

ensure_assignment() {
  local campaign_token="$1"
  local campaign_id="$2"
  local health_area_id="$3"
  local user_id="$4"

  local assignments exists payload
  assignments="$(request_json GET "/campaigns/$campaign_id/assignments" "" "$campaign_token")"
  exists="$(echo "$assignments" | jq -r --arg zid "$health_area_id" --arg uid "$user_id" '.[] | select(.health_area_id == $zid and .user_id == $uid) | .id' | head -n 1)"

  if [[ -n "$exists" ]]; then
    return
  fi

  payload="$(jq -n --arg zid "$health_area_id" --arg uid "$user_id" '{health_area_id: $zid, user_id: $uid}')"
  request_json POST "/campaigns/$campaign_id/assignments" "$payload" "$campaign_token" >/dev/null
}

sync_one_record() {
  local token="$1"
  local campaign_id="$2"
  local health_area_id="$3"
  local who="$4"

  local ts data payload response accepted_count
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  data="$(jq -n --arg who "$who" --arg ts "$ts" '{patient_code: $who, status: "ok", captured_at: $ts}')"
  payload="$(jq -n --arg cid "$campaign_id" --arg zid "$health_area_id" --arg ts "$ts" --argjson p "$data" '{changes:[{campaign_id:$cid, health_area_id:$zid, village_id:null, data_payload:$p, source_timestamp:$ts}], timestamp:$ts}')"

  response="$(request_json POST "/sync" "$payload" "$token")"
  accepted_count="$(echo "$response" | jq -r '.accepted | length')"
  if [[ "$accepted_count" -lt 1 ]]; then
    echo "[ERROR] Sync did not accept record for $who" >&2
    echo "$response" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq

echo "[INFO] Running phase7 E2E API validation"
health="$(curl -sS "$API_URL/health")"
echo "[INFO] Health check: $health"

admin_token="$(login_get_token "$ADMIN_EMAIL" "$ADMIN_PIN")"

campaign_pin="$(ensure_user_and_reset_pin "$admin_token" "$CAMPAIGN_EMAIL" "administrator_campaign")"
inter1_pin="$(ensure_user_and_reset_pin "$admin_token" "$INTER1_EMAIL" "intervenant_terrain")"
inter2_pin="$(ensure_user_and_reset_pin "$admin_token" "$INTER2_EMAIL" "intervenant_terrain")"
analyst_pin="$(ensure_user_and_reset_pin "$admin_token" "$ANALYST_EMAIL" "analyste")"

users_json="$(request_json GET "/users" "" "$admin_token")"
campaign_user_id="$(echo "$users_json" | jq -r --arg e "$CAMPAIGN_EMAIL" '.[] | select(.email == $e) | .id' | head -n 1)"
inter1_user_id="$(echo "$users_json" | jq -r --arg e "$INTER1_EMAIL" '.[] | select(.email == $e) | .id' | head -n 1)"
inter2_user_id="$(echo "$users_json" | jq -r --arg e "$INTER2_EMAIL" '.[] | select(.email == $e) | .id' | head -n 1)"

campaign_token="$(login_get_token "$CAMPAIGN_EMAIL" "$campaign_pin")"
zone_north_id="$(ensure_zone "$campaign_token" "$ZONE_NORTH_NAME")"
zone_south_id="$(ensure_zone "$campaign_token" "$ZONE_SOUTH_NAME")"
campaign_id="$(ensure_campaign "$campaign_token" "$CAMPAIGN_NAME")"

ensure_assignment "$campaign_token" "$campaign_id" "$zone_north_id" "$inter1_user_id"
ensure_assignment "$campaign_token" "$campaign_id" "$zone_south_id" "$inter2_user_id"

inter1_token="$(login_get_token "$INTER1_EMAIL" "$inter1_pin")"
inter2_token="$(login_get_token "$INTER2_EMAIL" "$inter2_pin")"

my_assignment_1="$(request_json GET "/me/assignment" "" "$inter1_token")"
my_assignment_2="$(request_json GET "/me/assignment" "" "$inter2_token")"

assigned_campaign_1="$(echo "$my_assignment_1" | jq -r '.assignment.campaign_id')"
assigned_zone_1="$(echo "$my_assignment_1" | jq -r '.assignment.health_area_id')"
assigned_campaign_2="$(echo "$my_assignment_2" | jq -r '.assignment.campaign_id')"
assigned_zone_2="$(echo "$my_assignment_2" | jq -r '.assignment.health_area_id')"

if [[ "$assigned_campaign_1" != "$campaign_id" || "$assigned_campaign_2" != "$campaign_id" ]]; then
  echo "[ERROR] Assignment campaign mismatch" >&2
  exit 1
fi

sync_one_record "$inter1_token" "$campaign_id" "$assigned_zone_1" "intervenant-1"
sync_one_record "$inter2_token" "$campaign_id" "$assigned_zone_2" "intervenant-2"

analyst_token="$(login_get_token "$ANALYST_EMAIL" "$analyst_pin")"
summary="$(request_json GET "/analytics/summary" "" "$analyst_token")"
total_records="$(echo "$summary" | jq -r '.total_records')"

if [[ "$total_records" -lt 2 ]]; then
  echo "[ERROR] Expected at least 2 records, got $total_records" >&2
  echo "$summary" >&2
  exit 1
fi

echo "[SUCCESS] Phase7 E2E API validation passed"
echo "[INFO] Summary total_records=$total_records"
echo "[INFO] Scenario users temporary pins used for this run:"
echo "  - $CAMPAIGN_EMAIL : $campaign_pin"
echo "  - $INTER1_EMAIL : $inter1_pin"
echo "  - $INTER2_EMAIL : $inter2_pin"
echo "  - $ANALYST_EMAIL : $analyst_pin"
