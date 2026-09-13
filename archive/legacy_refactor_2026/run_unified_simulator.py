"""
Unified Simulator Entry Point

ADR 043: The "Great Pruning" & Unified Controller

This replaces run_game.py and any terminal_rpg.py with a single
unified entry point. One engine, two perspectives.
"""

import argparse
import asyncio
import sys
from pathlib import Path
from typing import Optional

from loguru import logger

from core.simulator import SimulatorHost, ViewMode
from views.terminal_view import TerminalView
from views.gui_view import GUIView


class UnifiedSimulator:
    """
    Unified simulator that manages both terminal and GUI views.
    
    This is the single entry point that eliminates the dual logic drift.
    """
    
    def __init__(self, view_mode: ViewMode = ViewMode.TERMINAL, save_path: Optional[Path] = None):
        """Initialize unified simulator."""
        self.view_mode = view_mode
        self.save_path = save_path or Path("savegame.json")
        
        # Create the single source of truth
        self.simulator = SimulatorHost(save_path=self.save_path)
        
        # Create views based on mode
        self.terminal_view: Optional[TerminalView] = None
        self.gui_view: Optional[GUIView] = None
        
        if view_mode in [ViewMode.TERMINAL, ViewMode.BOTH]:
            self.terminal_view = TerminalView(self.simulator)
            self.simulator.add_observer(self.terminal_view)
        
        if view_mode in [ViewMode.GUI, ViewMode.BOTH]:
            self.gui_view = GUIView(self.simulator)
            self.simulator.add_observer(self.gui_view)
        
        logger.info(f"🚀 UnifiedSimulator initialized with {view_mode.value} view(s)")
    
    async def run(self) -> None:
        """Run the unified simulator."""
        try:
            # Start the simulator
            self.simulator.start()
            
            # Start views based on mode
            if self.view_mode == ViewMode.BOTH:
                # Run both views concurrently
                logger.info("🖥️🖼️ Starting both Terminal and GUI views")
                
                # Start GUI in separate thread
                import threading
                gui_thread = threading.Thread(target=self.gui_view.start, daemon=True)
                gui_thread.start()
                
                # Run terminal view in main thread
                await self.terminal_view.run()
                
            elif self.view_mode == ViewMode.TERMINAL:
                logger.info("🖥️ Starting Terminal view only")
                await self.terminal_view.run()
                
            elif self.view_mode == ViewMode.GUI:
                logger.info("🖼️ Starting GUI view only")
                # GUI runs in main thread (blocking)
                self.gui_view.start()
            
        except KeyboardInterrupt:
            logger.info("🛑 Simulator stopped by user")
        except Exception as e:
            logger.error(f"❌ Simulator error: {e}")
        finally:
            # Cleanup
            self.simulator.stop()
            logger.info("🧹 UnifiedSimulator cleaned up")
    
    def start(self) -> None:
        """Start the simulator (blocking)."""
        # Run in asyncio event loop
        try:
            asyncio.run(self.run())
        except KeyboardInterrupt:
            logger.info("🛑 Unified simulator stopped by user")
        except Exception as e:
            logger.error(f"❌ Unified simulator error: {e}")
            sys.exit(1)


def main():
    """Main entry point for the unified simulator."""
    # Parse CLI arguments
    parser = argparse.ArgumentParser(
        description="DGT Perfect Simulator - Unified Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_unified_simulator.py                    # Terminal mode (default)
  python run_unified_simulator.py --mode gui        # GUI mode only
  python run_unified_simulator.py --mode both       # Both views
  python run_unified_simulator.py --save custom.json  # Custom save file
        """
    )
    
    parser.add_argument(
        "--mode",
        choices=["terminal", "gui", "both"],
        default="terminal",
        help="View mode: terminal (default), gui, or both"
    )
    
    parser.add_argument(
        "--save",
        type=str,
        default="savegame.json",
        help="Save file path (default: savegame.json)"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()
    
    # File logging
    logger.add(
        "simulator_debug.log",
        level="DEBUG",
        format="{time:HH:mm:ss} | {level} | {message}",
        rotation="10 MB"
    )
    
    # Console logging
    log_level = "DEBUG" if args.debug else "INFO"
    logger.add(
        lambda msg: print(msg, end=""),
        level=log_level,
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    # Convert mode string to enum
    view_mode_map = {
        "terminal": ViewMode.TERMINAL,
        "gui": ViewMode.GUI,
        "both": ViewMode.BOTH
    }
    view_mode = view_mode_map[args.mode]
    
    # Create save path
    save_path = Path(args.save)
    
    # Start unified simulator
    logger.info("🎮 DGT Perfect Simulator - Unified Engine")
    logger.info(f"📁 Save file: {save_path}")
    logger.info(f"👁️ View mode: {args.mode}")
    
    simulator = UnifiedSimulator(view_mode=view_mode, save_path=save_path)
    simulator.start()


if __name__ == "__main__":
    main()
