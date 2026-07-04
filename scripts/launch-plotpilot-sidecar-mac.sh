#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PLOTPILOT_PORT="${PLOTPILOT_PORT:-8005}"
PLOTPILOT_HOST="${PLOTPILOT_HOST:-127.0.0.1}"
PLOTPILOT_URL="${PLOTPILOT_URL:-http://${PLOTPILOT_HOST}:${PLOTPILOT_PORT}}"
TIMEOUT_SECONDS="${PLOTPILOT_LAUNCH_TIMEOUT_SECONDS:-45}"
STATE_DIR="${PLOTPILOT_STATE_DIR:-$HOME/.local/share/zen-drama}"
LOG_DIR="$STATE_DIR/logs"
DATA_DIR="${PLOTPILOT_PROD_DATA_DIR:-$HOME/.plotpilot/data}"
LOCK_DIR="$STATE_DIR/plotpilot-${PLOTPILOT_HOST//[^A-Za-z0-9_.-]/_}-${PLOTPILOT_PORT}.lock"
LAUNCH_LABEL="dev.plotpilot.sidecar.${PLOTPILOT_PORT}"
LAUNCH_PLIST="$HOME/Library/LaunchAgents/${LAUNCH_LABEL}.plist"
STDOUT_LOG="$LOG_DIR/plotpilot-${PLOTPILOT_PORT}.log"
STDERR_LOG="$LOG_DIR/plotpilot-${PLOTPILOT_PORT}.err.log"

mkdir -p "$LOG_DIR" "$DATA_DIR/logs"

prepend_user_tool_path() {
  local entries=(
    "$HOME/.local/bin"
    "$HOME/.codex/plugins/.plugin-appserver"
    "$HOME/.bun/bin"
    "/opt/homebrew/bin"
    "/usr/local/bin"
    "/usr/bin"
    "/bin"
    "/usr/sbin"
    "/sbin"
  )
  local result=""
  local entry
  for entry in "${entries[@]}"; do
    [[ -d "$entry" ]] || continue
    case ":$result:$PATH:" in
      *":$entry:"*) ;;
      *) result="${result:+$result:}$entry" ;;
    esac
  done
  printf '%s\n' "${result:+$result:}$PATH"
}

find_codex() {
  if [[ -n "${CODEX_CLI:-}" && -x "${CODEX_CLI:-}" ]]; then
    printf '%s\n' "$CODEX_CLI"
    return 0
  fi
  command -v codex 2>/dev/null || true
}

find_plotpilot_root() {
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

runtime_healthy() {
  curl -fsS "$PLOTPILOT_URL/health" 2>/dev/null \
    | python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin).get("status") == "healthy" else 1)' 2>/dev/null
}

wait_runtime_healthy() {
  local deadline
  deadline=$((SECONDS + TIMEOUT_SECONDS))
  while (( SECONDS < deadline )); do
    if runtime_healthy; then
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
    if runtime_healthy; then
      exit 0
    fi
    if (( SECONDS >= deadline )); then
      echo "Timed out waiting for PlotPilot sidecar launch lock at $LOCK_DIR." >&2
      exit 1
    fi
    sleep 0.2
  done
  trap 'rm -rf "$LOCK_DIR"' EXIT
}

if runtime_healthy; then
  exit 0
fi

acquire_launch_lock

if runtime_healthy; then
  exit 0
fi

PLOTPILOT_ROOT="$(find_plotpilot_root || true)"
if [[ -z "$PLOTPILOT_ROOT" ]]; then
  echo "PlotPilot project root was not found. Set PLOTPILOT_PROJECT_ROOT." >&2
  exit 1
fi

if [[ -n "${PLOTPILOT_PYTHON_EXE:-}" ]]; then
  PYTHON_EXE="$PLOTPILOT_PYTHON_EXE"
elif [[ -x "$PLOTPILOT_ROOT/.venv/bin/python" ]]; then
  PYTHON_EXE="$PLOTPILOT_ROOT/.venv/bin/python"
else
  PYTHON_EXE="$(command -v python3 || true)"
fi

if [[ -z "$PYTHON_EXE" || ! -x "$PYTHON_EXE" ]]; then
  echo "PlotPilot Python executable was not found. Set PLOTPILOT_PYTHON_EXE." >&2
  exit 1
fi

BOOT_PATH="${DRAMA_PLOTPILOT_BOOT_PATH:-$REPO_ROOT/apps/electron/resources}"
if [[ ! -f "$BOOT_PATH/plotpilot_embedded_boot.py" ]]; then
  echo "PlotPilot embedded boot module was not found at $BOOT_PATH." >&2
  exit 1
fi

export PATH="$(prepend_user_tool_path)"
if CODEX_CLI_PATH="$(find_codex)" && [[ -n "$CODEX_CLI_PATH" ]]; then
  export CODEX_CLI="$CODEX_CLI_PATH"
fi

mkdir -p "$(dirname "$LAUNCH_PLIST")"
LAUNCH_LABEL="$LAUNCH_LABEL" \
LAUNCH_PLIST="$LAUNCH_PLIST" \
PYTHON_EXE="$PYTHON_EXE" \
PLOTPILOT_ROOT="$PLOTPILOT_ROOT" \
PLOTPILOT_PORT="$PLOTPILOT_PORT" \
PLOTPILOT_HOST="$PLOTPILOT_HOST" \
BOOT_PATH="$BOOT_PATH" \
DATA_DIR="$DATA_DIR" \
PATH="$PATH" \
CODEX_CLI="${CODEX_CLI:-}" \
STDOUT_LOG="$STDOUT_LOG" \
STDERR_LOG="$STDERR_LOG" \
python3 <<'PY'
import os
import plistlib

data_dir = os.environ["DATA_DIR"]
env = {
    "PYTHONPATH": os.environ["BOOT_PATH"],
    "PATH": os.environ["PATH"],
    "PYTHONIOENCODING": "utf-8",
    "PYTHONUNBUFFERED": "1",
    "HF_HUB_OFFLINE": "1",
    "TRANSFORMERS_OFFLINE": "1",
    "HF_DATASETS_OFFLINE": "1",
    "PLOTPILOT_EMBEDDED_RUNTIME": "1",
    "PLOTPILOT_SKIP_ORPHAN_CLEANUP": "1",
    "PLOTPILOT_SKIP_PROCESS_CLEANUP": "1",
    "PLOTPILOT_PROD_DATA_DIR": data_dir,
    "AITEXT_PROD_DATA_DIR": data_dir,
    "LOG_FILE": os.path.join(data_dir, "logs", "plotpilot.log"),
}
if os.environ.get("CODEX_CLI"):
    env["CODEX_CLI"] = os.environ["CODEX_CLI"]

plist = {
    "Label": os.environ["LAUNCH_LABEL"],
    "ProgramArguments": [
        os.environ["PYTHON_EXE"],
        "-m",
        "uvicorn",
        "plotpilot_embedded_boot:app",
        "--host",
        os.environ["PLOTPILOT_HOST"],
        "--port",
        os.environ["PLOTPILOT_PORT"],
        "--log-level",
        "info",
    ],
    "WorkingDirectory": os.environ["PLOTPILOT_ROOT"],
    "EnvironmentVariables": env,
    "RunAtLoad": True,
    "KeepAlive": False,
    "StandardOutPath": os.environ["STDOUT_LOG"],
    "StandardErrorPath": os.environ["STDERR_LOG"],
}

with open(os.environ["LAUNCH_PLIST"], "wb") as handle:
    plistlib.dump(plist, handle, sort_keys=False)
PY

/bin/launchctl bootout "gui/$(id -u)" "$LAUNCH_PLIST" >/dev/null 2>&1 || true
/bin/launchctl bootstrap "gui/$(id -u)" "$LAUNCH_PLIST"
/bin/launchctl kickstart -k "gui/$(id -u)/$LAUNCH_LABEL" >/dev/null 2>&1 || true

if wait_runtime_healthy; then
  exit 0
fi

echo "PlotPilot sidecar did not become healthy at $PLOTPILOT_URL. See $STDOUT_LOG and $STDERR_LOG" >&2
exit 1
