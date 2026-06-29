import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

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
  warnings: string[];
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

function walk(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function textFilesWithNeedle(root: string, needles: string[]): string[] {
  const textExtensions = new Set([
    ".ini",
    ".js",
    ".json",
    ".plist",
    ".properties",
    ".strings",
    ".xml",
  ]);
  return walk(root).filter((file) => {
    if (!textExtensions.has(path.extname(file))) return false;
    const content = readIfExists(file);
    return needles.some((needle) => content.includes(needle));
  });
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

const commonMozconfig = readIfExists(path.join(sourceWorkspace, "configs/common/mozconfig"));
const engineMozconfig = readIfExists(path.join(sourceWorkspace, "engine/mozconfig"));
const configStatus = readIfExists(
  path.join(sourceWorkspace, "engine/obj-aarch64-apple-darwin/config.status"),
);
const infoPlist = readIfExists(path.join(appBundle, "Contents/Info.plist"));

const updaterPaths = walk(path.join(appBundle, "Contents")).filter((file) => {
  const basename = path.basename(file).toLowerCase();
  return basename.includes("updater") || basename === "org.mozilla.updater";
});
const updaterDirs = existsSync(path.join(appBundle, "Contents"))
  ? walk(path.join(appBundle, "Contents"))
      .map((file) => path.dirname(file))
      .filter((dir) => /updater\.app|org\.mozilla\.updater/i.test(dir))
  : [];
const zenUpdateIdentityMatches = textFilesWithNeedle(path.join(appBundle, "Contents"), [
  "app.zen-browser",
  "github.com/zen-browser",
  "updates.zen",
  "Zen Browser",
]);
const mozillaUpdaterMatches = textFilesWithNeedle(path.join(appBundle, "Contents"), [
  "org.mozilla.updater",
  "SMPrivilegedExecutables",
]);

const outputMar = path.join(sourceWorkspace, "dist/output.mar");
const updateArtifactsZip = path.join(
  sourceWorkspace,
  "dist/drama-browser-1.21.2b.en-US.mac.update_framework_artifacts.zip",
);

const checks: Check[] = [
  check("source-workspace", existsSync(sourceWorkspace), sourceWorkspace),
  check("app-bundle", existsSync(appBundle), appBundle),
  check(
    "source-disable-updater",
    commonMozconfig.includes("ac_add_options --disable-updater") &&
      engineMozconfig.includes("ac_add_options --disable-updater"),
    "source and engine mozconfigs disable updater",
  ),
  check(
    "config-status-no-moz-updater",
    !configStatus.includes("'MOZ_UPDATER': '1'") && !configStatus.includes('"MOZ_UPDATER": "1"'),
    "configured objdir does not enable MOZ_UPDATER",
  ),
  check(
    "bundle-no-updater-files",
    updaterPaths.length === 0 && updaterDirs.length === 0,
    updaterPaths.concat(updaterDirs).join("\n") || "no updater files/directories in app bundle",
  ),
  check(
    "bundle-no-privileged-updater",
    !infoPlist.includes("SMPrivilegedExecutables") &&
      !infoPlist.includes("org.mozilla.updater") &&
      mozillaUpdaterMatches.length === 0,
    mozillaUpdaterMatches.join("\n") || "no privileged updater declaration in app bundle",
  ),
  check(
    "bundle-no-zen-update-identity",
    zenUpdateIdentityMatches.length === 0,
    zenUpdateIdentityMatches.join("\n") || "no Zen update identity strings in app bundle",
  ),
];

const warnings: string[] = [];
if (existsSync(outputMar)) {
  warnings.push(`non-shipped MAR artifact remains: ${outputMar} (${statSync(outputMar).size} bytes)`);
}
if (existsSync(updateArtifactsZip)) {
  warnings.push(`non-shipped update framework artifact remains: ${updateArtifactsZip}`);
}
if (configStatus.includes("'MOZ_UPDATE_CHANNEL': 'release'")) {
  warnings.push("MOZ_UPDATE_CHANNEL remains release even though MOZ_UPDATER is disabled");
}

const report: Report = {
  ok: checks.every((entry) => entry.ok),
  sourceWorkspace,
  appBundle,
  generatedAt: new Date().toISOString(),
  checks,
  warnings,
};

const json = JSON.stringify(report, null, 2);
if (outPath) writeFileSync(outPath, `${json}\n`);
console.log(json);

process.exit(report.ok ? 0 : 1);
