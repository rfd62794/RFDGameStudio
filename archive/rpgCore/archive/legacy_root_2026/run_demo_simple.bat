@echo off
REM Quick launcher for NEAT Asteroids Demo
REM Edit the GODOT_PATH below to match where you extracted Godot

SET GODOT_PATH=C:\Godot\4.6_NET\Godot_v4.6-stable_mono_win64.exe

REM Check if Godot exists
IF NOT EXIST "%GODOT_PATH%" (
    echo [ERROR] Godot not found at: %GODOT_PATH%
    echo.
    echo Please edit this file and set GODOT_PATH to your Godot .exe location
    pause
    exit /b 1
)

echo ===============================================================================
echo NEAT ASTEROIDS VISUAL DEMO - QUICK LAUNCH
echo ===============================================================================
echo.
echo Starting demo...
echo.

python start_visual_demo.py --godot-path "%GODOT_PATH%"

pause
