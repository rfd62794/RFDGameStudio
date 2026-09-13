#!/usr/bin/env python3
"""
Rust Build Script for DGT Harvest Core
Python 3.12 compatible build system for high-performance image processing
Based on PhantomArbiter's proven Rust build system
"""

import subprocess
import sys
import os
from pathlib import Path
import shutil
from loguru import logger

# Ensure stdout uses UTF-8 on Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


def check_rust_toolchain():
    """Check if Rust toolchain is available"""
    try:
        result = subprocess.run(['rustc', '--version'], 
                              capture_output=True, text=True, check=True)
        logger.success(f"✅ Rust toolchain found: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("❌ Rust toolchain not found")
        logger.error("Please install Rust from https://rustup.rs/")
        return False


def check_maturin():
    """Check if maturin is available"""
    try:
        result = subprocess.run(['maturin', '--version'], 
                              capture_output=True, text=True, check=True)
        logger.success(f"✅ Maturin found: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("❌ Maturin not found")
        logger.error("Installing Maturin...")
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'maturin'], check=True)
            logger.success("✅ Maturin installed successfully")
            return True
        except subprocess.CalledProcessError:
            logger.error("❌ Failed to install Maturin")
            return False


def build_rust_module():
    """Build the Rust module using maturin with pyproject.toml support"""
    project_root = Path('.')
    
    if not (project_root / 'pyproject.toml').exists():
        logger.error("❌ pyproject.toml not found in project root")
        return False
    
    # Set environment variables for proper Python detection
    env = os.environ.copy()
    
    # CRITICAL: Force PyO3 to use Python 3.12 compatibility
    env["PYO3_PYTHON"] = sys.executable
    env["PYO3_USE_ABI3_FORWARD_COMPATIBILITY"] = "1"
    
    # Use develop mode for rapid iteration
    logger.info("🔨 Building Rust harvest core in develop mode (Python 3.12 compatible)...")
    
    try:
        # Use maturin develop for rapid iteration
        command = ['maturin', 'develop', '--release']
        
        logger.info(f"Running: {' '.join(command)}")
        result = subprocess.run(command, cwd=project_root, capture_output=True, text=True, 
                              encoding='utf-8', errors='replace', env=env)
        
        if result.returncode == 0:
            logger.success("✅ Rust module built successfully")
            logger.info(result.stdout)
            
            # Verify the module can be imported
            logger.info("🔍 Verifying Rust module import...")
            verify = subprocess.run([
                sys.executable, '-c', 
                'import dgt_harvest_rust; print("SUCCESS: dgt_harvest_rust loaded successfully")'
            ], capture_output=True, text=True)
            
            if verify.returncode == 0:
                logger.success("✅ Rust module verified successfully!")
                logger.info(verify.stdout.strip())
            else:
                logger.error(f"❌ Verification failed: {verify.stderr}")
                return False
            
            return True
        else:
            logger.error(f"❌ Build failed: {result.stderr}")
            return False
            
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Build error: {e}")
        return False


def main():
    """Main build function"""
    logger.info("🦀 DGT Rust Build System (PhantomArbiter-style)")
    logger.info("=" * 50)
    
    # Check prerequisites
    if not check_rust_toolchain():
        logger.error("Please install Rust from https://rustup.rs/")
        return 1
    
    if not check_maturin():
        return 1
    
    # Build the module
    if not build_rust_module():
        return 1
    
    logger.success("🚀 Rust module ready for use!")
    logger.info("🎯 The DGT Sheet-Cutter now has instant sub-millisecond sprite analysis!")
    logger.info("📦 Module installed in develop mode for rapid iteration")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
