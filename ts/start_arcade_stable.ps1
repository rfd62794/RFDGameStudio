# RFDGameStudio — Arcade Stable Server (port 5174, built snapshot)
# Serves the local-arcade-preview directory so /arcade/{gameId}/ URLs render.
# Run via NSSM as RFDArcadeServe service (powershell -File, so $PSScriptRoot is ts/).
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $repoRoot "local-arcade-preview")
node (Join-Path $PSScriptRoot "node_modules\vite\bin\vite.js") preview --host 0.0.0.0 --port 5174 --base / --outDir . --strictPort
