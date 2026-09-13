#!/usr/bin/env python3
"""
Run Tests - Comprehensive Test Suite for DGT Platform
Runs all unit tests, integration tests, and stress tests
"""

import sys
import os
import subprocess
import time
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from dgt_core.view.cli.logger_config import configure_logging


def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"🧪 Running {description}...")
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(__file__).replace('scripts', '')
        )
        
        if result.returncode == 0:
            print(f"✅ {description} - PASSED")
            return True
        else:
            print(f"❌ {description} - FAILED")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False


def main():
    """Run comprehensive test suite"""
    # Configure logging
    configure_logging(
        log_level="INFO",
        log_file="logs/test_suite.log",
        enable_rich=True
    )
    
    print("🧪 DGT Platform Test Suite")
    print("=" * 50)
    
    tests = [
        ("python -m pytest tests/ -v", "Unit Tests"),
        ("python scripts/hardware_stress_test.py", "Hardware Stress Test"),
        ("python scripts/cross_load_test.py", "Cross-Load Test"),
        ("python -c \"import dgt_core; print('✅ Import Test - PASSED')\"", "Import Test"),
    ]
    
    passed = 0
    total = len(tests)
    
    start_time = time.time()
    
    for cmd, description in tests:
        if run_command(cmd, description):
            passed += 1
        print()
    
    end_time = time.time()
    duration = end_time - start_time
    
    print("=" * 50)
    print(f"🧪 Test Results: {passed}/{total} passed")
    print(f"🧪 Duration: {duration:.2f} seconds")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
