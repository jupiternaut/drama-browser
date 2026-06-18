param(
  [string]$ZenBinDir = "",
  [string]$ZenInstallerUrl = "https://github.com/zen-browser/desktop/releases/latest/download/zen.installer.exe",
  [string]$OutputDir = "",
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputDir) {
  $OutputDir = Join-Path $repoRoot "dist\zen-windows-bin"
}

function Get-FullPath {
  param([string]$Path)

  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }
  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Path))
}

function Test-ZenBinDir {
  param([string]$Candidate)

  if (-not $Candidate) {
    return $false
  }
  $zenExe = Join-Path $Candidate "zen.exe"
  return (Test-Path -LiteralPath $zenExe) -and (
    (Test-Path -LiteralPath (Join-Path $Candidate "browser")) -or
    (Test-Path -LiteralPath (Join-Path $Candidate "omni.ja"))
  )
}

function Resolve-7Zip {
  foreach ($commandName in @("7z", "7za")) {
    $command = Get-Command $commandName -ErrorAction SilentlyContinue
    if ($command) {
      return $command.Source
    }
  }

  foreach ($candidate in @(
    "$env:ProgramFiles\7-Zip\7z.exe",
    "${env:ProgramFiles(x86)}\7-Zip\7z.exe"
  )) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return $candidate
    }
  }

  return $null
}

function Find-ZenBinDir {
  param([string]$Root)

  $candidates = @(
    Get-ChildItem -LiteralPath $Root -Filter "zen.exe" -File -Recurse -ErrorAction SilentlyContinue |
      ForEach-Object { $_.Directory.FullName } |
      Sort-Object -Unique
  )

  foreach ($candidate in $candidates) {
    if (Test-ZenBinDir -Candidate $candidate) {
      return $candidate
    }
  }

  if ($candidates.Count -gt 0) {
    return $candidates[0]
  }

  throw "Could not find zen.exe under extracted installer root: $Root"
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

$outputRoot = Get-FullPath $OutputDir
if ($ZenBinDir) {
  $resolvedZenBin = Get-FullPath $ZenBinDir
  if (-not (Test-ZenBinDir -Candidate $resolvedZenBin)) {
    throw "ZenBinDir does not look like a Zen Windows bin directory: $resolvedZenBin"
  }
  $result = [ordered]@{
    ok = $true
    schema = "zen-windows-bin-preparation.v1"
    source = "explicit"
    zenBinDir = $resolvedZenBin
    zenExe = (Join-Path $resolvedZenBin "zen.exe")
  }
  $result | ConvertTo-Json -Depth 4
  exit 0
}

if ((Test-Path -LiteralPath $outputRoot) -and -not $Force) {
  if (Test-ZenBinDir -Candidate $outputRoot) {
    $result = [ordered]@{
      ok = $true
      schema = "zen-windows-bin-preparation.v1"
      source = "cached"
      zenBinDir = $outputRoot
      zenExe = (Join-Path $outputRoot "zen.exe")
    }
    $result | ConvertTo-Json -Depth 4
    exit 0
  }
  throw "OutputDir already exists but is not a Zen bin directory. Pass -Force to replace it: $outputRoot"
}

if (Test-Path -LiteralPath $outputRoot) {
  Remove-Item -LiteralPath $outputRoot -Recurse -Force
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("zen-windows-bin-" + [System.Guid]::NewGuid().ToString("N"))
$extractRoot = Join-Path $tempRoot "extract"
$installerPath = Join-Path $tempRoot "zen.installer.exe"
New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null

try {
  if ($ZenInstallerUrl -match '^https?://') {
    Invoke-WebRequest -Uri $ZenInstallerUrl -OutFile $installerPath
  } else {
    $localInstaller = Get-FullPath $ZenInstallerUrl
    if (-not (Test-Path -LiteralPath $localInstaller)) {
      throw "Zen installer is missing: $localInstaller"
    }
    Copy-Item -LiteralPath $localInstaller -Destination $installerPath -Force
  }

  $sevenZip = Resolve-7Zip
  if ($sevenZip) {
    & $sevenZip x $installerPath "-o$extractRoot" -y | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "7-Zip failed to extract Zen installer with exit code $LASTEXITCODE."
    }
    $extractedZenBin = Find-ZenBinDir -Root $extractRoot
    Invoke-RobocopyMirror -Source $extractedZenBin -Destination $outputRoot
  } else {
    $installRoot = Join-Path $tempRoot "installed"
    New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
    $installArgument = "/D=$installRoot"
    $process = Start-Process -FilePath $installerPath -ArgumentList @("/S", $installArgument) -Wait -PassThru
    if ($process.ExitCode -ne 0) {
      throw "Zen installer silent install failed with exit code $($process.ExitCode)."
    }
    $installedZenBin = Find-ZenBinDir -Root $installRoot
    Invoke-RobocopyMirror -Source $installedZenBin -Destination $outputRoot
  }

  if (-not (Test-ZenBinDir -Candidate $outputRoot)) {
    throw "Prepared output is not a usable Zen Windows bin directory: $outputRoot"
  }

  $result = [ordered]@{
    ok = $true
    schema = "zen-windows-bin-preparation.v1"
    source = $ZenInstallerUrl
    zenBinDir = $outputRoot
    zenExe = (Join-Path $outputRoot "zen.exe")
  }
  $result | ConvertTo-Json -Depth 4
} finally {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
