# RFDGameStudio — Arcade Stable Server (port 5174, built snapshot)
# Serves the local-arcade-preview directory so /arcade/{gameId}/ URLs render.
# Run via NSSM as RFDArcadeServe service.
Set-Location "C:\Github\RFDGameStudio\local-arcade-preview"
node "C:\Github\RFDGameStudio\ts\node_modules\vite\bin\vite.js" preview --host 0.0.0.0 --port 5174 --base / --outDir . --strictPort
