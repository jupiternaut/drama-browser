param(
  [string]$PackageDir = "",
  [string]$PackageZip = "",
  [string]$InstallDir = "",
  [string]$OutputDir = "",
  [ValidateSet("graph", "plm", "crew")]
  [string]$Surface = "plm",
  [switch]$AllSurfaces,
  [switch]$CheckRouteSwitches,
  [switch]$KeepPackage,
  [switch]$KeepProfiles,
  [switch]$NoStrict
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $PackageDir) {
  $PackageDir = Join-Path $repoRoot "dist\zen-drama-win-x64"
}
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

function Invoke-CheckedPowerShell {
  param(
    [string]$ScriptPath,
    [string[]]$ArgumentList
  )

  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "$ScriptPath failed with exit code $LASTEXITCODE."
  }
}

function Resolve-PackageFromZip {
  param(
    [string]$Zip,
    [string]$TempRoot
  )

  New-Item -ItemType Directory -Force -Path $TempRoot | Out-Null
  $zipPath = Join-Path $TempRoot "zen-drama-package.zip"
  $extractRoot = Join-Path $TempRoot "package"

  if ($Zip -match '^https?://') {
    Invoke-WebRequest -Uri $Zip -OutFile $zipPath
  } else {
    $sourceZip = Get-FullPath $Zip
    Test-RequiredPath -Path $sourceZip -Label "Zen Drama package zip"
    Copy-Item -LiteralPath $sourceZip -Destination $zipPath -Force
  }

  Expand-Archive -LiteralPath $zipPath -DestinationPath $extractRoot -Force

  if (Test-Path -LiteralPath (Join-Path $extractRoot "manifest.json")) {
    return $extractRoot
  }

  $candidates = @(
    Get-ChildItem -LiteralPath $extractRoot -Directory -ErrorAction SilentlyContinue |
      Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "manifest.json") }
  )
  if ($candidates.Count -eq 1) {
    return $candidates[0].FullName
  }

  throw "Package zip did not expand to a Zen Drama package root containing manifest.json."
}

$tempRoot = $null
try {
  if ($PackageZip) {
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("zen-drama-windows-gate-" + [System.Guid]::NewGuid().ToString("N"))
    $packageRoot = Resolve-PackageFromZip -Zip $PackageZip -TempRoot $tempRoot
  } else {
    $packageRoot = Get-FullPath $PackageDir
  }

  $installRoot = Get-FullPath $InstallDir
  $outputRoot = Get-FullPath $OutputDir
  $packageVerifier = Join-Path $PSScriptRoot "verify-zen-drama-package.ps1"
  $installer = Join-Path $PSScriptRoot "install-zen-drama-package.ps1"
  $marionetteVerifier = Join-Path $PSScriptRoot "verify-zen-drama-win-marionette.ps1"

  Test-RequiredPath -Path (Join-Path $packageRoot "manifest.json") -Label "Zen Drama package manifest"
  Test-RequiredPath -Path (Join-Path $packageRoot "zen\zen.exe") -Label "Packaged Zen executable"
  Test-RequiredPath -Path $packageVerifier -Label "Package verifier"
  Test-RequiredPath -Path $installer -Label "Package installer"
  Test-RequiredPath -Path $marionetteVerifier -Label "Windows Marionette verifier"

  New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

  Invoke-CheckedPowerShell -ScriptPath $packageVerifier -ArgumentList @(
    "-PackageDir",
    $packageRoot
  )

  Invoke-CheckedPowerShell -ScriptPath $installer -ArgumentList @(
    "-PackageDir",
    $packageRoot,
    "-InstallDir",
    $installRoot,
    "-NoShortcut"
  )

  $verifyArgs = @(
    "-InstallDir",
    $installRoot,
    "-OutputDir",
    $outputRoot,
    "-Surface",
    $Surface
  )
  if ($AllSurfaces) {
    $verifyArgs += "-AllSurfaces"
  }
  if ($CheckRouteSwitches) {
    $verifyArgs += "-CheckRouteSwitches"
  }
  if ($KeepProfiles) {
    $verifyArgs += "-KeepProfiles"
  }
  if ($NoStrict) {
    $verifyArgs += "-NoStrict"
  }

  Invoke-CheckedPowerShell -ScriptPath $marionetteVerifier -ArgumentList $verifyArgs

  $summaryPath = Join-Path $outputRoot "zen-drama-win-marionette-summary-current.json"
  Test-RequiredPath -Path $summaryPath -Label "Windows Marionette summary"
  $summary = Get-Content -LiteralPath $summaryPath -Raw | ConvertFrom-Json
  if (-not $summary.ok -and -not $NoStrict) {
    throw "Windows Marionette summary reported ok=false: $summaryPath"
  }

  $gateSummary = [ordered]@{
    ok = [bool]$summary.ok
    schema = "zen-drama-windows-product-gate.v1"
    checkedAt = (Get-Date).ToUniversalTime().ToString("o")
    packageRoot = $packageRoot
    installDir = $installRoot
    outputDir = $outputRoot
    summary = $summaryPath
    surfaces = $summary.surfaces
  }
  $gateSummaryPath = Join-Path $outputRoot "zen-drama-windows-product-gate-current.json"
  $gateSummary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $gateSummaryPath -Encoding UTF8
  $gateSummary | ConvertTo-Json -Depth 8
} finally {
  if ($tempRoot -and -not $KeepPackage) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
