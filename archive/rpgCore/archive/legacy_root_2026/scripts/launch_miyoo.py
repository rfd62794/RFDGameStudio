"""
Miyoo Mini Launch Script - ADR 178: Embedded Deployment
Optimized for handheld retro gaming with 1x scale display
"""

import asyncio
import sys
import os
import time
from pathlib import Path

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from loguru import logger
from survival_game_simple import SurvivalGameSimple


class MiyooLauncher:
    """Miyoo Mini optimized launcher for embedded deployment"""
    
    def __init__(self):
        # Miyoo Mini specific settings
        self.scale_factor = 1  # 1x scale for 160x144 native display
        self.target_fps = 30  # Lower FPS for battery optimization
        self.window_title = "Sovereign Scout - Miyoo Mini"
        
        logger.info("🎮 Miyoo Mini Launcher initialized")
    
    def create_miyoo_ppu(self):
        """Create Miyoo-optimized SimplePPU"""
        from body.simple_ppu import SimplePPU
        
        ppu = SimplePPU(self.window_title)
        
        # Override scale factor for Miyoo
        ppu.SCALE_FACTOR = self.scale_factor
        ppu.PHYSICAL_WIDTH = ppu.LOGICAL_WIDTH * ppu.SCALE_FACTOR
        ppu.PHYSICAL_HEIGHT = ppu.LOGICAL_HEIGHT * ppu.SCALE_FACTOR
        
        # Re-initialize with Miyoo settings
        if hasattr(ppu, 'root') and ppu.root:
            ppu.root.destroy()
        
        ppu.root = None
        ppu.canvas = None
        
        if not ppu.initialize():
            logger.error("❌ Failed to create Miyoo PPU")
            return None
        
        logger.info(f"✅ Miyoo PPU created - {ppu.PHYSICAL_WIDTH}x{ppu.PHYSICAL_HEIGHT} at 1x scale")
        return ppu
    
    async def launch_game(self):
        """Launch optimized game for Miyoo Mini"""
        logger.info("🚀 Launching Sovereign Scout for Miyoo Mini")
        logger.info(f"📊 Settings: {self.target_fps} FPS, 1x scale, 160x144 native")
        
        # Create game with Miyoo optimizations
        game = SurvivalGameSimple()
        
        # Override game settings for Miyoo
        game.survival_duration = 60.0  # Keep 60-second gameplay
        game.dt = 1.0 / self.target_fps  # Optimized frame rate
        
        # Initialize with Miyoo PPU
        game.ppu = self.create_miyoo_ppu()
        if not game.ppu:
            logger.error("❌ Failed to initialize Miyoo game")
            return
        
        # Reset game state
        from survival_game_simple import GameState
        game.game_state = GameState.PREPARATION
        game.game_time = 0.0
        game.player_physics.x = 80.0
        game.player_physics.y = 36.0
        game.player_physics.velocity_x = 0.0
        game.player_physics.velocity_y = 0.0
        game.player_physics.energy = 100.0
        game.player_physics.mass = 10.0
        
        # Create asteroid field
        game.asteroids.clear()
        game._create_asteroid_field()
        
        # Start game
        game.start_survival_phase()
        game.is_running = True
        
        logger.info("🎮 Miyoo game started - WASD to move")
        
        # Miyoo-optimized game loop
        last_time = 0.0
        
        try:
            while game.is_running:
                current_time = time.time()
                dt = current_time - last_time
                last_time = current_time
                
                # Update game at Miyoo-optimized rate
                game.update(dt)
                
                # Update display
                if game.ppu and not game.ppu.update():
                    logger.info("🖼️ Game window closed")
                    break
                
                # Miyoo frame rate control
                await asyncio.sleep(1/self.target_fps)
                
        except KeyboardInterrupt:
            logger.info("🛑 Game interrupted")
        finally:
            game.cleanup()
        
        logger.info("🎮 Miyoo game session complete")


def main():
    """Main entry point for Miyoo Mini"""
    logger.remove()
    logger.add(sys.stdout, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{message}</level>")
    
    print("🎮 Sovereign Scout - Miyoo Mini Edition")
    print("=" * 50)
    print("🚀 60-Second Survival Challenge")
    print("📐 Newtonian Screen Wrap with Ghosting")
    print("📖 Narrative Integration & Clone System")
    print("=" * 50)
    print("\n🎮 Controls: WASD to move, ESC to exit")
    print("⚡ Avoid high-speed asteroid collisions!")
    print("🌀 Reach the portal after 60 seconds!")
    print("\n🎯 Starting game...")
    
    launcher = MiyooLauncher()
    asyncio.run(launcher.launch_game())


if __name__ == "__main__":
    main()
