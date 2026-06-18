#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RUNTIME_PORT="${DRAMA_RUNTIME_PORT:-3198}"
RUNTIME_HOST="${DRAMA_RUNTIME_HOST:-127.0.0.1}"
RUNTIME_URL="${DRAMA_RUNTIME_URL:-http://${RUNTIME_HOST}:${RUNTIME_PORT}}"
TIMEOUT_SECONDS="${DRAMA_RUNTIME_LAUNCH_TIMEOUT_SECONDS:-45}"
STATE_DIR="${DRAMA_RUNTIME_STATE_DIR:-$HOME/.local/share/zen-drama}"
LOG_DIR="$STATE_DIR/logs"
PID_FILE="$STATE_DIR/runtime-${RUNTIME_PORT}.pid"
LOCK_DIR="$STATE_DIR/runtime-${RUNTIME_HOST//[^A-Za-z0-9_.-]/_}-${RUNTIME_PORT}.lock"
RUNTIME_LOG="$LOG_DIR/drama-runtime-${RUNTIME_PORT}.log"
RUNTIME_ERR_LOG="$LOG_DIR/drama-runtime-${RUNTIME_PORT}.err.log"
RUNTIME_ENTRY="$STATE_DIR/runtime-entry-${RUNTIME_PORT}.ts"
LAUNCH_LABEL="dev.drama-browser.runtime.${RUNTIME_PORT}"
LAUNCH_PLIST="$HOME/Library/LaunchAgents/${LAUNCH_LABEL}.plist"

mkdir -p "$LOG_DIR"

find_bun() {
  if [[ -n "${BUN_EXE:-}" && -x "${BUN_EXE}" ]]; then
    printf '%s\n' "$BUN_EXE"
    return
  fi
  if [[ -x "$HOME/.bun/bin/bun" ]]; then
    printf '%s\n' "$HOME/.bun/bin/bun"
    return
  fi
  command -v bun
}

runtime_ready() {
  curl -fsS "$RUNTIME_URL/runtime/status" 2>/dev/null \
    | python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin).get("state") == "ready" else 1)' 2>/dev/null
}

wait_runtime_ready() {
  local deadline
  deadline=$((SECONDS + TIMEOUT_SECONDS))
  while (( SECONDS < deadline )); do
    if runtime_ready; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

acquire_launch_lock() {
  local deadline
  deadline=$((SECONDS + TIMEOUT_SECONDS))
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    if runtime_ready; then
      exit 0
    fi
    if (( SECONDS >= deadline )); then
      echo "Timed out waiting for Drama runtime launch lock at $LOCK_DIR." >&2
      exit 1
    fi
    sleep 0.2
  done
  trap 'rm -rf "$LOCK_DIR"' EXIT
}

write_listener_pid() {
  local pid
  pid="$(lsof -nP -tiTCP:"$RUNTIME_PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  if [[ -n "$pid" ]]; then
    echo "$pid" > "$PID_FILE"
  fi
}

resolve_plotpilot_root() {
  local candidates=()
  [[ -n "${PLOTPILOT_PROJECT_ROOT:-}" ]] && candidates+=("$PLOTPILOT_PROJECT_ROOT")
  candidates+=(
    "$HOME/PlotPilot"
    "$HOME/PlotPilot-v4.6.0"
    "$HOME/plm"
    "$HOME/Downloads/PlotPilot-plm-v46-read"
    "$HOME/Downloads/PlotPilot-plm-v46"
    "$HOME/Downloads/PlotPilot-plm"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate/interfaces/main.py" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
}

if runtime_ready; then
  exit 0
fi

acquire_launch_lock

if runtime_ready; then
  exit 0
fi

BUN_EXE="$(find_bun)"
export DRAMA_RUNTIME_HOST="$RUNTIME_HOST"
export DRAMA_RUNTIME_PORT="$RUNTIME_PORT"
export DRAMA_BROWSER_SHELL_DIST="${DRAMA_BROWSER_SHELL_DIST:-$REPO_ROOT/apps/drama-browser-shell/dist}"

if [[ ! -f "$DRAMA_BROWSER_SHELL_DIST/index.html" ]]; then
  (cd "$REPO_ROOT" && "$BUN_EXE" run browser-shell:build)
fi

if PLOTPILOT_ROOT="$(resolve_plotpilot_root)"; then
  export PLOTPILOT_PROJECT_ROOT="$PLOTPILOT_ROOT"
  if [[ -z "${PLOTPILOT_PYTHON_EXE:-}" && -x "$PLOTPILOT_ROOT/.venv/bin/python" ]]; then
    export PLOTPILOT_PYTHON_EXE="$PLOTPILOT_ROOT/.venv/bin/python"
  fi
fi

if [[ -z "${PLOTPILOT_PYTHON_EXE:-}" ]]; then
  export PLOTPILOT_PYTHON_EXE="$(command -v python3 || true)"
fi

cd "$REPO_ROOT"
cat > "$RUNTIME_ENTRY" <<EOF
import "$REPO_ROOT/apps/drama-runtime/src/server.ts"

setInterval(() => {}, 60_000)
EOF

if [[ "$(uname -s)" == "Darwin" && -x /bin/launchctl ]]; then
  mkdir -p "$(dirname "$LAUNCH_PLIST")"
  LAUNCH_LABEL="$LAUNCH_LABEL" \
  LAUNCH_PLIST="$LAUNCH_PLIST" \
  BUN_EXE="$BUN_EXE" \
  RUNTIME_ENTRY="$RUNTIME_ENTRY" \
  REPO_ROOT="$REPO_ROOT" \
  RUNTIME_LOG="$RUNTIME_LOG" \
  RUNTIME_ERR_LOG="$RUNTIME_ERR_LOG" \
  DRAMA_RUNTIME_HOST="$DRAMA_RUNTIME_HOST" \
  DRAMA_RUNTIME_PORT="$DRAMA_RUNTIME_PORT" \
  DRAMA_RUNTIME_URL="$RUNTIME_URL" \
  DRAMA_BROWSER_SHELL_DIST="$DRAMA_BROWSER_SHELL_DIST" \
  PLOTPILOT_PROJECT_ROOT="${PLOTPILOT_PROJECT_ROOT:-}" \
  PLOTPILOT_PYTHON_EXE="${PLOTPILOT_PYTHON_EXE:-}" \
  python3 <<'PY'
import os
import plistlib

env = {
    "DRAMA_RUNTIME_HOST": os.environ["DRAMA_RUNTIME_HOST"],
    "DRAMA_RUNTIME_PORT": os.environ["DRAMA_RUNTIME_PORT"],
    "DRAMA_RUNTIME_URL": os.environ["DRAMA_RUNTIME_URL"],
    "DRAMA_BROWSER_SHELL_DIST": os.environ["DRAMA_BROWSER_SHELL_DIST"],
}
for key in ("PLOTPILOT_PROJECT_ROOT", "PLOTPILOT_PYTHON_EXE"):
    value = os.environ.get(key)
    if value:
        env[key] = value

plist = {
    "Label": os.environ["LAUNCH_LABEL"],
    "ProgramArguments": [os.environ["BUN_EXE"], os.environ["RUNTIME_ENTRY"]],
    "WorkingDirectory": os.environ["REPO_ROOT"],
    "EnvironmentVariables": env,
    "RunAtLoad": True,
    "KeepAlive": False,
    "StandardOutPath": os.environ["RUNTIME_LOG"],
    "StandardErrorPath": os.environ["RUNTIME_ERR_LOG"],
}

with open(os.environ["LAUNCH_PLIST"], "wb") as handle:
    plistlib.dump(plist, handle, sort_keys=False)
PY

  /bin/launchctl bootout "gui/$(id -u)" "$LAUNCH_PLIST" >/dev/null 2>&1 || true
  /bin/launchctl bootstrap "gui/$(id -u)" "$LAUNCH_PLIST"
  /bin/launchctl kickstart -k "gui/$(id -u)/$LAUNCH_LABEL" >/dev/null 2>&1 || true
else
  nohup "$BUN_EXE" "$RUNTIME_ENTRY" >"$RUNTIME_LOG" 2>"$RUNTIME_ERR_LOG" &
  echo $! > "$PID_FILE"
fi

if wait_runtime_ready; then
  write_listener_pid
  exit 0
fi

echo "Drama runtime did not become ready at $RUNTIME_URL. See $RUNTIME_LOG and $RUNTIME_ERR_LOG" >&2
exit 1
