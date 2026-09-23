# RFDGameStudio — Arcade Dev Server (port 5173, HMR)
# Run via NSSM as RFDArcadeDev service (powershell -File, so $PSScriptRoot is ts/).
Set-Location $PSScriptRoot
npx vite dev --host 0.0.0.0 --port 5173
