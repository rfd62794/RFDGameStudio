#!/bin/sh
# DGT Platform Miyoo Mini Plus Launcher
# Handles Python 3.12 environment and screen rotation

# Set up environment
export DGT_PLATFORM="miyoo"
export PYTHONPATH="./bin/python3.12"

# Check for Python 3.12 binary
if [ ! -f "./bin/python3.12" ]; then
    echo "❌ Python 3.12 binary not found in ./bin/"
    echo "❌ Please ensure Python 3.12 is available for Miyoo Mini Plus"
    echo "❌ Download from: https://www.python.org/downloads/"
    exit 1
fi

# Check if binary is executable
if [ ! -x "./bin/python3.12" ]; then
    echo "❌ Python 3.12 binary is not executable"
    echo "❌ Run: chmod +x ./bin/python3.12"
    exit 1
fi

# Set environment variables for Miyoo
export MIYOO_MODEL="Mini Plus"
export DGT_SCREEN_ROTATION=90
export DGT_TARGET_FPS=30
export DGT_MAX_SHIPS=4
export DGT_MEMORY_LIMIT_MB=128

# Log hardware info
echo "🎮 DGT Platform Miyoo Mini Plus Launcher"
echo "📱 Python: $("$PYTHONPATH" --version)"
echo "🖥️ Screen: 640x480 (rotated 90°)"
echo "🎯 Target FPS: $DGT_TARGET_FPS"
echo "🚢 Max Ships: $DGT_MAX_SHIPS"
echo "💾 Memory Limit: ${DGT_MEMORY_LIMIT_MB}MB"

# Run the DGT Platform with Miyoo-specific settings
"$PYTHON_PATH" scripts/universal_launcher.py \
    --engine space \
    --view graphics \
    --miyoo \
    --fps-target $DGT_TARGET_FPS \
    --max-ships $DGT_MAX_SHIPS \
    --memory-limit $DGT_MEMORY_LIMIT_MB
