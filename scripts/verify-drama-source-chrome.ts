import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Check = {
  id: string;
  ok: boolean;
  detail: string;
};

type Report = {
  ok: boolean;
  sourceWorkspace: string;
  appBundle: string;
  generatedAt: string;
  checks: Check[];
  surfaces: string[];
  omniEntries: string[];
  looseEntries: string[];
};

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function readIfExists(file: string): string {
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function check(id: string, ok: boolean, detail: string): Check {
  return { id, ok, detail };
}

function listZipEntries(file: string): string[] {
  if (!existsSync(file)) return [];
  const result = spawnSync("zipinfo", ["-1", file], { encoding: "utf8" });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function includesAll(haystack: string, needles: string[]): boolean {
  return needles.every((needle) => haystack.includes(needle));
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

const engineBase = path.join(sourceWorkspace, "engine/browser/base");
const jarMnPath = path.join(engineBase, "jar.mn");
const browserXhtmlPath = path.join(engineBase, "content/browser.xhtml");
const dramaJarPath = path.join(engineBase, "content/drama-assets.jar.inc.mn");
const dramaHeadPath = path.join(engineBase, "content/drama-assets-head.inc.xhtml");
const dramaBodyPath = path.join(engineBase, "content/drama-assets-body.inc.xhtml");
const dramaRoot = path.join(engineBase, "content/drama");
const wrapperPackageScript = path.resolve(
  sourceWorkspace,
  "../drama-browser/scripts/package-zen-drama-mac.sh",
);

const jarMn = readIfExists(jarMnPath);
const browserXhtml = readIfExists(browserXhtmlPath);
const dramaJar = readIfExists(dramaJarPath);
const dramaHead = readIfExists(dramaHeadPath);
const dramaBody = readIfExists(dramaBodyPath);
const manager = readIfExists(path.join(dramaRoot, "DramaBrowserChromeManager.mjs"));
const appIndex = readIfExists(path.join(dramaRoot, "app/index.html"));
const wrapperPackageScriptText = readIfExists(wrapperPackageScript);

const omniPath = path.join(appBundle, "Contents/Resources/browser/omni.ja");
const omniEntries = listZipEntries(omniPath);
const omniEntrySet = new Set(omniEntries);
const appResources = path.join(appBundle, "Contents/Resources");

const requiredSourceFiles = [
  "DramaBrowserChromeManager.mjs",
  "zen-drama.css",
  "icons/drama-start.svg",
  "icons/drama-graph.svg",
  "icons/drama-plm.svg",
  "icons/drama-crew.svg",
  "icons/drama-memory.svg",
  "app/index.html",
];

const requiredOmniEntries = [
  "chrome/browser/content/browser/drama/DramaBrowserChromeManager.mjs",
  "chrome/browser/content/browser/zen-components/ZenDramaManager.mjs",
  "chrome/browser/content/browser/zen-styles/zen-drama.css",
  "chrome/browser/content/browser/zen-icons/drama-start.svg",
  "chrome/browser/content/browser/zen-icons/drama-graph.svg",
  "chrome/browser/content/browser/zen-icons/drama-plm.svg",
  "chrome/browser/content/browser/zen-icons/drama-crew.svg",
  "chrome/browser/content/browser/zen-icons/drama-memory.svg",
  "chrome/browser/content/browser/drama/app/index.html",
];

const looseEntryPath = (entry: string) =>
  path.join(appResources, entry.replace(/^chrome\/browser\//, "browser/chrome/"));
const packagedEntries = requiredOmniEntries.filter(
  (entry) => omniEntrySet.has(entry) || existsSync(looseEntryPath(entry)),
);

const surfaces = ["start", "graph", "plm", "crew", "memory"];
const surfaceUrls = surfaces.map(
  (surface) =>
    `chrome://browser/content/drama/app/index.html?host=drama&surface=${surface}`,
);

const checks: Check[] = [
  check("source-workspace", existsSync(sourceWorkspace), sourceWorkspace),
  check("app-bundle", existsSync(appBundle), appBundle),
  check("drama-source-root", existsSync(dramaRoot), dramaRoot),
  check(
    "source-files-present",
    requiredSourceFiles.every((file) => existsSync(path.join(dramaRoot, file))),
    requiredSourceFiles
      .filter((file) => !existsSync(path.join(dramaRoot, file)))
      .join("\n") || "all Drama source chrome files exist",
  ),
  check(
    "jar-include-registered",
    jarMn.includes("#include content/drama-assets.jar.inc.mn"),
    "browser/base/jar.mn includes Drama jar manifest",
  ),
  check(
    "jar-manifest-routes",
    includesAll(dramaJar, [
      "content/browser/drama/DramaBrowserChromeManager.mjs",
      "content/browser/zen-components/ZenDramaManager.mjs",
      "content/browser/zen-styles/zen-drama.css",
      "content/browser/drama/app/index.html",
    ]),
    "Drama jar manifest maps manager, compatibility alias, CSS, icons, and app shell",
  ),
  check(
    "browser-xhtml-head-hook",
    browserXhtml.includes("#include drama-assets-head.inc.xhtml") &&
      dramaHead.includes("chrome://browser/content/drama/DramaBrowserChromeManager.mjs") &&
      dramaHead.includes("chrome://browser/content/zen-styles/zen-drama.css"),
    "browser window loads Drama manager and CSS from source include",
  ),
  check(
    "browser-xhtml-body-hook",
    browserXhtml.includes("#include drama-assets-body.inc.xhtml") &&
      dramaBody.includes("cmd_dramaBrowserOpenStart") &&
      dramaBody.includes("cmd_dramaBrowserOpenGraph") &&
      dramaBody.includes("cmd_dramaBrowserOpenPlm") &&
      dramaBody.includes("cmd_dramaBrowserOpenCrew") &&
      dramaBody.includes("cmd_dramaBrowserOpenMemory") &&
      dramaBody.includes('id="zen-drama-browser"'),
    "browser window declares Drama commands, toolbar, panel, and embedded browser",
  ),
  check(
    "manager-internal-url",
    manager.includes('chrome://browser/content/drama/app/index.html') &&
      manager.includes("drama.browser.internal-app.enabled") &&
      manager.includes("drama.browser.runtime-token") &&
      manager.includes("zen.drama.internal-app.enabled"),
    "manager defaults to source-registered internal app, supports runtime token handoff, and keeps Zen prefs as migration aliases",
  ),
  check(
    "manager-drama-product-startup-default",
    manager.includes("this.#getBoolPref(DRAMA_OPEN_ON_STARTUP_PREF, this.#isDramaBrowserProduct())") &&
      manager.includes("#isDramaBrowserProduct()"),
    "Drama Browser product defaults to opening the browser shell even when a fresh profile has no launch-script prefs",
  ),
  check(
    "manager-browser-commands",
    includesAll(manager, [
      "openUrl(url)",
      "openInternalRoute(surface",
      "newTab(url",
      "newWindow(url",
      "openFile(path)",
      "showInFolder(path)",
      "getDiagnostics()",
    ]),
    "manager exposes browser-level commands for URL, internal route, tabs/windows, file open/reveal, and diagnostics",
  ),
  check(
    "app-index-relative-assets",
    appIndex.includes('src="./assets/') && appIndex.includes('href="./assets/'),
    "static app index uses relative assets that resolve inside chrome package",
  ),
  check(
    "surface-routes-covered",
    surfaceUrls.every((url) => url.includes("host=drama") && url.includes("surface=")),
    surfaceUrls.join("\n"),
  ),
  check(
    "packaged-omni-entries",
    requiredOmniEntries.every(
      (entry) => omniEntrySet.has(entry) || existsSync(looseEntryPath(entry)),
    ),
    requiredOmniEntries
      .filter((entry) => !omniEntrySet.has(entry) && !existsSync(looseEntryPath(entry)))
      .join("\n") ||
      "source-built package contains Drama app, manager, CSS, and icons",
  ),
  check(
    "wrapper-is-transitional",
    wrapperPackageScriptText.includes("transitional") ||
      wrapperPackageScriptText.includes("adapter"),
    "wrapper package injection is documented as transitional adapter tooling",
  ),
];

const report: Report = {
  ok: checks.every((entry) => entry.ok),
  sourceWorkspace,
  appBundle,
  generatedAt: new Date().toISOString(),
  checks,
  surfaces: surfaceUrls,
  omniEntries: requiredOmniEntries.filter((entry) => omniEntrySet.has(entry)),
  looseEntries: packagedEntries.filter((entry) => existsSync(looseEntryPath(entry))),
};

const json = JSON.stringify(report, null, 2);
if (outPath) writeFileSync(outPath, `${json}\n`);
console.log(json);

process.exit(report.ok ? 0 : 1);
