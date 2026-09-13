"""
Sonic Field Test - SEED_SONIC_FIELD
ADR 083: The Actor-Aesthetic Bridge

Tests the Voyager God Class in a beautiful, swaying 8-bit field.
Forces the Voyager into a 4x4 square path while flowers sway in the background.
"""

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from launch_movie import ObserverView

def run_sonic_field_test():
    """Run the Sonic Field test with Voyager God Class"""
    print("🌸🎬🍿 SEED_SONIC_FIELD Test - Voyager in the Sonic Field")
    print("=" * 60)
    print("🚶 Voyager God Class - Intent Processor with Aesthetic Bridge")
    print("🌸 Sonic Field DNA - Flora with wind-sway animations")
    print("🎬 Neck-Pivot Animation - Idle timer triggers sprite swapping")
    print("🔄 Square Loop Path - 4x4 demonstration path")
    print("=" * 60)
    
    # Initialize Observer View with SEED_SONIC_FIELD
    observer = ObserverView(seed="SEED_SONIC_FIELD", enable_graphics=True)
    
    # Override object spawning to create Sonic Field
    def spawn_sonic_field(self):
        """Spawn a field of sonic flowers"""
        self.log_event("🌸 Spawning Sonic Field...")
        
        # Create a dense field of sonic flowers
        flower_positions = []
        for x in range(20, 30):
            for y in range(20, 30):
                if (x + y) % 2 == 0:  # Checkerboard pattern
                    flower_positions.append((x, y))
        
        self.log_event(f"🌸 Spawning {len(flower_positions)} sonic flowers...")
        
        for i, position in enumerate(flower_positions):
            # Create sonic flower object
            obj = type('SonicFlower', (), {
                'asset_id': 'sonic_flower',
                'position': position,
                'characteristics': type('Characteristics', (), {
                    'material': 'flower_petals',
                    'tags': ['animated', 'flora', 'wind_sensitive', 'sonic'],
                    'integrity': 20,
                    'd20_checks': {
                        'examine': {'difficulty': 5, 'skill': 'nature', 'success': 'observe_pollen'}
                    }
                })()
            })()
            
            # Register in world
            self.world_engine.object_registry.world_objects[position] = obj
            
            # Register animation in PPU
            if self.ppu:
                self.ppu.register_entity_animation(f"sonic_flower_{i}", position, "wind_sway")
        
        self.log_event(f"🌸 Sonic Field complete with {len(flower_positions)} animated flowers")
    
    # Override spawn method
    observer.spawn_forest_objects = spawn_sonic_field.__get__(observer, ObserverView)
    
    # Override Voyager position to start in the field
    if hasattr(observer, 'voyager'):
        observer.voyager.current_position = (25, 25)
    elif hasattr(observer, 'voyager_shell'):
        observer.voyager_shell.current_position = (25, 25)
    
    # Run the test
    observer.run()

if __name__ == "__main__":
    run_sonic_field_test()
