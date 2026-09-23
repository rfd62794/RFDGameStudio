@echo off
REM Test if Godot can build the C# project
SET GODOT_PATH=C:\Godot\4.6_NET\Godot_v4.6-stable_mono_win64.exe

IF NOT EXIST "%GODOT_PATH%" (
    echo [ERROR] Godot not found at: %GODOT_PATH%
    echo Update GODOT_PATH in this file
    pause
    exit /b 1
)

echo Testing Godot C# build...
echo.

"%GODOT_PATH%" --path . --headless --build-solutions --quit

echo.
echo Build test complete!
echo Check above for any errors.
pause
