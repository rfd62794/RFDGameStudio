@echo off
REM Direct launcher - Runs Godot game directly (not editor)
REM This starts the server immediately

SET GODOT_PATH=C:\Godot\4.6_NET\Godot_v4.6-stable_mono_win64.exe
SET PROJECT_PATH=%~dp0godot_project

echo ================================================================================
echo NEAT ASTEROIDS VISUAL DEMO - DIRECT LAUNCH
echo ================================================================================
echo.

REM Start Godot in game mode (runs scene directly, server starts immediately)
echo [1/2] Starting Godot game (server will listen on port 9001)...
"%GODOT_PATH%" --path "%PROJECT_PATH%" &

REM Wait for Godot to start
echo [Waiting 8 seconds for Godot to start server...]
ping 127.0.0.1 -n 9 >nul

REM Start Python engine
echo.
echo [2/2] Starting Python NEAT engine...
echo.
python run_demo.py

echo.
echo Demo stopped!
pause
