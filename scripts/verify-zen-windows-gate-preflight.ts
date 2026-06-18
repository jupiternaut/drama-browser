import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface CheckResult {
  id: string
  ok: boolean
  message: string
}

function read(path: string): string {
  const fullPath = resolve(path)
  if (!existsSync(fullPath)) {
    throw new Error(`Required file is missing: ${path}`)
  }
  return readFileSync(fullPath, 'utf8')
}

function check(id: string, ok: boolean, message: string): CheckResult {
  return { id, ok, message }
}

function parseArgs(argv: string[]) {
  const args = {
    output: 'docs/verification/zen-drama-win-gate-preflight-current.json',
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--output') {
      const value = argv[index + 1]
      if (!value) throw new Error('--output requires a path')
      args.output = value
      index += 1
    } else if (arg === '--help') {
      console.log('Usage: bun run scripts/verify-zen-windows-gate-preflight.ts [--output PATH]')
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const pythonVerifier = read('scripts/verify-zen-drama-mac-marionette.py')
const winVerifier = read('scripts/verify-zen-drama-win-marionette.ps1')
const winGateRunner = read('scripts/run-zen-drama-windows-gate.ps1')
const prepareZenBin = read('scripts/prepare-zen-windows-bin.ps1')
const winGateWorkflow = read('.github/workflows/zen-drama-windows-product-gate.yml')
const windowsAdapterDependencies = JSON.parse(read('docs/verification/zen-drama-windows-adapter-dependencies-current.json')) as {
  schema?: string
  scope?: {
    thisChangeRequiresWindowsRuntimeVerification?: boolean
    crossPlatformClaimAllowed?: boolean
  }
  commands?: Record<string, string>
  evidencePolicy?: {
    windowsDependencyFileCanSatisfyThisChange?: boolean
    windowsDependencyFileCanSatisfyCrossPlatformRuntimeClaim?: boolean
  }
}
const handoff = read('docs/HANDOFF-zen-drama-migration.md')
const tasks = read('openspec/changes/zen-native-port-performance-uiux/tasks.md')

const winScript = packageJson.scripts?.['zen:drama:verify:marionette:win'] ?? ''
const winGateScript = packageJson.scripts?.['zen:drama:windows-gate'] ?? ''
const sharedScript = packageJson.scripts?.['zen:drama:verify:marionette'] ?? ''

const checks: CheckResult[] = [
  check(
    'package-json-windows-script',
    /verify-zen-drama-win-marionette\.ps1/.test(winScript),
    'package.json exposes the Windows Marionette product-path verifier.',
  ),
  check(
    'package-json-shared-script',
    /verify-zen-drama-mac-marionette\.py/.test(sharedScript),
    'package.json exposes the shared Python Marionette verifier.',
  ),
  check(
    'package-json-windows-gate-script',
    /run-zen-drama-windows-gate\.ps1/.test(winGateScript),
    'package.json exposes the end-to-end Windows product gate runner.',
  ),
  check(
    'package-json-prepare-zen-bin-script',
    /prepare-zen-windows-bin\.ps1/.test(packageJson.scripts?.['zen:drama:prepare-zen-bin:win'] ?? ''),
    'package.json exposes the Windows Zen bin preparation helper.',
  ),
  check(
    'shared-verifier-zen-bin',
    /--zen-bin/.test(pythonVerifier) && /resolve_zen_binary/.test(pythonVerifier),
    'Shared verifier can launch a direct Zen executable, not only a macOS app bundle.',
  ),
  check(
    'shared-verifier-screenshot',
    /WebDriver:TakeScreenshot/.test(pythonVerifier) && /analyze_screenshot/.test(pythonVerifier),
    'Shared verifier captures and analyzes WebDriver screenshots.',
  ),
  check(
    'shared-verifier-budgets',
    /firstStyledViewportMs/.test(pythonVerifier)
      && /routeSwitchMs/.test(pythonVerifier)
      && /startupMainThreadTaskMs/.test(pythonVerifier),
    'Shared verifier enforces first viewport, route switch, and startup responsiveness budgets.',
  ),
  check(
    'windows-wrapper-runtime-package-root',
    /runtimePackageRoot/.test(winVerifier) && /expected '\$installRoot'/.test(winVerifier),
    'Windows wrapper verifies the runtime belongs to the installed package root.',
  ),
  check(
    'windows-wrapper-installed-zen',
    /zen\\zen\.exe/.test(winVerifier) && /--zen-bin/.test(winVerifier),
    'Windows wrapper launches the installed package zen.exe through the shared verifier.',
  ),
  check(
    'windows-wrapper-all-surfaces',
    /\$AllSurfaces/.test(winVerifier) && /@\("graph", "plm", "crew"\)/.test(winVerifier),
    'Windows wrapper can verify Graph, PLM, and Skill Crew product paths.',
  ),
  check(
    'windows-wrapper-summary',
    /zen-drama-win-marionette-summary-current\.json/.test(winVerifier),
    'Windows wrapper writes a summary JSON artifact.',
  ),
  check(
    'windows-gate-runner-installs-package',
    /install-zen-drama-package\.ps1/.test(winGateRunner)
      && /verify-zen-drama-package\.ps1/.test(winGateRunner)
      && /verify-zen-drama-win-marionette\.ps1/.test(winGateRunner),
    'Windows gate runner verifies, installs, and runs Marionette against the package.',
  ),
  check(
    'windows-gate-runner-artifact',
    /zen-drama-windows-product-gate-current\.json/.test(winGateRunner),
    'Windows gate runner writes a product-gate summary artifact.',
  ),
  check(
    'windows-gate-workflow',
    /windows-latest/.test(winGateWorkflow)
      && /run-zen-drama-windows-gate\.ps1/.test(winGateWorkflow)
      && /prepare-zen-windows-bin\.ps1/.test(winGateWorkflow)
      && /package-zen-drama-win\.ps1/.test(winGateWorkflow)
      && /upload-artifact/.test(winGateWorkflow),
    'GitHub workflow can build a package from a Zen installer, run the Windows product gate, and upload evidence.',
  ),
  check(
    'prepare-zen-bin-from-installer',
    /zen\.installer\.exe/.test(prepareZenBin)
      && /7-Zip/.test(prepareZenBin)
      && /zen\.exe/.test(prepareZenBin),
    'Windows Zen bin preparation can download/extract an official Zen installer into a packageable bin tree.',
  ),
  check(
    'windows-adapter-dependency-file',
    windowsAdapterDependencies.schema === 'zen-drama-windows-adapter-dependencies.v1'
      && windowsAdapterDependencies.scope?.thisChangeRequiresWindowsRuntimeVerification === false
      && windowsAdapterDependencies.scope?.crossPlatformClaimAllowed === false
      && windowsAdapterDependencies.evidencePolicy?.windowsDependencyFileCanSatisfyThisChange === true
      && windowsAdapterDependencies.evidencePolicy?.windowsDependencyFileCanSatisfyCrossPlatformRuntimeClaim === false,
    'Windows adapter dependency file records this change boundary without claiming Windows runtime verification.',
  ),
  check(
    'windows-adapter-command-file',
    /zen:drama:prepare-zen-bin:win/.test(windowsAdapterDependencies.commands?.prepareZenBin ?? '')
      && /zen:drama:package:win/.test(windowsAdapterDependencies.commands?.package ?? '')
      && /zen:drama:windows-gate/.test(windowsAdapterDependencies.commands?.runtimeProductGate ?? ''),
    'Windows adapter dependency file records prepare/package/runtime-gate commands.',
  ),
  check(
    'handoff-windows-command',
    /zen:drama:verify:marionette:win -- -AllSurfaces -CheckRouteSwitches/.test(handoff),
    'Handoff documents the Windows product-path Marionette gate command.',
  ),
  check(
    'handoff-windows-gate-command',
    /zen:drama:windows-gate/.test(handoff)
      && /zen-drama-windows-product-gate-current\.json/.test(handoff),
    'Handoff documents the end-to-end Windows product gate runner and artifact.',
  ),
  check(
    'handoff-windows-adapter-boundary',
    /zen-drama-windows-adapter-dependencies-current\.json/.test(handoff)
      && /Windows support is represented by an adapter dependency file/.test(handoff),
    'Handoff documents that Windows is an adapter dependency deliverable, not a runtime success claim for this change.',
  ),
  check(
    'handoff-no-cross-platform-claim',
    /cross-platform Zen-native runtime success is not claimed until the Windows package gate passes/.test(handoff),
    'Handoff blocks cross-platform runtime wording until Windows gate evidence exists.',
  ),
  check(
    'openspec-windows-adapter-task-complete',
    /- \[x\] 7\.4 Record the Windows adapter dependency file/.test(tasks),
    'OpenSpec task 7.4 is complete under the current macOS-only runtime verification scope.',
  ),
]

const ok = checks.every((item) => item.ok)
const output = {
  ok,
  schema: 'zen-drama-windows-gate-preflight.v1',
  checkedAt: new Date().toISOString(),
  checks,
  nextWindowsCommand: 'gh workflow run zen-drama-windows-product-gate.yml --ref <branch-with-this-change>',
  packageZipCommand: 'bun run zen:drama:windows-gate -- -PackageZip "path-or-url-to-zen-drama-win-x64.zip" -AllSurfaces -CheckRouteSwitches',
  installedPackageCommand: 'bun run zen:drama:verify:marionette:win -- -AllSurfaces -CheckRouteSwitches',
}

writeFileSync(resolve(args.output), `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(JSON.stringify(output, null, 2))

if (!ok) {
  process.exit(1)
}
