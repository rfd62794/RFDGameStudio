#!/usr/bin/env python3
"""
Setup Python 3.12 Environment for DGT Platform

This script ensures the project is running on Python 3.12 and sets up a proper
virtual environment if needed. Run this to bootstrap the development environment.
"""

import os
import subprocess
import sys
from pathlib import Path


def check_python_version():
    """Check current Python version without importing foundation."""
    current_version = (
        sys.version_info.major, 
        sys.version_info.minor, 
        sys.version_info.micro
    )
    current_version_str = f"{current_version[0]}.{current_version[1]}.{current_version[2]}"
    
    required_version = (3, 12)
    
    if not (required_version <= (current_version[0], current_version[1]) < (required_version[0], required_version[1] + 1)):
        return False, current_version_str
    
    return True, current_version_str


def find_python_312():
    """Find Python 3.12 executable on the system."""
    version_str = "3.12"
    
    # Windows: Try py launcher first
    if os.name == "nt":
        candidates = [
            f"py -{version_str}",
            f"python{version_str}",
            "python"
        ]
    else:
        candidates = [
            f"python{version_str}",
            f"python3.{version_str.split('.')[1]}",
            "python3",
            "python"
        ]
    
    for cmd in candidates:
        try:
            result = subprocess.run(
                cmd.split() + ["-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0 and result.stdout.strip().startswith(version_str):
                return cmd
        except Exception:
            continue
    
    return None


def create_venv_312(project_root, venv_name=".venv"):
    """Create Python 3.12 virtual environment."""
    python_cmd = find_python_312()
    if not python_cmd:
        return False, "Python 3.12 not found on system"
    
    venv_path = project_root / venv_name
    
    try:
        subprocess.run(
            python_cmd.split() + ["-m", "venv", str(venv_path)],
            check=True,
            capture_output=True,
            text=True
        )
        
        # Verify creation
        if os.name == "nt":
            python_exe = venv_path / "Scripts" / "python.exe"
        else:
            python_exe = venv_path / "bin" / "python"
        
        if not python_exe.exists():
            return False, f"Venv created but Python executable not found: {python_exe}"
        
        # Verify version
        result = subprocess.run(
            [str(python_exe), "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip().startswith("3.12"):
            return True, f"Successfully created Python 3.12 venv: {venv_path}"
        else:
            return False, f"Venv created but wrong Python version: {result.stdout.strip()}"
            
    except subprocess.CalledProcessError as e:
        return False, f"Failed to create venv: {e.stderr}"


def main():
    """Main setup function."""
    print("🏗️  DGT Platform Python 3.12 Setup")
    print("=" * 50)
    
    # Get project root
    project_root = Path(__file__).parent.parent
    print(f"📁 Project root: {project_root}")
    
    # Check current version
    print("\n🔍 Checking Python version...")
    is_valid, version_msg = check_python_version()
    
    if is_valid:
        print(f"✅ Current Python version: {version_msg}")
        
        # Check if we're in a venv
        if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
            print("✅ Running in virtual environment")
            print("\n🎉 DGT Platform is ready for development!")
            return
        else:
            print("⚠️  Not running in virtual environment")
            print("   Consider creating a virtual environment for isolation")
    else:
        print(f"❌ {version_msg}")
        print("\n🔧 Attempting to set up Python 3.12 environment...")
        
        # Try to create venv
        success, message = create_venv_312(project_root)
        
        if success:
            print(f"✅ {message}")
            print("\n📋 Next steps:")
            print("   1. Activate the virtual environment:")
            
            if os.name == "nt":
                activate_cmd = ".venv\\Scripts\\activate"
            else:
                activate_cmd = "source .venv/bin/activate"
            
            print(f"      {activate_cmd}")
            print("   2. Install dependencies:")
            print("      pip install -e .")
            print("   3. Run tests:")
            print("      python tests/verification/test_headless_derby.py")
        else:
            print(f"❌ {message}")
            print("\n💡 Manual setup instructions:")
            print("   Please install Python 3.12 manually:")
            print("   - Windows: Download from python.org or use 'py -3.12'")
            print("   - Linux/macOS: Use package manager or python.org")
            print("\n   Then create virtual environment:")
            print("   py -3.12 -m venv .venv  # Windows")
            print("   python3.12 -m venv .venv  # Linux/macOS")
            sys.exit(1)


if __name__ == "__main__":
    main()
