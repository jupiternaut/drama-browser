import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Check = {
  id: string;
  ok: boolean;
  detail: string;
};

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: string;
};

type Report = {
  ok: boolean;
  sourceWorkspace: string;
  appBundle: string;
  generatedAt: string;
  summary: string;
  checks: Check[];
  commands: Record<string, CommandResult>;
  launchedProcessLines: string[];
  newOriginalZenProcessLines: string[];
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

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function readIfExists(file: string): string {
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function readJson(file: string): any {
  try {
    return JSON.parse(readIfExists(file));
  } catch {
    return null;
  }
}

function plistValue(plist: string, key: string): string {
  const result = run("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, plist]);
  return result.status === 0 ? result.stdout.trim() : "";
}

function check(id: string, ok: boolean, detail: string): Check {
  return { id, ok, detail };
}

function summarizeCommandOutput(
  command: CommandResult,
  summary: string,
): CommandResult {
  return {
    ...command,
    stdout: summary,
  };
}

function psSnapshot(): string[] {
  return run("ps", ["ax", "-ww", "-o", "pid=,command="]).stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const sourceWorkspace = path.resolve(
  argValue("--source-workspace", "/Users/gengrf/zen-browser-desktop"),
);
const appBundle = path.resolve(
  argValue(
    "--app-bundle",
    path.join(
      sourceWorkspace,
      "engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app",
    ),
  ),
);
const outPath = process.argv.includes("--out")
  ? path.resolve(argValue("--out", ""))
  : "";

const repoRoot = path.resolve(sourceWorkspace, "../drama-browser");
const evidenceRoot = path.join(
  repoRoot,
  "openspec/changes/fork-drama-browser-source-product/evidence",
);
const appInfo = path.join(appBundle, "Contents/Info.plist");
const appExecutable = path.join(appBundle, "Contents/MacOS/drama-browser");
const applicationIni = path.join(appBundle, "Contents/Resources/application.ini");
const browserOmni = path.join(appBundle, "Contents/Resources/browser/omni.ja");

const evidence = {
  stage03: readJson(path.join(evidenceRoot, "stage-03-build-time-branding.json")),
  stage04: readJson(path.join(evidenceRoot, "stage-04-source-identity.json")),
  stage05: readJson(path.join(evidenceRoot, "stage-05-updater-ownership.json")),
  stage06: readJson(path.join(evidenceRoot, "stage-06-source-chrome.json")),
  stage07: readJson(path.join(evidenceRoot, "stage-07-source-profile.json")),
  stage08: readJson(path.join(evidenceRoot, "stage-08-source-signing.json")),
};

const helperApps = [
  path.join(appBundle, "Contents/MacOS/drama-browser-gpu-helper.app"),
  path.join(appBundle, "Contents/MacOS/drama-browser-media-plugin-helper.app"),
  path.join(appBundle, "Contents/MacOS/drama-browser-plugin-container.app"),
];
const helperIdentities = helperApps.map((helper) => ({
  path: helper,
  bundleId: plistValue(path.join(helper, "Contents/Info.plist"), "CFBundleIdentifier"),
  executable: plistValue(path.join(helper, "Contents/Info.plist"), "CFBundleExecutable"),
}));

const commands: Record<string, CommandResult> = {
  codesign: run("codesign", ["--verify", "--deep", "--strict", "--verbose=4", appBundle]),
  zipinfo: run("zipinfo", ["-1", browserOmni]),
  packagedManager: run("unzip", [
    "-p",
    browserOmni,
    "chrome/browser/content/browser/drama/DramaBrowserChromeManager.mjs",
  ]),
};

const beforeProcessSet = new Set(psSnapshot());
const tempProfile = mkdtempSync(path.join(os.tmpdir(), "drama-source-product-profile."));
const launchScript = [
  `${shellQuote(appExecutable)} --headless -profile ${shellQuote(tempProfile)} about:blank >/tmp/drama-source-product.out 2>/tmp/drama-source-product.err &`,
  "pid=$!",
  "sleep 4",
  "ps ax -ww -o pid=,command=",
  "kill \"$pid\" 2>/dev/null || true",
  "wait \"$pid\" 2>/dev/null || true",
].join("\n");
commands.launchSnapshot = run("/bin/zsh", ["-lc", launchScript], 12000);

const launchedProcessLines = commands.launchSnapshot.stdout
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
const originalZenPattern =
  /\/Applications\/Zen Browser\.app|app\.zen-browser\.zen|\/Zen Browser\.app\/Contents\/MacOS\/zen(?:\s|$)/i;
const newOriginalZenProcessLines = launchedProcessLines.filter(
  (line) => !beforeProcessSet.has(line) && originalZenPattern.test(line),
);
const sourceProcessLines = launchedProcessLines.filter(
  (line) => line.includes("Drama Browser.app/Contents/MacOS/drama-browser") ||
    line.includes("/dist/drama-browser/Drama Browser.app/"),
);
commands.launchSnapshot = {
  ...commands.launchSnapshot,
  stdout: [...sourceProcessLines, ...newOriginalZenProcessLines].join("\n"),
};

const appBundleId = plistValue(appInfo, "CFBundleIdentifier");
const appDisplayName = plistValue(appInfo, "CFBundleDisplayName") || plistValue(appInfo, "CFBundleName");
const appBundleName = plistValue(appInfo, "CFBundleName");
const appExecName = plistValue(appInfo, "CFBundleExecutable");
const urlTypes = plistValue(appInfo, "CFBundleURLTypes");
const documentTypes = plistValue(appInfo, "CFBundleDocumentTypes");
const appIni = readIfExists(applicationIni);
const packagedManager = commands.packagedManager.stdout;
const zipEntries = commands.zipinfo.stdout;
const updaterPaths = run("/usr/bin/find", [appBundle, "-iname", "*updater*", "-o", "-iname", "*update-settings*"]).stdout
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const checks: Check[] = [
  check("app-bundle", existsSync(appBundle), appBundle),
  check(
    "main-product-identity",
    appBundleId === "app.drama-browser.local" &&
      appDisplayName === "Drama Browser" &&
      appBundleName === "Drama Browser" &&
      appExecName === "drama-browser",
    JSON.stringify({ appBundleId, appDisplayName, appBundleName, appExecName }),
  ),
  check(
    "helper-product-identity",
    helperIdentities.every(
      (helper) =>
        helper.bundleId.startsWith("app.drama-browser.") &&
        !helper.bundleId.toLowerCase().includes("zen") &&
        !helper.executable.toLowerCase().includes("zen"),
    ),
    JSON.stringify(helperIdentities),
  ),
  check(
    "url-schemes",
    urlTypes.includes("drama") &&
      urlTypes.includes("Drama Browser URL") &&
      !urlTypes.includes("Zen Browser URL"),
    urlTypes,
  ),
  check(
    "document-types",
    documentTypes.length > 0 && !documentTypes.includes("Zen"),
    documentTypes.slice(0, 1000),
  ),
  check(
    "application-ini",
    appIni.includes("Name=Drama Browser") &&
      appIni.includes("Profile=drama-browser") &&
      appIni.includes("RemotingName=drama-browser") &&
      !appIni.includes("Name=Zen"),
    appIni,
  ),
  check("codesign", commands.codesign.status === 0, commands.codesign.stderr || commands.codesign.stdout),
  check(
    "updater-disabled",
    evidence.stage05?.ok === true && updaterPaths.length === 0,
    updaterPaths.join("\n") || "no updater/update-settings artifacts in app bundle",
  ),
  check(
    "source-registered-chrome",
    evidence.stage06?.ok === true &&
      zipEntries.includes("chrome/browser/content/browser/drama/DramaBrowserChromeManager.mjs") &&
      zipEntries.includes("chrome/browser/content/browser/drama/app/index.html"),
    "Drama chrome resources are packaged in browser/omni.ja",
  ),
  check(
    "packaged-manager-pref-migration",
    packagedManager.includes("DRAMA_LEGACY_ZEN_PREF_MIGRATED") &&
      packagedManager.includes("#migrateLegacyZenDramaPrefs") &&
      !/Services\.prefs\.set(?:String|Bool|Int)Pref\([^)]*zen\.drama\./.test(packagedManager),
    "packaged manager imports legacy zen.drama.* prefs without writing them as product prefs",
  ),
  check("profile-evidence", evidence.stage07?.ok === true, "stage-07-source-profile.json"),
  check("signing-evidence", evidence.stage08?.ok === true, "stage-08-source-signing.json"),
  check("branding-evidence", evidence.stage03?.ok === true, "stage-03-build-time-branding.json"),
  check("helper-evidence", evidence.stage04?.ok === true, "stage-04-source-identity.json"),
  check(
    "source-built-launch-process",
    sourceProcessLines.length > 0,
    sourceProcessLines.join("\n") || commands.launchSnapshot.stdout,
  ),
  check(
    "no-original-zen-wakeup",
    newOriginalZenProcessLines.length === 0,
    newOriginalZenProcessLines.join("\n") || "no new original Zen product process observed",
  ),
  check(
    "allowed-attribution-boundary",
    appIni.includes("Vendor=Mozilla") && ![
      appBundleId,
      appDisplayName,
      appBundleName,
      appExecName,
      urlTypes,
    ].join("\n").includes("Zen"),
    "Mozilla/Firefox/Zen-derived source attribution is allowed outside product identity fields",
  ),
];

commands.zipinfo = summarizeCommandOutput(
  commands.zipinfo,
  JSON.stringify({
    entryCount: zipEntries.split("\n").filter(Boolean).length,
    hasDramaManager: zipEntries.includes("chrome/browser/content/browser/drama/DramaBrowserChromeManager.mjs"),
    hasDramaApp: zipEntries.includes("chrome/browser/content/browser/drama/app/index.html"),
  }),
);
commands.packagedManager = summarizeCommandOutput(
  commands.packagedManager,
  JSON.stringify({
    bytesRead: packagedManager.length,
    hasLegacyMigrationSentinel: packagedManager.includes("DRAMA_LEGACY_ZEN_PREF_MIGRATED"),
    hasLegacyMigrationMethod: packagedManager.includes("#migrateLegacyZenDramaPrefs"),
    writesLegacyZenPrefs: /Services\.prefs\.set(?:String|Bool|Int)Pref\([^)]*zen\.drama\./.test(packagedManager),
  }),
);

const ok = checks.every((entry) => entry.ok);
const report: Report = {
  ok,
  sourceWorkspace,
  appBundle,
  generatedAt: new Date().toISOString(),
  summary: ok
    ? "Source-built Drama Browser product identity verifier passed."
    : "Source-built Drama Browser product identity verifier failed.",
  checks,
  commands,
  launchedProcessLines: sourceProcessLines,
  newOriginalZenProcessLines,
};

const json = JSON.stringify(report, null, 2);
if (outPath) writeFileSync(outPath, `${json}\n`);
console.log(json);

process.exit(ok ? 0 : 1);
