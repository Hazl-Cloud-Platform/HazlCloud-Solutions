#!/usr/bin/env bash
#
# One-shot provisioning for the EC2 host, run FROM YOUR MAC.
#
#   bash scripts/deploy/provision-and-token.sh
#
# It does three things:
#   1. copies bootstrap-vm.sh + the systemd unit to the box and runs it
#   2. creates the two read-only Doppler service tokens
#   3. writes them into /etc/hazl/doppler.env
#
# The token values are piped straight from Doppler into the file over SSH and
# are never printed, never written to a local file, and never land in shell
# history.
set -euo pipefail

PROJECT=hazl-general
CONFIG=prd
LLM_PROJECT=dr-keys
LLM_CONFIG=prd_llm_opus4-8
APP_PORT="${APP_PORT:-3002}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
chmod 700 "$TMP"

echo "==> pulling connection details from Doppler"
doppler secrets get EC2_SSH_PRIVATE_KEY -p "$PROJECT" -c "$CONFIG" --plain > "$TMP/key"
[ -n "$(tail -c1 "$TMP/key")" ] && printf '\n' >> "$TMP/key"
chmod 600 "$TMP/key"
doppler secrets get EC2_HOST_KEY -p "$PROJECT" -c "$CONFIG" --plain > "$TMP/known_hosts"
HOST="$(doppler secrets get EC2_HOST -p "$PROJECT" -c "$CONFIG" --plain)"
USER_="$(doppler secrets get EC2_USER -p "$PROJECT" -c "$CONFIG" --plain)"
SSHOPTS=(-i "$TMP/key" -o UserKnownHostsFile="$TMP/known_hosts"
         -o StrictHostKeyChecking=yes -o IdentitiesOnly=yes -o BatchMode=yes)
echo "    target: $USER_@$HOST"

echo "==> neighbour health BEFORE"
for u in https://smswebpages.hazl.ca https://fruttagala.ca \
         https://nexgen-flha.hazl.ca https://nexgen-flha-pembina.hazl.ca; do
  printf '    %-42s %s\n' "$u" "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$u" || echo 000)"
done

echo "==> staging bootstrap files"
# bootstrap-vm.sh resolves the unit as ../../deploy/hazl-solutions.service, so
# the repo-relative layout has to be preserved on the box.
ssh "${SSHOPTS[@]}" "$USER_@$HOST" \
  'rm -rf /tmp/hazl-bootstrap && mkdir -p /tmp/hazl-bootstrap/scripts/deploy /tmp/hazl-bootstrap/deploy'
scp "${SSHOPTS[@]}" -q scripts/deploy/bootstrap-vm.sh "$USER_@$HOST:/tmp/hazl-bootstrap/scripts/deploy/"
scp "${SSHOPTS[@]}" -q deploy/hazl-solutions.service  "$USER_@$HOST:/tmp/hazl-bootstrap/deploy/"

echo "==> running bootstrap-vm.sh (additive: user, dirs, systemd unit; no nginx changes)"
ssh "${SSHOPTS[@]}" "$USER_@$HOST" 'sudo bash /tmp/hazl-bootstrap/scripts/deploy/bootstrap-vm.sh'

echo "==> creating read-only Doppler service tokens"
GEN_TOKEN_NAME="ec2-vm-general-$(date -u +%Y%m%d)"
LLM_TOKEN_NAME="ec2-vm-llm-$(date -u +%Y%m%d)"

# Written with a quoted heredoc so the remote shell does no expansion, and the
# token is substituted by THIS shell only inside the pipe -- never echoed.
write_env() {
  doppler configs tokens create "$GEN_TOKEN_NAME" \
      --project "$PROJECT" --config "$CONFIG" --access read --plain > "$TMP/t_gen"
  doppler configs tokens create "$LLM_TOKEN_NAME" \
      --project "$LLM_PROJECT" --config "$LLM_CONFIG" --access read --plain > "$TMP/t_llm"
  {
    echo "# Read-only Doppler SERVICE tokens. Created by provision-and-token.sh."
    echo "# These two lines are the only secrets stored on this machine."
    echo "DOPPLER_TOKEN_GENERAL=$(cat "$TMP/t_gen")"
    echo "DOPPLER_TOKEN_LLM=$(cat "$TMP/t_llm")"
    echo "PORT=$APP_PORT"
  } | ssh "${SSHOPTS[@]}" "$USER_@$HOST" \
        'sudo install -m 600 -o root -g root /dev/stdin /etc/hazl/doppler.env'
}
write_env
echo "    wrote /etc/hazl/doppler.env (mode 600, root:root)"

echo "==> verifying (no secret values printed)"
ssh "${SSHOPTS[@]}" "$USER_@$HOST" '
  echo -n "    hazl user            : "; id -u hazl >/dev/null 2>&1 && echo OK || echo MISSING
  echo -n "    /srv/hazl-solutions  : "; [ -d /srv/hazl-solutions ] && echo OK || echo MISSING
  echo -n "    /var/lib/hazl-vibe   : "; [ -d /var/lib/hazl-vibe ] && echo OK || echo MISSING
  echo -n "    systemd unit         : "; systemctl cat hazl-solutions >/dev/null 2>&1 && echo OK || echo MISSING
  echo -n "    doppler.env keys     : "; sudo grep -c "^DOPPLER_TOKEN_\|^PORT=" /etc/hazl/doppler.env
  echo -n "    tokens resolve       : "
  sudo bash -c ". /etc/hazl/doppler.env; doppler secrets --token \"\$DOPPLER_TOKEN_GENERAL\" --only-names >/dev/null 2>&1 && echo OK || echo FAILED"
'

echo "==> neighbour health AFTER"
for u in https://smswebpages.hazl.ca https://fruttagala.ca \
         https://nexgen-flha.hazl.ca https://nexgen-flha-pembina.hazl.ca; do
  printf '    %-42s %s\n' "$u" "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$u" || echo 000)"
done

echo
echo "Done. The service will not start until a release exists at"
echo "/srv/hazl-solutions/current -- that is the first CI deploy's job."
