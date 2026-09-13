"""
DGT Launcher - Unified Entry Point for the Perfect Simulator

The "Big Red Button" that detects environment capabilities and boots the
appropriate engine mode. This single script provides a plug-and-play
experience for West Palm Beach deployments.

Features:
- Automatic environment detection (Terminal vs. GUI)
- Asset validation and automatic baking if missing
- Unified session management
- Mode selection interface
- Error handling and graceful fallbacks
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List
import argparse

# Add src to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger


class DGTLauncher:
    """
    Unified launcher for the DGT Perfect Simulator.
    
    This is the "Big Red Button" that handles all bootstrapping,
    asset validation, and mode selection automatically.
    """
    
    def __init__(self):
        """Initialize the DGT launcher."""
        self.root_dir = Path(__file__).parent.resolve()  # Current directory where launcher is
        self.assets_dir = self.root_dir / "assets"
        self.src_dir = self.root_dir / "src"
        
        # Asset paths
        self.asset_manifest = self.root_dir / "assets" / "ASSET_MANIFEST.yaml"
        self.binary_assets = self.root_dir / "assets" / "assets.dgt"
        
        # Component paths
        self.terminal_game = self.src_dir / "game_loop.py"
        self.handheld_game = self.src_dir / "ui" / "adapters" / "gameboy_parity.py"
        self.asset_baker = self.src_dir / "utils" / "asset_baker.py"
        
        # Environment detection
        self.has_gui = self._detect_gui_support()
        self.has_terminal = self._detect_terminal_support()
        
        logger.info("🚀 DGT Launcher initialized")
        logger.info(f"📁 Root directory: {self.root_dir}")
        logger.info(f"🎮 GUI support: {self.has_gui}")
        logger.info(f"💻 Terminal support: {self.has_terminal}")
    
    def _detect_gui_support(self) -> bool:
        """Detect if GUI (Tkinter) is supported."""
        try:
            import tkinter as tk
            root = tk.Tk()
            root.withdraw()  # Hide the test window
            root.destroy()
            return True
        except ImportError:
            return False
        except Exception:
            return False
    
    def _detect_terminal_support(self) -> bool:
        """Detect if terminal supports rich output."""
        try:
            # Test basic terminal capabilities
            return sys.stdout.isatty()
        except Exception:
            return False
    
    def validate_assets(self) -> bool:
        """
        Validate that all required assets exist and are up to date.
        
        Returns:
            True if assets are valid, False otherwise
        """
        logger.info("🔍 Validating assets...")
        
        # Check if binary assets exist
        if not self.binary_assets.exists():
            logger.warning("⚠️ Binary assets not found")
            return self._bake_assets()
        
        # Check if binary is newer than manifest
        if self.asset_manifest.exists():
            manifest_time = self.asset_manifest.stat().st_mtime
            binary_time = self.binary_assets.stat().st_mtime
            
            if binary_time < manifest_time:
                logger.warning("⚠️ Binary assets are outdated")
                return self._bake_assets()
        
        # Validate binary format
        try:
            with open(self.binary_assets, 'rb') as f:
                magic = f.read(4)
                if magic != b'DGT\x01':
                    logger.error("❌ Invalid binary format")
                    return self._bake_assets()
        
        except Exception as e:
            logger.error(f"❌ Binary validation failed: {e}")
            return self._bake_assets()
        
        logger.info("✅ Assets validated successfully")
        return True
    
    def _bake_assets(self) -> bool:
        """
        Bake assets from YAML manifest to binary format.
        
        Returns:
            True if baking succeeded, False otherwise
        """
        logger.info("🔥 Baking assets from manifest...")
        
        try:
            # Import and run asset baker
            baker_path = self.src_dir / "utils" / "asset_baker.py"
            sys.path.append(str(self.src_dir / "utils"))
            from asset_baker import DGTAssetBaker
            
            baker = DGTAssetBaker(self.asset_manifest, self.binary_assets)
            success = baker.bake_assets()
            
            if success:
                logger.info("✅ Assets baked successfully")
                return True
            else:
                logger.error("❌ Asset baking failed")
                return False
                
        except Exception as e:
            logger.error(f"❌ Asset baking error: {e}")
            return False
    
    def detect_mode(self) -> str:
        """
        Detect the appropriate mode based on environment and user preference.
        
        Returns:
            'terminal', 'handheld', or 'auto'
        """
        # Auto-detect based on capabilities
        if self.has_gui and not self.has_terminal:
            return "handheld"
        elif self.has_terminal and not self.has_gui:
            return "terminal"
        elif self.has_gui and self.has_terminal:
            return "auto"  # Let user choose
        else:
            return "terminal"  # Fallback
    
    def show_mode_selection(self) -> str:
        """
        Show mode selection interface.
        
        Returns:
            Selected mode
        """
        print("\n🎮 DGT Perfect Simulator - Mode Selection")
        print("=" * 50)
        print("Choose your experience:")
        print()
        print("1. 🖥️  Terminal Mode (Rich CLI)")
        print("2. 🎨 Handheld Mode (Game Boy Visual)")
        print("3. 🤖 Auto (Choose based on environment)")
        print()
        
        while True:
            try:
                choice = input("Select mode (1-3): ").strip()
                
                if choice == "1":
                    return "terminal"
                elif choice == "2":
                    return "handheld"
                elif choice == "3":
                    return "auto"
                else:
                    print("❌ Invalid choice. Please enter 1, 2, or 3.")
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                sys.exit(0)
    
    def launch_terminal_mode(self) -> bool:
        """
        Launch terminal mode game.
        
        Returns:
            True if launch succeeded, False otherwise
        """
        logger.info("🖥️ Launching terminal mode...")
        
        try:
            # Change to src directory and run game
            os.chdir(self.src_dir)
            subprocess.run([sys.executable, "game_loop.py", "--auto", "--personality", "curious"], check=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Terminal mode launch failed: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Terminal mode error: {e}")
            return False
    
    def launch_handheld_mode(self) -> bool:
        """
        Launch handheld mode game.
        
        Returns:
            True if launch succeeded, False otherwise
        """
        logger.info("🎨 Launching handheld mode...")
        
        try:
            # Change to adapters directory and run game
            adapters_dir = self.src_dir / "ui" / "adapters"
            os.chdir(adapters_dir)
            subprocess.run([sys.executable, "gameboy_parity.py"], check=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Handheld mode launch failed: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Handheld mode error: {e}")
            return False
    
    def show_system_info(self) -> None:
        """Display system information and capabilities."""
        print("\n🔧 DGT System Information")
        print("=" * 40)
        print(f"Platform: {sys.platform}")
        print(f"Python: {sys.version}")
        print(f"Root: {self.root_dir}")
        print(f"GUI Support: {'✅' if self.has_gui else '❌'}")
        print(f"Terminal Support: {'✅' if self.has_terminal else '❌'}")
        
        # Asset information
        if self.binary_assets.exists():
            size = self.binary_assets.stat().st_size
            print(f"Binary Assets: ✅ {size:,} bytes")
        else:
            print(f"Binary Assets: ❌ Not found at {self.binary_assets}")
        
        if self.asset_manifest.exists():
            print(f"Asset Manifest: ✅ {self.asset_manifest}")
        else:
            print(f"Asset Manifest: ❌ Not found at {self.asset_manifest}")
        
        # Debug info
        print(f"Debug: root_dir = {self.root_dir}")
        print(f"Debug: assets_dir = {self.assets_dir}")
        print(f"Debug: binary_assets = {self.binary_assets}")
        print(f"Debug: asset_manifest = {self.asset_manifest}")
    
    def run(self) -> None:
        """
        Main launcher execution.
        
        This is the "Big Red Button" - the single entry point
        that handles everything automatically.
        """
        print("🏆 DGT Perfect Simulator Launcher")
        print("=" * 50)
        print("🚀 Initializing Perfect Simulator...")
        
        # Configure logging
        logger.remove()
        logger.add(
            lambda msg: print(msg, end=""),
            level="INFO",
            format="{time:HH:mm:ss} | {level} | {message}"
        )
        
        # Show system info
        self.show_system_info()
        
        # Validate assets
        if not self.validate_assets():
            print("\n❌ Failed to validate assets. Cannot continue.")
            return
        
        # Detect mode
        mode = self.detect_mode()
        
        if mode == "auto":
            mode = self.show_mode_selection()
        
        print(f"\n🎯 Launching {mode} mode...")
        
        # Launch appropriate mode
        success = False
        if mode == "terminal":
            success = self.launch_terminal_mode()
        elif mode == "handheld":
            success = self.launch_handheld_mode()
        else:
            print(f"❌ Unknown mode: {mode}")
            return
        
        if success:
            print("\n✅ Session completed successfully!")
        else:
            print("\n❌ Session failed. Check logs for details.")
        
        print("\n👋 Thank you for playing DGT Perfect Simulator!")


def main():
    """Main entry point for the DGT launcher."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="DGT Perfect Simulator Launcher")
    parser.add_argument("--mode", choices=["terminal", "handheld", "auto"], 
                       help="Force specific mode (auto for selection)")
    parser.add_argument("--info", action="store_true", 
                       help="Show system information only")
    parser.add_argument("--bake", action="store_true", 
                       help="Force asset baking")
    
    args = parser.parse_args()
    
    # Initialize launcher
    launcher = DGTLauncher()
    
    # Handle special commands
    if args.info:
        launcher.show_system_info()
        return
    
    if args.bake:
        print("🔥 Forcing asset baking...")
        if launcher._bake_assets():
            print("✅ Assets baked successfully!")
        else:
            print("❌ Asset baking failed!")
        return
    
    # Override mode if specified
    if args.mode:
        if args.mode == "auto":
            mode = launcher.show_mode_selection()
        else:
            mode = args.mode
        
        print(f"\n🎯 Launching {mode} mode...")
        
        if mode == "terminal":
            launcher.launch_terminal_mode()
        elif mode == "handheld":
            launcher.launch_handheld_mode()
    else:
        # Normal launcher flow
        launcher.run()


if __name__ == "__main__":
    main()
