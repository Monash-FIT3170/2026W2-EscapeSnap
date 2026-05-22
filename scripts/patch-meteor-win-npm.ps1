# Copies all missing npm packages from Meteor atmosphere package caches into the build.
# Run this in a second terminal after "meteor run" crashes with "Cannot find module".
# Usage: npm run patch:meteor-win

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$bundleBase = Join-Path $root '.meteor\local\build\programs\server\npm\node_modules'
$meteorCache = "$env:LOCALAPPDATA\.meteor\packages"
$versionsFile = Join-Path $root '.meteor\versions'
$triggerFile = Join-Path $root 'server\main.js'

if (-not (Test-Path $bundleBase)) {
  Write-Host 'No Meteor bundle yet. Run "meteor run" first, wait for it to crash, then run this script.' -ForegroundColor Yellow
  exit 0
}

$versions = @{}
Get-Content $versionsFile | ForEach-Object {
  if ($_ -match '^([\w:.-]+)@(.+)$') { $versions[$Matches[1]] = $Matches[2] }
}

$patched = $false
foreach ($pkg in $versions.Keys) {
  $ver = $versions[$pkg]
  $pkgName = $pkg -replace ':', '__'
  $npmSrc = Join-Path $meteorCache "$pkgName\$ver\npm\node_modules"
  if (-not (Test-Path $npmSrc)) { continue }

  $buildDest = Join-Path $bundleBase "meteor\$pkgName\node_modules"
  if (-not (Test-Path $buildDest)) { continue }

  Get-ChildItem $npmSrc -Directory | Where-Object { $_.Name -notlike '.*' } | ForEach-Object {
    $destDep = Join-Path $buildDest $_.Name
    if ((Test-Path $destDep) -and -not (Test-Path (Join-Path $destDep 'package.json'))) {
      Remove-Item -Recurse -Force $destDep
      Copy-Item -Recurse $_.FullName $destDep
      Write-Host "Patched $pkgName/$($_.Name)"
      $patched = $true
    }
  }
}

if ($patched) {
  Write-Host 'All packages patched. Triggering reload...' -ForegroundColor Green
  (Get-Content $triggerFile -Raw) | Set-Content $triggerFile -NoNewline
} else {
  Write-Host 'Nothing to patch — all packages already present.' -ForegroundColor Green
}
