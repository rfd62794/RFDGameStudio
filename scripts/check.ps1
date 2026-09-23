<#
.SYNOPSIS
RFDGameStudio local checks (replaces the GitHub Actions CI).

.DESCRIPTION
Runs what CI used to run, and exits non-zero at the first failing stage:
  1. uv sync --frozen
  2. Generate ts/src/games/game-metadata.json
  3. Python tests (slow and e2e excluded), retrying known-flaky tests twice
  4. TypeScript tests (vitest), retrying known-flaky tests twice

Called by .githooks/pre-push. Skip the hook once with: git push --no-verify

.EXAMPLE
  .\scripts\check.ps1
  .\scripts\check.ps1 -SkipTypeScript
#>

param (
    [switch]$SkipPython,
    [switch]$SkipTypeScript
)

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $RepoRoot

# When this script runs under a git hook (e.g. .githooks/pre-push), git exports
# GIT_DIR and friends into the environment. Any test or tool we spawn that calls
# `git` would then operate on the REAL repository instead of its own fixture —
# see docs/directives/Test_Git_Isolation_Directive.md. Strip every GIT_* var
# before pytest and vitest run.
Get-ChildItem Env:GIT_* | Remove-Item

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host ""
    Write-Host "== $Name ==" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $Name (exit $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

$started = Get-Date

if (-not $SkipPython) {
    Invoke-Step "Sync Python environment" { uv sync --frozen }
    Invoke-Step "Generate game metadata" { uv run --no-sync python -m studio_mcp.game_metadata }
    # Load the rerun plugin explicitly with autoload off, so this behaves the
    # same whether or not the machine sets PYTEST_DISABLE_PLUGIN_AUTOLOAD.
    $env:PYTEST_DISABLE_PLUGIN_AUTOLOAD = "1"
    Invoke-Step "Python tests (slow and e2e excluded)" {
        uv run --no-sync python -m pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2
    }
}

if (-not $SkipTypeScript) {
    Push-Location (Join-Path $RepoRoot "ts")
    try {
        if (-not (Test-Path "node_modules")) {
            Invoke-Step "Install TypeScript dependencies" { npm ci }
        }
        # test_shoal_y8_integration.ts rebuilds ts/dist-shoal (npm run build:shoal),
        # which races with the tests that read that build when files run in
        # parallel. Run everything else first, then that file on its own.
        $buildTest = "tests/test_shoal_y8_integration.ts"
        Invoke-Step "TypeScript tests" { npx vitest run --retry=2 --exclude $buildTest }
        Invoke-Step "TypeScript build test (runs alone)" { npx vitest run --retry=2 $buildTest }
    } finally {
        Pop-Location
    }
}

$elapsed = [int]((Get-Date) - $started).TotalSeconds
Write-Host ""
Write-Host "All checks passed in ${elapsed}s." -ForegroundColor Green
exit 0
