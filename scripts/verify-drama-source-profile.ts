import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
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
  tempHome: string;
  tempProfile: string;
  checks: Check[];
  launch: {
    status: number | null;
    signal: NodeJS.Signals | null;
    error?: string;
    stdout: string;
    stderr: string;
  };
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

function listPaths(root: string): string[] {
  if (!existsSync(root)) return [];
  const found: string[] = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop()!;
    found.push(current);
    let entries: string[] = [];
    try {
      entries = readdirSync(current);
    } catch {
      continue;
    }
    for (const entry of entries) {
      stack.push(path.join(current, entry));
    }
  }
  return found;
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

const files = {
  commonMozconfig: path.join(sourceWorkspace, "configs/common/mozconfig"),
  engineMozconfig: path.join(sourceWorkspace, "engine/mozconfig"),
  configStatus: path.join(sourceWorkspace, "engine/obj-aarch64-apple-darwin/config.status"),
  applicationIni: path.join(appBundle, "Contents/Resources/application.ini"),
  wrapperManager: path.join(sourceWorkspace, "../drama-browser/gecko-drama-chrome/DramaBrowserChromeManager.mjs"),
  sourceManager: path.join(
    sourceWorkspace,
    "engine/browser/base/content/drama/DramaBrowserChromeManager.mjs",
  ),
  migrationPlan: path.join(
    sourceWorkspace,
    "../drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-07-profile-preferences-migration.md",
  ),
};

const commonMozconfig = readIfExists(files.commonMozconfig);
const engineMozconfig = readIfExists(files.engineMozconfig);
const configStatus = readIfExists(files.configStatus);
const applicationIni = readIfExists(files.applicationIni);
const wrapperManager = readIfExists(files.wrapperManager);
const sourceManager = readIfExists(files.sourceManager);
const managerCombined = `${wrapperManager}\n${sourceManager}`;

const tempHome = mkdtempSync(path.join(os.tmpdir(), "drama-source-profile-home."));
const tempProfile = path.join(tempHome, "Library/Application Support/DramaBrowser/Profiles/stage7");
mkdirSync(tempProfile, { recursive: true });

const executable = path.join(appBundle, "Contents/MacOS/drama-browser");
const launch = spawnSync(executable, ["--headless", "-profile", tempProfile, "about:blank"], {
  encoding: "utf8",
  env: {
    ...process.env,
    HOME: tempHome,
  },
  timeout: 8000,
});

const tempPaths = listPaths(tempHome);
const prefsJs = readIfExists(path.join(tempProfile, "prefs.js"));
const compatibilityIni = readIfExists(path.join(tempProfile, "compatibility.ini"));
const legacyWritePattern = /Services\.prefs\.set(?:String|Bool|Int)Pref\([^)]*zen\.drama\./;
const canonicalAliasPattern =
  /\["drama\.browser\.[^"]+",\s*"zen\.drama\.[^"]+"\]/g;
const canonicalAliases = managerCombined.match(canonicalAliasPattern) ?? [];
const disallowedProfilePaths = tempPaths.filter((entry) =>
  /\/Library\/Application Support\/(?:Zen|ZenDrama|zen)(?:\/|$)/.test(entry),
);

const checks: Check[] = [
  check("source-workspace", existsSync(sourceWorkspace), sourceWorkspace),
  check("app-bundle", existsSync(appBundle), appBundle),
  check("executable", existsSync(executable), executable),
  check(
    "build-config-user-appdir",
    has(commonMozconfig, "ac_add_options --with-user-appdir=DramaBrowser") &&
      has(engineMozconfig, "ac_add_options --with-user-appdir=DramaBrowser"),
    "source and engine mozconfig set DramaBrowser as the profile owner directory",
  ),
  check(
    "config-status-profile-owner",
    has(configStatus, "'MOZ_USER_DIR': '\"DramaBrowser\"'") &&
      has(configStatus, "'MOZ_APP_PROFILE': 'drama-browser'") &&
      has(configStatus, "'MOZ_APP_NAME': 'drama-browser'") &&
      has(configStatus, "'MOZ_APP_DISPLAYNAME': 'Drama Browser'"),
    "configured build output records DramaBrowser/Drama Browser profile metadata",
  ),
  check(
    "application-ini-profile",
    has(applicationIni, "Name=Drama Browser") &&
      has(applicationIni, "RemotingName=drama-browser") &&
      has(applicationIni, "Profile=drama-browser") &&
      has(applicationIni, "SourceRepository=https://github.com/jupiternaut/drama-browser"),
    "built application.ini identifies the source product and profile as Drama-owned",
  ),
  check(
    "canonical-pref-alias-order",
    canonicalAliases.length >= 10,
    `${canonicalAliases.length} drama.browser.* -> zen.drama.* compatibility aliases found`,
  ),
  check(
    "legacy-pref-migration-code",
    has(managerCombined, "DRAMA_LEGACY_ZEN_PREF_MIGRATED") &&
      has(managerCombined, "#migrateLegacyZenDramaPrefs") &&
      has(managerCombined, "#copyLegacyPrefIfNeeded") &&
      has(managerCombined, "Services.prefs.setBoolPref(DRAMA_LEGACY_ZEN_PREF_MIGRATED, true)"),
    "Chrome manager imports old zen.drama.* prefs into canonical drama.browser.* prefs once",
  ),
  check(
    "no-legacy-product-pref-writes",
    !legacyWritePattern.test(managerCombined),
    "source-built manager does not write zen.drama.* as a product preference namespace",
  ),
  check(
    "migration-plan",
    existsSync(files.migrationPlan) &&
      has(readIfExists(files.migrationPlan), "drama.browser.*") &&
      has(readIfExists(files.migrationPlan), "zen.drama.*"),
    files.migrationPlan,
  ),
  check(
    "explicit-profile-created",
    existsSync(path.join(tempProfile, "prefs.js")) &&
      existsSync(path.join(tempProfile, "compatibility.ini")),
    tempProfile,
  ),
  check(
    "explicit-profile-runtime-path",
    has(compatibilityIni, "Drama Browser.app/Contents/Resources") &&
      has(compatibilityIni, "/dist/drama-browser/Drama Browser.app/"),
    compatibilityIni
      .split("\n")
      .filter((line) => line.startsWith("Last"))
      .join("\n"),
  ),
  check(
    "no-zen-owned-temp-profile-paths",
    disallowedProfilePaths.length === 0,
    disallowedProfilePaths.join("\n") || "no Zen/ZenDrama profile directories in temp HOME",
  ),
  check(
    "no-zen-drama-user-prefs",
    !prefsJs.includes('user_pref("zen.drama.'),
    "fresh source-built profile does not persist zen.drama.* prefs",
  ),
];

const report: Report = {
  ok: checks.every((entry) => entry.ok),
  sourceWorkspace,
  appBundle,
  generatedAt: new Date().toISOString(),
  tempHome,
  tempProfile,
  checks,
  launch: {
    status: launch.status,
    signal: launch.signal,
    error: launch.error?.message,
    stdout: launch.stdout,
    stderr: launch.stderr,
  },
};

const json = JSON.stringify(report, null, 2);
if (outPath) writeFileSync(outPath, `${json}\n`);
console.log(json);

process.exit(report.ok ? 0 : 1);
