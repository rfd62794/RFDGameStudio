# NEAT Asteroids Visual Demo - PowerShell Launcher
# Starts Godot game window + Python NEAT engine

$GODOT_PATH = "C:\Godot\4.6_NET\Godot_v4.6-stable_mono_win64.exe"
$PROJECT_PATH = "$PSScriptRoot\godot_project"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "NEAT ASTEROIDS VISUAL DEMO" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Check Godot exists
if (-not (Test-Path $GODOT_PATH)) {
    Write-Host "[ERROR] Godot not found at: $GODOT_PATH" -ForegroundColor Red
    Write-Host "Please update GODOT_PATH in this script" -ForegroundColor Yellow
    pause
    exit 1
}

# Start Godot game window
Write-Host "[1/2] Launching Godot game window..." -ForegroundColor Green
$godot_proc = Start-Process -FilePath $GODOT_PATH -ArgumentList "--path `"$PROJECT_PATH`"" -PassThru

Write-Host "[Waiting 8 seconds for Godot to initialize server...]" -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start Python NEAT engine
Write-Host ""
Write-Host "[2/2] Starting Python NEAT AI engine..." -ForegroundColor Green
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "WATCH THE GODOT WINDOW:" -ForegroundColor Cyan
Write-Host "  - Green triangles = AI pilots" -ForegroundColor Green
Write-Host "  - Yellow circles = Asteroids" -ForegroundColor Yellow
Write-Host "  - White dots = Projectiles" -ForegroundColor White
Write-Host "  - HUD = Generation, Pilot Count" -ForegroundColor Gray
Write-Host ""
Write-Host "CONSOLE OUTPUT:" -ForegroundColor Cyan
Write-Host "  Frame updates every second" -ForegroundColor Gray
Write-Host "  Fitness scores after each generation (30s)" -ForegroundColor Gray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Run Python engine (this will block and show output)
python run_demo.py

Write-Host ""
Write-Host "Demo complete!" -ForegroundColor Green

# Kill Godot if still running
if (-not $godot_proc.HasExited) {
    Write-Host "Closing Godot window..." -ForegroundColor Yellow
    $godot_proc.Kill()
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
