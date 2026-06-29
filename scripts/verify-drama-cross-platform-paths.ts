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

function readJsonIfExists(filePath: string): unknown {
  if (!filePath || !existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const runtimeUrl = argValue("--runtime-url", "http://127.0.0.1:3198");
const outPath = process.argv.includes("--out") ? path.resolve(argValue("--out", "")) : "";
const uiEvidencePath = path.resolve(
  argValue(
    "--ui-evidence",
    "openspec/changes/remove-electron-host/evidence/stage-08-source-built-ui-runtime-parity.json",
  ),
);
const client = createDramaRuntimeClient({ baseUrl: runtimeUrl, timeoutMs: 8_000 });

const checks: Check[] = [];
const data: Record<string, unknown> = {};

const statusStep = await runStep(
  "runtime-status-ready",
  () => client.getStatus({ timeoutMs: 5_000 }),
  (status) => status.state === "ready",
  (status) => `state=${status.state}; workspace=${(status as { workspaceRoot?: string }).workspaceRoot ?? "unknown"}`,
);
checks.push(statusStep.check);
data.status = statusStep.value;

const workspaceRoot = (statusStep.value as { workspaceRoot?: string } | undefined)?.workspaceRoot
  ?? path.join(process.env.HOME ?? "/tmp", ".craft-agent/workspaces/my-workspace");
const basicMemoryRoot = (statusStep.value as { basicMemoryRoot?: string } | undefined)?.basicMemoryRoot
  ?? path.join(process.env.HOME ?? "/tmp", "basic-memory-claude-history");

const macLongDir = path.join(
  workspaceRoot,
  ".drama-verification",
  "remove-electron-host",
  "路径验收-这是一个很长的目录名-用于验证-Gecko-和-Runtime-不依赖-Electron-IPC",
  "第-001-章-低价值碰撞样本-人物-顾临川-沈知夏-环境-高淳",
);
const macLongFile = path.join(macLongDir, "章节正文-含中文-空格-和-long-path-fixture.md");
const windowsStyleFile = "C:\\Users\\jupiter\\Drama Browser\\Basic Memory\\Claude 历史\\第 1 章.md";
const windowsStyleGraph = "C:/Users/jupiter/Drama Browser/Graph/状态机.json";
const chineseStatus = "中文状态：路径、恢复和诊断文案保持可读";
const longContent = [
  "# Drama cross-platform path smoke",
  "",
  chineseStatus,
  `macOS long path: ${macLongFile}`,
  `Windows file fixture: ${windowsStyleFile}`,
  `Windows graph fixture: ${windowsStyleGraph}`,
  "",
].join("\n");

const fileStep = await runStep(
  "long-macos-path-file-roundtrip",
  async () => {
    const write = await client.request<{ content: string; path: string; root: string }>("files:writeText", {
      path: macLongFile,
      content: longContent,
    }, { timeoutMs: 8_000 });
    const read = await client.request<{ content: string; path: string; root: string }>("files:readText", {
      path: macLongFile,
    }, { timeoutMs: 8_000 });
    const preview = await client.request<{ content: string }>("files:preview", {
      path: macLongFile,
    }, { timeoutMs: 8_000 });
    return { write, read, preview };
  },
  (result) =>
    result.write.root === "workspace" &&
    result.read.content.includes(chineseStatus) &&
    result.preview.content.includes(windowsStyleFile),
  () => macLongFile,
);
checks.push(fileStep.check);
data.file = fileStep.value;

const sessionId = "remove-electron-host-cross-platform-paths";
const sessionStep = await runStep(
  "session-path-fixtures",
  async () => {
    const mac = await client.request("sessions:command", {
      sessionId,
      command: { type: "updateWorkingDirectory", dir: macLongDir },
    }, { timeoutMs: 5_000 });
    const win = await client.request("sessions:command", {
      sessionId,
      command: {
        type: "setLabels",
        labels: ["Windows fixture", windowsStyleFile, chineseStatus],
      },
    }, { timeoutMs: 5_000 });
    const status = await client.request("sessions:status", { sessionId }, { timeoutMs: 5_000 });
    return { mac, win, status };
  },
  (result) => {
    const status = result.status as { workingDirectory?: string; labels?: string[] };
    return status.workingDirectory === macLongDir && (status.labels ?? []).includes(windowsStyleFile);
  },
);
checks.push(sessionStep.check);
data.session = sessionStep.value;

const settingsStep = await runStep(
  "settings-windows-style-path-fixtures",
  async () => {
    const value = {
      macLongFile,
      windowsStyleFile,
      windowsStyleGraph,
      status: chineseStatus,
    };
    const write = await client.request("settings:write", {
      key: "remove-electron-host.cross-platform-paths",
      value,
    }, { timeoutMs: 5_000 });
    const read = await client.request<typeof value>("settings:read", {
      key: "remove-electron-host.cross-platform-paths",
    }, { timeoutMs: 5_000 });
    return { write, read };
  },
  (result) =>
    result.read?.windowsStyleFile === windowsStyleFile &&
    result.read?.status === chineseStatus,
);
checks.push(settingsStep.check);
data.settings = settingsStep.value;

const graphStep = await runStep(
  "graph-project-file-path-fixtures",
  async () => {
    const record = await client.request("drama:projectFile:record", {
      projectId: "remove-electron-host-cross-platform-paths",
      source: "graph",
      type: "path-fixture",
      title: "跨平台路径验收",
      summary: {
        macLongFile,
        windowsStyleFile,
        windowsStyleGraph,
        status: chineseStatus,
      },
      payload: {
        macLongFile,
        windowsStyleFile,
        windowsStyleGraph,
      },
      markdown: [
        "# 跨平台路径验收",
        "",
        chineseStatus,
        "",
        `- macOS: ${macLongFile}`,
        `- Windows: ${windowsStyleFile}`,
      ].join("\n"),
    }, { timeoutMs: 8_000 });
    const list = await client.request("drama:projectFile:list", {
      projectId: "remove-electron-host-cross-platform-paths",
      source: "graph",
      typePrefix: "path",
      limit: 5,
    }, { timeoutMs: 8_000 });
    return { record, list };
  },
  (result) => {
    const list = result.list as { files?: Array<{ title?: string; summary?: Record<string, unknown> }> };
    return (list.files ?? []).some((file) =>
      file.title === "跨平台路径验收" && file.summary?.windowsStyleFile === windowsStyleFile
    );
  },
);
checks.push(graphStep.check);
data.graph = graphStep.value;

const skillCrewStep = await runStep(
  "skill-crew-path-copy-fixture",
  async () => {
    const feedback = await client.request("skill-crew:record-feedback", {
      graphId: "remove-electron-host-cross-platform-paths",
      nodeId: "path-fixture-node",
      agentId: "path-fixture-agent",
      title: "路径验收反馈",
      body: `${chineseStatus}\n${windowsStyleFile}\n${macLongFile}`,
    }, { timeoutMs: 8_000 });
    return feedback;
  },
  (result) => stringify(result).includes("path-fixture-node") || stringify(result).includes("graphId"),
);
checks.push(skillCrewStep.check);
data.skillCrew = skillCrewStep.value;

const basicMemoryPath = "zz-drama-verification/remove-electron-host/路径验收-第-001-章.md";
const basicMemoryFile = path.join(basicMemoryRoot, basicMemoryPath);
const basicMemoryHadExisting = existsSync(basicMemoryFile);
const basicMemoryBackup = basicMemoryHadExisting ? readFileSync(basicMemoryFile, "utf8") : "";
mkdirSync(path.dirname(basicMemoryFile), { recursive: true });
writeFileSync(
  basicMemoryFile,
  [
    "---",
    "title: Drama Cross Platform Path Smoke",
    "type: verification",
    "---",
    "",
    "# Drama Cross Platform Path Smoke",
    "",
    chineseStatus,
    "",
    `Windows fixture: ${windowsStyleFile}`,
    `macOS long fixture: ${macLongFile}`,
    "",
  ].join("\n"),
);

const basicMemoryStep = await runStep(
  "basic-memory-path-fixtures",
  async () => {
    const list = await client.request("basicMemory:list", { query: "路径验收", limit: 10 }, { timeoutMs: 5_000 });
    const search = await client.request("basic-memory:search", { query: windowsStyleFile, limit: 10 }, { timeoutMs: 5_000 });
    const read = await client.request<{ content: string }>("basic-memory:read", { path: basicMemoryPath }, {
      timeoutMs: 5_000,
    });
    return { list, search, read };
  },
  (result) =>
    stringify(result.list).includes("路径验收") &&
    stringify(result.search).includes("Windows fixture") &&
    result.read.content.includes(chineseStatus),
);
checks.push(basicMemoryStep.check);
data.basicMemory = basicMemoryStep.value;

if (basicMemoryHadExisting) {
  writeFileSync(basicMemoryFile, basicMemoryBackup);
} else {
  rmSync(basicMemoryFile, { force: true });
}

const diagnosticsStep = await runStep(
  "diagnostics-chinese-path-copy",
  async () => {
    const snapshot = await client.request("diagnostics:snapshot", undefined, { timeoutMs: 5_000 });
    return snapshot;
  },
  (snapshot) => stringify(snapshot).includes("workspaceRoot") && stringify(snapshot).includes("basicMemoryRoot"),
);
checks.push(diagnosticsStep.check);
data.diagnostics = diagnosticsStep.value;

const uiEvidence = readJsonIfExists(uiEvidencePath) as {
  ok?: boolean;
  screenshots?: Record<string, string>;
  surfaces?: Array<{ screenshot?: { path?: string; captured?: boolean } }>;
} | null;
const screenshotValues = uiEvidence?.screenshots
  ? Object.values(uiEvidence.screenshots)
  : (uiEvidence?.surfaces ?? [])
    .map((surface) => surface.screenshot?.path)
    .filter((file): file is string => Boolean(file));
checks.push(check(
  "source-built-ui-evidence-references-surfaces",
  uiEvidence?.ok === true &&
    screenshotValues.length >= 5 &&
    (uiEvidence.surfaces ?? []).every((surface) => surface.screenshot?.captured === true) &&
    screenshotValues.every((file) => existsSync(file)),
  uiEvidence
    ? `${screenshotValues.length} screenshots referenced from ${uiEvidencePath}`
    : `missing UI parity evidence at ${uiEvidencePath}`,
));
data.uiEvidence = {
  path: uiEvidencePath,
  ok: uiEvidence?.ok ?? false,
  screenshots: screenshotValues,
};

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
