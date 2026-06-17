param(
  [string]$ZenExe = "",
  [string]$ShortZenRoot = "C:\Users\gengr\zen-build",
  [string]$Profile = "C:\Users\gengr\zen-build\profile-drama-main",
  [ValidateSet("graph", "plm", "crew")]
  [string]$Surface = "graph",
  [string]$RuntimeUrl = "http://127.0.0.1:3198",
  [switch]$NoRuntimeLaunch,
  [switch]$PrepareOnly,
  [switch]$WaitForExit
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

function Resolve-ZenExe {
  param(
    [string]$ExplicitZenExe,
    [string]$BuildRoot
  )

  if ($ExplicitZenExe -and (Test-Path -LiteralPath $ExplicitZenExe)) {
    return (Resolve-Path -LiteralPath $ExplicitZenExe).Path
  }

  $candidates = @(
    (Join-Path $BuildRoot "engine\obj-x86_64-pc-windows-msvc\dist\bin\zen.exe"),
    "C:\Users\gengr\Downloads\open-source-clients\zen-browser\engine\obj-x86_64-pc-windows-msvc\dist\bin\zen.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  throw "Built Zen executable not found. Run Zen full build first, or pass -ZenExe."
}

function Test-DramaRuntimeReady {
  param([string]$BaseUrl)

  try {
    $status = Invoke-RestMethod -Uri "$BaseUrl/runtime/status" -Method Get -TimeoutSec 2
    return $status.state -eq "ready"
  } catch {
    return $false
  }
}

function Wait-DramaRuntimeReady {
  param(
    [string]$BaseUrl,
    [int]$TimeoutSeconds = 45
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-DramaRuntimeReady -BaseUrl $BaseUrl) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Focus-ZenDramaWindow {
  param(
    [string]$ZenExecutable,
    [string]$ProfileDir
  )

  try {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class ZenDramaLauncherWindowTools {
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@ -ErrorAction SilentlyContinue

    $existing = Get-CimInstance Win32_Process -Filter "name = 'zen.exe'" |
      Where-Object {
        $_.ExecutablePath -eq $ZenExecutable -and
        $_.CommandLine -like "*$ProfileDir*"
      } |
      Select-Object -First 1

    if (-not $existing) {
      return $false
    }

    $process = Get-Process -Id $existing.ProcessId -ErrorAction SilentlyContinue
    if (-not $process -or $process.MainWindowHandle -eq 0) {
      return $false
    }

    [void][ZenDramaLauncherWindowTools]::ShowWindow([IntPtr]$process.MainWindowHandle, 9)
    [void][ZenDramaLauncherWindowTools]::SetForegroundWindow([IntPtr]$process.MainWindowHandle)
    Write-Host "Focused existing Zen Drama window."
    Write-Host "ProcessId: $($process.Id)"
    return $true
  } catch {
    Write-Warning "Could not focus existing Zen Drama window: $($_.Exception.Message)"
    return $false
  }
}

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
  param([string]$ProfileDir)

  $prefName = "browser.uiCustomization.state"
  $stateJson = $null
  foreach ($fileName in @("user.js", "prefs.js")) {
    $filePath = Join-Path $ProfileDir $fileName
    if (-not (Test-Path -LiteralPath $filePath)) {
      continue
    }
    $stateJson = Get-FirefoxStringPrefValue -Lines @(Get-Content -LiteralPath $filePath) -PrefName $prefName
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

  $surfaceButtons = @("zen-drama-graph-sidebar-button", "zen-drama-plm-sidebar-button", "zen-drama-crew-sidebar-button")
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
    if ($text -and -not ($staleButtons -contains $text)) {
      [void]$foot.Add($text)
    }
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

  return 'user_pref("' + $prefName + '", "' + (ConvertTo-FirefoxPrefString ($state | ConvertTo-Json -Depth 20 -Compress)) + '");'
}

function Set-ZenDramaProfilePrefs {
  param(
    [string]$ProfileDir,
    [string]$BaseRuntimeUrl,
    [string]$InitialSurface,
    [string]$DramaRepoRoot
  )

  New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

  $userJs = Join-Path $ProfileDir "user.js"
  $existing = @()
  if (Test-Path -LiteralPath $userJs) {
    $existing = Get-Content -LiteralPath $userJs | Where-Object {
      $_ -notmatch '^user_pref\("zen\.drama\.' -and
      $_ -notmatch '^user_pref\("browser\.uiCustomization\.state"'
    }
  }

  $runtimeBase = $BaseRuntimeUrl.TrimEnd("/")
  $launchScript = Join-Path $DramaRepoRoot "scripts\launch-drama-runtime.ps1"
  $launchArgsJson = ConvertTo-Json @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $launchScript
  ) -Compress

  $dramaPrefs = [System.Collections.Generic.List[string]]::new()
  $dramaPrefs.Add('user_pref("zen.drama.base-url", "' + (ConvertTo-FirefoxPrefString "$runtimeBase/app") + '");')
  $dramaPrefs.Add('user_pref("zen.drama.runtime-url", "' + (ConvertTo-FirefoxPrefString $runtimeBase) + '");')
  $dramaPrefs.Add('user_pref("zen.drama.internal-app.enabled", true);')
  $dramaPrefs.Add('user_pref("zen.drama.internal-app-url", "chrome://browser/content/drama/app/index.html");')
  $dramaPrefs.Add('user_pref("zen.drama.open-on-startup", true);')
  $dramaPrefs.Add('user_pref("zen.drama.start-surface", "' + (ConvertTo-FirefoxPrefString $InitialSurface) + '");')
  $dramaPrefs.Add('user_pref("zen.drama.runtime-launch.enabled", true);')
  $dramaPrefs.Add('user_pref("zen.drama.runtime-launch.command", "powershell.exe");')
  $dramaPrefs.Add('user_pref("zen.drama.runtime-launch.args", "' + (ConvertTo-FirefoxPrefString $launchArgsJson) + '");')
  $dramaPrefs.Add('user_pref("zen.drama.runtime-launch.cwd", "' + (ConvertTo-FirefoxPrefString $DramaRepoRoot) + '");')
  $dramaPrefs.Add('user_pref("zen.drama.runtime-launch.timeout-ms", 45000);')

  $toolbarCustomizationLine = Get-ZenDramaToolbarCustomizationPrefLine -ProfileDir $ProfileDir
  $lines = @($existing) + @($toolbarCustomizationLine) + @($dramaPrefs.ToArray())
  $lines | Set-Content -LiteralPath $userJs -Encoding UTF8
  return $userJs
}

function Invoke-RobocopyMirror {
  param(
    [string]$Source,
    [string]$Destination
  )

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  & robocopy $Source $Destination /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
  $exitCode = $LASTEXITCODE
  if ($exitCode -gt 7) {
    throw "robocopy failed from $Source to $Destination with exit code $exitCode."
  }
  $global:LASTEXITCODE = 0
}

function Sync-ZenDramaInternalAppResources {
  param(
    [string]$ZenExecutable,
    [string]$BuildRoot,
    [string]$DramaRepoRoot
  )

  $browserShellDist = Join-Path $DramaRepoRoot "apps\drama-browser-shell\dist"
  $browserShellIndex = Join-Path $browserShellDist "index.html"
  if (-not (Test-Path -LiteralPath $browserShellIndex)) {
    throw "Drama browser shell dist is missing: $browserShellIndex"
  }

  $zenBinDir = Split-Path -Parent $ZenExecutable
  $internalAppDir = Join-Path $zenBinDir "browser\chrome\browser\content\browser\drama\app"
  Invoke-RobocopyMirror -Source $browserShellDist -Destination $internalAppDir

  $repoManagerSource = Join-Path $repoRoot "zen-drama-chrome\ZenDramaManager.mjs"
  $managerSource = if (Test-Path -LiteralPath $repoManagerSource) {
    $repoManagerSource
  } else {
    Join-Path $BuildRoot "src\zen\drama\ZenDramaManager.mjs"
  }
  $managerDest = Join-Path $zenBinDir "browser\chrome\browser\content\browser\zen-components\ZenDramaManager.mjs"
  if (Test-Path -LiteralPath $managerSource) {
    Copy-Item -LiteralPath $managerSource -Destination $managerDest -Force
  }

  Write-Host "Synced Drama internal app resources." -ForegroundColor Green
  Write-Host "Internal app: chrome://browser/content/drama/app/index.html"
  Write-Host "Files: $internalAppDir"
}

$resolvedZenExe = Resolve-ZenExe -ExplicitZenExe $ZenExe -BuildRoot $ShortZenRoot
$runtimeBaseUrl = $RuntimeUrl.TrimEnd("/")

if (-not $NoRuntimeLaunch) {
  $runtimeLauncher = Join-Path $repoRoot "scripts\launch-drama-runtime.ps1"
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runtimeLauncher
  if ($LASTEXITCODE -ne 0) {
    throw "Drama runtime launcher failed with exit code $LASTEXITCODE."
  }
}

if (-not (Wait-DramaRuntimeReady -BaseUrl $runtimeBaseUrl -TimeoutSeconds 45)) {
  throw "Drama runtime did not become ready at $runtimeBaseUrl."
}

Sync-ZenDramaInternalAppResources `
  -ZenExecutable $resolvedZenExe `
  -BuildRoot $ShortZenRoot `
  -DramaRepoRoot $repoRoot

$userJsPath = Set-ZenDramaProfilePrefs `
  -ProfileDir $Profile `
  -BaseRuntimeUrl $runtimeBaseUrl `
  -InitialSurface $Surface `
  -DramaRepoRoot $repoRoot

if ($PrepareOnly) {
  Write-Host "Prepared Zen Drama profile." -ForegroundColor Green
  Write-Host "Zen: $resolvedZenExe"
  Write-Host "Profile: $Profile"
  Write-Host "Prefs: $userJsPath"
  Write-Host "Runtime: $runtimeBaseUrl"
  Write-Host "Surface: $Surface"
  exit 0
}

if (Focus-ZenDramaWindow -ZenExecutable $resolvedZenExe -ProfileDir $Profile) {
  exit 0
}

$zenArgs = @(
  "-no-remote",
  "-profile",
  $Profile,
  "about:blank"
)

$process = Start-Process `
  -FilePath $resolvedZenExe `
  -ArgumentList $zenArgs `
  -WorkingDirectory (Split-Path $resolvedZenExe) `
  -PassThru

Write-Host "Started Zen Drama main path." -ForegroundColor Green
Write-Host "Zen: $resolvedZenExe"
Write-Host "Profile: $Profile"
Write-Host "Prefs: $userJsPath"
Write-Host "Runtime: $runtimeBaseUrl"
Write-Host "Surface: $Surface"
Write-Host "ProcessId: $($process.Id)"

if ($WaitForExit) {
  Wait-Process -Id $process.Id
}
