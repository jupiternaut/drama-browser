#!/usr/bin/env python3
import argparse
import base64
import json
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import warnings
from pathlib import Path


DEFAULT_ZEN_APP = Path("/Users/gengrf/drama-browser/dist/zen-drama-mac-sourcebuilt/Zen Browser.app")
DEFAULT_RUNTIME_URL = "http://127.0.0.1:3198"
SURFACES = {"graph", "plm", "crew"}
FIRST_VIEWPORT_BUDGET_MS = 2000
RUNTIME_READY_BUDGET_MS = 8000
SIDECAR_READY_BUDGET_MS = 45000
ROUTE_SWITCH_BUDGET_MS = 500
STARTUP_TASK_BUDGET_MS = 100


class MarionetteClient:
    def __init__(self, host: str, port: int):
        self.sock = socket.create_connection((host, port), timeout=1)
        self.sock.settimeout(30)
        self.next_id = 0
        self.hello = self.recv()

    def close(self) -> None:
        self.sock.close()

    def recv(self):
        length_bytes = b""
        while True:
            chunk = self.sock.recv(1)
            if not chunk:
                raise RuntimeError("Marionette socket closed before packet length")
            if chunk == b":":
                break
            length_bytes += chunk

        length = int(length_bytes.decode("utf-8"))
        data = b""
        while len(data) < length:
            chunk = self.sock.recv(length - len(data))
            if not chunk:
                raise RuntimeError("Marionette socket closed before full packet")
            data += chunk
        return json.loads(data.decode("utf-8"))

    def send(self, payload) -> None:
        raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.sock.sendall(str(len(raw)).encode("utf-8") + b":" + raw)

    def call(self, name: str, params=None):
        self.next_id += 1
        request_id = self.next_id
        self.send([0, request_id, name, params or {}])
        while True:
            message = self.recv()
            if isinstance(message, list) and len(message) >= 4 and message[1] == request_id:
                if message[2] is not None:
                    raise RuntimeError(f"{name} failed: {message[2]}")
                return message[3]


def parse_args():
    parser = argparse.ArgumentParser(
        description="Verify the Zen Drama chrome-resource panel through Marionette."
    )
    parser.add_argument("--zen-app", default=str(DEFAULT_ZEN_APP), help="Path to Zen Browser.app on macOS.")
    parser.add_argument("--zen-bin", default=None, help="Path to a Zen executable. Overrides --zen-app.")
    parser.add_argument("--runtime-url", default=DEFAULT_RUNTIME_URL, help="Drama runtime base URL.")
    parser.add_argument("--surface", default="plm", choices=sorted(SURFACES), help="Surface to open.")
    parser.add_argument("--output", default=None, help="Optional JSON output path.")
    parser.add_argument("--screenshot-output", default=None, help="Optional PNG screenshot output path.")
    parser.add_argument("--no-screenshot", action="store_true", help="Disable WebDriver screenshot capture.")
    parser.add_argument("--wait-ms", type=int, default=8000, help="Wait after browser startup before inspection.")
    parser.add_argument("--timeout-ms", type=int, default=45000, help="Startup timeout.")
    parser.add_argument("--profile", default=None, help="Optional profile directory. Defaults to a temp dir.")
    parser.add_argument("--keep-profile", action="store_true", help="Do not delete the temporary profile.")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero when verification fails.")
    parser.add_argument("--check-route-switches", action="store_true", help="Measure warm route switches inside the mounted shell.")
    parser.add_argument("--first-viewport-budget-ms", type=int, default=FIRST_VIEWPORT_BUDGET_MS)
    parser.add_argument("--runtime-budget-ms", type=int, default=RUNTIME_READY_BUDGET_MS)
    parser.add_argument("--sidecar-budget-ms", type=int, default=SIDECAR_READY_BUDGET_MS)
    parser.add_argument("--route-switch-budget-ms", type=int, default=ROUTE_SWITCH_BUDGET_MS)
    parser.add_argument("--startup-task-budget-ms", type=int, default=STARTUP_TASK_BUDGET_MS)
    return parser.parse_args()


def allocate_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def write_profile(profile_dir: Path, port: int, runtime_url: str, surface: str) -> None:
    profile_dir.mkdir(parents=True, exist_ok=True)
    (profile_dir / "user.js").write_text(
        "\n".join(
            [
                f'user_pref("marionette.port", {port});',
                'user_pref("marionette.enabled", true);',
                'user_pref("browser.shell.checkDefaultBrowser", false);',
                'user_pref("browser.shell.didSkipDefaultBrowserCheckOnFirstRun", true);',
                'user_pref("startup.homepage_welcome_url", "");',
                'user_pref("startup.homepage_welcome_url.additional", "");',
                'user_pref("browser.startup.homepage_override.mstone", "ignore");',
                'user_pref("browser.aboutwelcome.enabled", false);',
                f'user_pref("zen.drama.runtime-url", "{runtime_url}");',
                'user_pref("zen.drama.internal-app.enabled", true);',
                'user_pref("zen.drama.internal-app-url", "chrome://browser/content/drama/app/index.html");',
                'user_pref("zen.drama.runtime-launch.enabled", false);',
                'user_pref("zen.drama.open-on-startup", true);',
                f'user_pref("zen.drama.start-surface", "{surface}");',
                "",
            ]
        ),
        encoding="utf-8",
    )


def connect_marionette(port: int, process: subprocess.Popen, timeout_ms: int) -> MarionetteClient:
    deadline = time.time() + (timeout_ms / 1000)
    last_error = None
    while time.time() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"Zen exited before Marionette opened: {process.returncode}")
        try:
            return MarionetteClient("127.0.0.1", port)
        except OSError as error:
            last_error = error
            time.sleep(0.25)
    raise RuntimeError(f"Marionette port did not open: {last_error}")


def resolve_zen_binary(args):
    if args.zen_bin:
        zen_bin = Path(args.zen_bin).expanduser().resolve()
        if not zen_bin.exists():
            raise SystemExit(f"Zen executable was not found: {zen_bin}")
        return None, zen_bin

    zen_app = Path(args.zen_app).expanduser().resolve()
    zen_bin = zen_app / "Contents/MacOS/zen"
    if not zen_bin.exists():
        raise SystemExit(f"Zen executable was not found: {zen_bin}")
    return zen_app, zen_bin


def verification_schema() -> str:
    return "zen-drama-marionette-verification.v2"


INSPECTION_SCRIPT = r"""
const panel = document.getElementById('zen-drama-panel');
const browser = document.getElementById('zen-drama-browser');
const manager = window.gZenDramaManager;
let content = null;
try {
  const doc = browser?.contentWindow?.document ?? browser?.contentDocument ?? null;
  const root = doc?.getElementById('root') ?? null;
  const shell = doc?.querySelector('[data-drama-shell="workbench"], .drama-shell, .drama-critical-fallback') ?? null;
  const shellRect = shell ? (() => {
    const rect = shell.getBoundingClientRect();
    return { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
  })() : null;
  content = doc ? {
    uri: doc.documentURI,
    readyState: doc.readyState,
    title: doc.title,
    dataset: { ...doc.documentElement.dataset },
    rootExists: Boolean(root),
    rootChildCount: root?.childElementCount ?? null,
    rootText: (root?.textContent ?? '').slice(0, 1200),
    shellExists: Boolean(shell),
    shellText: (shell?.textContent ?? '').slice(0, 1200),
    shellRect,
    elementCount: doc.querySelectorAll('*').length,
    scripts: [...doc.scripts].map((script) => script.src),
    stylesheets: [...doc.styleSheets].length,
	    marks: doc.defaultView?.__DRAMA_PRODUCT_PATH_MARKS__ ?? null,
	    events: doc.defaultView?.__DRAMA_PRODUCT_PATH_EVENTS__ ?? null,
	    responsiveness: doc.defaultView?.__DRAMA_PRODUCT_PATH_RESPONSIVENESS__ ?? null,
	  } : null;
	} catch (error) {
	  content = { error: String(error), name: error?.name, message: error?.message };
}
return {
  managerType: typeof manager,
  managerConstructor: manager?.constructor?.name ?? null,
  panelExists: Boolean(panel),
  panelHidden: panel?.hidden ?? null,
  panelDisplay: panel ? getComputedStyle(panel).display : null,
  browserExists: Boolean(browser),
  currentURI: browser?.currentURI?.spec ?? null,
  statusValue: document.getElementById('zen-drama-runtime-status')?.getAttribute('value') ?? null,
  sidebarButtons: ['zen-drama-graph-sidebar-button','zen-drama-plm-sidebar-button','zen-drama-crew-sidebar-button']
    .map((id) => Boolean(document.getElementById(id))),
  content,
  documentTitle: document.title,
  location: String(location.href),
	};
	"""


ROUTE_SWITCH_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const browser = document.getElementById('zen-drama-browser');
  const doc = browser?.contentWindow?.document ?? browser?.contentDocument ?? null;
  const win = doc?.defaultView ?? null;
  if (!doc || !win) {
    done({ ok: false, error: 'content document is unavailable' });
    return;
  }

  const initialShell = doc.querySelector('[data-drama-shell="workbench"]');
  if (!initialShell) {
    done({ ok: false, error: 'workbench shell is unavailable' });
    return;
  }

  const currentSurface = doc.documentElement.dataset.dramaSurface;
  const surfaces = ['graph', 'plm', 'crew'];
  const sequence = surfaces.filter((surface) => surface !== currentSurface);
  if (currentSurface && surfaces.includes(currentSurface)) sequence.push(currentSurface);

  const waitForSurface = (surface, timeoutMs) => new Promise((resolve) => {
    const startedAt = win.performance.now();
    const check = () => {
      const now = win.performance.now();
      const shell = doc.querySelector('[data-drama-shell="workbench"]');
      const frame = doc.querySelector('.drama-surface-frame');
      const active = doc.documentElement.dataset.dramaSurface === surface
        && frame?.getAttribute('data-surface') === surface;
      if (active) {
        win.requestAnimationFrame(() => {
          resolve({
            ok: true,
            waitedMs: win.performance.now() - startedAt,
            shellRemounted: shell !== initialShell,
            shellState: shell?.getAttribute('data-drama-shell-state') ?? null,
          });
        });
        return;
      }
      if (now - startedAt >= timeoutMs) {
        resolve({
          ok: false,
          waitedMs: now - startedAt,
          timedOut: true,
          shellRemounted: shell !== initialShell,
          shellState: shell?.getAttribute('data-drama-shell-state') ?? null,
        });
        return;
      }
      win.setTimeout(check, 16);
    };
    check();
  });

  const switches = [];
  for (const surface of sequence) {
    const button = doc.querySelector(`[data-drama-surface-button="${surface}"]`);
    if (!button) {
      switches.push({ surface, ok: false, error: 'surface button missing' });
      continue;
    }
    const startedAt = win.performance.now();
    button.click();
    const settled = await waitForSurface(surface, 5000);
    switches.push({
      surface,
      ok: settled.ok,
      elapsedMs: win.performance.now() - startedAt,
      waitedMs: settled.waitedMs,
      timedOut: settled.timedOut === true,
      shellRemounted: settled.shellRemounted === true,
      shellState: settled.shellState,
    });
  }

  done({
    ok: switches.every((item) => item.ok && !item.shellRemounted && !item.timedOut),
    switches,
    finalSurface: doc.documentElement.dataset.dramaSurface ?? null,
    shellRemounted: doc.querySelector('[data-drama-shell="workbench"]') !== initialShell,
  });
})().catch((error) => {
  done({ ok: false, error: String(error), name: error?.name, message: error?.message });
});
"""


def as_number(value):
    if isinstance(value, (int, float)):
        return float(value)
    return None


def get_mark(content, name: str):
    marks = content.get("marks") if isinstance(content, dict) else None
    if not isinstance(marks, dict):
        return None
    mark = marks.get(name)
    return mark if isinstance(mark, dict) else None


def elapsed_from_shell_load(content, name: str):
    start = get_mark(content, "shell-document-load")
    mark = get_mark(content, name)
    marked_at = as_number(mark.get("markedAt")) if mark else None
    start_at = as_number(start.get("markedAt")) if start else None
    if marked_at is None:
        return None
    if start_at is None:
        return marked_at
    return max(0, marked_at - start_at)


def performance_report(result, surface: str, args, route_switch_result):
    content = result.get("content") if isinstance(result, dict) else None
    dataset = content.get("dataset", {}) if isinstance(content, dict) else {}
    shell_state = dataset.get("dramaShellState")
    first_viewport_ms = elapsed_from_shell_load(content, "first-styled-viewport")
    runtime_ready_ms = elapsed_from_shell_load(content, "runtime-ready")
    sidecar_ready_ms = elapsed_from_shell_load(content, "sidecar-ready")
    responsiveness = content.get("responsiveness") if isinstance(content, dict) else None
    startup_task_ms = None
    if isinstance(responsiveness, dict):
        startup_task_ms = as_number(responsiveness.get("maxStartupBlockingMs"))

    budgets = {
        "firstStyledViewportMs": args.first_viewport_budget_ms,
        "runtimeReadyOrUnavailableMs": args.runtime_budget_ms,
        "sidecarReadyOrUnavailableMs": args.sidecar_budget_ms,
        "routeSwitchMs": args.route_switch_budget_ms,
        "startupMainThreadTaskMs": args.startup_task_budget_ms,
    }
    measurements = {
        "firstStyledViewportMs": round(first_viewport_ms, 3) if first_viewport_ms is not None else None,
        "runtimeReadyMs": round(runtime_ready_ms, 3) if runtime_ready_ms is not None else None,
        "sidecarReadyMs": round(sidecar_ready_ms, 3) if sidecar_ready_ms is not None else None,
        "startupMainThreadTaskMs": round(startup_task_ms, 3) if startup_task_ms is not None else None,
        "shellState": shell_state,
    }

    reasons = []
    if first_viewport_ms is None:
        reasons.append("first styled viewport budget could not be measured.")
    elif first_viewport_ms > args.first_viewport_budget_ms:
        reasons.append(
            f"first styled viewport exceeded {args.first_viewport_budget_ms} ms budget: {first_viewport_ms:.1f} ms."
        )

    runtime_ready_states = {
        "runtime-ready",
        "sidecar-starting",
        "sidecar-ready",
        "sidecar-unavailable",
        "ai-unavailable",
        "workspace-missing",
        "parity-blocked",
    }
    if runtime_ready_ms is not None and runtime_ready_ms > args.runtime_budget_ms:
        reasons.append(f"runtime readiness exceeded {args.runtime_budget_ms} ms budget: {runtime_ready_ms:.1f} ms.")
    elif runtime_ready_ms is None and shell_state not in runtime_ready_states and shell_state != "runtime-unavailable":
        reasons.append("runtime did not reach ready or visible unavailable state inside the verification window.")

    if surface == "plm" and shell_state != "runtime-unavailable":
        sidecar_visible_states = {"sidecar-ready", "sidecar-unavailable", "ai-unavailable", "workspace-missing", "parity-blocked"}
        if sidecar_ready_ms is not None and sidecar_ready_ms > args.sidecar_budget_ms:
            reasons.append(f"PlotPilot sidecar readiness exceeded {args.sidecar_budget_ms} ms budget: {sidecar_ready_ms:.1f} ms.")
        elif sidecar_ready_ms is None and shell_state not in sidecar_visible_states:
            reasons.append("PlotPilot sidecar did not reach ready or visible unavailable state inside the verification window.")

    if startup_task_ms is None:
        reasons.append("startup responsiveness budget could not be measured.")
    elif startup_task_ms > args.startup_task_budget_ms:
        reasons.append(
            f"startup main-thread task exceeded {args.startup_task_budget_ms} ms budget: {startup_task_ms:.1f} ms."
        )

    if route_switch_result is not None:
        if not isinstance(route_switch_result, dict):
            reasons.append("route-switch verification did not return a structured result.")
        elif route_switch_result.get("error"):
            reasons.append(f"route-switch verification failed: {route_switch_result.get('error')}")
        else:
            switches = route_switch_result.get("switches", [])
            if not isinstance(switches, list) or len(switches) == 0:
                reasons.append("route-switch verification did not measure any switches.")
            for switch in switches if isinstance(switches, list) else []:
                elapsed = as_number(switch.get("elapsedMs")) if isinstance(switch, dict) else None
                target = switch.get("surface") if isinstance(switch, dict) else "unknown"
                if switch.get("ok") is not True:
                    reasons.append(f"route switch to {target} did not settle.")
                if switch.get("shellRemounted") is True:
                    reasons.append(f"route switch to {target} remounted the outer shell.")
                if elapsed is None:
                    reasons.append(f"route switch to {target} budget could not be measured.")
                elif elapsed > args.route_switch_budget_ms:
                    reasons.append(f"route switch to {target} exceeded {args.route_switch_budget_ms} ms budget: {elapsed:.1f} ms.")

    return {
        "budgets": budgets,
        "measurements": measurements,
        "responsiveness": responsiveness,
        "routeSwitches": route_switch_result,
    }, reasons


def default_screenshot_path(args):
    if args.screenshot_output:
        return Path(args.screenshot_output).expanduser().resolve()
    if args.output:
        return Path(args.output).expanduser().resolve().with_suffix(".png")
    return None


def analyze_screenshot(path: Path):
    try:
        from PIL import Image
    except Exception as error:
        return {
            "path": str(path),
            "captured": True,
            "analysisError": f"PIL unavailable: {error}",
        }, ["screenshot analysis could not run because PIL is unavailable."]

    with Image.open(path) as image:
        width, height = image.size
        thumbnail = image.convert("RGBA")
        thumbnail.thumbnail((256, 256))
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            pixels = list(thumbnail.getdata())

    visible = [(red, green, blue) for red, green, blue, alpha in pixels if alpha > 0]
    total = max(1, len(visible))
    lumas = [(0.2126 * red) + (0.7152 * green) + (0.0722 * blue) for red, green, blue in visible]
    average_luma = sum(lumas) / total
    dark_ratio = sum(1 for luma in lumas if luma < 8) / total
    bright_ratio = sum(1 for luma in lumas if luma > 245) / total
    unique_colors = len({(red // 8, green // 8, blue // 8) for red, green, blue in visible})

    reasons = []
    if width < 320 or height < 240:
        reasons.append(f"screenshot dimensions are too small: {width}x{height}.")
    if average_luma < 4 or dark_ratio > 0.985:
        reasons.append("screenshot is mostly black.")
    if bright_ratio > 0.985:
        reasons.append("screenshot is mostly blank or white.")
    if unique_colors < 16:
        reasons.append("screenshot has too little visual variation.")

    return {
        "path": str(path),
        "captured": True,
        "width": width,
        "height": height,
        "averageLuma": round(average_luma, 3),
        "darkRatio": round(dark_ratio, 6),
        "brightRatio": round(bright_ratio, 6),
        "uniqueColorBuckets": unique_colors,
    }, reasons


def capture_screenshot(client: MarionetteClient, args):
    path = default_screenshot_path(args)
    if args.no_screenshot or path is None:
        return {"captured": False, "path": str(path) if path else None}, []

    try:
        result = client.call("WebDriver:TakeScreenshot", {})
        encoded = result.get("value") if isinstance(result, dict) else result
        if not isinstance(encoded, str) or len(encoded) < 1000:
            return {
                "path": str(path),
                "captured": False,
                "error": "WebDriver screenshot did not return a PNG payload.",
            }, ["screenshot capture did not return a PNG payload."]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(encoded))
        return analyze_screenshot(path)
    except Exception as error:
        return {
            "path": str(path),
            "captured": False,
            "error": str(error),
        }, [f"screenshot capture failed: {error}"]


def failure_reasons(result, surface: str):
    content = result.get("content") if isinstance(result, dict) else None
    dataset = content.get("dataset", {}) if isinstance(content, dict) else {}
    current_uri = result.get("currentURI") if isinstance(result, dict) else None
    scripts = content.get("scripts", []) if isinstance(content, dict) else []
    shell_rect = content.get("shellRect") if isinstance(content, dict) else None
    reasons = []

    if result.get("managerConstructor") != "nsZenDramaManager":
        reasons.append("ZenDramaManager did not initialize in browser.xhtml.")
    if result.get("panelExists") is not True or result.get("panelHidden") is True:
        reasons.append("zen-drama-panel is missing or hidden.")
    if result.get("browserExists") is not True:
        reasons.append("zen-drama-browser is missing.")
    if not current_uri or "chrome://browser/content/drama/app/index.html" not in current_uri:
        reasons.append("internal browser did not load the chrome-resource Drama app.")
    if f"surface={surface}" not in (current_uri or ""):
        reasons.append(f"internal browser did not load the requested surface: {surface}.")
    if not isinstance(content, dict) or content.get("error"):
        reasons.append(f"content document inspection failed: {content.get('error') if isinstance(content, dict) else 'missing content'}")
    if isinstance(content, dict) and content.get("rootExists") is not True:
        reasons.append("React root element is missing.")
    if isinstance(content, dict) and int(content.get("rootChildCount") or 0) <= 0:
        reasons.append("React root has no rendered children.")
    if isinstance(content, dict) and content.get("shellExists") is not True:
        reasons.append("Drama workbench shell did not mount.")
    if dataset.get("dramaShellMounted") != "true":
        reasons.append("dramaShellMounted signal is not true.")
    if dataset.get("dramaFirstStyledViewport") != "ready":
        reasons.append("first styled viewport did not report ready.")
    if dataset.get("dramaHost") != "zen":
        reasons.append("content did not report dramaHost=zen.")
    if dataset.get("dramaSurface") != surface:
        reasons.append(f"content did not report dramaSurface={surface}.")
    if not any("chrome://browser/content/drama/app/assets/" in script for script in scripts):
        reasons.append("Drama JS asset did not load from chrome resource.")
    if isinstance(content, dict) and int(content.get("stylesheets") or 0) <= 0:
        reasons.append("Drama CSS stylesheets did not load.")
    if isinstance(shell_rect, dict) and (float(shell_rect.get("width") or 0) <= 0 or float(shell_rect.get("height") or 0) <= 0):
        reasons.append("Drama shell has an empty viewport rectangle.")
    return reasons


def main() -> int:
    args = parse_args()
    zen_app, zen_bin = resolve_zen_binary(args)

    port = allocate_port()
    profile_dir = Path(args.profile).expanduser().resolve() if args.profile else Path(
        tempfile.mkdtemp(prefix="zen-drama-marionette-profile-")
    )
    log_path = Path(tempfile.gettempdir()) / f"zen-drama-marionette-{int(time.time())}.log"
    client = None
    process = None
    started_at = time.time()
    try:
        write_profile(profile_dir, port, args.runtime_url, args.surface)
        log_file = log_path.open("w", encoding="utf-8")
        process = subprocess.Popen(
            [
                str(zen_bin),
                "-profile",
                str(profile_dir),
                "-no-remote",
                "-marionette",
                "-remote-allow-system-access",
                "about:blank",
            ],
            stdout=log_file,
            stderr=subprocess.STDOUT,
        )
        client = connect_marionette(port, process, args.timeout_ms)
        session = client.call("WebDriver:NewSession", {"capabilities": {"alwaysMatch": {}}})
        client.call("Marionette:SetContext", {"value": "chrome"})
        time.sleep(max(0, args.wait_ms) / 1000)
        inspected = client.call(
            "WebDriver:ExecuteScript",
            {"script": INSPECTION_SCRIPT, "args": [], "newSandbox": False},
        ).get("value")
        screenshot, screenshot_reasons = capture_screenshot(client, args)
        route_switch_result = None
        if args.check_route_switches:
            route_switch_result = client.call(
                "WebDriver:ExecuteAsyncScript",
                {"script": ROUTE_SWITCH_SCRIPT, "args": [], "newSandbox": False},
            ).get("value")
        performance, performance_reasons = performance_report(inspected, args.surface, args, route_switch_result)
        reasons = failure_reasons(inspected, args.surface) + performance_reasons + screenshot_reasons
        ok = len(reasons) == 0
        output = {
            "ok": ok,
            "schema": verification_schema(),
            "surfaceClassification": "product-zen-panel",
            "surface": args.surface,
            "platform": sys.platform,
            "zenApp": str(zen_app) if zen_app else None,
            "zenBin": str(zen_bin),
            "runtimeUrl": args.runtime_url,
            "profile": str(profile_dir),
            "logPath": str(log_path),
            "durationMs": round((time.time() - started_at) * 1000),
            "marionette": {
                "hello": client.hello,
                "session": session,
            },
            "result": inspected,
            "screenshot": screenshot,
            "performance": performance,
            "failureReasons": reasons,
        }
    except Exception as error:
        output = {
            "ok": False,
            "schema": verification_schema(),
            "surfaceClassification": "product-zen-panel",
            "surface": args.surface,
            "platform": sys.platform,
            "zenApp": str(zen_app) if zen_app else None,
            "zenBin": str(zen_bin),
            "runtimeUrl": args.runtime_url,
            "profile": str(profile_dir),
            "logPath": str(log_path),
            "durationMs": round((time.time() - started_at) * 1000),
            "failureReasons": [str(error)],
        }
    finally:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass
        if process is not None and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        try:
            log_file.close()
        except Exception:
            pass
        if not args.keep_profile and args.profile is None:
            shutil.rmtree(profile_dir, ignore_errors=True)

    if args.output:
        output_path = Path(args.output).expanduser().resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0 if output.get("ok") or not args.strict else 1


if __name__ == "__main__":
    sys.exit(main())
