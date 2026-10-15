<#
.SYNOPSIS
RFDGameStudio local checks (replaces the GitHub Actions CI).

.DESCRIPTION
Runs what CI used to run, and exits non-zero at the first failing stage:
  1. uv sync --frozen, then generate ts/src/games/game-metadata.json (either stage)
  2. Python tests (slow and e2e excluded), retrying known-flaky tests twice
  3. TypeScript: tsc --noEmit, then vitest, retrying known-flaky tests twice
The pre-push hook picks the stages per push via scripts/hook_scope.py
(-SkipPython / -SkipTypeScript).

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

# Prep runs for either stage: TS tests read the generated game-metadata.json.
if (-not ($SkipPython -and $SkipTypeScript)) {
    Invoke-Step "Sync Python environment" { uv sync --frozen }
    # The metadata generator loads ts/vite.config.ts, which needs ts/node_modules.
    if (-not (Test-Path (Join-Path $RepoRoot "ts/node_modules"))) {
        Invoke-Step "Install TypeScript dependencies" {
            Push-Location (Join-Path $RepoRoot "ts")
            try { npm ci } finally { Pop-Location }
        }
    }
    Invoke-Step "Generate game metadata" { uv run --no-sync python -m studio_mcp.game_metadata }
}

if (-not $SkipPython) {
    # Headless SDL for the Python stage regardless of what the caller exported
    # (a real video/audio driver init is a native-crash risk on this machine).
    $env:SDL_VIDEODRIVER = "dummy"
    $env:SDL_AUDIODRIVER = "dummy"
    # Load the rerun plugin explicitly with autoload off, so this behaves the
    # same whether or not the machine sets PYTEST_DISABLE_PLUGIN_AUTOLOAD.
    $env:PYTEST_DISABLE_PLUGIN_AUTOLOAD = "1"
    Invoke-Step "Python tests (slow and e2e excluded)" {
        uv run --no-sync python -X faulthandler -m pytest -m "not e2e and not slow" -q -p pytest_rerunfailures --reruns 2
    }
}

if (-not $SkipTypeScript) {
    Push-Location (Join-Path $RepoRoot "ts")
    try {
        # test_shoal_y8_integration.ts rebuilds ts/dist-shoal (npm run build:shoal),
        # which races with the tests that read that build when files run in
        # parallel. Run everything else first, then that file on its own.
        Invoke-Step "TypeScript type check" { npx tsc --noEmit }
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
