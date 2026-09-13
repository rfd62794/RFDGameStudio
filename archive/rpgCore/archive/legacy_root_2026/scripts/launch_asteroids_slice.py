#!/usr/bin/env python3
"""
Asteroids Slice Launcher - Sovereign Flight Protocol

Final Launch Sequence for the DGT Platform Asteroids Game Slice

Features:
- Genetic Pilot integration for ship control
- Tri-Modal Graphics Engine (Terminal/Cockpit/PPU)
- Real-time MFD handshake (Score/Scrap events)
- 60Hz Newtonian physics with toroidal wrap
- Persistent locker.json scrap tracking
"""

import sys
import time
import asyncio
from pathlib import Path
from typing import Optional

# Add src to path for absolute imports
current_dir = Path.cwd()
src_path = current_dir / 'src'
if src_path.exists():
    sys_path = str(src_path.resolve())
    if sys_path not in sys.path:
        sys.path.insert(0, sys_path)

# Now import without src prefix
from apps.space.physics_body import PhysicsBody
from apps.space.asteroids_strategy import AsteroidsStrategy
from engines.body.tri_modal_engine import TriModalEngine, DisplayMode
from engines.mind.dd_engine import GeneticPilot
from foundation.types import Result
from loguru import logger


class AsteroidsSliceLauncher:
    """Main launcher for the Asteroids game slice"""
    
    def __init__(self):
        self.physics_body = PhysicsBody()
        self.rendering_strategy = AsteroidsStrategy()
        self.genetic_pilot = GeneticPilot()
        self.tri_modal_engine: Optional[TriModalEngine] = None
        self.running = False
        self.last_frame_time = 0.0
        self.frame_count = 0
        
        # Performance tracking
        self.fps_history = []
        self.target_fps = 60.0
        self.frame_time = 1.0 / self.target_fps
        
        # MFD event tracking
        self.score_events = []
        self.scrap_events = []
        
    def initialize(self) -> Result[None]:
        """Initialize all systems"""
        try:
            logger.info("🚀 Initializing Asteroids Slice...")
            
            # Initialize Tri-Modal Graphics Engine
            self.tri_modal_engine = TriModalEngine()
            
            # Register rendering strategy
            self.tri_modal_engine.register_strategy("asteroids", self.rendering_strategy)
            
            # Initialize Genetic Pilot
            pilot_result = self.genetic_pilot.initialize()
            if not pilot_result.success:
                return Result.failure_result(f"Failed to initialize Genetic Pilot: {pilot_result.error}")
            
            # Connect pilot to physics body
            self.genetic_pilot.connect_physics(self.physics_body)
            
            # Set display mode (default to Cockpit for MFD visibility)
            engine_result = self.tri_modal_engine.set_display_mode(DisplayMode.COCKPIT)
            if not engine_result.success:
                logger.warning(f"Could not set Cockpit mode: {engine_result.error}")
                # Fallback to Terminal mode
                self.tri_modal_engine.set_display_mode(DisplayMode.TERMINAL)
            
            logger.success("✅ All systems initialized")
            return Result.success_result(None)
            
        except Exception as e:
            logger.error(f"❌ Initialization failed: {e}")
            return Result.failure_result(f"Initialization error: {str(e)}")
    
    def handle_mfd_handshake(self) -> None:
        """Process MFD events and update displays"""
        # Get pending notifications from physics body
        notifications = self.physics_body.get_pending_notifications()
        
        for notification in notifications:
            if notification['action'] == 'scrap_acquired':
                self.scrap_events.append(notification)
                logger.info(f"📟 MFD: {notification['message']}")
        
        # Get current score from physics state
        current_score = self.physics_body.physics_state.score
        if current_score > 0:
            score_event = {
                'action': 'score_update',
                'score': current_score,
                'timestamp': time.time()
            }
            self.score_events.append(score_event)
            logger.info(f"🏆 MFD: Score: {current_score}")
        
        # Update Tri-Modal Engine with MFD data
        if self.tri_modal_engine:
            mfd_data = {
                'score': current_score,
                'scrap_events': self.scrap_events[-10:],  # Last 10 events
                'score_events': self.score_events[-10:],   # Last 10 events
                'fps': self.get_current_fps(),
                'entity_count': len(self.physics_body.entities)
            }
            self.tri_modal_engine.update_mfd_data(mfd_data)
    
    def get_current_fps(self) -> float:
        """Calculate current FPS"""
        if len(self.fps_history) < 2:
            return 0.0
        
        recent_times = self.fps_history[-60:]  # Last 60 frames
        if len(recent_times) < 2:
            return 0.0
        
        avg_frame_time = sum(recent_times) / len(recent_times)
        return 1.0 / avg_frame_time if avg_frame_time > 0 else 0.0
    
    async def run_game_loop(self) -> Result[None]:
        """Main game loop with 60Hz target"""
        logger.info("🎮 Starting Asteroids Slice game loop...")
        
        self.running = True
        self.last_frame_time = time.perf_counter()
        
        try:
            while self.running:
                current_time = time.perf_counter()
                actual_dt = current_time - self.last_frame_time
                
                # Frame rate limiting to 60Hz
                if actual_dt >= self.frame_time:
                    # Update physics
                    physics_result = self.physics_body.update(current_time)
                    if not physics_result.success:
                        logger.error(f"Physics update failed: {physics_result.error}")
                        break
                    
                    # Update Genetic Pilot
                    pilot_result = self.genetic_pilot.update(actual_dt)
                    if not pilot_result.success:
                        logger.warning(f"Pilot update failed: {pilot_result.error}")
                    
                    # Handle MFD handshake
                    self.handle_mfd_handshake()
                    
                    # Render frame
                    if self.tri_modal_engine:
                        render_result = self.tri_modal_engine.render_frame(
                            self.physics_body.physics_state
                        )
                        if not render_result.success:
                            logger.warning(f"Render failed: {render_result.error}")
                    
                    # Track performance
                    self.fps_history.append(actual_dt)
                    if len(self.fps_history) > 300:  # Keep 5 seconds of history
                        self.fps_history.pop(0)
                    
                    self.frame_count += 1
                    self.last_frame_time = current_time
                    
                    # Log performance every 60 frames
                    if self.frame_count % 60 == 0:
                        current_fps = self.get_current_fps()
                        logger.debug(f"📊 FPS: {current_fps:.1f} | Frame: {self.frame_count}")
                
                # Small sleep to prevent CPU spinning
                await asyncio.sleep(0.001)
                
        except KeyboardInterrupt:
            logger.info("⏹️ Game loop interrupted by user")
        except Exception as e:
            logger.error(f"❌ Game loop error: {e}")
            return Result.failure_result(f"Game loop error: {str(e)}")
        
        self.running = False
        logger.success(f"🏁 Game loop completed. Total frames: {self.frame_count}")
        return Result.success_result(None)
    
    def shutdown(self) -> Result[None]:
        """Shutdown all systems gracefully"""
        logger.info("🔄 Shutting down Asteroids Slice...")
        
        try:
            # Save final locker state
            locker_summary = self.physics_body.scrap_locker.get_locker_summary()
            logger.info(f"💾 Final scrap totals: {locker_summary['scrap_counts']}")
            logger.info(f"🏆 Final score: {self.physics_body.physics_state.score}")
            
            # Shutdown Genetic Pilot
            pilot_result = self.genetic_pilot.shutdown()
            if not pilot_result.success:
                logger.warning(f"Pilot shutdown warning: {pilot_result.error}")
            
            # Shutdown Tri-Modal Engine
            if self.tri_modal_engine:
                engine_result = self.tri_modal_engine.shutdown()
                if not engine_result.success:
                    logger.warning(f"Engine shutdown warning: {engine_result.error}")
            
            logger.success("✅ All systems shutdown gracefully")
            return Result.success_result(None)
            
        except Exception as e:
            logger.error(f"❌ Shutdown error: {e}")
            return Result.failure_result(f"Shutdown error: {str(e)}")
    
    async def launch(self) -> Result[None]:
        """Complete launch sequence"""
        logger.info("🌌 === DGT PLATFORM - ASTEROIDS SLICE LAUNCH ===")
        logger.info("🎯 Sovereign Flight Protocol Initiated")
        
        # Initialize systems
        init_result = self.initialize()
        if not init_result.success:
            return init_result
        
        # Run game loop
        game_result = await self.run_game_loop()
        if not game_result.success:
            return game_result
        
        # Shutdown gracefully
        shutdown_result = self.shutdown()
        if not shutdown_result.success:
            return shutdown_result
        
        logger.success("🚀 === ASTEROIDS SLICE LAUNCH COMPLETE ===")
        return Result.success_result(None)


def main():
    """Main entry point"""
    # Configure logging
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>",
        level="INFO"
    )
    
    # Add file logging
    log_file = Path(__file__).parent.parent / "logs" / "asteroids_slice.log"
    log_file.parent.mkdir(exist_ok=True)
    logger.add(
        log_file,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}",
        level="DEBUG",
        rotation="10 MB",
        retention="3 days"
    )
    
    # Create and launch the slice
    launcher = AsteroidsSliceLauncher()
    
    try:
        # Run the async launch
        result = asyncio.run(launcher.launch())
        
        if result.success:
            logger.success("🎉 Launch completed successfully!")
            return 0
        else:
            logger.error(f"❌ Launch failed: {result.error}")
            return 1
            
    except Exception as e:
        logger.error(f"💥 Critical launch failure: {e}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
