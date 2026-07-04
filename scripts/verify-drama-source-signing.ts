import { existsSync, readFileSync, writeFileSync } from "node:fs";
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
  appBundle: string;
  generatedAt: string;
  publicDistributableReady: boolean;
  checks: Check[];
  commands: Record<string, CommandResult>;
};

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function run(command: string, args: string[]): CommandResult {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 20000 });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error?.message,
  };
}

function plistValue(plist: string, key: string): string {
  const result = run("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, plist]);
  return result.status === 0 ? result.stdout.trim() : "";
}

function check(id: string, ok: boolean, detail: string): Check {
  return { id, ok, detail };
}

function readIfExists(file: string): string {
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

const appBundle = path.resolve(
  argValue(
    "--app-bundle",
    "/Users/gengrf/zen-browser-desktop/engine/obj-aarch64-apple-darwin/dist/drama-browser/Drama Browser.app",
  ),
);
const sourceWorkspace = path.resolve(
  argValue("--source-workspace", "/Users/gengrf/zen-browser-desktop"),
);
const outPath = process.argv.includes("--out")
  ? path.resolve(argValue("--out", ""))
  : "";

const appInfo = path.join(appBundle, "Contents/Info.plist");
const entitlementsPath = path.join(
  sourceWorkspace,
  "engine/security/mac/hardenedruntime/production/firefox.browser.xml",
);
const internalEntitlementsPath = path.join(
  sourceWorkspace,
  "../drama-browser/scripts/drama-source-internal.entitlements.plist",
);
const signingScript = path.join(sourceWorkspace, "../drama-browser/scripts/sign-drama-source-internal.sh");
const evidenceDoc = path.join(
  sourceWorkspace,
  "../drama-browser/openspec/changes/fork-drama-browser-source-product/evidence/stage-08-signing-entitlements-notarization.md",
);

const helperApps = [
  path.join(appBundle, "Contents/MacOS/drama-browser-gpu-helper.app"),
  path.join(appBundle, "Contents/MacOS/drama-browser-media-plugin-helper.app"),
  path.join(appBundle, "Contents/MacOS/drama-browser-plugin-container.app"),
];

const commands: Record<string, CommandResult> = {
  verifyDeep: run("codesign", ["--verify", "--deep", "--strict", "--verbose=4", appBundle]),
  appDetails: run("codesign", ["-dv", "--verbose=4", appBundle]),
  appEntitlements: run("codesign", ["-d", "--entitlements", "-", appBundle]),
  spctl: run("spctl", ["--assess", "--type", "execute", "--verbose=4", appBundle]),
  stapler: run("xcrun", ["stapler", "validate", appBundle]),
};

for (const helper of helperApps) {
  commands[`helper:${path.basename(helper)}`] = run("codesign", ["-dv", "--verbose=4", helper]);
}

const appDetailsText = `${commands.appDetails.stdout}\n${commands.appDetails.stderr}`;
const entitlementsText = `${commands.appEntitlements.stdout}\n${commands.appEntitlements.stderr}`;
const helperDetails = helperApps.map((helper) => ({
  path: helper,
  bundleId: plistValue(path.join(helper, "Contents/Info.plist"), "CFBundleIdentifier"),
  executable: plistValue(path.join(helper, "Contents/Info.plist"), "CFBundleExecutable"),
  details: `${commands[`helper:${path.basename(helper)}`].stdout}\n${
    commands[`helper:${path.basename(helper)}`].stderr
  }`,
}));

const cameraPrompt = plistValue(appInfo, "NSCameraUsageDescription");
const microphonePrompt = plistValue(appInfo, "NSMicrophoneUsageDescription");
const displayName = plistValue(appInfo, "CFBundleDisplayName") || plistValue(appInfo, "CFBundleName");
const bundleId = plistValue(appInfo, "CFBundleIdentifier");
const executable = plistValue(appInfo, "CFBundleExecutable");
const evidenceText = readIfExists(evidenceDoc);

const checks: Check[] = [
  check("app-bundle", existsSync(appBundle), appBundle),
  check("strict-codesign-valid", commands.verifyDeep.status === 0, commands.verifyDeep.stderr || commands.verifyDeep.stdout),
  check(
    "main-app-identity",
    bundleId === "app.drama-browser.local" &&
      displayName === "Drama Browser" &&
      executable === "drama-browser",
    JSON.stringify({ bundleId, displayName, executable }),
  ),
  check(
    "main-app-adhoc-runtime-signature",
    appDetailsText.includes("Signature=adhoc") &&
      appDetailsText.includes("TeamIdentifier=not set") &&
      appDetailsText.includes("Runtime Version=") &&
      appDetailsText.includes("Sealed Resources version=2"),
    appDetailsText,
  ),
  check(
    "main-internal-entitlements",
    !entitlementsText.includes("app.zen-browser.zen") &&
      !entitlementsText.includes("com.apple.application-identifier") &&
      entitlementsText.includes("com.apple.security.cs.allow-jit") &&
      entitlementsText.includes("com.apple.security.device.camera") &&
      entitlementsText.includes("com.apple.security.device.audio-input"),
    entitlementsText,
  ),
  check(
    "internal-entitlements-file",
    readIfExists(internalEntitlementsPath).includes("com.apple.security.cs.allow-jit") &&
      !readIfExists(internalEntitlementsPath).includes("com.apple.application-identifier") &&
      !readIfExists(internalEntitlementsPath).includes("app.zen-browser.zen"),
    internalEntitlementsPath,
  ),
  check(
    "source-entitlements-drama-owned",
    readIfExists(entitlementsPath).includes("9V5K9TP787.app.drama-browser.local") &&
      !readIfExists(entitlementsPath).includes("app.zen-browser.zen"),
    entitlementsPath,
  ),
  check(
    "helper-bundle-ids",
    helperDetails.every(
      (helper) =>
        helper.bundleId.startsWith("app.drama-browser.") &&
        (helper.executable.startsWith("drama-browser-") ||
          helper.executable.startsWith("Drama Browser ")) &&
        !helper.bundleId.toLowerCase().includes("zen"),
    ),
    JSON.stringify(helperDetails.map(({ path, bundleId, executable }) => ({ path, bundleId, executable }))),
  ),
  check(
    "helper-signatures",
    helperDetails.every(
      (helper) =>
        helper.details.includes("Signature=adhoc") &&
        helper.details.includes("TeamIdentifier=not set") &&
        helper.details.includes("Sealed Resources version=2"),
    ),
    helperDetails.map((helper) => `${helper.path}\n${helper.details}`).join("\n"),
  ),
  check(
    "permission-prompts-drama-owned",
    cameraPrompt.includes("Drama Browser") &&
      microphonePrompt.includes("Drama Browser") &&
      !`${cameraPrompt}\n${microphonePrompt}`.includes("Zen"),
    JSON.stringify({ cameraPrompt, microphonePrompt }),
  ),
  check("internal-signing-script", existsSync(signingScript), signingScript),
  check(
    "public-notarization-boundary-documented",
    evidenceText.includes("publicDistributableReady=false") &&
      evidenceText.includes("Developer ID") &&
      evidenceText.includes("notarization"),
    evidenceDoc,
  ),
  check(
    "notarization-not-claimed",
    commands.stapler.status !== 0 && commands.spctl.status !== 0,
    `spctl=${commands.spctl.status}; stapler=${commands.stapler.status}`,
  ),
];

const report: Report = {
  ok: checks.every((entry) => entry.ok),
  appBundle,
  generatedAt: new Date().toISOString(),
  publicDistributableReady: false,
  checks,
  commands,
};

const json = JSON.stringify(report, null, 2);
if (outPath) writeFileSync(outPath, `${json}\n`);
console.log(json);

process.exit(report.ok ? 0 : 1);
