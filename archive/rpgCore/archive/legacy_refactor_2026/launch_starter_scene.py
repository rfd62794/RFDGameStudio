#!/usr/bin/env python3
"""
Launch Starter Scene - ADR 091: The Semantic Starter Protocol
Deploy the DGT Starter Kit with clean console output
"""

import sys
import os
from pathlib import Path
import pygame
from loguru import logger

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from assets.starter_loader import load_starter_kit, get_scene_rendering_data

class StarterScene:
    """Simple scene renderer for starter kit"""
    
    def __init__(self):
        pygame.init()
        self.screen_width = 800
        self.screen_height = 600
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height))
        pygame.display.set_caption("DGT Starter Scene - Token & Tint")
        
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Scene objects
        self.scene_objects = {}
        self.object_positions = {}
        
        # Colors
        self.bg_color = (20, 20, 30)  # Dark blue background
        
        logger.info("Starter Scene initialized")
    
    def load_assets(self) -> bool:
        """Load starter kit assets"""
        try:
            # Load the starter kit
            starter_path = Path("assets/objects_starter.yaml")
            if not starter_path.exists():
                logger.error(f"Starter kit not found: {starter_path}")
                return False
            
            success = load_starter_kit(starter_path)
            if not success:
                logger.error("Failed to load starter kit")
                return False
            
            # Get scene rendering data
            scene_data = get_scene_rendering_data()
            self.scene_objects = scene_data
            
            # Set up object positions for the scene
            self._setup_scene_positions()
            
            logger.info(f"Loaded {len(self.scene_objects)} scene objects")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load assets: {e}")
            return False
    
    def _setup_scene_positions(self) -> None:
        """Set up positions for scene objects"""
        # Position objects in a simple scene layout
        positions = {
            'grass_tuft': [(100, 400), (200, 420), (300, 410), (400, 430), (500, 415), (600, 425), (700, 405)],
            'oak_tree': [(150, 350)],
            'gray_boulder': [(400, 380)],
            'wooden_gate': [(650, 400)],
            'iron_lockbox': [(350, 450)]
        }
        
        for obj_id, obj_data in self.scene_objects.items():
            if obj_id in positions:
                self.object_positions[obj_id] = positions[obj_id]
            else:
                # Default position
                self.object_positions[obj_id] = [(100, 100)]
    
    def hex_to_rgb(self, hex_color: str) -> tuple:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def draw_object(self, obj_id: str, obj_data: dict, position: tuple) -> None:
        """Draw a single object"""
        x, y = position
        
        # Get object properties
        color = self.hex_to_rgb(obj_data['color'])
        sprite_id = obj_data['sprite_id']
        collision = obj_data['collision']
        
        # Draw based on sprite type (simple colored rectangles for now)
        if sprite_id == 'grass':
            # Draw grass as small green rectangles
            pygame.draw.rect(self.screen, color, (x, y, 8, 12))
            pygame.draw.rect(self.screen, color, (x+4, y-4, 8, 12))
            pygame.draw.rect(self.screen, color, (x+2, y-8, 8, 12))
        
        elif sprite_id == 'tree':
            # Draw tree as brown trunk with green top
            trunk_color = self.hex_to_rgb("#5d4037")  # Brown
            pygame.draw.rect(self.screen, trunk_color, (x, y, 20, 40))  # Trunk
            pygame.draw.circle(self.screen, color, (x+10, y-10), 25)  # Leaves
        
        elif sprite_id == 'boulder':
            # Draw boulder as gray circle
            pygame.draw.circle(self.screen, color, (x+15, y+15), 20)
            pygame.draw.circle(self.screen, (100, 100, 100), (x+15, y+15), 20, 2)  # Outline
        
        elif sprite_id == 'gate':
            # Draw gate as wooden rectangle with handle
            pygame.draw.rect(self.screen, color, (x, y, 30, 50))
            pygame.draw.rect(self.screen, (200, 200, 200), (x+20, y+20, 5, 5))  # Handle
        
        elif sprite_id == 'chest':
            # Draw chest as metal rectangle with lock
            pygame.draw.rect(self.screen, color, (x, y, 40, 30))
            pygame.draw.rect(self.screen, (255, 215, 0), (x+15, y+10, 10, 10))  # Lock
        
        else:
            # Default: draw as colored rectangle
            pygame.draw.rect(self.screen, color, (x, y, 30, 30))
        
        # Draw collision indicator if debugging
        if collision and False:  # Set to True to see collision areas
            pygame.draw.rect(self.screen, (255, 0, 0), (x-2, y-2, 34, 34), 1)
    
    def draw_scene(self) -> None:
        """Draw the complete scene"""
        # Clear screen
        self.screen.fill(self.bg_color)
        
        # Draw ground
        ground_color = self.hex_to_rgb("#2d5a27")  # Green
        pygame.draw.rect(self.screen, ground_color, (0, 400, self.screen_width, 200))
        
        # Draw objects
        for obj_id, obj_data in self.scene_objects.items():
            if obj_id in self.object_positions:
                for position in self.object_positions[obj_id]:
                    self.draw_object(obj_id, obj_data, position)
        
        # Draw title
        font = pygame.font.Font(None, 36)
        title = font.render("DGT Starter Scene", True, (255, 255, 255))
        self.screen.blit(title, (10, 10))
        
        # Draw object count
        font_small = pygame.font.Font(None, 24)
        count_text = font_small.render(f"Objects: {len(self.scene_objects)}", True, (200, 200, 200))
        self.screen.blit(count_text, (10, 50))
        
        # Draw instructions
        instructions = [
            "ESC - Exit",
            "Starter Kit Loaded Successfully"
        ]
        y_offset = 80
        for instruction in instructions:
            inst_text = font_small.render(instruction, True, (180, 180, 180))
            self.screen.blit(inst_text, (10, y_offset))
            y_offset += 25
    
    def handle_events(self) -> None:
        """Handle pygame events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
    
    def run(self) -> None:
        """Run the starter scene"""
        logger.info("Starting Starter Scene")
        
        if not self.load_assets():
            logger.error("Failed to load assets, exiting")
            return
        
        # Main game loop
        while self.running:
            self.handle_events()
            self.draw_scene()
            pygame.display.flip()
            self.clock.tick(60)  # 60 FPS
        
        pygame.quit()
        logger.info("Starter Scene ended")

def main():
    """Main entry point"""
    # Configure logging
    logger.remove()
    logger.add(sys.stdout, level="INFO", format="{time} | {level} | {message}")
    
    print("=== DGT Starter Scene Launcher ===")
    print("Loading Token & Tint Starter Kit...")
    
    try:
        scene = StarterScene()
        scene.run()
        print("✅ Starter Scene completed successfully!")
        
    except Exception as e:
        logger.error(f"Scene failed: {e}")
        print(f"❌ Scene failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
