"""
Cinematic Simulator - The D&D Movie Experience

Run the autonomous Director Mode to watch the DGT Perfect Simulator
as a cinematic experience with no manual input required.

This is the "Big Red Button" for watching your D&D movie.
"""

import argparse
import asyncio
import sys
import tkinter as tk
from pathlib import Path
from typing import Optional

from loguru import logger

# Add src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from core.simulator import SimulatorHost, ViewMode
from views.terminal_view import TerminalView
from views.gui_view import GUIView
from logic.director import AutonomousDirector, DirectorFactory, DirectorMode
from logic.pathfinding import NavigationFactory
from ui.cinematic_camera import CameraFactory
from ui.cinematic_pauses import CinematicFactory
from ui.director_hud import HUDFactory


class CinematicSimulator:
    """
    Cinematic simulator that combines all autonomous components.
    
    This is the complete "D&D Movie" experience where:
    - The Director generates narrative beacons
    - The Voyager navigates autonomously
    - The camera provides cinematic framing
    - The pauses control narrative pacing
    - The HUD provides director controls
    """
    
    def __init__(self, save_path: Optional[Path] = None):
        """Initialize the cinematic simulator."""
        self.save_path = save_path or Path("cinematic_save.json")
        
        # Core simulator
        self.simulator = SimulatorHost(save_path=self.save_path)
        
        # Autonomous components
        self.director: Optional[AutonomousDirector] = None
        self.navigation = None
        self.camera_controller = None
        self.cinematic_pauses = None
        
        # Views
        self.terminal_view: Optional[TerminalView] = None
        self.gui_view: Optional[GUIView] = None
        
        # GUI components
        self.root: Optional[tk.Tk] = None
        self.hud: Optional[object] = None
        
        # Cinematic state
        self.is_running = False
        self.is_autonomous = True
        
        logger.info("🎬 CinematicSimulator initialized")
    
    async def initialize(self) -> bool:
        """Initialize all components."""
        try:
            logger.info("🚀 Initializing Cinematic Simulator...")
            
            # Initialize core simulator
            if not self.simulator.initialize():
                return False
            
            # Create autonomous components
            self.director = DirectorFactory.create_director(self.simulator)
            self.navigation = NavigationFactory.create_navigation_system(64, 64)
            self.camera_controller = CameraFactory.create_camera_controller(700, 500)
            self.cinematic_pauses = CinematicFactory.create_cinematic_pauses(self.simulator)
            
            # Create views
            self.terminal_view = TerminalView(self.simulator)
            self.gui_view = GUIView(self.simulator)
            
            # Add views as observers
            self.simulator.add_observer(self.terminal_view)
            self.simulator.add_observer(self.gui_view)
            
            # Setup director event handlers
            self._setup_director_events()
            
            # Setup cinematic pause handlers
            self._setup_cinematic_events()
            
            logger.info("✅ Cinematic Simulator initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize: {e}")
            return False
    
    def _setup_director_events(self) -> None:
        """Setup Director event handlers."""
        def on_beacon_generated(beacon):
            logger.info(f"🎯 New beacon: {beacon.description}")
            # Set navigation path to beacon
            voyager_pos = self.director.get_voyager_position()
            self.navigation.set_path_to_beacon(voyager_pos, beacon.target_coords)
        
        def on_beacon_achieved(beacon):
            logger.info(f"🎯 Beacon achieved: {beacon.description}")
            # Add cinematic pause for achievement
            self.cinematic_pauses.add_discovery_pause(f"Beacon achieved: {beacon.description}")
        
        def on_cinematic_pause(message):
            logger.info(f"🎬 Cinematic pause: {message}")
        
        self.director.on_beacon_generated = on_beacon_generated
        self.director.on_beacon_achieved = on_beacon_achieved
        self.director.on_cinematic_pause = on_cinematic_pause
    
    def _setup_cinematic_events(self) -> None:
        """Setup cinematic pause event handlers."""
        def on_pause_started(pause):
            logger.info(f"⏸️ Pause started: {pause.pause_type.value}")
        
        def on_pause_ended(pause):
            logger.info(f"▶️ Pause ended: {pause.pause_type.value}")
        
        def on_dialogue_displayed(dialogue):
            logger.info(f"💬 Dialogue: {dialogue[:50]}...")
        
        self.cinematic_pauses.on_pause_started = on_pause_started
        self.cinematic_pauses.on_pause_ended = on_pause_ended
        self.cinematic_pauses.on_dialogue_displayed = on_dialogue_displayed
    
    async def start_autonomous_mode(self) -> None:
        """Start the autonomous cinematic mode."""
        logger.info("🎬 Starting autonomous cinematic mode")
        
        self.is_autonomous = True
        self.is_running = True
        
        # Mark simulator as autonomous
        self.simulator.is_autonomous = True
        
        # Start the Director
        await self.director.start_autonomous_mode()
        
        # Start the simulator
        self.simulator.start()
        
        # Start cinematic loop
        asyncio.create_task(self._cinematic_loop())
    
    async def _cinematic_loop(self) -> None:
        """Main cinematic loop."""
        logger.info("🎬 Cinematic loop started")
        
        try:
            while self.is_running:
                # Execute cinematic pauses
                await self.cinematic_pauses.execute_pause_queue()
                
                # Update camera
                if self.gui_view and self.camera_controller:
                    state = self.simulator.get_state()
                    if state:
                        # Get game entities for camera
                        voyager_pos = self.director.get_voyager_position()
                        npcs = []  # Would extract from state
                        objects = []  # Would extract from state
                        
                        # Update camera
                        self.camera_controller.update(voyager_pos, npcs, objects, 0.016)
                
                # Small delay
                await asyncio.sleep(0.016)  # ~60 FPS
                
        except Exception as e:
            logger.error(f"❌ Cinematic loop error: {e}")
        finally:
            logger.info("🎬 Cinematic loop stopped")
    
    def start_gui_mode(self) -> None:
        """Start GUI mode with Director HUD."""
        logger.info("🖼️ Starting GUI mode with Director HUD")
        
        # Create main window
        self.root = tk.Tk()
        self.root.title("DGT Perfect Simulator - Cinematic Mode")
        self.root.geometry("1024x768")
        
        # Create main frame
        main_frame = Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create GUI view
        self.gui_view.root = main_frame
        self.gui_view.start()
        
        # Create Director HUD
        if self.director and self.cinematic_pauses and self.camera_controller:
            self.hud = HUDFactory.create_director_hud(
                main_frame, self.director, self.cinematic_pauses, self.camera_controller
            )
            self.hud.show()
        
        # Start autonomous mode
        asyncio.create_task(self.start_autonomous_mode())
        
        # Start GUI main loop
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            logger.info("🖼️ GUI mode stopped by user")
        finally:
            self.stop()
    
    def start_terminal_mode(self) -> None:
        """Start terminal-only mode."""
        logger.info("🖥️ Starting terminal-only mode")
        
        # Create event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Start autonomous mode
            loop.run_until_complete(self.start_autonomous_mode())
            
            # Run terminal view
            loop.run_until_complete(self.terminal_view.run())
        except KeyboardInterrupt:
            logger.info("🖥️ Terminal mode stopped by user")
        finally:
            loop.close()
            self.stop()
    
    def stop(self) -> None:
        """Stop the cinematic simulator."""
        logger.info("🛑 Stopping Cinematic Simulator")
        
        self.is_running = False
        self.is_autonomous = False
        
        if self.director:
            self.director.mode = DirectorMode.IDLE
        
        if self.simulator:
            self.simulator.stop()
        
        if self.root:
            self.root.quit()
        
        logger.info("🎬 Cinematic Simulator stopped")
    
    def get_status(self) -> dict:
        """Get current simulator status."""
        status = {
            'is_running': self.is_running,
            'is_autonomous': self.is_autonomous,
            'simulator_running': self.simulator.is_running() if self.simulator else False,
        }
        
        if self.director:
            status.update({
                'director_mode': self.director.mode.value,
                'current_beacon': self.director.current_beacon.description if self.director.current_beacon else None,
                'beacon_count': len(self.director.beacon_history),
                'playback_speed': self.director.playback_speed,
                'is_paused': self.director.is_paused
            })
        
        if self.cinematic_pauses:
            pause_status = self.cinematic_pauses.get_pause_status()
            status['cinematic_pauses'] = pause_status
        
        return status


def main():
    """Main entry point for the cinematic simulator."""
    # Parse CLI arguments
    parser = argparse.ArgumentParser(
        description="DGT Perfect Simulator - Cinematic Mode",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_cinematic_simulator.py                    # GUI mode with Director HUD
  python run_cinematic_simulator.py --mode terminal   # Terminal-only mode
  python run_cinematic_simulator.py --save movie.json   # Custom save file
        """
    )
    
    parser.add_argument(
        "--mode",
        choices=["gui", "terminal"],
        default="gui",
        help="Display mode: gui (default) or terminal"
    )
    
    parser.add_argument(
        "--save",
        type=str,
        default="cinematic_save.json",
        help="Save file path (default: cinematic_save.json)"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    logger.remove()
    logger.add(
        "cinematic_simulator.log",
        level="DEBUG",
        format="{time:HH:mm:ss} | {level} | {message}",
        rotation="10 MB"
    )
    
    log_level = "DEBUG" if args.debug else "INFO"
    logger.add(
        lambda msg: print(msg, end=""),
        level=log_level,
        format="{time:HH:mm:ss} | {level} | {message}"
    )
    
    # Create save path
    save_path = Path(args.save)
    
    # Create cinematic simulator
    simulator = CinematicSimulator(save_path=save_path)
    
    print("🎬 DGT Perfect Simulator - Cinematic Mode")
    print("=" * 50)
    print("Autonomous Director Mode - Watch the D&D Movie!")
    print()
    
    try:
        # Initialize simulator
        if not asyncio.run(simulator.initialize()):
            print("❌ Failed to initialize simulator")
            return 1
        
        # Start based on mode
        if args.mode == "gui":
            print("🖼️ Starting GUI mode with Director HUD...")
            simulator.start_gui_mode()
        else:
            print("🖥️ Starting terminal-only mode...")
            simulator.start_terminal_mode()
        
        return 0
        
    except KeyboardInterrupt:
        logger.info("🛑 Cinematic simulator stopped by user")
        return 0
    except Exception as e:
        logger.error(f"❌ Cinematic simulator error: {e}")
        print(f"❌ Error: {e}")
        return 1
    finally:
        simulator.stop()


if __name__ == "__main__":
    exit(main())
