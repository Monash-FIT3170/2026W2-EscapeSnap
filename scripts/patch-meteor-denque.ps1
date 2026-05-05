# Fix empty Meteor-internal denque after a build (common on Windows when symlink creation is blocked).
# Run after the first failed `meteor run` if you see "Cannot find module ... denque".
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$nested = Join-Path $root '.meteor\local\build\programs\server\npm\node_modules\meteor\meteor\node_modules\denque'
$src = Join-Path $root 'node_modules\denque'
if (-not (Test-Path (Join-Path $src 'package.json'))) {
  Write-Error "Missing $src — run: meteor npm install"
}
if (Test-Path $nested) {
  $hasPkg = Test-Path (Join-Path $nested 'package.json')
  if (-not $hasPkg) {
    Remove-Item -Recurse -Force $nested
    Copy-Item -Recurse $src $nested
    Write-Host "Patched denque into Meteor server bundle."
  } else {
    Write-Host "denque already present; no patch needed."
  }
} else {
  Write-Host "Meteor has not built yet (no $nested). Run meteor run once first."
}
