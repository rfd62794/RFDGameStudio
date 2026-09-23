#!/usr/bin/env python3
"""
Launch Enhanced Scene - ADR 093: The "Sonic Aesthetic" Restoration
Deploy the enhanced starter kit with dithering, shadows, and kinetic sway
"""

import sys
import os
from pathlib import Path
import pygame
import math
import time
from loguru import logger

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from assets.starter_loader import load_starter_kit, get_starter_loader

class EnhancedScene:
    """Enhanced scene renderer with Sonic/Game Boy aesthetic"""
    
    def __init__(self):
        pygame.init()
        self.screen_width = 800
        self.screen_height = 600
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height))
        pygame.display.set_caption("DGT Enhanced Scene - Sonic Aesthetic")
        
        self.clock = pygame.time.Clock()
        self.running = True
        self.animation_time = 0.0
        
        # Scene objects
        self.scene_objects = {}
        self.object_positions = {}
        
        # Enhanced rendering properties
        self.dither_patterns = self._create_dither_patterns()
        self.shadow_color = (0, 0, 0, 128)  # 50% transparent black
        
        # Colors
        self.bg_color = (20, 20, 30)  # Dark blue background
        
        logger.info("Enhanced Scene initialized with Sonic aesthetic")
    
    def _create_dither_patterns(self) -> dict:
        """Create Bayer dithering patterns for materials"""
        return {
            'lush_green': [
                [0, 1, 0, 1],
                [1, 0, 1, 0],
                [0, 1, 0, 1],
                [1, 0, 1, 0]
            ],
            'wood_brown': [
                [1, 0, 0, 1],
                [0, 1, 1, 0],
                [0, 1, 1, 0],
                [1, 0, 0, 1]
            ],
            'stone_gray': [
                [0, 0, 1, 1],
                [1, 1, 0, 0],
                [0, 0, 1, 1],
                [1, 1, 0, 0]
            ],
            'metal_silver': [
                [1, 1, 0, 0],
                [1, 0, 0, 1],
                [0, 0, 1, 1],
                [0, 1, 1, 0]
            ]
        }
    
    def load_assets(self) -> bool:
        """Load enhanced starter kit assets"""
        try:
            # Load the enhanced starter kit
            starter_path = Path("assets/objects_enhanced.yaml")
            if not starter_path.exists():
                logger.error(f"Enhanced starter kit not found: {starter_path}")
                return False
            
            success = load_starter_kit(starter_path)
            if not success:
                logger.error("Failed to load enhanced starter kit")
                return False
            
            loader = get_starter_loader()
            
            # Get scene rendering data
            scene_data = {}
            for obj_id in loader.get_scene_objects().keys():
                render_data = loader.get_rendering_data(obj_id)
                if render_data:
                    scene_data[obj_id] = render_data
            
            self.scene_objects = scene_data
            
            # Set up enhanced object positions
            self._setup_enhanced_scene_positions()
            
            logger.info(f"Loaded {len(self.scene_objects)} enhanced scene objects")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load enhanced assets: {e}")
            return False
    
    def _setup_enhanced_scene_positions(self) -> None:
        """Set up positions for enhanced scene objects"""
        # Position objects in an aesthetically pleasing scene
        positions = {
            'grass_tuft': [
                (50, 420), (120, 410), (200, 430), (280, 415), (360, 425),
                (440, 410), (520, 420), (600, 415), (680, 425), (750, 410)
            ],
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
    
    def get_dither_colors(self, material_id: str) -> tuple:
        """Get dithering colors for material"""
        base_color = self.hex_to_rgb(self.scene_objects[material_id]['color'])
        
        # Create light and dark variants
        light_color = tuple(min(255, c + 30) for c in base_color)
        dark_color = tuple(max(0, c - 30) for c in base_color)
        
        return dark_color, light_color
    
    def apply_dithering(self, surface: pygame.Surface, x: int, y: int, width: int, height: int, 
                       material_id: str) -> None:
        """Apply dithering pattern to surface"""
        if material_id not in self.scene_objects:
            return
        
        # Get dither pattern and colors
        if material_id == 'organic':
            pattern = self.dither_patterns['lush_green']
        elif material_id == 'wood':
            pattern = self.dither_patterns['wood_brown']
        elif material_id == 'stone':
            pattern = self.dither_patterns['stone_gray']
        elif material_id == 'metal':
            pattern = self.dither_patterns['metal_silver']
        else:
            return
        
        dark_color, light_color = self.get_dither_colors(material_id)
        
        # Apply dithering pattern
        cell_size = 4
        for dy in range(0, height, cell_size):
            for dx in range(0, width, cell_size):
                pattern_x = (x + dx) // cell_size % len(pattern[0])
                pattern_y = (y + dy) // cell_size % len(pattern)
                
                if pattern[pattern_y][pattern_x] == 1:
                    color = light_color
                else:
                    color = dark_color
                
                pygame.draw.rect(surface, color, (x + dx, y + dy, cell_size, cell_size))
    
    def draw_shadow(self, surface: pygame.Surface, x: int, y: int, width: int, height: int) -> None:
        """Draw drop shadow for grounding effect"""
        # Create shadow surface with transparency
        shadow_surface = pygame.Surface((width + 10, height // 2), pygame.SRCALPHA)
        
        # Draw shadow as ellipse
        shadow_rect = pygame.Rect(0, 0, width + 10, height // 2)
        pygame.draw.ellipse(shadow_surface, self.shadow_color, shadow_rect)
        
        # Blit shadow to main surface
        surface.blit(shadow_surface, (x - 5, y + height // 3))
    
    def apply_kinetic_sway(self, base_x: int, base_y: int, material_id: str, time_offset: float) -> tuple:
        """Apply kinetic sway animation to organic materials"""
        if material_id != 'organic':
            return base_x, base_y
        
        # Calculate sway using sine wave
        sway_amplitude = 3.0
        sway_frequency = 2.0
        
        sway_offset = sway_amplitude * math.sin(2 * math.pi * sway_frequency * time_offset)
        
        return int(base_x + sway_offset), base_y
    
    def draw_enhanced_object(self, obj_id: str, obj_data: dict, position: tuple) -> None:
        """Draw enhanced object with all aesthetic effects"""
        x, y = position
        
        # Get object properties
        material_id = obj_id.replace('_tuft', '').replace('oak_', '').replace('gray_', '').replace('wooden_', '').replace('iron_', '')
        if material_id == 'grass':
            material_id = 'organic'
        elif material_id == 'tree':
            material_id = 'wood'
        elif material_id == 'boulder':
            material_id = 'stone'
        elif material_id == 'gate':
            material_id = 'wood'
        elif material_id == 'lockbox':
            material_id = 'metal'
        
        # Apply kinetic sway
        swayed_x, swayed_y = self.apply_kinetic_sway(x, y, material_id, self.animation_time)
        
        # Draw shadow first (behind object)
        if obj_data.get('collision', False):
            self.draw_shadow(self.screen, swayed_x, swayed_y, 32, 32)
        
        # Draw based on sprite type with dithering
        sprite_id = obj_data['sprite_id']
        
        if sprite_id == 'grass':
            # Draw grass with dithering
            self.apply_dithering(self.screen, swayed_x, swayed_y - 8, 8, 12, material_id)
            self.apply_dithering(self.screen, swayed_x + 4, swayed_y - 12, 8, 12, material_id)
            self.apply_dithering(self.screen, swayed_x + 2, swayed_y - 16, 8, 12, material_id)
        
        elif sprite_id == 'tree':
            # Draw tree trunk with wood dithering
            trunk_color = self.hex_to_rgb("#5d4037")
            pygame.draw.rect(self.screen, trunk_color, (swayed_x, swayed_y, 20, 40))
            
            # Draw leaves with organic dithering
            self.apply_dithering(self.screen, swayed_x - 15, swayed_y - 35, 50, 50, 'organic')
        
        elif sprite_id == 'boulder':
            # Draw boulder with stone dithering
            self.apply_dithering(self.screen, swayed_x, swayed_y, 40, 40, 'stone')
            # Add outline
            pygame.draw.circle(self.screen, (100, 100, 100), (swayed_x + 20, swayed_y + 20), 20, 2)
        
        elif sprite_id == 'gate':
            # Draw gate with wood dithering
            self.apply_dithering(self.screen, swayed_x, swayed_y, 30, 50, 'wood')
            # Add handle
            pygame.draw.rect(self.screen, (200, 200, 200), (swayed_x + 20, swayed_y + 20, 5, 5))
        
        elif sprite_id == 'chest':
            # Draw chest with metal dithering
            self.apply_dithering(self.screen, swayed_x, swayed_y, 40, 30, 'metal')
            # Add lock
            pygame.draw.rect(self.screen, (255, 215, 0), (swayed_x + 15, swayed_y + 10, 10, 10))
        
        else:
            # Default: draw with material dithering
            self.apply_dithering(self.screen, swayed_x, swayed_y, 30, 30, material_id)
    
    def draw_enhanced_scene(self) -> None:
        """Draw the complete enhanced scene"""
        # Clear screen
        self.screen.fill(self.bg_color)
        
        # Draw ground with organic dithering
        ground_color = self.hex_to_rgb("#2d5a27")
        pygame.draw.rect(self.screen, ground_color, (0, 400, self.screen_width, 200))
        
        # Apply ground dithering
        for x in range(0, self.screen_width, 8):
            for y in range(400, self.screen_height, 8):
                self.apply_dithering(self.screen, x, y, 8, 8, 'organic')
        
        # Draw objects with enhancements
        for obj_id, obj_data in self.scene_objects.items():
            if obj_id in self.object_positions:
                for position in self.object_positions[obj_id]:
                    self.draw_enhanced_object(obj_id, obj_data, position)
        
        # Draw title
        font = pygame.font.Font(None, 36)
        title = font.render("DGT Enhanced Scene - Sonic Aesthetic", True, (255, 255, 255))
        self.screen.blit(title, (10, 10))
        
        # Draw object count
        font_small = pygame.font.Font(None, 24)
        count_text = font_small.render(f"Objects: {len(self.scene_objects)} | Dithering: ON | Shadows: ON | Kinetic: ON", True, (200, 200, 200))
        self.screen.blit(count_text, (10, 50))
        
        # Draw instructions
        instructions = [
            "ESC - Exit",
            "Enhanced Starter Kit with Sonic Aesthetic",
            f"Animation Time: {self.animation_time:.1f}s"
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
        """Run the enhanced scene"""
        logger.info("Starting Enhanced Scene with Sonic aesthetic")
        
        if not self.load_assets():
            logger.error("Failed to load enhanced assets, exiting")
            return
        
        # Main game loop
        while self.running:
            self.handle_events()
            
            # Update animation time
            self.animation_time = time.time()
            
            # Draw enhanced scene
            self.draw_enhanced_scene()
            
            pygame.display.flip()
            self.clock.tick(60)  # 60 FPS
        
        pygame.quit()
        logger.info("Enhanced Scene ended")

def main():
    """Main entry point"""
    # Configure logging
    logger.remove()
    logger.add(sys.stdout, level="INFO", format="{time} | {level} | {message}")
    
    print("=== DGT Enhanced Scene Launcher ===")
    print("Loading Sonic Aesthetic Starter Kit...")
    
    try:
        scene = EnhancedScene()
        scene.run()
        print("✅ Enhanced Scene completed successfully!")
        
    except Exception as e:
        logger.error(f"Enhanced scene failed: {e}")
        print(f"❌ Enhanced scene failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
