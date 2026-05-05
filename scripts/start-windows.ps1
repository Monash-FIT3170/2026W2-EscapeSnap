# Windows launcher for Meteor when symlink creation is blocked.
# Starts meteor run, then watches for crashes and auto-patches all missing npm packages.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/start-windows.ps1 [--port 4000]

param([string]$port = '4000')

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$bundleBase = Join-Path $root '.meteor\local\build\programs\server\npm\node_modules'
$meteorCache = "$env:LOCALAPPDATA\.meteor\packages"
$versionsFile = Join-Path $root '.meteor\versions'
$triggerFile = Join-Path $root 'server\main.js'

function Get-PackageVersions {
    $versions = @{}
    Get-Content $versionsFile | ForEach-Object {
        if ($_ -match '^([\w:.-]+)@(.+)$') {
            $versions[$Matches[1]] = $Matches[2]
        }
    }
    return $versions
}

function Copy-MissingNpmDeps {
    if (-not (Test-Path $bundleBase)) { return $false }

    $versions = Get-PackageVersions
    $patched = $false

    foreach ($pkg in $versions.Keys) {
        $ver = $versions[$pkg]
        $pkgName = $pkg -replace ':', '__'
        $npmSrc = Join-Path $meteorCache "$pkgName\$ver\npm\node_modules"
        if (-not (Test-Path $npmSrc)) { continue }

        $buildDest = Join-Path $bundleBase "meteor\$pkgName\node_modules"
        if (-not (Test-Path $buildDest)) { continue }

        Get-ChildItem $npmSrc -Directory | Where-Object { $_.Name -notlike '.*' } | ForEach-Object {
            $depName = $_.Name
            $destDep = Join-Path $buildDest $depName
            $hasPkg = Test-Path (Join-Path $destDep 'package.json')
            if ((Test-Path $destDep) -and -not $hasPkg) {
                Remove-Item -Recurse -Force $destDep
                Copy-Item -Recurse $_.FullName $destDep
                Write-Host "  Patched $pkgName/$depName"
                $patched = $true
            }
        }
    }
    return $patched
}

function Invoke-Patch {
    Write-Host "`n[patch] Copying missing npm packages into Meteor build..." -ForegroundColor Cyan
    $patched = Copy-MissingNpmDeps
    if ($patched) {
        Write-Host "[patch] Done. Triggering reload..." -ForegroundColor Cyan
        (Get-Content $triggerFile -Raw) | Set-Content $triggerFile -NoNewline
    } else {
        Write-Host "[patch] Nothing to patch." -ForegroundColor Green
    }
}

# Start meteor run in background
Write-Host "[start] Starting meteor run --port $port" -ForegroundColor Yellow
$meteor = Start-Process -FilePath 'cmd.exe' -ArgumentList "/c meteor run --port $port" -NoNewWindow -PassThru

Write-Host "[start] Waiting for Meteor to build..." -ForegroundColor Yellow

$lastPatch = [DateTime]::MinValue

while (-not $meteor.HasExited) {
    Start-Sleep -Seconds 3

    if (Test-Path $bundleBase) {
        $now = [DateTime]::UtcNow
        # Only patch if we haven't patched in the last 10 seconds
        if (($now - $lastPatch).TotalSeconds -gt 10) {
            Invoke-Patch
            $lastPatch = $now
        }
    }
}

Write-Host "[start] Meteor process exited." -ForegroundColor Red
