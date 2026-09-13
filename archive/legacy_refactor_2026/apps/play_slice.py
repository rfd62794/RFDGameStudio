#!/usr/bin/env python3
"""
DGT Play Slice - PPU Mode Launcher
Game Boy parity rendering with 60Hz dithered display
"""

import sys
import time
import argparse
import random
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from loguru import logger

def create_demo_game_state() -> dict:
    """Create demo game state"""
    return {
        'width': 160,
        'height': 144,
        'entities': [
            {
                'id': 'player',
                'x': 10 + random.randint(-2, 2),
                'y': 10 + random.randint(-2, 2),
                'type': 'dynamic',
                'effect': 'sway',
                'depth': 2
            },
            {
                'id': 'enemy',
                'x': 15 + random.randint(-1, 1),
                'y': 8 + random.randint(-1, 1),
                'type': 'dynamic',
                'effect': 'pulse',
                'depth': 2
            },
            {
                'id': 'chest',
                'x': 12,
                'y': 12,
                'type': 'dynamic',
                'effect': None,
                'depth': 1
            },
            {
                'id': 'particles',
                'x': 10,
                'y': 8,
                'type': 'effect',
                'effect': 'flicker',
                'depth': 3
            }
        ],
        'background': {
            'id': 'dungeon_bg',
            'type': 'baked'
        },
        'hud': {
            'line_1': 'DGT Game Slice',
            'line_2': f'HP: {random.randint(80, 100)}/100',
            'line_3': f'Gold: {random.randint(50, 200)}',
            'line_4': f'Time: {random.randint(0, 999)}'
        },
        'effects': {
            'ambient_light': 0.8,
            'particle_count': random.randint(5, 15),
            'weather': 'clear'
        }
    }

def run_ppu_game():
    """Run PPU game mode"""
    try:
        from dgt_core import BodyEngine, DisplayMode, TRI_MODAL_AVAILABLE
        
        if not TRI_MODAL_AVAILABLE:
            logger.error("❌ Tri-Modal Display Suite not available")
            return False
        
        # Create engine with PPU mode
        engine = BodyEngine(use_tri_modal=True, universal_packet_enforcement=True)
        
        if not engine.set_mode(DisplayMode.PPU):
            logger.error("❌ Failed to set PPU mode")
            return False
        
        print("🎮 DGT Play Slice Started")
        print("=" * 50)
        print("Game Boy parity rendering... Close window to stop")
        print()
        
        # Game loop
        try:
            frame_count = 0
            last_time = time.time()
            
            while True:
                current_time = time.time()
                delta_time = current_time - last_time
                
                # Target 60 FPS (16.67ms per frame)
                if delta_time >= 1.0 / 60.0:
                    # Create game state
                    game_state = create_demo_game_state()
                    
                    # Add frame info
                    game_state['frame'] = {
                        'count': frame_count,
                        'fps': 1.0 / delta_time if delta_time > 0 else 60,
                        'delta_time': delta_time
                    }
                    
                    # Render in PPU mode
                    success = engine.render(game_state, DisplayMode.PPU)
                    
                    if not success:
                        logger.warning("⚠️ PPU render failed")
                    
                    frame_count += 1
                    last_time = current_time
                    
                    # Performance logging every 60 frames
                    if frame_count % 60 == 0:
                        fps = 1.0 / delta_time if delta_time > 0 else 60
                        logger.debug(f"🎮 PPU Performance: {fps:.1f} FPS")
                
                # Small sleep to prevent CPU overload
                time.sleep(0.001)
                
        except KeyboardInterrupt:
            print("\n🛑 Game stopped by user")
        except Exception as e:
            if "window was closed" in str(e).lower():
                print("\n🎮 Game window closed")
            else:
                raise e
        
        # Cleanup
        engine.cleanup()
        return True
        
    except Exception as e:
        logger.error(f"❌ PPU game failed: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='DGT Play Slice')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug logging')
    parser.add_argument('--fps', type=int, default=60, help='Target FPS (default: 60)')
    
    args = parser.parse_args()
    
    # Configure logging
    if args.debug:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    elif args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="INFO")
    else:
        logger.remove()
        logger.add(sys.stderr, level="WARNING")
    
    print("🎭 DGT Play Slice")
    print("Game Boy parity rendering with 60Hz dithered display")
    print()
    
    success = run_ppu_game()
    
    if success:
        print("✅ Game session completed")
        return 0
    else:
        print("❌ Game session failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
