"""
Wooden Box Field Test
Tests rendering a wooden box in the Sonic Field
"""

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from launch_movie import ObserverView

def run_wooden_box_test():
    """Run the Wooden Box test with Voyager God Class"""
    print("📦🎬🍿 Wooden Box Test - Voyager in the Field")
    print("=" * 50)
    print("📦 Wooden Box - Container object with interactions")
    print("🚶 Voyager God Class - Intent Processor")
    print("🌸 Sonic Field - Swaying flowers")
    print("=" * 50)
    
    # Initialize Observer View
    observer = ObserverView(seed="WOODEN_BOX_TEST", enable_graphics=True)
    
    # Override object spawning to create field with wooden box
    def spawn_field_with_box(self):
        """Spawn a field with sonic flowers and a wooden box"""
        self.log_event("🌸 Spawning Sonic Field with Wooden Box...")
        
        # Create sonic flowers
        flower_positions = []
        for x in range(22, 28):
            for y in range(22, 28):
                if (x + y) % 2 == 0:  # Checkerboard pattern
                    flower_positions.append((x, y))
        
        self.log_event(f"🌸 Spawning {len(flower_positions)} sonic flowers...")
        
        for i, position in enumerate(flower_positions):
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
            
            self.world_engine.object_registry.world_objects[position] = obj
            
            if self.ppu:
                self.ppu.register_entity_animation(f"sonic_flower_{i}", position, "wind_sway")
        
        # Add wooden box in the center
        box_position = (25, 25)
        obj = type('WoodenBox', (), {
            'asset_id': 'wooden_box',
            'position': box_position,
            'characteristics': type('Characteristics', (), {
                'material': 'wood',
                'tags': ['container', 'wooden', 'interactive'],
                'integrity': 40,
                'state': 'closed',
                'd20_checks': {
                    'open': {'difficulty': 10, 'skill': 'dexterity', 'success': 'open_box'},
                    'examine': {'difficulty': 5, 'skill': 'perception', 'success': 'examine_box'}
                }
            })()
        })()
        
        self.world_engine.object_registry.world_objects[box_position] = obj
        self.log_event(f"📦 Spawned wooden box at {box_position}")
        
        # Add some other wooden objects
        wooden_objects = [
            ('wooden_chest', (24, 24)),
            ('wooden_door', (26, 26)),
            ('signpost', (23, 27))
        ]
        
        for obj_id, position in wooden_objects:
            obj = type('WoodenObject', (), {
                'asset_id': obj_id,
                'position': position,
                'characteristics': type('Characteristics', (), {
                    'material': 'wood',
                    'tags': ['wooden', 'interactive'],
                    'integrity': 50,
                    'd20_checks': {
                        'examine': {'difficulty': 5, 'skill': 'perception', 'success': 'examine_object'}
                    }
                })()
            })()
            
            self.world_engine.object_registry.world_objects[position] = obj
            self.log_event(f"🪵 Spawned {obj_id} at {position}")
        
        self.log_event(f"🌸 Field complete with {len(flower_positions)} flowers + {len(wooden_objects)} wooden objects")
    
    # Override spawn method
    observer.spawn_forest_objects = spawn_field_with_box.__get__(observer, ObserverView)
    
    # Override Voyager position to start near the box
    if hasattr(observer, 'voyager'):
        observer.voyager.current_position = (25, 23)  # Near the box
    elif hasattr(observer, 'voyager_shell'):
        observer.voyager_shell.current_position = (25, 23)
    
    # Run the test
    observer.run()

if __name__ == "__main__":
    run_wooden_box_test()
