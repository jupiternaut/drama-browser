import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Check = {
  id: string;
  ok: boolean;
  detail: string;
};

type Report = {
  ok: boolean;
  generatedAt: string;
  repoRoot: string;
  appBundle: string | null;
  checks: Check[];
};

const repoRoot = path.resolve(import.meta.dir, "..");
const blockedRootPackages = [
  "electron",
  "electron-builder",
  "@electron/packager",
  "@sentry/electron",
  "electron-updater",
  "electron-winstaller",
];
const productionScriptNames = new Set([
  "check:drama-boundaries",
  "check:no-electron-production",
  "drama:build-packages",
  "drama:browser:build",
  "drama:browser:package:mac",
  "drama:browser:install:mac",
  "drama:browser:launch:mac",
  "drama:browser:verify",
  "validate:drama-modules",
  "browser-shell:build",
  "browser-shell:typecheck",
  "runtime:typecheck",
]);
const productionSourceRoots = [
  "apps/drama-browser-shell/src",
  "apps/drama-runtime/src",
  "gecko-drama-chrome",
  "packages/drama-host/src",
  "packages/drama-graph-ui/src",
  "packages/drama-plm-ui/src",
  "packages/drama-ui/src",
];
const productionSourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const forbiddenProductionSourcePatterns = [
  /window\.electronAPI/,
  /\bipcRenderer\b/,
  /\bcontextBridge\b/,
  /(?:from|import)\s+['"]electron['"]/,
  /\brequire\(['"]electron['"]\)/,
  /(?:from|import)\s+['"][^'"]*apps\/electron/i,
  /\b(?:electron-builder|electron-updater|@electron\/packager|@sentry\/electron)\b/,
];
const forbiddenProductionScriptPatterns = [
  /\bapps\/electron\b/i,
  /\belectron-builder\b/i,
  /\belectron-packager\b/i,
  /\belectron-updater\b/i,
  /\b@electron\/packager\b/i,
  /\bbun\s+run\s+electron:/i,
  /\bnpx\s+electron\b/i,
  /(^|[;&|]\s*|\s)electron(\s|$)/i,
];

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function check(id: string, ok: boolean, detail: string): Check {
  return { id, ok, detail };
}

function walk(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
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

function isProductionSourceFile(file: string): boolean {
  return productionSourceExtensions.has(path.extname(file));
}

function findProductionSourceViolations(): string[] {
  const violations: string[] = [];
  for (const root of productionSourceRoots) {
    for (const file of walk(path.join(repoRoot, root)).filter(isProductionSourceFile)) {
      const text = readFileSync(file, "utf8");
      const lines = text.split(/\r?\n/);
      lines.forEach((line, index) => {
        for (const pattern of forbiddenProductionSourcePatterns) {
          if (!pattern.test(line)) continue;
          const relativePath = path.relative(repoRoot, file).split(path.sep).join("/");
          violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
  return violations;
}

function findBundleElectronArtifacts(appBundle: string): string[] {
  const artifacts: string[] = [];
  if (!existsSync(appBundle)) return artifacts;
  const stack = [appBundle];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const relativePath = path.relative(repoRoot, fullPath);
      if (
        entry.name === "Electron Framework.framework" ||
        /^Electron Helper(?: .*)?\.app$/i.test(entry.name) ||
        /^Electron(?:\.app)?$/i.test(entry.name)
      ) {
        artifacts.push(relativePath);
      }
      if (entry.isDirectory()) {
        stack.push(fullPath);
      }
    }
  }
  return artifacts.sort();
}

function legacyAppStatus(legacyApp: string): string {
  if (!existsSync(legacyApp)) return "not installed";
  const electronArtifacts = findBundleElectronArtifacts(legacyApp);
  if (electronArtifacts.length > 0) {
    return `legacy Electron app present and rejected: ${legacyApp}`;
  }
  return `legacy app present without Electron Framework: ${legacyApp}`;
}

function processElectronLines(): string[] {
  const result = spawnSync("ps", ["ax", "-ww", "-o", "pid=,command="], {
    encoding: "utf8",
  });
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !line.includes("verify-no-production-electron.ts"))
    .filter((line) =>
      /Electron Helper|\/Applications\/Drama\.app|apps\/electron|electron-builder|electron\s+apps\/electron/i.test(
        line,
      ),
    );
}

const skipApp = process.argv.includes("--skip-app");
const checkProcesses = process.argv.includes("--check-processes");
const outPath = process.argv.includes("--out") ? path.resolve(argValue("--out", "")) : "";
const appBundle = skipApp
  ? null
  : path.resolve(argValue("--app", "dist/drama-browser-mac/Drama Browser.app"));
const legacyApp = path.resolve(argValue("--legacy-app", "/Applications/Drama.app"));

const packageJsonPath = path.join(repoRoot, "package.json");
const packageJson = readJson<{
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  trustedDependencies?: string[];
}>(packageJsonPath);

const dependencySections = [
  ["dependencies", packageJson.dependencies ?? {}],
  ["devDependencies", packageJson.devDependencies ?? {}],
  ["optionalDependencies", packageJson.optionalDependencies ?? {}],
  ["peerDependencies", packageJson.peerDependencies ?? {}],
] as const;
const rootDependencyHits = dependencySections.flatMap(([section, deps]) =>
  blockedRootPackages
    .filter((pkg) => Object.prototype.hasOwnProperty.call(deps, pkg))
    .map((pkg) => `${section}:${pkg}`),
);
const trustedHits = (packageJson.trustedDependencies ?? []).filter((pkg) =>
  blockedRootPackages.includes(pkg),
);
const productionSourceViolations = findProductionSourceViolations();

const scripts = packageJson.scripts ?? {};
const productionScriptViolations = [...productionScriptNames].flatMap((name) => {
  const command = scripts[name];
  if (!command) return [`${name}: missing`];
  return forbiddenProductionScriptPatterns
    .filter((pattern) => pattern.test(command))
    .map((pattern) => `${name}: ${pattern.source} matched ${command}`);
});
const legacyScriptNames = Object.keys(scripts).filter((name) => name.startsWith("electron:"));
const undocumentedLegacyEntrypoints = legacyScriptNames.filter((name) => {
  const command = scripts[name] ?? "";
  const isLaunchOrPackage =
    /(^electron:start$|^electron:dev$|^electron:dist|^electron:build$)/.test(name);
  return isLaunchOrPackage && !command.includes("scripts/legacy/electron/notice.ts");
});

const checks: Check[] = [
  check(
    "root-dependencies",
    rootDependencyHits.length === 0,
    rootDependencyHits.join(", ") || "root production dependency sections contain no Electron packages",
  ),
  check(
    "root-trusted-dependencies",
    trustedHits.length === 0,
    trustedHits.join(", ") || "root trustedDependencies contains no Electron packages",
  ),
  check(
    "production-scripts",
    productionScriptViolations.length === 0,
    productionScriptViolations.join("\n") ||
      "drama:browser and production validation scripts do not traverse apps/electron",
  ),
  check(
    "legacy-entrypoint-notices",
    undocumentedLegacyEntrypoints.length === 0,
    undocumentedLegacyEntrypoints.join(", ") ||
      "launch/package Electron scripts print the legacy warning before running",
  ),
  check(
    "production-source-allowlist",
    productionSourceViolations.length === 0,
    productionSourceViolations.join("\n") ||
      "production source roots contain no Electron IPC, preload, app, updater, or packager references",
  ),
  check("legacy-app-rejected", true, legacyAppStatus(legacyApp)),
];

if (appBundle) {
  const bundleArtifacts = findBundleElectronArtifacts(appBundle);
  checks.push(
    check("app-bundle-exists", existsSync(appBundle), appBundle),
    check(
      "app-bundle-no-electron",
      existsSync(appBundle) && bundleArtifacts.length === 0,
      bundleArtifacts.join("\n") || "no Electron Framework or Electron Helper apps in production bundle",
    ),
  );
}

if (checkProcesses) {
  const electronProcesses = processElectronLines();
  checks.push(
    check(
      "process-tree-no-electron",
      electronProcesses.length === 0,
      electronProcesses.join("\n") || "no Electron Helper or legacy Drama Electron processes",
    ),
  );
}

const report: Report = {
  ok: checks.every((item) => item.ok),
  generatedAt: new Date().toISOString(),
  repoRoot,
  appBundle,
  checks,
};

if (outPath) {
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
