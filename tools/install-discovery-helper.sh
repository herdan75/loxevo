#!/bin/sh
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Bitte als root ausfuehren."
  exit 1
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HELPER_SRC="$SCRIPT_DIR/loxevo-discovery-helper.py"
HELPER_DST="/usr/local/sbin/loxevo-discovery-helper"
UNIT_PATH="/etc/systemd/system/loxevo-discovery-helper.service"
ENV_PATH="/etc/loxevo-discovery-helper.env"

if [ ! -f "$HELPER_SRC" ]; then
  echo "Helper nicht gefunden: $HELPER_SRC"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 wurde nicht gefunden. Bitte zuerst Python 3 auf dem LoxBerry installieren."
  exit 1
fi

install -m 0755 "$HELPER_SRC" "$HELPER_DST"

if [ ! -f "$ENV_PATH" ]; then
  cat > "$ENV_PATH" <<'EOF'
LOXEVO_DISCOVERY_BIND=127.0.0.1
LOXEVO_DISCOVERY_PORT=18091
# Optional: Token setzen und in LoxEvo als DISCOVERY_HELPER_TOKEN hinterlegen.
# LOXEVO_DISCOVERY_TOKEN=
EOF
  chmod 0600 "$ENV_PATH"
fi

cat > "$UNIT_PATH" <<EOF
[Unit]
Description=LoxEvo Alexa discovery helper
After=network.target

[Service]
Type=simple
EnvironmentFile=-$ENV_PATH
ExecStart=$HELPER_DST
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now loxevo-discovery-helper.service
systemctl status --no-pager loxevo-discovery-helper.service
