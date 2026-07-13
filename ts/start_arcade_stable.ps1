# RFDGameStudio — Arcade Stable Server (port 5174, built snapshot)
# Requires: vite build run at least once before starting.
# Run via NSSM as RFDArcadeServe service.
Set-Location "C:\Github\RFDGameStudio\ts"
npx vite preview --host 0.0.0.0 --port 5174
