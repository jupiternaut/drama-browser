import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type Check = {
  id: string;
  ok: boolean;
  detail: string;
};

type Report = {
  ok: boolean;
  sourceWorkspace: string;
  generatedAt: string;
  checks: Check[];
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

function has(text: string, needle: string): boolean {
  return text.includes(needle);
}

const sourceWorkspace = path.resolve(
  argValue("--source-workspace", "/Users/gengrf/zen-browser-desktop"),
);
const outPath = process.argv.includes("--out")
  ? path.resolve(argValue("--out", ""))
  : "";

const files = {
  surfer: path.join(sourceWorkspace, "surfer.json"),
  commonMozconfig: path.join(sourceWorkspace, "configs/common/mozconfig"),
  engineMozconfig: path.join(sourceWorkspace, "engine/mozconfig"),
  releaseConfigure: path.join(sourceWorkspace, "configs/branding/release/configure.sh"),
  engineReleaseConfigure: path.join(
    sourceWorkspace,
    "engine/browser/branding/release/configure.sh",
  ),
  toolkitPatch: path.join(sourceWorkspace, "src/toolkit/moz-configure.patch"),
  entitlementPatch: path.join(
    sourceWorkspace,
    "src/security/mac/hardenedruntime/production/firefox-browser-xml.patch",
  ),
  engineToolkit: path.join(sourceWorkspace, "engine/toolkit/moz.configure"),
  engineEntitlement: path.join(
    sourceWorkspace,
    "engine/security/mac/hardenedruntime/production/firefox.browser.xml",
  ),
};

let surfer: any = {};
try {
  surfer = JSON.parse(readIfExists(files.surfer));
} catch {
  surfer = {};
}

const commonMozconfig = readIfExists(files.commonMozconfig);
const engineMozconfig = readIfExists(files.engineMozconfig);
const releaseConfigure = readIfExists(files.releaseConfigure);
const engineReleaseConfigure = readIfExists(files.engineReleaseConfigure);
const toolkitPatch = readIfExists(files.toolkitPatch);
const entitlementPatch = readIfExists(files.entitlementPatch);
const engineToolkit = readIfExists(files.engineToolkit);
const engineEntitlement = readIfExists(files.engineEntitlement);

const checks: Check[] = [
  check("source-workspace", existsSync(sourceWorkspace), sourceWorkspace),
  check(
    "binary-name",
    surfer.binaryName === "drama-browser",
    `binaryName=${surfer.binaryName ?? "missing"}`,
  ),
  check(
    "source-mozconfig-app-name",
    has(commonMozconfig, "ac_add_options --with-app-name=${binName}") &&
      has(engineMozconfig, "ac_add_options --with-app-name=drama-browser"),
    "build config resolves main executable name to drama-browser",
  ),
  check(
    "mac-bundle-id",
    !has(commonMozconfig, "MOZ_MACBUNDLE_ID=") &&
      !has(engineMozconfig, "MOZ_MACBUNDLE_ID=") &&
      has(releaseConfigure, "MOZ_MACBUNDLE_ID=local") &&
      has(engineReleaseConfigure, "MOZ_MACBUNDLE_ID=local"),
    "mac bundle id suffix is Drama-owned and provided by branding confvars",
  ),
  check(
    "plugin-container-helper",
    has(toolkitPatch, "drama-browser-plugin-container") &&
      has(engineToolkit, "drama-browser-plugin-container"),
    "generic child process bundle/name is Drama-owned",
  ),
  check(
    "media-helper",
    has(toolkitPatch, "drama-browser-media-plugin-helper") &&
      has(engineToolkit, "drama-browser-media-plugin-helper"),
    "media plugin helper executable/bundle id seed is Drama-owned",
  ),
  check(
    "gpu-helper",
    has(toolkitPatch, "drama-browser-gpu-helper") &&
      has(engineToolkit, "drama-browser-gpu-helper"),
    "GPU helper executable/bundle id seed is Drama-owned",
  ),
  check(
    "security-module-helper",
    has(toolkitPatch, "drama-browser-security-module-helper") &&
      has(engineToolkit, "drama-browser-security-module-helper"),
    "security module helper executable/bundle id seed is Drama-owned",
  ),
  check(
    "entitlement-bundle-id",
    has(entitlementPatch, "9V5K9TP787.app.drama-browser.local") &&
      has(engineEntitlement, "9V5K9TP787.app.drama-browser.local"),
    "macOS hardened runtime entitlement no longer points at app.zen-browser.zen",
  ),
  check(
    "no-stage4-zen-product-id",
    !has(engineMozconfig, "--with-app-name=zen") &&
      !has(engineMozconfig, "MOZ_MACBUNDLE_ID=app.zen-browser") &&
      !has(engineMozconfig, "MOZ_APP_VENDOR=Zen") &&
      !has(toolkitPatch, "app.zen-browser.zen") &&
      !has(entitlementPatch, "app.zen-browser.zen"),
    "stage 4 product identity fields do not reference Zen",
  ),
];

const report: Report = {
  ok: checks.every((entry) => entry.ok),
  sourceWorkspace,
  generatedAt: new Date().toISOString(),
  checks,
};

const json = JSON.stringify(report, null, 2);
if (outPath) writeFileSync(outPath, `${json}\n`);
console.log(json);
process.exit(report.ok ? 0 : 1);
