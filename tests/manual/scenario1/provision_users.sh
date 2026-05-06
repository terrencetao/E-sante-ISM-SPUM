#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:8000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin-system@local.dev}"
ADMIN_PIN="${ADMIN_PIN:-1234}"

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

require_cmd curl
require_cmd jq

echo "[INFO] Login as system admin: $ADMIN_EMAIL"
LOGIN_PAYLOAD="$(jq -n --arg email "$ADMIN_EMAIL" --arg pin "$ADMIN_PIN" '{email: $email, pin: $pin}')"
LOGIN_RESPONSE="$(request_json POST "/auth/login" "$LOGIN_PAYLOAD")"
ACCESS_TOKEN="$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')"

if [[ -z "$ACCESS_TOKEN" || "$ACCESS_TOKEN" == "null" ]]; then
  echo "[ERROR] Could not get access_token from login response" >&2
  exit 1
fi

EMAILS=(
  "campagne-manager.scenario1@local.dev"
  "intervenant-1.scenario1@local.dev"
  "intervenant-2.scenario1@local.dev"
  "analyste.scenario1@local.dev"
)

ROLES=(
  "administrator_campaign"
  "intervenant_terrain"
  "intervenant_terrain"
  "analyste"
)

echo "[INFO] Provisioning scenario1 users"
printf "%-42s | %-24s | %-36s | %-10s\n" "email" "role" "user_id" "temp_pin"
printf "%.42s-+-%.24s-+-%.36s-+-%.10s\n" "------------------------------------------" "------------------------" "------------------------------------" "----------"

for i in "${!EMAILS[@]}"; do
  email="${EMAILS[$i]}"
  role="${ROLES[$i]}"

  USERS_RESPONSE="$(request_json GET "/users" "" "$ACCESS_TOKEN")"
  user_id="$(echo "$USERS_RESPONSE" | jq -r --arg email "$email" '.[] | select(.email == $email) | .id' | head -n 1)"

  if [[ -n "$user_id" ]]; then
    result="$(request_json POST "/users/$user_id/reset-pin" "" "$ACCESS_TOKEN")"
  else
    payload="$(jq -n --arg email "$email" --arg role "$role" '{email: $email, role_name: $role}')"
    result="$(request_json POST "/users" "$payload" "$ACCESS_TOKEN")"
    user_id="$(echo "$result" | jq -r '.user_id')"
  fi

  temp_pin="$(echo "$result" | jq -r '.temporary_pin')"
  printf "%-42s | %-24s | %-36s | %-10s\n" "$email" "$role" "$user_id" "$temp_pin"
done

echo

echo "[SUCCESS] Provisioning done for scenario1 users."
echo "[INFO] Keep the temp_pin values above for manual login during the test scenario."
