#!/usr/bin/env bash
#
# One-time provisioning for the EC2 host that serves www.hazlsolutions.com.
#
# THIS BOX IS SHARED with smswebpages.hazl.ca. Everything here is additive and
# scoped: a dedicated user, a dedicated release directory, a dedicated nginx
# server block. Nothing touches the neighbour's config, and the deploy workflow
# smoke-tests the neighbour after every release so a shared-nginx mistake cannot
# take it down unnoticed.
#
# Run as root on the VM:
#   sudo bash bootstrap-vm.sh
#
# Afterwards, write the two Doppler service tokens into /etc/hazl/doppler.env by
# hand. They are the ONLY secrets on the box; everything else is resolved from
# Doppler at service start.
set -euo pipefail

APP_USER=hazl
APP_ROOT=/srv/hazl-solutions
STORAGE_DIR=/var/lib/hazl-vibe
SECRETS_DIR=/etc/hazl
# 3000 and 3001 are already taken on the shared host by other Next.js apps.
APP_PORT=${APP_PORT:-3002}

echo "==> port check"
if ss -tln 2>/dev/null | grep -q ":$APP_PORT "; then
  echo "ERROR: port $APP_PORT is already in use on this host." >&2
  ss -tlnp 2>/dev/null | grep ":$APP_PORT " >&2
  echo "Pick a free port: APP_PORT=3003 sudo -E bash $0" >&2
  exit 1
fi
echo "    port $APP_PORT is free"

echo "==> user and directories"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"

mkdir -p "$APP_ROOT/releases" "$SECRETS_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_ROOT"

# Generated documents are the source of truth, not a cache: this directory is the
# thing that must survive a redeploy, so it lives outside the release tree.
mkdir -p "$STORAGE_DIR/designs"
chown -R "$APP_USER:$APP_USER" "$STORAGE_DIR"
chmod 750 "$STORAGE_DIR"

chmod 700 "$SECRETS_DIR"

echo "==> node 20 LTS"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs || yum install -y nodejs
fi
node -v

echo "==> doppler cli"
if ! command -v doppler >/dev/null 2>&1; then
  curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh
fi
doppler --version

echo "==> nginx"
command -v nginx >/dev/null 2>&1 || dnf install -y nginx || yum install -y nginx
systemctl enable --now nginx

echo "==> systemd unit"
# Installed from THIS repository, not from $APP_ROOT/current.
#
# Reading it from the deployed release was a bootstrap cycle: on a fresh host
# there is no `current`, so no unit was installed -- yet the very first deploy
# runs `systemctl restart hazl-solutions`, which fails with "unit not found".
# It also kept the unit inside rsynced content, which would make push access to
# main equivalent to root on a box holding the Doppler service tokens.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_SRC="$SCRIPT_DIR/../../deploy/hazl-solutions.service"

if [ ! -f "$UNIT_SRC" ]; then
  echo "ERROR: cannot find deploy/hazl-solutions.service relative to this script." >&2
  echo "Run bootstrap-vm.sh from a checkout of the repository, e.g.:" >&2
  echo "    git clone <repo> /tmp/hazl && sudo bash /tmp/hazl/scripts/deploy/bootstrap-vm.sh" >&2
  exit 1
fi

install -m 0644 "$UNIT_SRC" /etc/systemd/system/hazl-solutions.service
systemctl daemon-reload
systemctl enable hazl-solutions
echo "    installed /etc/systemd/system/hazl-solutions.service"

if [ ! -f "$SECRETS_DIR/doppler.env" ]; then
  cat > "$SECRETS_DIR/doppler.env" <<'ENVEOF'
# Read-only Doppler SERVICE tokens. Create them with:
#   doppler configs tokens create vm --project hazl-general --config prd --plain
#   doppler configs tokens create vm --project dr-keys    --config prd_llm_opus4-8 --plain
# These two lines are the only secrets stored on this machine.
DOPPLER_TOKEN_GENERAL=
DOPPLER_TOKEN_LLM=
# Port this app binds on loopback. Must not collide with the other Next.js apps
# already on this host (3000, 3001 at time of writing).
PORT=__APP_PORT__
ENVEOF
  sed -i "s/__APP_PORT__/$APP_PORT/" "$SECRETS_DIR/doppler.env"
  chmod 600 "$SECRETS_DIR/doppler.env"
  echo "    created $SECRETS_DIR/doppler.env -- FILL IN THE TWO TOKENS"
fi

cat <<'NEXT'

==> Remaining manual steps

  1. Put the two Doppler service tokens in /etc/hazl/doppler.env
  2. Set the studio's own secrets in Doppler (hazl-general / prd):
        VIBE_ENABLED=1
        VIBE_STORAGE_DIR=/var/lib/hazl-vibe
        VIBE_TRUST_PROXY=1
        NEXT_PUBLIC_SITE_URL=https://www.hazlsolutions.com
        VIBE_SESSION_SECRET, VIBE_ADMIN_SESSION_SECRET, VIBE_IP_SALT   (openssl rand -hex 32)
        VIBE_ADMIN_EMAILS, VIBE_ADMIN_PASSWORD_HASH                    (npm run vibe:hash)
        NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY           (docs/turnstile-setup.md)
  3. TLS:  certbot --nginx -d www.hazlsolutions.com -d hazlsolutions.com
  4. Copy deploy/nginx/hazl-solutions.conf into /etc/nginx/conf.d/ and reload.
     Check the neighbour is still up FIRST:
        curl -sS -o /dev/null -w '%{http_code}\n' https://smswebpages.hazl.ca
  5. Deploy from CI, then flip DNS to this host. Keep Vercel intact as a
     one-record rollback until the VM has served real traffic for a day.

  The service will not start until step 1 and step 2 are done -- it has no
  credentials before then. That is expected; the first CI deploy is what puts a
  release under $APP_ROOT/current for it to run.
NEXT
