#!/usr/bin/env python
"""
Start Full Visual Demo - Launches both Python engine and Godot

This script automatically:
1. Starts the Python NEAT game engine
2. Waits for it to initialize and listen on port 9001
3. Launches Godot editor automatically
4. Manages both processes

Requirements:
- Godot 4.4+ installed and in PATH (or provide path)
- Python 3.14+
- Both processes run in parallel

Usage:
  python start_visual_demo.py                    # Uses 'godot' from PATH
  python start_visual_demo.py --godot-path /path/to/godot
"""

import sys
import os
import subprocess
import time
import threading
import argparse

def find_godot():
    """Try to find Godot executable in PATH."""
    import shutil
    godot_path = shutil.which('godot')
    if godot_path:
        return godot_path

    # Try common installation paths on Windows
    common_paths = [
        r"C:\Program Files\Godot\godot.exe",
        r"C:\Program Files (x86)\Godot\godot.exe",
        r"C:\Users\*\AppData\Local\Programs\Godot\godot.exe",
    ]

    for path in common_paths:
        if os.path.exists(path):
            return path

    return None

def start_python_engine():
    """Start Python NEAT game engine."""
    print("[Python Engine] Starting NEAT Asteroids Game Engine...")
    print("[Python Engine] Initializing game...")

    # Run Python engine
    python_script = os.path.join(os.getcwd(), 'run_demo.py')

    try:
        process = subprocess.Popen(
            [sys.executable, python_script],
            cwd=os.getcwd(),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        return process
    except Exception as e:
        print(f"[ERROR] Failed to start Python engine: {e}")
        return None

def start_godot(godot_path):
    """Start Godot editor."""
    print("[Godot] Launching Godot editor...")

    godot_dir = os.path.join(os.getcwd(), 'godot_project')

    try:
        process = subprocess.Popen(
            [godot_path, '--path', godot_dir],
            cwd=godot_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        return process
    except Exception as e:
        print(f"[ERROR] Failed to start Godot: {e}")
        return None

def print_python_output(process):
    """Print Python engine output in real-time."""
    try:
        while True:
            line = process.stdout.readline()
            if not line:
                break
            print(f"[Python Engine] {line.rstrip()}")
    except:
        pass

def main():
    parser = argparse.ArgumentParser(description='Start Full Visual Demo')
    parser.add_argument('--godot-path', help='Path to Godot executable')
    args = parser.parse_args()

    print("=" * 80)
    print("NEAT ASTEROIDS VISUAL DEMO - FULL LAUNCH")
    print("=" * 80)
    print()

    # Check Python engine script exists
    if not os.path.exists('run_demo.py'):
        print("[ERROR] run_demo.py not found in current directory")
        return 1

    # Find Godot
    godot_path = args.godot_path
    if not godot_path:
        godot_path = find_godot()

    if not godot_path or not os.path.exists(godot_path):
        print("[ERROR] Godot not found!")
        print("        Install Godot 4.4+ or provide path with --godot-path")
        return 1

    print(f"[Setup] Python engine: {sys.executable}")
    print(f"[Setup] Godot: {godot_path}")
    print(f"[Setup] Project: {os.path.join(os.getcwd(), 'godot_project')}")
    print()

    # Start Godot FIRST (it needs to listen on port 9001)
    print("[Main] Starting Godot editor (will listen for Python)...")
    godot_proc = start_godot(godot_path)
    if not godot_proc:
        return 1

    # Wait for Godot to start and begin listening
    print("[Main] Waiting for Godot to start server on port 9001...")
    print("[Main] (This may take 30-60 seconds on first run)")
    time.sleep(10)  # Give Godot time to import project and start server

    # Start Python engine (connects to Godot)
    print()
    print("[Main] Starting Python NEAT engine...")
    python_proc = start_python_engine()
    if not python_proc:
        godot_proc.terminate()
        return 1

    # Print Python output in background thread
    python_thread = threading.Thread(target=print_python_output, args=(python_proc,), daemon=True)
    python_thread.start()

    print()
    print("=" * 80)
    print("VISUAL DEMO RUNNING!")
    print("=" * 80)
    print()
    print("[Instructions]")
    print("  1. Godot editor is starting (wait for it to open)")
    print("  2. First time: Wait for project import + C# build (~30-60 sec)")
    print("  3. Python engine will connect automatically")
    print("  4. In Godot: Press F5 (Play button) to start")
    print("  5. Watch AI pilots learn Asteroids!")
    print()
    print("[What You'll See]")
    print("  - Green triangles = AI pilots")
    print("  - Yellow circles = Asteroids")
    print("  - White dots = Projectiles")
    print("  - HUD shows generation, score, pilot count")
    print()
    print("[Console Output]")
    print("  Python engine will print frame updates every second")
    print("  Look for fitness scores improving over generations!")
    print()
    print("[To Stop]")
    print("  - Close Godot editor")
    print("  - Or press Ctrl+C to stop both processes")
    print()
    print("=" * 80)
    print()

    # Monitor both processes
    try:
        while True:
            # Check if processes are still running
            if python_proc.poll() is not None:
                print("[Main] Python engine has exited")
                godot_proc.terminate()
                break

            if godot_proc.poll() is not None:
                print("[Main] Godot has closed")
                python_proc.terminate()
                break

            time.sleep(1)

    except KeyboardInterrupt:
        print()
        print("[Main] Shutting down...")
        python_proc.terminate()
        godot_proc.terminate()
        print("[Main] Both processes terminated")

    # Wait for processes to finish
    python_proc.wait(timeout=5)
    godot_proc.wait(timeout=5)

    print("[Main] Demo complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
