import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createDramaRuntimeClient } from "../packages/drama-host/src/runtime-client.ts";

type Check = {
  id: string;
  ok: boolean;
  detail: string;
};

type Report = {
  ok: boolean;
  generatedAt: string;
  runtimeUrl: string;
  checks: Check[];
  data: Record<string, unknown>;
};

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function check(id: string, ok: boolean, detail: string): Check {
  return { id, ok, detail };
}

function run(command: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
  });
}

function processElectronLines(): string[] {
  const result = run("ps", ["ax", "-ww", "-o", "pid=,command="]);
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      /Electron Helper|\/Applications\/Drama\.app|apps\/electron|electron-builder|electron\s+apps\/electron/i.test(
        line,
      ),
    );
}

function listenerPids(port: string): string[] {
  const result = run("lsof", ["-nP", `-tiTCP:${port}`, "-sTCP:LISTEN"]);
  return result.stdout
    .split(/\s+/)
    .map((pid) => pid.trim())
    .filter(Boolean)
    .filter((pid, index, all) => all.indexOf(pid) === index);
}

const repoRoot = path.resolve(import.meta.dir, "..");
const runtimeUrl = argValue("--runtime-url", "http://127.0.0.1:3198");
const outPath = process.argv.includes("--out") ? path.resolve(argValue("--out", "")) : "";
const launchScript = path.resolve(argValue("--launch-script", "scripts/launch-drama-runtime.sh"));
const portFromUrl = (() => {
  try {
    return new URL(runtimeUrl).port || (new URL(runtimeUrl).protocol === "https:" ? "443" : "80");
  } catch {
    return "3198";
  }
})();
const runtimePort = argValue("--port", process.env.DRAMA_RUNTIME_PORT ?? portFromUrl);
const client = createDramaRuntimeClient({ baseUrl: runtimeUrl, timeoutMs: 5_000 });

const checks: Check[] = [];
const data: Record<string, unknown> = {};

const launchEnv = {
  DRAMA_RUNTIME_URL: runtimeUrl,
  DRAMA_RUNTIME_PORT: runtimePort,
};

if (!existsSync(launchScript)) {
  checks.push(check("launch-script-exists", false, launchScript));
} else {
  checks.push(check("launch-script-exists", true, launchScript));
}

const firstLaunch = existsSync(launchScript)
  ? run("bash", [launchScript], { env: launchEnv })
  : null;
checks.push(check(
  "initial-launch-exits-zero",
  firstLaunch?.status === 0,
  firstLaunch
    ? `status=${firstLaunch.status}; stderr=${firstLaunch.stderr.trim().slice(0, 500)}`
    : "launch script missing",
));
data.initialLaunch = firstLaunch
  ? { status: firstLaunch.status, stdout: firstLaunch.stdout.trim(), stderr: firstLaunch.stderr.trim() }
  : null;

const beforeStatus = await client.getStatus({ timeoutMs: 8_000 }).catch((error) => ({
  state: "error",
  message: error instanceof Error ? error.message : String(error),
}));
checks.push(check("runtime-ready-before-duplicate-launch", beforeStatus.state === "ready", JSON.stringify(beforeStatus)));
data.beforeStatus = beforeStatus;

const duplicateLaunches = existsSync(launchScript)
  ? [0, 1, 2].map((index) => {
    const result = run("bash", [launchScript], { env: launchEnv });
    return {
      index,
      status: result.status,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  })
  : [];
checks.push(check(
  "duplicate-launches-exit-zero",
  duplicateLaunches.length === 3 && duplicateLaunches.every((item) => item.status === 0),
  duplicateLaunches.map((item) => `#${item.index}: status=${item.status}`).join("; "),
));
data.duplicateLaunches = duplicateLaunches;

const afterStatus = await client.getStatus({ timeoutMs: 8_000 }).catch((error) => ({
  state: "error",
  message: error instanceof Error ? error.message : String(error),
}));
checks.push(check("runtime-ready-after-duplicate-launch", afterStatus.state === "ready", JSON.stringify(afterStatus)));
data.afterStatus = afterStatus;

const processInfo = await client.request<{ pid?: number }>("diagnostics:process", undefined, { timeoutMs: 5_000 })
  .catch((error) => ({
    error: error instanceof Error ? error.message : String(error),
  }));
const pids = listenerPids(runtimePort);
checks.push(check(
  "single-runtime-listener",
  pids.length === 1,
  pids.length > 0 ? `listeners=${pids.join(",")}` : `no listener on ${runtimePort}`,
));
checks.push(check(
  "runtime-pid-matches-listener",
  typeof processInfo.pid === "number" && pids.includes(String(processInfo.pid)),
  `runtimePid=${typeof processInfo.pid === "number" ? processInfo.pid : "unknown"}; listeners=${pids.join(",")}`,
));
data.process = { runtime: processInfo, listenerPids: pids };

const electronProcesses = processElectronLines();
checks.push(check(
  "no-electron-processes",
  electronProcesses.length === 0,
  electronProcesses.join("\n") || "no Electron Helper or legacy Drama Electron processes",
));
data.electronProcesses = electronProcesses;

const report: Report = {
  ok: checks.every((item) => item.ok),
  generatedAt: new Date().toISOString(),
  runtimeUrl,
  checks,
  data,
};

if (outPath) {
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
