@echo off
REM Build C# project for Godot

echo Building rpgCore Godot C# project...
echo.

pushd "%~dp0"
dotnet build rpgCore.Godot.csproj
popd

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Build completed successfully!
    echo.
) else (
    echo.
    echo [FAILED] Build failed with errors. See output above.
    echo.
)

rem pause
