param(
  [string]$ZenBinDir = "",
  [string]$ShortZenRoot = "C:\Users\gengr\zen-build",
  [string]$OutputDir = "",
  [ValidateSet("graph", "plm", "crew")]
  [string]$Surface = "graph",
  [string]$PlotPilotProjectRoot = "",
  [switch]$NoPlotPilotBundle,
  [switch]$SkipBuild,
  [switch]$Zip,
  [switch]$AllowOutsideRepo
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputDir) {
  $OutputDir = Join-Path $repoRoot "dist\zen-drama-win-x64"
}

function Get-FullPath {
  param([string]$Path)

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }
  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Path))
}

function Assert-SafeOutputPath {
  param(
    [string]$Candidate,
    [switch]$AllowOutside
  )

  $full = Get-FullPath $Candidate
  $distRoot = Get-FullPath (Join-Path $repoRoot "dist")
  $comparison = [System.StringComparison]::OrdinalIgnoreCase

  if ($full.Equals($distRoot, $comparison)) {
    throw "OutputDir must be a child directory of dist, not dist itself: $full"
  }

  if (-not $AllowOutside) {
    $prefix = $distRoot.TrimEnd('\') + '\'
    if (-not $full.StartsWith($prefix, $comparison)) {
      throw "Refusing to package outside repo dist without -AllowOutsideRepo: $full"
    }
  }

  return $full
}

function Resolve-BunExe {
  $candidates = @()
  if ($env:BUN_EXE) {
    $candidates += $env:BUN_EXE
  }
  $candidates += (Join-Path $env:USERPROFILE ".bun\bin\bun.exe")

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  $command = Get-Command bun -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  throw "bun was not found. Install Bun or set BUN_EXE."
}

function Resolve-ZenBinDir {
  param(
    [string]$ExplicitZenBinDir,
    [string]$BuildRoot
  )

  $candidates = @()
  if ($ExplicitZenBinDir) {
    $candidates += $ExplicitZenBinDir
  }
  $candidates += @(
    (Join-Path $BuildRoot "engine\obj-x86_64-pc-windows-msvc\dist\bin"),
    "C:\Users\gengr\Downloads\open-source-clients\zen-browser\engine\obj-x86_64-pc-windows-msvc\dist\bin"
  )

  foreach ($candidate in $candidates) {
    if (-not $candidate) {
      continue
    }

    $candidatePath = Get-FullPath $candidate
    if ((Test-Path -LiteralPath $candidatePath -PathType Leaf) -and ((Split-Path -Leaf $candidatePath) -ieq "zen.exe")) {
      return Split-Path -Parent $candidatePath
    }

    $zenExe = Join-Path $candidatePath "zen.exe"
    if (Test-Path -LiteralPath $zenExe) {
      return $candidatePath
    }
  }

  throw "Built Zen bin directory not found. Run the Zen build first or pass -ZenBinDir."
}

function Resolve-PlotPilotProjectRoot {
  param([string]$ExplicitProjectRoot)

  $candidates = @()
  if ($ExplicitProjectRoot) {
    $candidates += $ExplicitProjectRoot
  }
  if ($env:PLOTPILOT_PROJECT_ROOT) {
    $candidates += $env:PLOTPILOT_PROJECT_ROOT
  }
  $candidates += @(
    (Join-Path $env:USERPROFILE "Downloads\PlotPilot-plm-v46-read"),
    (Join-Path $env:USERPROFILE "Downloads\PlotPilot-plm-v46"),
    (Join-Path $env:USERPROFILE "Downloads\PlotPilot-plm-v451-read"),
    (Join-Path $env:USERPROFILE "Downloads\PlotPilot-plm")
  )

  foreach ($candidate in $candidates) {
    if (-not $candidate) {
      continue
    }

    $full = Get-FullPath $candidate
    if (Test-Path -LiteralPath (Join-Path $full "interfaces\main.py")) {
      return $full
    }
  }

  if ($ExplicitProjectRoot) {
    throw "PlotPilot project root is invalid or missing interfaces\main.py: $ExplicitProjectRoot"
  }

  return $null
}

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$WorkingDirectory = $repoRoot
  )

  & $FilePath @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $($ArgumentList -join ' ') failed with exit code $LASTEXITCODE."
  }
}

function Invoke-RobocopyMirror {
  param(
    [string]$Source,
    [string]$Destination,
    [string[]]$ExcludeDirs = @(),
    [string[]]$ExcludeFiles = @()
  )

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  $arguments = @($Source, $Destination, "/MIR", "/NFL", "/NDL", "/NJH", "/NJS", "/NP")
  if ($ExcludeDirs.Count -gt 0) {
    $arguments += "/XD"
    $arguments += $ExcludeDirs
  }
  if ($ExcludeFiles.Count -gt 0) {
    $arguments += "/XF"
    $arguments += $ExcludeFiles
  }

  & robocopy @arguments
  $exitCode = $LASTEXITCODE
  if ($exitCode -gt 7) {
    throw "robocopy failed from $Source to $Destination with exit code $exitCode."
  }
  $global:LASTEXITCODE = 0
}

function Write-TextFile {
  param(
    [string]$Path,
    [string]$Content
  )

  $parent = Split-Path -Parent $Path
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
  Set-Content -LiteralPath $Path -Encoding UTF8 -Value $Content
}

$outputRoot = Assert-SafeOutputPath -Candidate $OutputDir -AllowOutside:$AllowOutsideRepo
$bunExe = Resolve-BunExe
$zenBin = Resolve-ZenBinDir -ExplicitZenBinDir $ZenBinDir -BuildRoot $ShortZenRoot
$resolvedPlotPilotRoot = if ($NoPlotPilotBundle) { $null } else { Resolve-PlotPilotProjectRoot -ExplicitProjectRoot $PlotPilotProjectRoot }

Write-Host "Packaging Zen Drama main path..." -ForegroundColor Cyan
Write-Host "Repo: $repoRoot"
Write-Host "Zen bin: $zenBin"
Write-Host "Output: $outputRoot"
if ($resolvedPlotPilotRoot) {
  Write-Host "PlotPilot: $resolvedPlotPilotRoot"
} else {
  Write-Host "PlotPilot: not bundled"
}

if (-not $SkipBuild) {
  Push-Location $repoRoot
  try {
    Invoke-Checked -FilePath $bunExe -ArgumentList @("run", "drama:build-packages")
    Invoke-Checked -FilePath $bunExe -ArgumentList @("run", "browser-shell:build")
  } finally {
    Pop-Location
  }
}

$browserShellDist = Join-Path $repoRoot "apps\drama-browser-shell\dist"
$browserShellIndex = Join-Path $browserShellDist "index.html"
if (-not (Test-Path -LiteralPath $browserShellIndex)) {
  throw "Drama browser shell build is missing: $browserShellIndex"
}

$runtimeSource = Join-Path $repoRoot "apps\drama-runtime\src\server.ts"
if (-not (Test-Path -LiteralPath $runtimeSource)) {
  throw "Drama runtime source is missing: $runtimeSource"
}

if (Test-Path -LiteralPath $outputRoot) {
  Remove-Item -LiteralPath $outputRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

$zenDest = Join-Path $outputRoot "zen"
$shellDest = Join-Path $outputRoot "drama-browser-shell\dist"
$internalShellDest = Join-Path $zenDest "browser\chrome\browser\content\browser\drama\app"
$runtimeDest = Join-Path $outputRoot "runtime"
$resourcesDest = Join-Path $outputRoot "resources"
$binDest = Join-Path $outputRoot "bin"
$plotPilotSourceDest = Join-Path $resourcesDest "plotpilot\source"

Invoke-RobocopyMirror -Source $zenBin -Destination $zenDest
Invoke-RobocopyMirror -Source $browserShellDist -Destination $shellDest
Invoke-RobocopyMirror -Source $browserShellDist -Destination $internalShellDest

$repoZenDramaChrome = Join-Path $repoRoot "zen-drama-chrome"
$zenDramaManagerSource = Join-Path $repoZenDramaChrome "ZenDramaManager.mjs"
if (-not (Test-Path -LiteralPath $zenDramaManagerSource)) {
  $zenDramaManagerSource = Join-Path $ShortZenRoot "src\zen\drama\ZenDramaManager.mjs"
}
$zenDramaManagerDest = Join-Path $zenDest "browser\chrome\browser\content\browser\zen-components\ZenDramaManager.mjs"
if (Test-Path -LiteralPath $zenDramaManagerSource) {
  Copy-Item -LiteralPath $zenDramaManagerSource -Destination $zenDramaManagerDest -Force
}

$zenDramaCssSource = Join-Path $repoZenDramaChrome "zen-drama.css"
if (Test-Path -LiteralPath $zenDramaCssSource) {
  Copy-Item -LiteralPath $zenDramaCssSource -Destination (Join-Path $zenDest "browser\chrome\browser\content\browser\zen-styles\zen-drama.css") -Force
}

foreach ($iconName in @("drama-graph.svg", "drama-plm.svg", "drama-crew.svg")) {
  $iconPath = Join-Path $repoZenDramaChrome $iconName
  if (Test-Path -LiteralPath $iconPath) {
    Copy-Item -LiteralPath $iconPath -Destination (Join-Path $zenDest "browser\chrome\browser\content\browser\zen-icons\$iconName") -Force
  }
}

New-Item -ItemType Directory -Force -Path $runtimeDest, $resourcesDest, $binDest | Out-Null

$plotPilotBundle = [ordered]@{
  bundled = $false
  source = $null
  sourceRoot = $null
  includesVenv = $false
  python = $null
  excludedDirs = @(".git", ".pytest_cache", "__pycache__", "logs", "projects")
  excludedFiles = @(".env", ".env.local", ".env.production", "*.pyc", "*.log")
}

if ($resolvedPlotPilotRoot) {
  Invoke-RobocopyMirror `
    -Source $resolvedPlotPilotRoot `
    -Destination $plotPilotSourceDest `
    -ExcludeDirs $plotPilotBundle["excludedDirs"] `
    -ExcludeFiles $plotPilotBundle["excludedFiles"]

  $plotPilotPython = Join-Path $plotPilotSourceDest ".venv\Scripts\python.exe"
  $plotPilotBundle.bundled = $true
  $plotPilotBundle.source = "resources\plotpilot\source"
  $plotPilotBundle.sourceRoot = $resolvedPlotPilotRoot
  $plotPilotBundle.includesVenv = Test-Path -LiteralPath (Join-Path $plotPilotSourceDest ".venv")
  $plotPilotBundle.python = if (Test-Path -LiteralPath $plotPilotPython) { "resources\plotpilot\source\.venv\Scripts\python.exe" } else { $null }
}

$runtimeBundle = Join-Path $runtimeDest "drama-runtime.js"
Invoke-Checked -FilePath $bunExe -ArgumentList @(
  "build",
  $runtimeSource,
  "--target=bun",
  "--outfile",
  $runtimeBundle
)

$plmBootShim = Join-Path $repoRoot "packages\drama-plm\resources\plotpilot_embedded_boot.py"
if (Test-Path -LiteralPath $plmBootShim) {
  Copy-Item -LiteralPath $plmBootShim -Destination (Join-Path $resourcesDest "plotpilot_embedded_boot.py") -Force
} else {
  Write-Warning "PLM embedded boot shim was not found: $plmBootShim"
}

$iconSource = Join-Path $repoRoot "apps\electron\resources\drama-icon.ico"
if (Test-Path -LiteralPath $iconSource) {
  Copy-Item -LiteralPath $iconSource -Destination (Join-Path $resourcesDest "drama-icon.ico") -Force
}

if ((Split-Path -Leaf $bunExe) -ieq "bun.exe") {
  Copy-Item -LiteralPath $bunExe -Destination (Join-Path $binDest "bun.exe") -Force
} else {
  Write-Warning "Resolved Bun is not bun.exe, so the package launcher will fall back to PATH: $bunExe"
}

$runtimeLauncher = @'
param(
  [int]$RuntimePort = 3198,
  [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = "Stop"

$packageRoot = $PSScriptRoot
$runtimeUrl = "http://127.0.0.1:$RuntimePort"
$logDir = Join-Path $packageRoot "logs"
$runtimeLog = Join-Path $logDir "drama-runtime-$RuntimePort.log"
$launcherLog = Join-Path $logDir "drama-runtime-launcher-$RuntimePort.log"
$runtimeScript = Join-Path $packageRoot "runtime\drama-runtime.js"
$browserShellDist = Join-Path $packageRoot "drama-browser-shell\dist"
$resourcesDir = Join-Path $packageRoot "resources"
$bootShim = Join-Path $resourcesDir "plotpilot_embedded_boot.py"
$plotPilotRoot = Join-Path $resourcesDir "plotpilot\source"
$plotPilotPython = Join-Path $plotPilotRoot ".venv\Scripts\python.exe"
$bunExe = Join-Path $packageRoot "bin\bun.exe"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-DramaRuntimeLog {
  param([string]$Message)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $launcherLog -Encoding UTF8 -Value "[$timestamp] $Message"
}

function Test-DramaRuntimeReady {
  try {
    $status = Invoke-RestMethod -Uri "$runtimeUrl/runtime/status" -Method Get -TimeoutSec 1
    return $status.state -eq "ready" -and (Test-RuntimeOwnedByPackage -Status $status)
  } catch {
    return $false
  }
}

function Get-DramaRuntimeStatus {
  try {
    return Invoke-RestMethod -Uri "$runtimeUrl/runtime/status" -Method Get -TimeoutSec 1
  } catch {
    return $null
  }
}

function Test-RuntimeOwnedByPackage {
  param([object]$Status)

  if (-not $Status -or $Status.state -ne "ready") {
    return $false
  }
  $reportedRoot = [string]$Status.runtimePackageRoot
  if (-not $reportedRoot) {
    return $false
  }
  return [System.IO.Path]::GetFullPath($reportedRoot).Equals(
    [System.IO.Path]::GetFullPath($packageRoot),
    [System.StringComparison]::OrdinalIgnoreCase
  )
}

function Stop-ForeignDramaRuntime {
  $status = Get-DramaRuntimeStatus
  if (-not $status -or $status.state -ne "ready" -or (Test-RuntimeOwnedByPackage -Status $status)) {
    return
  }

  Write-DramaRuntimeLog "Stopping foreign Drama runtime before starting packaged runtime. Reported runtimePackageRoot=$($status.runtimePackageRoot)"
  try {
    Invoke-RestMethod -Uri "$runtimeUrl/runtime/shutdown" -Method Post -Body "{}" -ContentType "application/json" -TimeoutSec 3 | Out-Null
  } catch {
    Write-DramaRuntimeLog "Foreign runtime shutdown request failed: $($_.Exception.Message)"
  }

  Start-Sleep -Milliseconds 800
}

function Wait-DramaRuntimeReady {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-DramaRuntimeReady) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

if (-not (Test-Path -LiteralPath $bunExe)) {
  $bunCommand = Get-Command bun -ErrorAction Stop
  $bunExe = $bunCommand.Source
}

if (-not (Test-Path -LiteralPath $runtimeScript)) {
  throw "Packaged Drama runtime script is missing: $runtimeScript"
}

if (-not (Test-Path -LiteralPath (Join-Path $browserShellDist "index.html"))) {
  throw "Packaged Drama browser shell is missing: $browserShellDist"
}

$plotPilotEnv = ""
if (Test-Path -LiteralPath (Join-Path $plotPilotRoot "interfaces\main.py")) {
  $plotPilotEnv += "`$env:PLOTPILOT_PROJECT_ROOT = '$plotPilotRoot'`r`n"
  if (Test-Path -LiteralPath $plotPilotPython) {
    $plotPilotEnv += "`$env:PLOTPILOT_PYTHON_EXE = '$plotPilotPython'`r`n"
  }
}

Write-DramaRuntimeLog "Starting packaged Drama runtime for $runtimeUrl"

if (Test-DramaRuntimeReady) {
  Write-DramaRuntimeLog "Drama runtime is already ready."
  exit 0
}

Stop-ForeignDramaRuntime

$runtimeCommand = @"
`$env:DRAMA_RUNTIME_PORT = '$RuntimePort'
`$env:DRAMA_BROWSER_SHELL_DIST = '$browserShellDist'
`$env:DRAMA_RESOURCES_BASE = '$resourcesDir'
`$env:DRAMA_ZEN_PACKAGE_RESOURCES = '$resourcesDir'
`$env:DRAMA_PLOTPILOT_BOOT_SHIM = '$bootShim'
`$env:DRAMA_RUNTIME_PACKAGE_ROOT = '$packageRoot'
$plotPilotEnv
& '$bunExe' '$runtimeScript' *> '$runtimeLog'
"@

Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $runtimeCommand) `
  -WindowStyle Hidden `
  -WorkingDirectory $packageRoot

if (Wait-DramaRuntimeReady) {
  Write-DramaRuntimeLog "Drama runtime is ready."
  exit 0
}

Write-DramaRuntimeLog "Timed out waiting for Drama runtime."
exit 1
'@

$zenLauncher = @'
param(
  [ValidateSet("graph", "plm", "crew")]
  [string]$Surface = "graph",
  [int]$RuntimePort = 3198,
  [switch]$NoRuntimeLaunch,
  [switch]$WaitForExit
)

$ErrorActionPreference = "Stop"

$packageRoot = $PSScriptRoot
$zenExe = Join-Path $packageRoot "zen\zen.exe"
$profileDir = Join-Path $packageRoot "profile"
$runtimeUrl = "http://127.0.0.1:$RuntimePort"
$runtimeLauncher = Join-Path $packageRoot "Start-Drama-Runtime.ps1"
$logDir = Join-Path $packageRoot "logs"

function ConvertTo-FirefoxPrefString {
  param([string]$Value)

  return $Value.Replace('\', '\\').Replace('"', '\"')
}

function ConvertFrom-FirefoxPrefString {
  param([string]$Value)

  return [System.Text.RegularExpressions.Regex]::Unescape($Value)
}

function Get-FirefoxStringPrefValue {
  param(
    [string[]]$Lines,
    [string]$PrefName
  )

  $escapedName = [System.Text.RegularExpressions.Regex]::Escape($PrefName)
  foreach ($line in $Lines) {
    if ($line -match ('^user_pref\("' + $escapedName + '", "(.*)"\);')) {
      return ConvertFrom-FirefoxPrefString $Matches[1]
    }
  }
  return $null
}

function Set-ObjectProperty {
  param(
    [object]$Target,
    [string]$Name,
    [object]$Value
  )

  if ($Target.PSObject.Properties.Name -contains $Name) {
    $Target.$Name = $Value
  } else {
    $Target | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
  }
}

function Get-ZenDramaToolbarCustomizationPrefLine {
  $prefName = "browser.uiCustomization.state"
  $stateJson = $null

  foreach ($fileName in @("user.js", "prefs.js")) {
    $filePath = Join-Path $profileDir $fileName
    if (-not (Test-Path -LiteralPath $filePath)) {
      continue
    }
    $lines = @(Get-Content -LiteralPath $filePath)
    $stateJson = Get-FirefoxStringPrefValue -Lines $lines -PrefName $prefName
    if ($stateJson) {
      break
    }
  }

  $state = $null
  if ($stateJson) {
    try {
      $state = $stateJson | ConvertFrom-Json
    } catch {
      $state = $null
    }
  }

  if (-not $state) {
    $state = [pscustomobject]@{
      placements = [pscustomobject]@{
        "zen-sidebar-foot-buttons" = @("downloads-button", "zen-workspaces-button", "zen-create-new-button")
      }
      seen = @()
      dirtyAreaCache = @("zen-sidebar-foot-buttons")
      currentVersion = 24
      newElementCount = 0
    }
  }

  if (-not $state.placements) {
    Set-ObjectProperty -Target $state -Name "placements" -Value ([pscustomobject]@{})
  }

  $surfaceButtons = @(
    "zen-drama-graph-sidebar-button",
    "zen-drama-plm-sidebar-button",
    "zen-drama-crew-sidebar-button"
  )
  $staleButtons = @("zen-drama-button") + $surfaceButtons
  $placementName = "zen-sidebar-foot-buttons"
  $existingFoot = @()
  if ($state.placements.PSObject.Properties.Name -contains $placementName) {
    $existingFoot = @($state.placements.$placementName)
  }
  if ($existingFoot.Count -eq 0) {
    $existingFoot = @("downloads-button", "zen-workspaces-button", "zen-create-new-button")
  }

  $foot = [System.Collections.Generic.List[string]]::new()
  foreach ($item in $existingFoot) {
    $text = [string]$item
    if (-not $text -or $staleButtons -contains $text) {
      continue
    }
    [void]$foot.Add($text)
  }

  $insertIndex = $foot.IndexOf("zen-create-new-button")
  if ($insertIndex -lt 0) {
    foreach ($button in $surfaceButtons) {
      [void]$foot.Add($button)
    }
  } else {
    for ($index = $surfaceButtons.Count - 1; $index -ge 0; $index--) {
      $foot.Insert($insertIndex, $surfaceButtons[$index])
    }
  }

  Set-ObjectProperty -Target $state.placements -Name $placementName -Value @($foot.ToArray())

  $seen = [System.Collections.Generic.List[string]]::new()
  foreach ($item in @($state.seen)) {
    $text = [string]$item
    if ($text -and -not $seen.Contains($text)) {
      [void]$seen.Add($text)
    }
  }
  foreach ($button in $surfaceButtons) {
    if (-not $seen.Contains($button)) {
      [void]$seen.Add($button)
    }
  }
  Set-ObjectProperty -Target $state -Name "seen" -Value @($seen.ToArray())

  $dirty = [System.Collections.Generic.List[string]]::new()
  foreach ($item in @($state.dirtyAreaCache)) {
    $text = [string]$item
    if ($text -and -not $dirty.Contains($text)) {
      [void]$dirty.Add($text)
    }
  }
  if (-not $dirty.Contains($placementName)) {
    [void]$dirty.Add($placementName)
  }
  Set-ObjectProperty -Target $state -Name "dirtyAreaCache" -Value @($dirty.ToArray())

  $nextJson = $state | ConvertTo-Json -Depth 20 -Compress
  return 'user_pref("' + $prefName + '", "' + (ConvertTo-FirefoxPrefString $nextJson) + '");'
}

function Test-DramaRuntimeReady {
  try {
    $status = Invoke-RestMethod -Uri "$runtimeUrl/runtime/status" -Method Get -TimeoutSec 1
    return $status.state -eq "ready"
  } catch {
    return $false
  }
}

function Wait-DramaRuntimeReady {
  param([int]$TimeoutSeconds = 45)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-DramaRuntimeReady) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Get-DramaRuntimeStatusForPort {
  param([int]$Port)

  try {
    return Invoke-RestMethod -Uri "http://127.0.0.1:$Port/runtime/status" -Method Get -TimeoutSec 1
  } catch {
    return $null
  }
}

function Test-RuntimeOwnedByPackage {
  param([object]$Status)

  if (-not $Status -or $Status.state -ne "ready") {
    return $false
  }
  $reportedRoot = [string]$Status.runtimePackageRoot
  if (-not $reportedRoot) {
    return $false
  }
  return [System.IO.Path]::GetFullPath($reportedRoot).Equals(
    [System.IO.Path]::GetFullPath($packageRoot),
    [System.StringComparison]::OrdinalIgnoreCase
  )
}

function Test-TcpPortOpen {
  param([int]$Port)

  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    return $async.AsyncWaitHandle.WaitOne(200) -and $client.Connected
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

function Resolve-DramaRuntimePort {
  param([int]$PreferredPort)

  $preferredStatus = Get-DramaRuntimeStatusForPort -Port $PreferredPort
  if (Test-RuntimeOwnedByPackage -Status $preferredStatus) {
    return $PreferredPort
  }
  if (-not (Test-TcpPortOpen -Port $PreferredPort)) {
    return $PreferredPort
  }

  foreach ($candidate in 3199..3298) {
    $status = Get-DramaRuntimeStatusForPort -Port $candidate
    if (Test-RuntimeOwnedByPackage -Status $status) {
      return $candidate
    }
    if (-not (Test-TcpPortOpen -Port $candidate)) {
      return $candidate
    }
  }

  throw "No free Drama runtime port was found in 3198-3298."
}

function Set-ZenDramaProfilePrefs {
  New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

  $userJs = Join-Path $profileDir "user.js"
  $existing = @()
  if (Test-Path -LiteralPath $userJs) {
    $existing = Get-Content -LiteralPath $userJs | Where-Object {
      $_ -notmatch '^user_pref\("zen\.drama\.' -and
      $_ -notmatch '^user_pref\("browser\.uiCustomization\.state"'
    }
  }

  $launchArgsJson = ConvertTo-Json @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $runtimeLauncher,
    "-RuntimePort",
    "$RuntimePort"
  ) -Compress

  $toolbarCustomizationLine = Get-ZenDramaToolbarCustomizationPrefLine
  $lines = @($existing) + @($toolbarCustomizationLine) + @(
    'user_pref("zen.drama.base-url", "' + (ConvertTo-FirefoxPrefString "$runtimeUrl/app") + '");',
    'user_pref("zen.drama.runtime-url", "' + (ConvertTo-FirefoxPrefString $runtimeUrl) + '");',
    'user_pref("zen.drama.internal-app.enabled", true);',
    'user_pref("zen.drama.internal-app-url", "chrome://browser/content/drama/app/index.html");',
    'user_pref("zen.drama.open-on-startup", true);',
    'user_pref("zen.drama.start-surface", "' + (ConvertTo-FirefoxPrefString $Surface) + '");',
    'user_pref("zen.drama.runtime-launch.enabled", true);',
    'user_pref("zen.drama.runtime-launch.command", "powershell.exe");',
    'user_pref("zen.drama.runtime-launch.args", "' + (ConvertTo-FirefoxPrefString $launchArgsJson) + '");',
    'user_pref("zen.drama.runtime-launch.cwd", "' + (ConvertTo-FirefoxPrefString $packageRoot) + '");',
    'user_pref("zen.drama.runtime-launch.timeout-ms", 45000);'
  )

  $nextContent = ($lines -join [Environment]::NewLine) + [Environment]::NewLine
  $previousContent = if (Test-Path -LiteralPath $userJs) { Get-Content -LiteralPath $userJs -Raw } else { "" }
  $nextContent | Set-Content -LiteralPath $userJs -Encoding UTF8 -NoNewline
  return [pscustomobject]@{
    Path = $userJs
    Changed = ($previousContent -ne $nextContent)
  }
}

function Clear-ZenDramaChromeCaches {
  $cachePaths = @(
    (Join-Path $profileDir "startupCache")
  )

  foreach ($cachePath in $cachePaths) {
    Remove-Item -LiteralPath $cachePath -Recurse -Force -ErrorAction SilentlyContinue
  }
}

function Focus-ZenDramaWindow {
  try {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class PackagedZenDramaWindowTools {
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@ -ErrorAction SilentlyContinue

    $existing = Get-CimInstance Win32_Process -Filter "name = 'zen.exe'" |
      Where-Object {
        $_.ExecutablePath -eq $zenExe -and
        $_.CommandLine -like "*$profileDir*"
      } |
      Select-Object -First 1

    if (-not $existing) {
      return $false
    }

    $process = Get-Process -Id $existing.ProcessId -ErrorAction SilentlyContinue
    if (-not $process -or $process.MainWindowHandle -eq 0) {
      return $false
    }

    [void][PackagedZenDramaWindowTools]::ShowWindow([IntPtr]$process.MainWindowHandle, 9)
    [void][PackagedZenDramaWindowTools]::SetForegroundWindow([IntPtr]$process.MainWindowHandle)
    Write-Host "Focused existing packaged Zen Drama window."
    return $process.Id
  } catch {
    Write-Warning "Could not focus existing packaged Zen Drama window: $($_.Exception.Message)"
    return $null
  }
}

function Stop-PackagedZenDramaProcesses {
  $processes = @(Get-CimInstance Win32_Process -Filter "name = 'zen.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $_.ExecutablePath -eq $zenExe -and
      $_.CommandLine -like "*$profileDir*"
    })

  foreach ($process in $processes) {
    & taskkill /F /T /PID $process.ProcessId 2>$null | Out-Null
  }
}

function Resolve-ZenDramaMonitorProcessId {
  param(
    [int]$FallbackProcessId,
    [int]$TimeoutSeconds = 12
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $candidates = Get-CimInstance Win32_Process -Filter "name = 'zen.exe'" |
      Where-Object {
        $_.ExecutablePath -eq $zenExe -and
        $_.CommandLine -like "*$profileDir*"
      }

    foreach ($candidate in $candidates) {
      $candidateProcess = Get-Process -Id $candidate.ProcessId -ErrorAction SilentlyContinue
      if ($candidateProcess -and $candidateProcess.MainWindowHandle -ne 0) {
        return $candidateProcess.Id
      }
    }

    $fallbackProcess = Get-Process -Id $FallbackProcessId -ErrorAction SilentlyContinue
    if ($fallbackProcess -and $fallbackProcess.MainWindowHandle -ne 0) {
      return $fallbackProcess.Id
    }

    Start-Sleep -Milliseconds 300
  } while ((Get-Date) -lt $deadline)

  $remaining = Get-CimInstance Win32_Process -Filter "name = 'zen.exe'" |
    Where-Object {
      $_.ExecutablePath -eq $zenExe -and
      $_.CommandLine -like "*$profileDir*"
    } |
    Select-Object -First 1

  if ($remaining) {
    return [int]$remaining.ProcessId
  }

  return $FallbackProcessId
}

function Start-DramaRuntimeLifecycleMonitor {
  param([int]$ZenProcessId)

  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $monitorLog = Join-Path $logDir "drama-runtime-monitor-$RuntimePort.log"
  $existingMonitor = Get-CimInstance Win32_Process -Filter "name = 'powershell.exe'" |
    Where-Object {
      $_.CommandLine -like "*drama-runtime-monitor-$RuntimePort.log*" -and
      $_.CommandLine -like "*Wait-Process -Id $ZenProcessId*"
    } |
    Select-Object -First 1

  if ($existingMonitor) {
    return
  }

  $escapedPackageRoot = $packageRoot.Replace("'", "''")
  $escapedRuntimeUrl = $runtimeUrl.Replace("'", "''")
  $escapedMonitorLog = $monitorLog.Replace("'", "''")
  $monitorCommand = @"
`$ErrorActionPreference = 'SilentlyContinue'
try {
  Wait-Process -Id $ZenProcessId
  Start-Sleep -Milliseconds 600
  `$status = Invoke-RestMethod -Uri '$escapedRuntimeUrl/runtime/status' -Method Get -TimeoutSec 2
  `$reportedRoot = [string]`$status.runtimePackageRoot
  if (`$reportedRoot -and [System.IO.Path]::GetFullPath(`$reportedRoot).Equals([System.IO.Path]::GetFullPath('$escapedPackageRoot'), [System.StringComparison]::OrdinalIgnoreCase)) {
    Invoke-RestMethod -Uri '$escapedRuntimeUrl/runtime/shutdown' -Method Post -Body '{ "stopPlotPilot": true }' -ContentType 'application/json' -TimeoutSec 5 | Out-Null
    Add-Content -LiteralPath '$escapedMonitorLog' -Encoding UTF8 -Value "[$(Get-Date -Format o)] stopped packaged Drama runtime after Zen exit"
  }
} catch {
  Add-Content -LiteralPath '$escapedMonitorLog' -Encoding UTF8 -Value "[$(Get-Date -Format o)] monitor failed: `$(`$_.Exception.Message)"
}
"@

  Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $monitorCommand) `
    -WindowStyle Hidden `
    -WorkingDirectory $packageRoot | Out-Null
}

if (-not (Test-Path -LiteralPath $zenExe)) {
  throw "Packaged Zen executable is missing: $zenExe"
}

$RuntimePort = Resolve-DramaRuntimePort -PreferredPort $RuntimePort
$runtimeUrl = "http://127.0.0.1:$RuntimePort"

if (-not $NoRuntimeLaunch) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runtimeLauncher -RuntimePort $RuntimePort
  if ($LASTEXITCODE -ne 0) {
    throw "Packaged Drama runtime launcher failed with exit code $LASTEXITCODE."
  }
}

if (-not (Wait-DramaRuntimeReady -TimeoutSeconds 45)) {
  throw "Drama runtime did not become ready at $runtimeUrl."
}

$profilePrefs = Set-ZenDramaProfilePrefs
Clear-ZenDramaChromeCaches

$focusedZenProcessId = Focus-ZenDramaWindow
if ($focusedZenProcessId) {
  if ($profilePrefs.Changed) {
    Write-Host "Drama profile changed; restarting packaged Zen Drama window."
    Stop-PackagedZenDramaProcesses
    Start-Sleep -Milliseconds 800
  } else {
    if (-not $NoRuntimeLaunch) {
      Start-DramaRuntimeLifecycleMonitor -ZenProcessId $focusedZenProcessId
    }
    exit 0
  }
}

$process = Start-Process `
  -FilePath $zenExe `
  -ArgumentList @("-no-remote", "-profile", $profileDir, "about:blank") `
  -WorkingDirectory (Split-Path $zenExe) `
  -PassThru

Write-Host "Started packaged Zen Drama." -ForegroundColor Green
Write-Host "Zen: $zenExe"
Write-Host "Profile: $profileDir"
Write-Host "Prefs: $($profilePrefs.Path)"
Write-Host "Runtime: $runtimeUrl"
Write-Host "Surface: $Surface"
Write-Host "ProcessId: $($process.Id)"

if (-not $NoRuntimeLaunch) {
  $monitorProcessId = Resolve-ZenDramaMonitorProcessId -FallbackProcessId $process.Id
  Start-DramaRuntimeLifecycleMonitor -ZenProcessId $monitorProcessId
}

if ($WaitForExit) {
  Wait-Process -Id $process.Id
}
'@

$shortcutInstaller = @'
param(
  [ValidateSet("graph", "plm", "crew")]
  [string]$Surface = "graph"
)

$ErrorActionPreference = "Stop"

$packageRoot = $PSScriptRoot
$launcher = Join-Path $packageRoot "Start-Drama-Zen.ps1"
$zenExe = Join-Path $packageRoot "zen\zen.exe"
$icon = Join-Path $packageRoot "resources\drama-icon.ico"
$shortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "Drama.lnk"

if (-not (Test-Path -LiteralPath $launcher)) {
  throw "Packaged launcher is missing: $launcher"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launcher`" -Surface $Surface"
$shortcut.WorkingDirectory = $packageRoot
$shortcut.Description = "Drama in Zen Browser"
if (Test-Path -LiteralPath $icon) {
  $shortcut.IconLocation = "$icon,0"
} elseif (Test-Path -LiteralPath $zenExe) {
  $shortcut.IconLocation = "$zenExe,0"
}
$shortcut.Save()

Write-Host "Installed Drama desktop shortcut." -ForegroundColor Green
Write-Host $shortcutPath
'@

$logOpener = @'
$ErrorActionPreference = "Stop"

$packageRoot = $PSScriptRoot
$logDir = Join-Path $packageRoot "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Start-Process -FilePath "explorer.exe" -ArgumentList @($logDir)
Write-Host "Opened Drama logs." -ForegroundColor Green
Write-Host $logDir
'@

$uninstaller = @'
param(
  [switch]$KeepProfile,
  [switch]$KeepLogs
)

$ErrorActionPreference = "Stop"

$installRoot = $PSScriptRoot
$shortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "Drama.lnk"

function Stop-InstalledDramaRuntime {
  try {
    $status = Invoke-RestMethod -Uri "http://127.0.0.1:3198/runtime/status" -Method Get -TimeoutSec 2
    if (
      $status.state -eq "ready" -and
      [string]$status.runtimePackageRoot -and
      [System.IO.Path]::GetFullPath([string]$status.runtimePackageRoot).Equals(
        [System.IO.Path]::GetFullPath($installRoot),
        [System.StringComparison]::OrdinalIgnoreCase
      )
    ) {
      Invoke-RestMethod -Uri "http://127.0.0.1:3198/runtime/shutdown" -Method Post -Body "{}" -ContentType "application/json" -TimeoutSec 5 | Out-Null
      Start-Sleep -Milliseconds 800
    }
  } catch {
    # Runtime is not running or not owned by this install.
  }
}

function Stop-InstalledZenProcesses {
  $zenExe = Join-Path $installRoot "zen\zen.exe"
  $processes = @(Get-CimInstance Win32_Process -Filter "name = 'zen.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.ExecutablePath -and [System.IO.Path]::GetFullPath($_.ExecutablePath).Equals(
      [System.IO.Path]::GetFullPath($zenExe),
      [System.StringComparison]::OrdinalIgnoreCase
    )
  })
  $installedProcessIds = @($processes | Select-Object -ExpandProperty ProcessId)
  $rootProcesses = @($processes | Where-Object { $installedProcessIds -notcontains $_.ParentProcessId })
  foreach ($process in $rootProcesses) {
    & taskkill /F /T /PID $process.ProcessId 2>$null | Out-Null
  }
}

Stop-InstalledDramaRuntime
Stop-InstalledZenProcesses
Remove-Item -LiteralPath $shortcutPath -Force -ErrorAction SilentlyContinue

$tempScript = Join-Path $env:TEMP ("drama-zen-uninstall-" + [guid]::NewGuid().ToString("N") + ".ps1")
$escapedInstallRoot = $installRoot.Replace("'", "''")
$removeProfile = if ($KeepProfile) { '$false' } else { '$true' }
$removeLogs = if ($KeepLogs) { '$false' } else { '$true' }
@"
`$ErrorActionPreference = 'SilentlyContinue'
Start-Sleep -Milliseconds 800
if ($removeProfile -eq `$false) {
  Get-ChildItem -LiteralPath '$escapedInstallRoot' -Force | Where-Object { `$_.Name -ne 'profile' -and `$_.Name -ne 'profile-marionette-verify' -and `$_.Name -ne 'logs' } | Remove-Item -Recurse -Force
  if ($removeLogs -eq `$true) { Remove-Item -LiteralPath (Join-Path '$escapedInstallRoot' 'logs') -Recurse -Force }
} elseif ($removeLogs -eq `$false) {
  Get-ChildItem -LiteralPath '$escapedInstallRoot' -Force | Where-Object { `$_.Name -ne 'logs' } | Remove-Item -Recurse -Force
} else {
  Remove-Item -LiteralPath '$escapedInstallRoot' -Recurse -Force
}
Remove-Item -LiteralPath '$tempScript' -Force
"@ | Set-Content -LiteralPath $tempScript -Encoding UTF8

Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $tempScript) -WindowStyle Hidden
Write-Host "DramaZen uninstall started." -ForegroundColor Green
'@

Write-TextFile -Path (Join-Path $outputRoot "Start-Drama-Runtime.ps1") -Content $runtimeLauncher
Write-TextFile -Path (Join-Path $outputRoot "Start-Drama-Zen.ps1") -Content $zenLauncher
Write-TextFile -Path (Join-Path $outputRoot "Install-Shortcut.ps1") -Content $shortcutInstaller
Write-TextFile -Path (Join-Path $outputRoot "Open-Drama-Logs.ps1") -Content $logOpener
Write-TextFile -Path (Join-Path $outputRoot "Uninstall-Drama-Zen.ps1") -Content $uninstaller

$manifest = [ordered]@{
  name = "Drama Zen Browser"
  version = "0.2.0"
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  surface = $Surface
  zenExe = "zen\zen.exe"
  runtime = "runtime\drama-runtime.js"
  browserShell = "drama-browser-shell\dist"
  browserShellInternal = "zen\browser\chrome\browser\content\browser\drama\app"
  resources = "resources"
  logs = "logs"
  openLogs = "Open-Drama-Logs.ps1"
  uninstall = "Uninstall-Drama-Zen.ps1"
  plotPilot = $plotPilotBundle
  repoRoot = $repoRoot
  notes = @(
    "This package uses the Zen Browser main path and does not launch Electron.",
    "When PlotPilot is bundled, the package launcher sets PLOTPILOT_PROJECT_ROOT and PLOTPILOT_PYTHON_EXE to resources\plotpilot\source."
  )
}

($manifest | ConvertTo-Json -Depth 4) | Set-Content -LiteralPath (Join-Path $outputRoot "manifest.json") -Encoding UTF8

if ($Zip) {
  $zipPath = "$outputRoot.zip"
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Compress-Archive -Path (Join-Path $outputRoot "*") -DestinationPath $zipPath -Force
  Write-Host "Zip: $zipPath"
}

Write-Host "Zen Drama package is ready." -ForegroundColor Green
Write-Host "Run: powershell -NoProfile -ExecutionPolicy Bypass -File `"$outputRoot\Start-Drama-Zen.ps1`" -Surface $Surface"
