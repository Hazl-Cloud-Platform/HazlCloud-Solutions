#!/usr/bin/env bash
#
# Cut www.hazlsolutions.com over from Vercel to the EC2 box. Run FROM YOUR MAC:
#
#   bash scripts/deploy/cutover-to-ec2.sh
#
# PRECONDITION: the app must already be deployed and answering on the box.
# The script refuses to touch DNS otherwise, because flipping DNS at a box that
# serves nothing is a self-inflicted outage.
#
# Order matters and is deliberate:
#   1. rate-limit zone      -- the vhost references it; without it `nginx -t`
#                              fails and a reload takes the FOUR NEIGHBOUR SITES
#                              on this shared box down with it
#   2. HTTP-only vhost      -- no TLS paths yet, so nginx -t can pass before a
#                              certificate exists
#   3. DNS flip             -- Cloudflare, grey cloud (DNS-only), matching what
#                              deploy/nginx/hazl-solutions.conf assumes
#   4. certbot HTTP-01      -- needs DNS pointing here first. Uses the nginx
#                              authenticator, same as the four existing certs.
#                              No pip plugin, so the RPM certbot and its renewal
#                              timer are left untouched.
#   5. full vhost           -- the real config, which references the cert paths
#                              that now exist, plus the SSE/proxy tuning
#
# Every reload is gated on `nginx -t`, and the neighbours are probed before and
# after. Original DNS records are saved so the flip can be undone.
set -euo pipefail

PROJECT=hazl-general
CONFIG=prd
ZONE_NAME=hazlsolutions.com
APP_PORT="${APP_PORT:-3002}"
NEIGHBOURS=(https://smswebpages.hazl.ca https://fruttagala.ca
            https://nexgen-flha.hazl.ca https://nexgen-flha-pembina.hazl.ca)

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT; chmod 700 "$TMP"
BACKUP_DIR="$PWD/.dns-backup"; mkdir -p "$BACKUP_DIR"

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

say "connection details from Doppler"
doppler secrets get EC2_SSH_PRIVATE_KEY -p "$PROJECT" -c "$CONFIG" --plain > "$TMP/key"
[ -n "$(tail -c1 "$TMP/key")" ] && printf '\n' >> "$TMP/key"
chmod 600 "$TMP/key"
doppler secrets get EC2_HOST_KEY -p "$PROJECT" -c "$CONFIG" --plain > "$TMP/known_hosts"
HOST="$(doppler secrets get EC2_HOST  -p "$PROJECT" -c "$CONFIG" --plain)"
USER_="$(doppler secrets get EC2_USER -p "$PROJECT" -c "$CONFIG" --plain)"
EMAIL="$(doppler secrets get ADMIN_EMAIL -p "$PROJECT" -c "$CONFIG" --plain)"
SSH=(ssh -i "$TMP/key" -o UserKnownHostsFile="$TMP/known_hosts"
     -o StrictHostKeyChecking=yes -o IdentitiesOnly=yes -o BatchMode=yes)
echo "    box: $USER_@$HOST   contact: $EMAIL"

say "PRECONDITION: is the app actually serving on the box?"
code="$("${SSH[@]}" "$USER_@$HOST" \
  "curl -sS -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:$APP_PORT/startup || echo 000")"
echo "    127.0.0.1:$APP_PORT/startup -> $code"
if [ "$code" != "200" ]; then
  echo "    ABORT: the app is not serving. Merge the PR so the deploy workflow" >&2
  echo "    ships a release, then re-run this script." >&2
  exit 1
fi

say "neighbour health BEFORE"
BEFORE=()
for u in "${NEIGHBOURS[@]}"; do
  c="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$u" || echo 000)"
  BEFORE+=("$c")
  printf '    %-42s %s\n' "$u" "$c"
done

if [ "${SKIP_DNS:-0}" = 1 ] || [ "${STOP_AFTER_NGINX:-0}" = 1 ]; then
  MANUAL_DNS=1
  CF_TOKEN=""
  CF_API=https://api.cloudflare.com/client/v4
  cf() { :; }
else

say "Cloudflare credentials (never echoed, never stored)"
echo "    The zone lives in a Cloudflare account that Anthony.tam@hazl.ca cannot"
echo "    see (its /api/v4/zones returns zero zones), so the token has to come"
echo "    from whoever owns the zone. Leave this blank to flip DNS by hand instead."
printf '    Cloudflare API token with Zone:DNS:Edit on %s (or blank): ' "$ZONE_NAME"
read -rs CF_TOKEN; echo

MANUAL_DNS=0
CF_API=https://api.cloudflare.com/client/v4
cf() { curl -sS -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" "$@"; }

if [ -z "$CF_TOKEN" ]; then
  MANUAL_DNS=1
  echo "    no token given -- step 3 will pause for a manual DNS change"
else
  ZONE_ID="$(cf "$CF_API/zones?name=$ZONE_NAME" | python3 -c 'import json,sys; r=json.load(sys.stdin); print(r["result"][0]["id"] if r.get("result") else "")')"
  if [ -z "$ZONE_ID" ]; then
    echo "    ABORT: that token cannot see zone $ZONE_NAME." >&2
    echo "    It must be issued from the Cloudflare account that holds the zone." >&2
    exit 1
  fi
  echo "    zone id: ${ZONE_ID:0:8}..."
fi
fi

say "step 1/5: rate-limit zone (vhost depends on it; must exist before nginx -t)"
printf '%s\n' \
  '# Required by /etc/nginx/conf.d/hazl-solutions.conf (location /api/vibe/).' \
  '# conf.d is included inside http{}, which is the context limit_req_zone needs.' \
  'limit_req_zone $binary_remote_addr zone=vibe_api:10m rate=20r/m;' \
  | "${SSH[@]}" "$USER_@$HOST" 'sudo install -m 644 /dev/stdin /etc/nginx/conf.d/00-vibe-limits.conf'
echo "    installed 00-vibe-limits.conf"

say "step 2/5: HTTP-only vhost, so nginx -t passes before any certificate exists"
printf '%s\n' \
  'server {' \
  '    listen 80;' \
  "    server_name www.$ZONE_NAME $ZONE_NAME;" \
  '    location / {' \
  "        proxy_pass http://127.0.0.1:$APP_PORT;" \
  '        proxy_http_version 1.1;' \
  "        proxy_set_header Host              \$host;" \
  "        proxy_set_header X-Real-IP         \$remote_addr;" \
  "        proxy_set_header X-Forwarded-For   \$remote_addr;" \
  "        proxy_set_header X-Forwarded-Proto \$scheme;" \
  '        proxy_set_header CF-Connecting-IP  "";' \
  '    }' \
  '}' \
  | "${SSH[@]}" "$USER_@$HOST" 'sudo install -m 644 /dev/stdin /etc/nginx/conf.d/hazl-solutions.conf'
"${SSH[@]}" "$USER_@$HOST" 'sudo nginx -t' || { echo "    ABORT: nginx -t failed, NOT reloading" >&2; exit 1; }
"${SSH[@]}" "$USER_@$HOST" 'sudo systemctl reload nginx'
echo "    reloaded. verifying over HTTP without touching DNS:"
printf '    www via --resolve -> %s\n' \
  "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 --resolve "www.$ZONE_NAME:80:$HOST" "http://www.$ZONE_NAME/startup" || echo 000)"

if [ "${STOP_AFTER_NGINX:-0}" = 1 ]; then
  say "STOP_AFTER_NGINX=1 -- nginx is prepared, stopping before the DNS change"
  echo "    The box now answers for www.$ZONE_NAME over HTTP. Change DNS, then"
  echo "    re-run with SKIP_DNS=1 to issue the certificate and install the"
  echo "    full vhost."
  exit 0
fi

say "step 3/5: pointing DNS at $HOST (grey cloud / DNS-only)"

if [ "${SKIP_DNS:-0}" = 1 ]; then
  echo "    SKIP_DNS=1 -- DNS was changed out of band; only verifying convergence"
elif [ "$MANUAL_DNS" = 1 ]; then
  cat <<MANUAL
    Make these two changes in the Cloudflare account that owns $ZONE_NAME:

      www.$ZONE_NAME   A   $HOST   TTL 60   Proxy: DNS only (grey cloud)
      $ZONE_NAME       A   $HOST   TTL 60   Proxy: DNS only (grey cloud)

    www is a CNAME to Vercel today, so its type changes from CNAME to A.
    Write down what the two records were first -- that is the rollback.

    Grey cloud matters: deploy/nginx/hazl-solutions.conf reads \$remote_addr
    directly for per-IP limits. Behind the orange cloud every visitor would
    collapse into a handful of Cloudflare edge IPs and the per-IP caps would
    become global caps.

MANUAL
  printf '    Press Enter once both records are saved (Ctrl-C to abort): '
  read -r _
else
  cf "$CF_API/zones/$ZONE_ID/dns_records?per_page=100" > "$BACKUP_DIR/records-before.json"
  echo "    original records saved to .dns-backup/records-before.json"

flip() {
  local name="$1" id
  # www is a CNAME to Vercel today; a PUT changes its type to A in place.
  id="$(cf "$CF_API/zones/$ZONE_ID/dns_records?name=$name" | python3 -c 'import json,sys; r=json.load(sys.stdin)["result"]; print(r[0]["id"] if r else "")')"
  local body="{\"type\":\"A\",\"name\":\"$name\",\"content\":\"$HOST\",\"ttl\":60,\"proxied\":false}"
  if [ -n "$id" ]; then
    cf -X PUT "$CF_API/zones/$ZONE_ID/dns_records/$id" --data "$body" > "$TMP/out.json"
  else
    cf -X POST "$CF_API/zones/$ZONE_ID/dns_records" --data "$body" > "$TMP/out.json"
  fi
  python3 -c 'import json,sys; r=json.load(open(sys.argv[1])); print("    "+sys.argv[2]+" -> "+("OK" if r.get("success") else "FAILED "+json.dumps(r.get("errors"))))' "$TMP/out.json" "$name"
}
  flip "www.$ZONE_NAME"
  flip "$ZONE_NAME"
fi

echo "    waiting for DNS to point here (TTL 60s)..."
for i in $(seq 1 40); do
  got="$(dig +short "www.$ZONE_NAME" A @1.1.1.1 | tail -1)"
  [ "$got" = "$HOST" ] && { echo "    resolves to $got"; break; }
  sleep 5
  if [ "$i" = 40 ]; then
    echo "    ABORT: www.$ZONE_NAME still does not resolve to $HOST." >&2
    [ "$MANUAL_DNS" = 1 ] \
      && echo "    Nothing here changed DNS, so there is nothing to undo." >&2 \
      || echo "    Previous records are in .dns-backup/records-before.json." >&2
    exit 1
  fi
done

say "step 4/5: certificate via HTTP-01 (nginx authenticator, RPM certbot untouched)"
"${SSH[@]}" "$USER_@$HOST" "sudo certbot certonly --nginx --non-interactive --agree-tos \
  -m '$EMAIL' -d 'www.$ZONE_NAME' -d '$ZONE_NAME'" 2>&1 | tail -12
"${SSH[@]}" "$USER_@$HOST" "sudo test -f /etc/letsencrypt/live/www.$ZONE_NAME/fullchain.pem" \
  || { echo "    ABORT: certificate was not issued" >&2; exit 1; }
echo "    certificate present"

say "step 5/5: installing the real vhost (TLS + SSE/proxy tuning)"
scp -i "$TMP/key" -o UserKnownHostsFile="$TMP/known_hosts" -o StrictHostKeyChecking=yes \
    -o IdentitiesOnly=yes -q deploy/nginx/hazl-solutions.conf "$USER_@$HOST:/tmp/hazl-solutions.conf"
"${SSH[@]}" "$USER_@$HOST" 'sudo install -m 644 /tmp/hazl-solutions.conf /etc/nginx/conf.d/hazl-solutions.conf'
"${SSH[@]}" "$USER_@$HOST" 'sudo nginx -t' || {
  echo "    nginx -t FAILED with the full vhost. Reverting to the HTTP-only one." >&2
  "${SSH[@]}" "$USER_@$HOST" 'sudo rm -f /etc/nginx/conf.d/hazl-solutions.conf && sudo systemctl reload nginx'
  exit 1
}
"${SSH[@]}" "$USER_@$HOST" 'sudo systemctl reload nginx'
echo "    reloaded with the full vhost"

say "verification"
for p in / /startup /insights /startup/studio; do
  printf '    https://www.%s%-16s -> %s\n' "$ZONE_NAME" "$p" \
    "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "https://www.$ZONE_NAME$p" || echo 000)"
done
printf '    apex redirect -> %s\n' \
  "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "https://$ZONE_NAME/" || echo 000)"

say "neighbour health AFTER"
# Compare against what each site returned BEFORE, not against 200. Several of
# these legitimately answer 3xx (smswebpages redirects to /login), so a bare
# "= 200" test reports a healthy neighbour as broken.
broke=""
i=0
for u in "${NEIGHBOURS[@]}"; do
  now="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$u" || echo 000)"
  was="${BEFORE[$i]:-?}"
  printf '    %-42s %s (before: %s)\n' "$u" "$now" "$was"
  [ "$now" = "$was" ] || broke="$broke $u($was->$now)"
  i=$((i+1))
done
[ -n "$broke" ] && echo "    WARNING: check these:$broke" >&2

cat <<'DONE'

Cutover complete. Vercel is still deployed but no longer receives traffic --
that is your rollback, and restoring it is a DNS change, nothing more. If the
API path ran, the previous records are in .dns-backup/records-before.json; if
DNS was changed by hand, use the values you noted before editing.

Leave it that way until the VM has served real traffic for a day. Only then
delete the Vercel project.
DONE
