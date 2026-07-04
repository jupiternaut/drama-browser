import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
  files: Record<string, { exists: boolean; sha256?: string; bytes?: number }>;
};

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function has(text: string, needle: string): boolean {
  return text.includes(needle);
}

function fileInfo(file: string): { exists: boolean; sha256?: string; bytes?: number } {
  if (!existsSync(file)) return { exists: false };
  const data = readFileSync(file);
  return {
    exists: true,
    sha256: createHash("sha256").update(data).digest("hex"),
    bytes: statSync(file).size,
  };
}

function check(id: string, ok: boolean, detail: string): Check {
  return { id, ok, detail };
}

const sourceWorkspace = path.resolve(
  argValue("--source-workspace", "/Users/gengrf/zen-browser-desktop"),
);
const outPath = process.argv.includes("--out")
  ? path.resolve(argValue("--out", ""))
  : "";

const paths = {
  surfer: path.join(sourceWorkspace, "surfer.json"),
  commonMozconfig: path.join(sourceWorkspace, "configs/common/mozconfig"),
  releaseConfigure: path.join(sourceWorkspace, "configs/branding/release/configure.sh"),
  releaseBrandProperties: path.join(
    sourceWorkspace,
    "configs/branding/release/locales/en-US/brand.properties",
  ),
  toolkitPatch: path.join(sourceWorkspace, "src/toolkit/moz-configure.patch"),
  buildPatch: path.join(sourceWorkspace, "src/build/moz-build.patch"),
  infoPlistPatch: path.join(
    sourceWorkspace,
    "src/browser/app/macbuild/Contents/Info-plist-in.patch",
  ),
  releaseLogo: path.join(sourceWorkspace, "configs/branding/release/logo.png"),
  releaseMacLogo: path.join(sourceWorkspace, "configs/branding/release/logo-mac.png"),
  twilightLogo: path.join(sourceWorkspace, "configs/branding/twilight/logo.png"),
  twilightMacLogo: path.join(sourceWorkspace, "configs/branding/twilight/logo-mac.png"),
};

const files = Object.fromEntries(
  Object.entries(paths).map(([key, file]) => [key, fileInfo(file)]),
) as Report["files"];

const surferRaw = existsSync(paths.surfer) ? readFileSync(paths.surfer, "utf8") : "{}";
const commonMozconfig = existsSync(paths.commonMozconfig)
  ? readFileSync(paths.commonMozconfig, "utf8")
  : "";
const releaseConfigure = existsSync(paths.releaseConfigure)
  ? readFileSync(paths.releaseConfigure, "utf8")
  : "";
const releaseBrandProperties = existsSync(paths.releaseBrandProperties)
  ? readFileSync(paths.releaseBrandProperties, "utf8")
  : "";
const toolkitPatch = existsSync(paths.toolkitPatch)
  ? readFileSync(paths.toolkitPatch, "utf8")
  : "";
const buildPatch = existsSync(paths.buildPatch)
  ? readFileSync(paths.buildPatch, "utf8")
  : "";
const infoPlistPatch = existsSync(paths.infoPlistPatch)
  ? readFileSync(paths.infoPlistPatch, "utf8")
  : "";

let surfer: any = {};
try {
  surfer = JSON.parse(surferRaw);
} catch {
  surfer = {};
}

const release = surfer?.brands?.release ?? {};
const twilight = surfer?.brands?.twilight ?? {};

const checks: Check[] = [
  check("source-workspace", existsSync(sourceWorkspace), sourceWorkspace),
  check("surfer-name", surfer.name === "Drama Browser", `name=${surfer.name ?? "missing"}`),
  check(
    "surfer-vendor",
    surfer.vendor === "Drama Browser Team",
    `vendor=${surfer.vendor ?? "missing"}`,
  ),
  check("surfer-app-id", surfer.appId === "local", `appId=${surfer.appId ?? "missing"}`),
  check(
    "release-brand",
    release.brandShortName === "Drama Browser" &&
      release.brandFullName === "Drama Browser" &&
      !JSON.stringify(release).includes("Zen"),
    JSON.stringify({
      brandShortName: release.brandShortName,
      brandFullName: release.brandFullName,
    }),
  ),
  check(
    "twilight-brand",
    String(twilight.brandFullName ?? "").includes("Drama Browser") &&
      !JSON.stringify(twilight).includes("Zen"),
    JSON.stringify({
      brandShortName: twilight.brandShortName,
      brandFullName: twilight.brandFullName,
    }),
  ),
  check(
    "update-host-owned",
    surfer.updateHostname === "updates.drama-browser.local",
    `updateHostname=${surfer.updateHostname ?? "missing"}`,
  ),
  check(
    "mozconfig-app-basename",
    has(commonMozconfig, 'ac_add_options --with-app-basename="Drama Browser"') &&
      has(commonMozconfig, 'export MOZ_APP_BASENAME="Drama Browser"'),
    "Drama Browser basename is set in configs/common/mozconfig",
  ),
  check(
    "branding-confvars",
    has(releaseConfigure, 'MOZ_APP_DISPLAYNAME="Drama Browser"') &&
      has(releaseConfigure, "MOZ_MACBUNDLE_ID=local") &&
      has(releaseBrandProperties, "brandShortName=Drama Browser") &&
      has(releaseBrandProperties, "vendorShortName=Drama Browser Team"),
    "macOS bundle id suffix and brand strings are provided by source branding confvars",
  ),
  check(
    "mozconfig-vendor-profile",
    has(toolkitPatch, 'default="drama-browser"') &&
      has(toolkitPatch, 'default="Drama Browser Team"'),
    "profile and vendor are provided by toolkit configure defaults",
  ),
  check(
    "mozconfig-distribution",
    has(commonMozconfig, "ac_add_options --with-distribution-id=app.drama-browser") &&
      has(commonMozconfig, "ac_add_options --with-user-appdir=DramaBrowser"),
    "distribution id and user app dir are Drama-owned",
  ),
  check(
    "mozconfig-source-repo",
    has(commonMozconfig, "https://github.com/jupiternaut/drama-browser"),
    "source repository metadata points at Drama Browser",
  ),
  check(
    "toolkit-defaults",
    has(toolkitPatch, 'default="Drama Browser Team"') &&
      has(toolkitPatch, 'default="drama-browser"') &&
      has(toolkitPatch, 'default="app.drama-browser"') &&
      has(toolkitPatch, 'return "DramaBrowser"'),
    "toolkit moz.configure patch no longer defaults to Zen identity",
  ),
  check(
    "build-update-host-default",
    has(buildPatch, 'appini_defines["MOZ_APPUPDATE_HOST"] = "updates.drama-browser.local"'),
    "application.ini update host default is Drama-owned",
  ),
  check(
    "drama-url-scheme-source-patch",
    has(infoPlistPatch, "<string>Drama Browser URL</string>") &&
      has(infoPlistPatch, "<string>drama</string>"),
    "drama:// is registered by a source patch, not a post-build plist edit",
  ),
  check(
    "branding-icons",
    files.releaseLogo.exists &&
      files.releaseMacLogo.exists &&
      files.twilightLogo.exists &&
      files.twilightMacLogo.exists &&
      (files.releaseLogo.bytes ?? 0) > 0 &&
      (files.releaseMacLogo.bytes ?? 0) > 0,
    "release/twilight source branding icons exist",
  ),
];

const report: Report = {
  ok: checks.every((entry) => entry.ok),
  sourceWorkspace,
  generatedAt: new Date().toISOString(),
  checks,
  files,
};

const json = JSON.stringify(report, null, 2);
if (outPath) writeFileSync(outPath, `${json}\n`);
console.log(json);

process.exit(report.ok ? 0 : 1);
