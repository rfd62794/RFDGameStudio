"""
DGT Studio Suite Launcher

Launches the complete DGT development environment including:
- Cartographer (Visual World Editor)
- Weaver (Narrative Dashboard)  
- Developer Console (Command Center)

Usage:
    python studio_launcher.py [--tool TOOL_NAME] [--config CONFIG_PATH]

Tools:
    cartographer - Launch visual world editor
    weaver      - Launch narrative dashboard
    console     - Launch developer console
    all         - Launch all tools (default)
"""

import sys
import argparse
import subprocess
import threading
import time
from pathlib import Path
from typing import List, Optional

from loguru import logger


class StudioLauncher:
    """Launcher for DGT Studio Suite"""
    
    def __init__(self):
        self.tools_dir = Path(__file__).parent
        self.running_processes: List[subprocess.Popen] = []
        
    def launch_cartographer(self) -> bool:
        """Launch Cartographer visual editor"""
        try:
            script_path = self.tools_dir / "cartographer.py"
            if not script_path.exists():
                logger.error(f"Cartographer script not found: {script_path}")
                return False
            
            process = subprocess.Popen(
                [sys.executable, str(script_path)],
                cwd=str(self.tools_dir.parent)
            )
            self.running_processes.append(process)
            
            logger.info("🗺️ Cartographer launched")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to launch Cartographer: {e}")
            return False
    
    def launch_weaver(self) -> bool:
        """Launch Weaver narrative dashboard"""
        try:
            script_path = self.tools_dir / "weaver.py"
            if not script_path.exists():
                logger.error(f"Weaver script not found: {script_path}")
                return False
            
            process = subprocess.Popen(
                [sys.executable, str(script_path)],
                cwd=str(self.tools_dir.parent)
            )
            self.running_processes.append(process)
            
            logger.info("🎭 Weaver launched")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to launch Weaver: {e}")
            return False
    
    def launch_console(self) -> bool:
        """Launch Developer Console"""
        try:
            # Console runs in the current process
            from tools.developer_console import DeveloperConsole
            from main import DGTSystem
            
            # Create minimal DGT system for console
            system = DGTSystem()
            
            # Initialize console
            console = DeveloperConsole(system)
            
            # Run console (blocking)
            import asyncio
            asyncio.run(console.start())
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to launch Console: {e}")
            return False
    
    def launch_all(self) -> None:
        """Launch all tools"""
        logger.info("🚀 Launching DGT Studio Suite...")
        
        # Launch visual tools in background
        cartographer_launched = self.launch_cartographer()
        weaver_launched = self.launch_weaver()
        
        # Give tools time to start
        time.sleep(2)
        
        # Launch console in foreground
        if cartographer_launched or weaver_launched:
            logger.info("🖥️ Visual tools launched. Starting Developer Console...")
            logger.info("💡 Use /cartographer commands to interact with visual tools")
        
        self.launch_console()
    
    def wait_for_processes(self) -> None:
        """Wait for all background processes to complete"""
        for process in self.running_processes:
            try:
                process.wait()
            except KeyboardInterrupt:
                logger.info("🛑 Interrupted by user")
                break
            except Exception as e:
                logger.error(f"❌ Process error: {e}")
    
    def cleanup(self) -> None:
        """Clean up running processes"""
        logger.info("🧹 Cleaning up processes...")
        
        for process in self.running_processes:
            try:
                if process.poll() is None:  # Process is still running
                    process.terminate()
                    process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                logger.warning("⚠️ Process did not terminate, forcing kill")
                process.kill()
            except Exception as e:
                logger.error(f"❌ Cleanup error: {e}")
        
        self.running_processes.clear()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="DGT Studio Suite Launcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python studio_launcher.py                    # Launch all tools
    python studio_launcher.py --tool cartographer  # Launch only Cartographer
    python studio_launcher.py --tool weaver       # Launch only Weaver
    python studio_launcher.py --tool console      # Launch only Console
        """
    )
    
    parser.add_argument(
        "--tool", 
        choices=["cartographer", "weaver", "console", "all"],
        default="all",
        help="Tool to launch (default: all)"
    )
    
    parser.add_argument(
        "--config",
        type=str,
        help="Path to configuration file"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = "DEBUG" if args.verbose else "INFO"
    logger.remove()
    logger.add(sys.stderr, level=log_level)
    
    # Create launcher
    launcher = StudioLauncher()
    
    try:
        # Launch requested tool
        if args.tool == "all":
            launcher.launch_all()
        elif args.tool == "cartographer":
            launcher.launch_cartographer()
            launcher.wait_for_processes()
        elif args.tool == "weaver":
            launcher.launch_weaver()
            launcher.wait_for_processes()
        elif args.tool == "console":
            launcher.launch_console()
        
    except KeyboardInterrupt:
        logger.info("\\n🛑 Studio Suite interrupted by user")
    except Exception as e:
        logger.error(f"💥 Studio Suite error: {e}")
    finally:
        launcher.cleanup()
        
        logger.info("👋 DGT Studio Suite closed")


if __name__ == "__main__":
    main()
