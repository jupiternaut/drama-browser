import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function runStep<T>(
  id: string,
  action: () => Promise<T>,
  validate: (value: T) => boolean,
  detail: (value: T) => string = stringify,
): Promise<{ check: Check; value?: T }> {
  try {
    const value = await action();
    return { check: check(id, validate(value), detail(value)), value };
  } catch (error) {
    return { check: check(id, false, error instanceof Error ? error.message : String(error)) };
  }
}

const runtimeUrl = argValue("--runtime-url", "http://127.0.0.1:3198");
const outPath = process.argv.includes("--out") ? path.resolve(argValue("--out", "")) : "";
const client = createDramaRuntimeClient({ baseUrl: runtimeUrl, timeoutMs: 5_000 });

const checks: Check[] = [];
const data: Record<string, unknown> = {};

const statusStep = await runStep(
  "runtime-status",
  () => client.getStatus({ timeoutMs: 5_000 }),
  (status) => status.state === "ready",
  (status) => `state=${status.state}; workspace=${(status as { workspaceRoot?: string }).workspaceRoot ?? "unknown"}`,
);
checks.push(statusStep.check);
data.status = statusStep.value;

const capabilitiesStep = await runStep(
  "runtime-capabilities",
  () => client.getCapabilities({ timeoutMs: 5_000 }),
  (capabilities) =>
    [
      "files.readTextFile",
      "files.writeTextFile",
      "sessions.command",
      "plm.sidecar.status",
      "graph.load",
      "skillCrew.refresh",
      "basicMemory.search",
      "settings.write",
    ].every((key) => capabilities[key] === true),
  (capabilities) => Object.entries(capabilities).filter(([, available]) => available).map(([key]) => key).join(", "),
);
checks.push(capabilitiesStep.check);
data.capabilities = capabilitiesStep.value;

const workspaceRoot = (statusStep.value as { workspaceRoot?: string } | undefined)?.workspaceRoot
  ?? path.join(process.env.HOME ?? "/tmp", ".craft-agent/workspaces/my-workspace");
const basicMemoryRoot = (statusStep.value as { basicMemoryRoot?: string } | undefined)?.basicMemoryRoot
  ?? path.join(process.env.HOME ?? "/tmp", "basic-memory-claude-history");

const smokeFile = path.join(
  workspaceRoot,
  ".drama-verification",
  "remove-electron-host",
  "nested",
  "local-file-smoke.txt",
);
const smokeContent = `Drama Runtime smoke ${new Date().toISOString()}\n中文状态：文件读写通过\nWindows path fixture: C:\\Users\\jupiter\\Drama Browser\\章节\\第 1 章.md\n`;

const writeFileStep = await runStep(
  "files-write-read-preview-import-export",
  async () => {
    const written = await client.request<{ content: string; path: string; root: string }>("files:writeText", {
      path: smokeFile,
      content: smokeContent,
    }, { timeoutMs: 5_000 });
    const read = await client.request<{ content: string }>("files:readText", { path: smokeFile }, { timeoutMs: 5_000 });
    const preview = await client.request<{ content: string }>("files:preview", { path: smokeFile }, { timeoutMs: 5_000 });
    const exported = await client.request<{ content: string }>("files:exportText", { path: smokeFile }, { timeoutMs: 5_000 });
    const imported = await client.request<{ content: string }>("files:importText", {
      path: smokeFile,
      content: `${smokeContent}importText roundtrip\n`,
    }, { timeoutMs: 5_000 });
    return { written, read, preview, exported, imported };
  },
  (result) =>
    result.written.content.includes("Drama Runtime smoke") &&
    result.read.content.includes("中文状态") &&
    result.preview.content.includes("Windows path fixture") &&
    result.exported.content.includes("Drama Runtime smoke") &&
    result.imported.content.includes("importText roundtrip"),
  () => smokeFile,
);
checks.push(writeFileStep.check);
data.files = writeFileStep.value;

const sessionId = "remove-electron-host-smoke";
const sessionStep = await runStep(
  "sessions-command-status-cancel",
  async () => {
    const command = await client.request("sessions:command", {
      sessionId,
      command: { type: "setStatus", status: "verifying-electron-free-runtime" },
    }, { timeoutMs: 5_000 });
    const status = await client.request("sessions:status", { sessionId }, { timeoutMs: 5_000 });
    const cancel = await client.request("sessions:cancel", { sessionId, silent: true }, { timeoutMs: 5_000 });
    return { command, status, cancel };
  },
  (result) => stringify(result).includes("cancelled-silent"),
);
checks.push(sessionStep.check);
data.sessions = sessionStep.value;

const settingsStep = await runStep(
  "settings-read-write",
  async () => {
    const key = "remove-electron-host.path-fixture";
    const value = {
      mac: smokeFile,
      win: "C:\\Users\\jupiter\\Drama Browser\\Basic Memory\\Claude 历史.md",
      cn: "诊断文案保持中文可读",
    };
    const write = await client.request("settings:write", { key, value }, { timeoutMs: 5_000 });
    const read = await client.request<typeof value>("settings:read", { key }, { timeoutMs: 5_000 });
    return { write, read };
  },
  (result) => result.read?.cn === "诊断文案保持中文可读" && result.read?.win?.includes("C:\\Users\\jupiter"),
);
checks.push(settingsStep.check);
data.settings = settingsStep.value;

const graphId = "remove-electron-host-smoke";
const graphStep = await runStep(
  "graph-load-persist-history",
  async () => {
    const loaded = await client.request<{ graph: unknown }>("drama:graph:load", { graphId }, { timeoutMs: 5_000 });
    const persisted = await client.request("drama:graph:persist", {
      graphId,
      graph: loaded.graph,
    }, { timeoutMs: 5_000 });
    const history = await client.request("drama:graph:history", { graphId, maxEvents: 5, maxBackups: 5 }, { timeoutMs: 5_000 });
    return { loaded, persisted, history };
  },
  (result) => Boolean(result.loaded?.graph) && stringify(result.history).includes(graphId),
);
checks.push(graphStep.check);
data.graph = graphStep.value;

const plmStep = await runStep(
  "plm-sidecar-status-logs-codex",
  async () => {
    let sidecar = await client.request<{ state?: string; healthy?: boolean }>("plotpilot:runtime:status", { checkHealth: false }, { timeoutMs: 5_000 });
    if (sidecar.state !== "running" && sidecar.healthy !== true) {
      await client.request("plotpilot:runtime:start", {}, { timeoutMs: 45_000 });
      sidecar = await client.request("plotpilot:runtime:status", { checkHealth: false }, { timeoutMs: 5_000 });
    }
    const logs = await client.request("plotpilot:runtime:logs", { limit: 5 }, { timeoutMs: 5_000 });
    const codex = await client.request("plotpilot:codex:status", undefined, { timeoutMs: 8_000 }).catch((error) => ({
      available: false,
      error: error instanceof Error ? error.message : String(error),
    }));
    return { sidecar, logs, codex };
  },
  (result) => stringify(result.sidecar).includes("running") && stringify(result.logs).length > 0,
);
checks.push(plmStep.check);
data.plm = plmStep.value;

const skillCrewStep = await runStep(
  "skill-crew-refresh-run-feedback",
  async () => {
    const refresh = await client.request("skill-crew:refresh-skills", { roomId: graphId }, { timeoutMs: 5_000 });
    const run = await client.request("skill-crew:run-codex-skill", {
      graphId,
      nodeId: "runtime-smoke-node",
      agentId: "runtime-smoke-agent",
      title: "Runtime smoke output",
      body: "Skill Crew 通过 Drama Runtime 记录输出。",
    }, { timeoutMs: 5_000 });
    const feedback = await client.request("skill-crew:record-feedback", {
      graphId,
      nodeId: "runtime-smoke-node",
      agentId: "runtime-smoke-agent",
      title: "Runtime smoke feedback",
      body: "Skill Crew feedback 通过 Drama Runtime 写入。",
    }, { timeoutMs: 5_000 });
    return { refresh, run, feedback };
  },
  (result) => stringify(result.refresh).includes("drama-runtime") && stringify(result.run).includes("graphId"),
);
checks.push(skillCrewStep.check);
data.skillCrew = skillCrewStep.value;

const basicMemorySmokePath = "zz-drama-verification/remove-electron-host-smoke.md";
const basicMemoryFile = path.join(basicMemoryRoot, basicMemorySmokePath);
const basicMemoryHadExisting = existsSync(basicMemoryFile);
const basicMemoryBackup = basicMemoryHadExisting ? readFileSync(basicMemoryFile, "utf8") : "";
mkdirSync(path.dirname(basicMemoryFile), { recursive: true });
writeFileSync(
  basicMemoryFile,
  [
    "---",
    "title: Drama Runtime Basic Memory Smoke",
    "type: verification",
    "---",
    "",
    "# Drama Runtime Basic Memory Smoke",
    "",
    "remove-electron-host smoke note. 中文状态：知识库读写通过。",
    "",
  ].join("\n"),
);

const basicMemoryStep = await runStep(
  "basic-memory-list-search-read-write",
  async () => {
    const list = await client.request("basicMemory:list", { query: "remove-electron-host", limit: 5 }, { timeoutMs: 5_000 });
    const search = await client.request("basic-memory:search", { query: "Basic Memory Smoke", limit: 5 }, { timeoutMs: 5_000 });
    const read = await client.request<{ content: string }>("basic-memory:read", { path: basicMemorySmokePath }, { timeoutMs: 5_000 });
    const write = await client.request<{ content: string }>("basic-memory:write", {
      path: basicMemorySmokePath,
      content: `${read.content}\n保存回写：通过 Drama Runtime。\n`,
    }, { timeoutMs: 5_000 });
    return { list, search, read, write };
  },
  (result) =>
    stringify(result.list).includes("remove-electron-host") &&
    stringify(result.search).includes("Basic Memory") &&
    result.read.content.includes("中文状态") &&
    result.write.content.includes("保存回写"),
);
checks.push(basicMemoryStep.check);
data.basicMemory = basicMemoryStep.value;

if (basicMemoryHadExisting) {
  writeFileSync(basicMemoryFile, basicMemoryBackup);
} else {
  rmSync(basicMemoryFile, { force: true });
}

const diagnosticsStep = await runStep(
  "diagnostics-snapshot-process",
  async () => {
    const snapshot = await client.request("diagnostics:snapshot", undefined, { timeoutMs: 5_000 });
    const process = await client.request("diagnostics:process", undefined, { timeoutMs: 5_000 });
    return { snapshot, process };
  },
  (result) => stringify(result.snapshot).includes("capabilities") && stringify(result.process).includes("pid"),
);
checks.push(diagnosticsStep.check);
data.diagnostics = diagnosticsStep.value;

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
