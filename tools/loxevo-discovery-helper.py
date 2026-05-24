#!/usr/bin/env python3
"""Small localhost helper for LoxEvo Alexa discovery mode.

The helper intentionally exposes only three actions:
  GET  /status
  POST /start   stop LoxBerry SSDP publishers temporarily
  POST /stop    start previously active SSDP publishers again

It is meant to run on the LoxBerry host as root via systemd and bind only to
127.0.0.1. LoxEvo can then call it from the Docker container because the
compose setup uses network_mode: host.
"""

from __future__ import annotations

import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


SERVICES = ("ssdpd", "lbssdpd")
STATE_FILE = Path(os.environ.get("LOXEVO_DISCOVERY_STATE", "/run/loxevo-discovery-helper.json"))
BIND = os.environ.get("LOXEVO_DISCOVERY_BIND", "127.0.0.1")
PORT = int(os.environ.get("LOXEVO_DISCOVERY_PORT", "18091"))
TOKEN = os.environ.get("LOXEVO_DISCOVERY_TOKEN", "").strip()


def run_command(*args: str) -> subprocess.CompletedProcess[str]:
  try:
    return subprocess.run(args, text=True, capture_output=True, check=False)
  except FileNotFoundError as error:
    return subprocess.CompletedProcess(args, 127, "", str(error))


def systemctl(*args: str) -> subprocess.CompletedProcess[str]:
  return run_command("systemctl", *args)


def service_exists(name: str) -> bool:
  result = systemctl("status", name)
  return result.returncode in (0, 3)


def service_active(name: str) -> bool:
  return systemctl("is-active", "--quiet", name).returncode == 0


def service_enabled(name: str) -> bool:
  return systemctl("is-enabled", "--quiet", name).returncode == 0


def service_status() -> list[dict[str, object]]:
  return [
    {
      "name": name,
      "exists": service_exists(name),
      "active": service_active(name),
      "enabled": service_enabled(name),
    }
    for name in SERVICES
  ]


def port_owner() -> str:
  result = run_command("ss", "-ulpn", "sport", "=", ":1900")
  return result.stdout.strip() or result.stderr.strip()


def read_state() -> dict[str, object]:
  try:
    return json.loads(STATE_FILE.read_text(encoding="utf-8"))
  except (FileNotFoundError, json.JSONDecodeError):
    return {}


def write_state(payload: dict[str, object]) -> None:
  STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
  STATE_FILE.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def clear_state() -> None:
  try:
    STATE_FILE.unlink()
  except FileNotFoundError:
    pass


def status_payload() -> dict[str, object]:
  return {
    "ready": True,
    "services": service_status(),
    "portOwner": port_owner(),
    "state": read_state(),
  }


def start_discovery() -> dict[str, object]:
  active_services = [service["name"] for service in service_status() if service["exists"] and service["active"]]
  write_state({"previouslyActive": active_services})

  stopped: list[str] = []
  errors: list[str] = []
  for name in active_services:
    result = systemctl("stop", str(name))
    if result.returncode == 0:
      stopped.append(str(name))
    else:
      errors.append(f"{name}: {result.stderr.strip() or result.stdout.strip() or result.returncode}")

  payload = status_payload()
  payload.update({"stopped": stopped, "errors": errors})
  return payload


def stop_discovery() -> dict[str, object]:
  state = read_state()
  previously_active = state.get("previouslyActive")
  if not isinstance(previously_active, list):
    previously_active = [
      service["name"]
      for service in service_status()
      if service["exists"] and service["enabled"]
    ]

  started: list[str] = []
  errors: list[str] = []
  for name in previously_active:
    if str(name) not in SERVICES:
      continue
    result = systemctl("start", str(name))
    if result.returncode == 0:
      started.append(str(name))
    else:
      errors.append(f"{name}: {result.stderr.strip() or result.stdout.strip() or result.returncode}")

  clear_state()
  payload = status_payload()
  payload.update({"started": started, "errors": errors})
  return payload


class Handler(BaseHTTPRequestHandler):
  server_version = "LoxEvoDiscoveryHelper/1.0"

  def log_message(self, format: str, *args: object) -> None:
    print(f"{self.address_string()} - {format % args}")

  def do_GET(self) -> None:
    if not self.authorized():
      return self.send_json({"error": "unauthorized"}, 401)
    if self.path == "/status":
      return self.send_json(status_payload())
    return self.send_json({"error": "not found"}, 404)

  def do_POST(self) -> None:
    if not self.authorized():
      return self.send_json({"error": "unauthorized"}, 401)
    if self.path == "/start":
      return self.send_json(start_discovery())
    if self.path == "/stop":
      return self.send_json(stop_discovery())
    return self.send_json({"error": "not found"}, 404)

  def authorized(self) -> bool:
    if not TOKEN:
      return True
    return self.headers.get("authorization") == f"Bearer {TOKEN}"

  def send_json(self, payload: dict[str, object], status: int = 200) -> None:
    body = json.dumps(payload).encode("utf-8")
    self.send_response(status)
    self.send_header("content-type", "application/json; charset=utf-8")
    self.send_header("cache-control", "no-store")
    self.send_header("content-length", str(len(body)))
    self.end_headers()
    self.wfile.write(body)


def main() -> None:
  server = ThreadingHTTPServer((BIND, PORT), Handler)
  print(f"LoxEvo discovery helper listening on {BIND}:{PORT}")
  server.serve_forever()


if __name__ == "__main__":
  main()
