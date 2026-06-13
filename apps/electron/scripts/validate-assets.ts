import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const requiredPaths = [
  'dist/resources',
  'dist/resources/config-defaults.json',
  'dist/resources/docs',
  'dist/resources/permissions/default.json',
  'dist/resources/release-notes',
  'dist/resources/themes',
  'dist/resources/tool-icons',
  'dist/resources/powershell-parser.ps1',
  'dist/resources/plotpilot_embedded_boot.py',
];

const missing = requiredPaths.filter((path) => !existsSync(path));

if (missing.length > 0) {
  console.error('Missing bundled assets:');
  for (const path of missing) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

const requiredNonEmptyDirs = [
  'dist/resources/docs',
  'dist/resources/release-notes',
  'dist/resources/themes',
  'dist/resources/tool-icons',
];

for (const dir of requiredNonEmptyDirs) {
  const entries = readdirSync(dir);
  if (entries.length === 0) {
    console.error(`Bundled asset directory is empty: ${dir}`);
    process.exit(1);
  }
}

const parserPath = join('dist', 'resources', 'powershell-parser.ps1');
if (!statSync(parserPath).isFile()) {
  console.error(`Bundled asset is not a file: ${parserPath}`);
  process.exit(1);
}

const plotpilotBootPath = join('dist', 'resources', 'plotpilot_embedded_boot.py');
if (!statSync(plotpilotBootPath).isFile()) {
  console.error(`Bundled asset is not a file: ${plotpilotBootPath}`);
  process.exit(1);
}

const plotpilotSidecarRoot = join('dist', 'resources', 'plotpilot');
const plotpilotSourceEntry = join(plotpilotSidecarRoot, 'interfaces', 'main.py');
const plotpilotPythonCandidates = process.platform === 'win32'
  ? [
      join(plotpilotSidecarRoot, '.venv', 'Scripts', 'python.exe'),
      join(plotpilotSidecarRoot, 'python', 'python.exe'),
      join('dist', 'resources', 'bin', `${process.platform}-${process.arch}`, 'uv.exe'),
    ]
  : [
      join(plotpilotSidecarRoot, '.venv', 'bin', 'python'),
      join(plotpilotSidecarRoot, 'python', 'bin', 'python'),
      join('dist', 'resources', 'bin', `${process.platform}-${process.arch}`, 'uv'),
    ];
const hasPlotPilotSidecar = existsSync(plotpilotSourceEntry);
const hasPlotPilotPython = plotpilotPythonCandidates.some((candidate) => existsSync(candidate));
if (!hasPlotPilotSidecar || !hasPlotPilotPython) {
  const message = [
    'PlotPilot portable sidecar is incomplete.',
    `- source: ${hasPlotPilotSidecar ? 'ok' : 'missing dist/resources/plotpilot/interfaces/main.py'}`,
    `- runner: ${hasPlotPilotPython ? 'ok' : 'missing bundled PlotPilot Python runtime, .venv, or uv'}`,
  ].join('\n');
  if (process.env.DRAMA_REQUIRE_PLOTPILOT_SIDECAR === '1') {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
}

console.log('✓ Validated bundled assets');
