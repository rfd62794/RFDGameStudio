@echo off
REM Manual Launch - Opens Godot Editor + Instructions

SET GODOT_PATH=C:\Godot\4.6_NET\Godot_v4.6-stable_mono_win64.exe
SET PROJECT_PATH=%~dp0godot_project

echo ================================================================================
echo NEAT ASTEROIDS VISUAL DEMO - MANUAL MODE
echo ================================================================================
echo.
echo This will open Godot EDITOR so you can see what's happening.
echo.
echo STEP 1: Starting Godot Editor...
echo.

REM Open Godot editor
start "Godot Editor" "%GODOT_PATH%" --path "%PROJECT_PATH%"

echo STEP 2: Wait for Godot to finish loading
echo         (First time: ~30-60 seconds for import + C# build)
echo.
echo STEP 3: In Godot editor, press F5 (Play button)
echo         You should see a game window open (640x576)
echo.
echo STEP 4: When you see the game window, press any key here to start Python...
pause

echo.
echo STEP 5: Starting Python NEAT engine...
echo.
python run_demo.py

echo.
echo Demo stopped!
pause
