@echo off
REM Build C# project then run visual demo

SET GODOT_PATH=C:\Godot\4.6_NET\Godot_v4.6-stable_mono_win64.exe
SET PROJECT_PATH=%~dp0godot_project

echo ================================================================================
echo NEAT ASTEROIDS - BUILD AND RUN
echo ================================================================================
echo.

echo [Step 0/3] Cleaning up potential zombie processes...
taskkill /F /IM Godot_v4.6-stable_mono_win64.exe 2>nul
taskkill /F /IM python.exe 2>nul
timeout /t 1 /nobreak >nul
echo.

echo [Step 1/3] Building C# project...
call "%~dp0godot_project\build.bat"

echo.
echo [Step 2/3] Starting Godot game window...
start "" "%GODOT_PATH%" --path "%PROJECT_PATH%"

echo [Waiting 5 seconds for Godot to start server...]
ping 127.0.0.1 -n 6 >nul

echo.
echo [Step 3/3] Starting Python NEAT engine...
echo.
python run_demo.py

echo.
echo Demo complete!
pause
