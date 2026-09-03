#!/usr/bin/env bash
#
# Repair the box after the first deploy. Run FROM YOUR MAC:
#
#   bash scripts/deploy/repair-service.sh
#
# The first deploy shipped a release successfully but left two problems:
#
#   1. The service crash-looped on
#          Doppler Error: mkdir /home/hazl/.doppler: permission denied
#      because ProtectHome=true hides /home from the unit's namespace. Fixed in
#      deploy/hazl-solutions.service with RuntimeDirectory + HOME. The deploy
#      workflow deliberately does NOT install the unit -- that would make push
#      access to main equivalent to root on a box holding the Doppler tokens --
#      so it has to be installed from here.
#
#   2. `current` was left as a symlink to ITSELF, because the rollback handler
#      trusted `readlink -f`, which prints a path even when the file does not
#      exist. Fixed in the workflow; this repoints `current` at the release that
#      is already on disk so the fix can be verified without a redeploy.
#
# Run this BEFORE pushing the workflow change, so the next deploy starts from a
# healthy box.
set -euo pipefail

PROJECT=hazl-general
CONFIG=prd
APP_ROOT=/srv/hazl-solutions
APP_PORT="${APP_PORT:-3002}"
NEIGHBOURS=(https://smswebpages.hazl.ca https://fruttagala.ca
            https://nexgen-flha.hazl.ca https://nexgen-flha-pembina.hazl.ca)

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT; chmod 700 "$TMP"
say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

say "connection details from Doppler"
doppler secrets get EC2_SSH_PRIVATE_KEY -p "$PROJECT" -c "$CONFIG" --plain > "$TMP/key"
[ -n "$(tail -c1 "$TMP/key")" ] && printf '\n' >> "$TMP/key"
chmod 600 "$TMP/key"
doppler secrets get EC2_HOST_KEY -p "$PROJECT" -c "$CONFIG" --plain > "$TMP/known_hosts"
HOST="$(doppler secrets get EC2_HOST  -p "$PROJECT" -c "$CONFIG" --plain)"
USER_="$(doppler secrets get EC2_USER -p "$PROJECT" -c "$CONFIG" --plain)"
SSH=(ssh -i "$TMP/key" -o UserKnownHostsFile="$TMP/known_hosts"
     -o StrictHostKeyChecking=yes -o IdentitiesOnly=yes -o BatchMode=yes)
echo "    box: $USER_@$HOST"

say "neighbour health BEFORE"
for u in "${NEIGHBOURS[@]}"; do
  printf '    %-42s %s\n' "$u" "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$u" || echo 000)"
done

say "stopping the crash loop while we work"
"${SSH[@]}" "$USER_@$HOST" 'sudo systemctl stop hazl-solutions || true'
echo "    stopped"

say "installing the corrected systemd unit"
scp -i "$TMP/key" -o UserKnownHostsFile="$TMP/known_hosts" -o StrictHostKeyChecking=yes \
    -o IdentitiesOnly=yes -q deploy/hazl-solutions.service "$USER_@$HOST:/tmp/hazl-solutions.service"
"${SSH[@]}" "$USER_@$HOST" '
  sudo install -m 0644 /tmp/hazl-solutions.service /etc/systemd/system/hazl-solutions.service
  rm -f /tmp/hazl-solutions.service
  sudo systemctl daemon-reload
  echo "    installed; HOME is now: $(systemctl show hazl-solutions -p Environment --value)"
  echo "    RuntimeDirectory      : $(systemctl show hazl-solutions -p RuntimeDirectory --value)"
'

say "repointing current at the newest release on disk"
"${SSH[@]}" "$USER_@$HOST" "APP_ROOT='$APP_ROOT' bash -s" <<'REMOTE'
set -euo pipefail
: "${APP_ROOT:?}"
cd "$APP_ROOT/releases"
NEWEST="$(ls -1t | head -1)"
[ -n "$NEWEST" ] || { echo "    no release on disk -- redeploy instead" >&2; exit 1; }
TARGET="$APP_ROOT/releases/$NEWEST"
test -d "$TARGET"
echo "    newest release: $NEWEST"
echo "    current was   : $(readlink "$APP_ROOT/current" 2>/dev/null || echo '<none>')"
sudo -u hazl ln -sfn "$TARGET" "$APP_ROOT/current.new"
sudo -u hazl mv -Tf "$APP_ROOT/current.new" "$APP_ROOT/current"
echo "    current now   : $(readlink "$APP_ROOT/current")"
test -f "$APP_ROOT/current/package.json" || { echo "    ERROR: current has no package.json" >&2; exit 1; }
REMOTE

say "starting the service"
"${SSH[@]}" "$USER_@$HOST" 'sudo systemctl start hazl-solutions'

say "verifying (this is what the deploy smoke test checks)"
"${SSH[@]}" "$USER_@$HOST" "APP_PORT='$APP_PORT' bash -s" <<'REMOTE'
set -uo pipefail
for i in $(seq 1 24); do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "http://127.0.0.1:$APP_PORT/startup" || echo 000)
  if [ "$code" = "200" ]; then
    echo "    app up on 127.0.0.1:$APP_PORT ($code)"
    echo "    restarts since start: $(systemctl show hazl-solutions -p NRestarts --value)"
    exit 0
  fi
  echo "      attempt $i: $code"
  sleep 5
done
echo "    STILL FAILING -- last 30 journal lines:" >&2
journalctl -u hazl-solutions -n 30 --no-pager >&2
exit 1
REMOTE

say "neighbour health AFTER"
for u in "${NEIGHBOURS[@]}"; do
  printf '    %-42s %s\n' "$u" "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$u" || echo 000)"
done

cat <<'DONE'

Box is healthy. Now push the workflow fix so future deploys inherit it:

  git add .github/workflows/deploy.yml deploy/hazl-solutions.service scripts/deploy/
  git commit -m "fix(deploy): HOME outside ProtectHome for doppler; stop bogus self-symlink rollback"
  git push

That push deploys again, and this time the smoke test should pass.
DONE
