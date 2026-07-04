param(
  [string]$InstallDir = "",
  [ValidateSet("graph", "plm", "crew")]
  [string]$Surface = "plm",
  [switch]$AllSurfaces,
  [string]$RuntimeUrl = "http://127.0.0.1:3198",
  [string]$OutputDir = "",
  [int]$WaitMs = 8000,
  [int]$TimeoutMs = 45000,
  [switch]$CheckRouteSwitches,
  [switch]$KeepProfiles,
  [switch]$NoScreenshot,
  [switch]$NoStrict
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $InstallDir) {
  $InstallDir = Join-Path $env:LOCALAPPDATA "Programs\DramaZen"
}
if (-not $OutputDir) {
  $OutputDir = Join-Path $repoRoot "docs\verification"
}

function Get-FullPath {
  param([string]$Path)

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }
  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Path))
}

function Test-RequiredPath {
  param(
    [string]$Path,
    [string]$Label
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "$Label is missing: $Path"
  }
}

function Resolve-Python {
  $command = Get-Command python -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $uvPython = Join-Path $env:USERPROFILE "AppData\Roaming\uv\python\cpython-3.11.14-windows-x86_64-none\python.exe"
  if (Test-Path -LiteralPath $uvPython) {
    return $uvPython
  }

  throw "Python is required for Marionette verification."
}

function Stop-InstalledZenProcesses {
  param([string]$InstalledZenExe)

  $processes = @(Get-CimInstance Win32_Process -Filter "name = 'zen.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.ExecutablePath -and [System.IO.Path]::GetFullPath($_.ExecutablePath).Equals(
      [System.IO.Path]::GetFullPath($InstalledZenExe),
      [System.StringComparison]::OrdinalIgnoreCase
    )
  })
  $installedProcessIds = @($processes | Select-Object -ExpandProperty ProcessId)
  $rootProcesses = @($processes | Where-Object { $installedProcessIds -notcontains $_.ParentProcessId })

  foreach ($process in $rootProcesses) {
    & taskkill /F /T /PID $process.ProcessId 2>$null | Out-Null
  }
}

function Invoke-Verifier {
  param(
    [string]$Python,
    [string]$Verifier,
    [string]$ZenExe,
    [string]$Profile,
    [string]$TargetSurface,
    [string]$BaseRuntimeUrl,
    [string]$OutputPath,
    [bool]$MeasureRouteSwitches
  )

  $arguments = @(
    $Verifier,
    "--zen-bin",
    $ZenExe,
    "--profile",
    $Profile,
    "--surface",
    $TargetSurface,
    "--runtime-url",
    $BaseRuntimeUrl,
    "--output",
    $OutputPath,
    "--wait-ms",
    [string]$WaitMs,
    "--timeout-ms",
    [string]$TimeoutMs
  )

  if ($MeasureRouteSwitches) {
    $arguments += "--check-route-switches"
  }
  if ($NoScreenshot) {
    $arguments += "--no-screenshot"
  }
  if ($KeepProfiles) {
    $arguments += "--keep-profile"
  }
  if (-not $NoStrict) {
    $arguments += "--strict"
  }

  & $Python @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Zen Drama product-path verifier failed for surface '$TargetSurface' with exit code $LASTEXITCODE."
  }

  return Get-Content -LiteralPath $OutputPath -Raw | ConvertFrom-Json
}

$installRoot = Get-FullPath $InstallDir
$outputRoot = Get-FullPath $OutputDir
$zenExe = Join-Path $installRoot "zen\zen.exe"
$runtimeLauncher = Join-Path $installRoot "Start-Drama-Runtime.ps1"
$manifest = Join-Path $installRoot "manifest.json"
$python = Resolve-Python
$verifier = Join-Path $PSScriptRoot "verify-zen-drama-mac-marionette.py"
$runtimeBaseUrl = $RuntimeUrl.TrimEnd("/")

Test-RequiredPath -Path $zenExe -Label "Installed Zen executable"
Test-RequiredPath -Path $runtimeLauncher -Label "Installed Drama runtime launcher"
Test-RequiredPath -Path $manifest -Label "Installed package manifest"
Test-RequiredPath -Path $verifier -Label "Shared Marionette verifier"

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runtimeLauncher
if ($LASTEXITCODE -ne 0) {
  throw "Installed Drama runtime launcher failed with exit code $LASTEXITCODE."
}

$status = Invoke-RestMethod -Uri "$runtimeBaseUrl/runtime/status" -Method Get -TimeoutSec 3
if ($status.state -ne "ready") {
  throw "Installed Drama runtime is not ready: $($status | ConvertTo-Json -Depth 4)"
}
if (-not $status.runtimePackageRoot) {
  throw "Runtime status does not expose runtimePackageRoot."
}
$runtimePackageRoot = Get-FullPath ([string]$status.runtimePackageRoot)
if (-not $runtimePackageRoot.Equals($installRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Runtime package root is '$runtimePackageRoot', expected '$installRoot'."
}

Stop-InstalledZenProcesses -InstalledZenExe $zenExe

$surfaces = if ($AllSurfaces) { @("graph", "plm", "crew") } else { @($Surface) }
$results = @()
foreach ($targetSurface in $surfaces) {
  $profile = Join-Path $installRoot "profile-marionette-product-$targetSurface"
  if (-not $KeepProfiles) {
    Remove-Item -LiteralPath $profile -Recurse -Force -ErrorAction SilentlyContinue
  }

  $outputPath = Join-Path $outputRoot "zen-drama-win-marionette-$targetSurface-current.json"
  $measureRouteSwitches = $CheckRouteSwitches -or ($targetSurface -eq "plm")
  $result = Invoke-Verifier `
    -Python $python `
    -Verifier $verifier `
    -ZenExe $zenExe `
    -Profile $profile `
    -TargetSurface $targetSurface `
    -BaseRuntimeUrl $runtimeBaseUrl `
    -OutputPath $outputPath `
    -MeasureRouteSwitches $measureRouteSwitches
  $results += $result
}

$summary = [ordered]@{
  ok = -not ($results | Where-Object { -not $_.ok })
  schema = "zen-drama-win-marionette-summary.v1"
  installDir = $installRoot
  zenExe = $zenExe
  runtimeUrl = $runtimeBaseUrl
  runtimePackageRoot = $runtimePackageRoot
  outputDir = $outputRoot
  surfaces = $surfaces
  results = $results
}

$summaryPath = Join-Path $outputRoot "zen-drama-win-marionette-summary-current.json"
$summary | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $summaryPath -Encoding UTF8
$summary | ConvertTo-Json -Depth 12

if (-not $summary.ok -and -not $NoStrict) {
  exit 1
}
