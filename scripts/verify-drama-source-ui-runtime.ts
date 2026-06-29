import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

type Surface = "start" | "graph" | "plm" | "crew" | "memory";

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: string;
};

type ScreenshotAnalysis = {
  path: string;
  captured: boolean;
  width?: number;
  height?: number;
  averageLuma?: number;
  darkRatio?: number;
  brightRatio?: number;
  uniqueColorBuckets?: number;
  error?: string;
};

type SurfaceReport = {
  surface: Surface;
  ok: boolean;
  profile: string;
  screenshot: ScreenshotAnalysis;
  processLines: string[];
  processName: string;
  windowTitles: string[];
  runtimeStatus?: unknown;
  failureReasons: string[];
};

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function run(command: string, args: string[], timeout = 20000): CommandResult {
  const result = spawnSync(command, args, { encoding: "utf8", timeout });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error?.message,
  };
}

function psSnapshot(): string[] {
  return run("ps", ["ax", "-ww", "-o", "pid=,command="]).stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function plistValue(plist: string, key: string): string {
  const result = run("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, plist]);
  return result.status === 0 ? result.stdout.trim() : "";
}

function writeProfile(profileDir: string, surface: Surface, runtimeUrl: string): void {
  mkdirSync(profileDir, { recursive: true });
  const productionFixture = surface === "plm";
  writeFileSync(
    path.join(profileDir, "user.js"),
    [
      'user_pref("browser.shell.checkDefaultBrowser", false);',
      'user_pref("browser.shell.didSkipDefaultBrowserCheckOnFirstRun", true);',
      'user_pref("startup.homepage_welcome_url", "");',
      'user_pref("startup.homepage_welcome_url.additional", "");',
      'user_pref("browser.startup.homepage_override.mstone", "ignore");',
      'user_pref("browser.aboutwelcome.enabled", false);',
      'user_pref("sidebar.visibility", "always-show");',
      'user_pref("sidebar.expandOnHover", false);',
      'user_pref("zen.view.sidebar-expanded", true);',
      `user_pref("drama.browser.base-url", "${runtimeUrl}/app");`,
      `user_pref("drama.browser.runtime-url", "${runtimeUrl}");`,
      'user_pref("drama.browser.internal-app.enabled", true);',
      'user_pref("drama.browser.internal-app-url", "chrome://browser/content/drama/app/index.html");',
      'user_pref("drama.browser.runtime-launch.enabled", false);',
      'user_pref("drama.browser.open-on-startup", true);',
      `user_pref("drama.browser.start-surface", "${surface}");`,
      `user_pref("drama.browser.production-fixture.enabled", ${productionFixture});`,
      "",
    ].join("\n"),
  );
}

async function analyzeScreenshot(file: string): Promise<ScreenshotAnalysis> {
  try {
    const image = sharp(file);
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const raw = await image
      .resize({ width: 220, height: 140, fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer();

    const total = Math.max(1, raw.length / 3);
    let lumaSum = 0;
    let dark = 0;
    let bright = 0;
    const buckets = new Set<string>();
    for (let index = 0; index < raw.length; index += 3) {
      const red = raw[index] ?? 0;
      const green = raw[index + 1] ?? 0;
      const blue = raw[index + 2] ?? 0;
      const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      lumaSum += luma;
      if (luma < 8) dark += 1;
      if (luma > 245) bright += 1;
      buckets.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
    }

    return {
      path: file,
      captured: true,
      width,
      height,
      averageLuma: Number((lumaSum / total).toFixed(3)),
      darkRatio: Number((dark / total).toFixed(6)),
      brightRatio: Number((bright / total).toFixed(6)),
      uniqueColorBuckets: buckets.size,
    };
  } catch (error) {
    return {
      path: file,
      captured: false,
      error: String(error),
    };
  }
}

async function fetchJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return await response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

function activateAndReadWindows(pid: number): { processName: string; windowTitles: string[] } {
  const script = `
tell application "System Events"
  set targetProcess to first process whose unix id is ${pid}
  set frontmost of targetProcess to true
  delay 0.5
  set processName to name of targetProcess
  set windowNames to {}
  repeat with itemWindow in windows of targetProcess
    set end of windowNames to name of itemWindow
  end repeat
  return processName & "\\n" & (windowNames as string)
end tell
`;
  const result = run("osascript", ["-e", script], 8000);
  const [processName = "", titles = ""] = result.stdout.trim().split("\n");
  return {
    processName,
    windowTitles: titles ? titles.split(", ").filter(Boolean) : [],
  };
}

function killSourceProcesses(appBundle: string): void {
  run("pkill", ["-f", appBundle], 5000);
}

async function verifySurface(options: {
  surface: Surface;
  appBundle: string;
  executable: string;
  runtimeUrl: string;
  evidenceRoot: string;
  screenshotDir: string;
}): Promise<SurfaceReport> {
  const { surface, appBundle, executable, runtimeUrl, evidenceRoot, screenshotDir } = options;
  const profile = path.join(evidenceRoot, "stage-10-profiles", surface);
  rmSync(profile, { recursive: true, force: true });
  writeProfile(profile, surface, runtimeUrl);

  const before = new Set(psSnapshot());
  run("open", ["-n", appBundle, "--args", "-profile", profile, "-no-remote", "about:blank"], 10000);

  const waitMs = surface === "plm" ? 18000 : 13000;
  await new Promise((resolve) => setTimeout(resolve, waitMs));

  const mainProcessLine = psSnapshot()
    .find((line) => line.includes(appBundle) && line.includes("/Contents/MacOS/drama-browser") && line.includes(profile));
  const mainProcessPid = Number(mainProcessLine?.trim().split(/\s+/, 1)[0] ?? 0);
  const processInfo = mainProcessPid > 0
    ? activateAndReadWindows(mainProcessPid)
    : { processName: "", windowTitles: [] };
  mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `drama-source-built-${surface}-current.png`);
  run("screencapture", ["-x", screenshotPath], 10000);

  const processLines = psSnapshot()
    .filter((line) => line.includes(appBundle))
    .filter((line) => !before.has(line) || line.includes(profile));
  const runtimeStatus = surface === "start"
    ? undefined
    : await fetchJson(`${runtimeUrl.replace(/\/+$/, "")}/runtime/status`);
  const screenshot = await analyzeScreenshot(screenshotPath);

  killSourceProcesses(appBundle);
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const failureReasons: string[] = [];
  if (processLines.length === 0) {
    failureReasons.push("source-built Drama Browser process was not observed.");
  }
  if (!screenshot.captured) {
    failureReasons.push(`screenshot was not captured: ${screenshot.error ?? "unknown error"}`);
  }
  if ((screenshot.width ?? 0) < 800 || (screenshot.height ?? 0) < 500) {
    failureReasons.push(`screenshot dimensions are too small: ${screenshot.width ?? 0}x${screenshot.height ?? 0}`);
  }
  if ((screenshot.brightRatio ?? 1) > 0.985 || (screenshot.darkRatio ?? 1) > 0.985 || (screenshot.uniqueColorBuckets ?? 0) < 24) {
    failureReasons.push("screenshot appears blank or visually unvaried.");
  }
  if (/Zen Browser|app\.zen-browser\.zen/i.test([processInfo.processName, ...processInfo.windowTitles].join("\n"))) {
    failureReasons.push(`frontmost process/window exposed Zen product identity: ${processInfo.processName || "unknown"} ${processInfo.windowTitles.join(" | ")}`);
  }
  if (surface !== "start") {
    const status = runtimeStatus as { state?: unknown; plmRuntime?: { healthy?: unknown; state?: unknown } } | undefined;
    if (status?.state !== "ready") {
      failureReasons.push(`runtime was not ready for ${surface}: ${JSON.stringify(runtimeStatus)}`);
    }
    if (surface === "plm" && status?.plmRuntime?.healthy !== true) {
      failureReasons.push(`PLM sidecar was not healthy: ${JSON.stringify(status?.plmRuntime ?? null)}`);
    }
  }

  return {
    surface,
    ok: failureReasons.length === 0,
    profile,
    screenshot,
    processLines,
    processName: processInfo.processName,
    windowTitles: processInfo.windowTitles,
    runtimeStatus,
    failureReasons,
  };
}

const sourceWorkspace = path.resolve(argValue("--source-workspace", "/Users/gengrf/zen-browser-desktop"));
const appBundle = path.resolve(
  argValue(
    "--app-bundle",
    path.join(sourceWorkspace, "engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app"),
  ),
);
const runtimeUrl = argValue("--runtime-url", "http://127.0.0.1:3198");
const outPath = path.resolve(
  argValue(
    "--out",
    "/Users/gengrf/drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-10-source-built-ui-runtime-parity.json",
  ),
);
const repoRoot = path.resolve(sourceWorkspace, "../drama-browser");
const evidenceRoot = path.join(repoRoot, "openspec/changes/fork-drama-browser-source-product/evidence");
const screenshotDir = path.join(repoRoot, "docs/verification");
const infoPlist = path.join(appBundle, "Contents/Info.plist");
const executable = path.join(appBundle, "Contents/MacOS", plistValue(infoPlist, "CFBundleExecutable"));

if (!existsSync(executable)) {
  throw new Error(`Source-built Drama Browser executable was not found: ${executable}`);
}

if (!existsSync(path.join(evidenceRoot, "stage-09-source-product.json"))) {
  throw new Error("Stage 09 source product verifier evidence is missing.");
}

const identityGate = JSON.parse(
  readFileSync(path.join(evidenceRoot, "stage-09-source-product.json"), "utf8"),
);
const runtimeBefore = await fetchJson(`${runtimeUrl.replace(/\/+$/, "")}/runtime/status`);
if ((runtimeBefore as { state?: unknown }).state !== "ready") {
  run(path.join(repoRoot, "scripts/launch-drama-runtime.sh"), [], 60000);
}

const surfaces: Surface[] = ["start", "graph", "plm", "crew", "memory"];
const results: SurfaceReport[] = [];
for (const surface of surfaces) {
  results.push(await verifySurface({ surface, appBundle, executable, runtimeUrl, evidenceRoot, screenshotDir }));
}

const sourceBuiltClassification = "product-drama-browser-source-built";
const appIdentity = {
  bundleId: plistValue(infoPlist, "CFBundleIdentifier"),
  displayName: plistValue(infoPlist, "CFBundleDisplayName") || plistValue(infoPlist, "CFBundleName"),
  executable: plistValue(infoPlist, "CFBundleExecutable"),
};
const checks = [
  {
    id: "identity-gate",
    ok: identityGate?.ok === true,
    detail: "stage-09-source-product.json",
  },
  {
    id: "source-built-app-identity",
    ok: appIdentity.bundleId === "app.drama-browser.local" &&
      appIdentity.displayName === "Drama Browser" &&
      appIdentity.executable === "drama-browser",
    detail: JSON.stringify(appIdentity),
  },
  {
    id: "all-surfaces-captured",
    ok: results.every((result) => result.ok),
    detail: results.map((result) => `${result.surface}:${result.ok ? "ok" : result.failureReasons.join("; ")}`).join("\n"),
  },
  {
    id: "plm-runtime-sidecar-visible",
    ok: results.find((result) => result.surface === "plm")?.ok === true,
    detail: JSON.stringify(results.find((result) => result.surface === "plm")?.runtimeStatus ?? null),
  },
  {
    id: "host-chrome-drama-identity",
    ok: results.every((result) => !/Zen Browser|app\.zen-browser\.zen/i.test([result.processName, ...result.windowTitles].join("\n"))),
    detail: results.map((result) => `${result.surface}:${result.processName}:${result.windowTitles.join(" | ")}`).join("\n"),
  },
];
const ok = checks.every((check) => check.ok);
const report = {
  ok,
  schema: "drama-source-ui-runtime-parity.v1",
  sourceBuiltClassification,
  generatedAt: new Date().toISOString(),
  sourceWorkspace,
  appBundle,
  runtimeUrl,
  appIdentity,
  identityGate: {
    path: path.join(evidenceRoot, "stage-09-source-product.json"),
    ok: identityGate?.ok === true,
  },
  checks,
  surfaces: results,
  failureReasons: checks.filter((check) => !check.ok).map((check) => `${check.id}: ${check.detail}`),
};

writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);
