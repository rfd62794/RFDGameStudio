import pygame
import os
from datetime import datetime

def save_screenshot(surface: pygame.Surface, scene_name: str):
    """Saves the surface to docs/ui_review/."""
    output_dir = "docs/ui_review"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    timestamp = datetime.now().strftime("%Y%m%d")
    filename = f"{scene_name}_{timestamp}.png"
    filepath = os.path.abspath(os.path.join(output_dir, filename))
    
    pygame.image.save(surface, filepath)
    print(f"✓ {scene_name}.png saved → {filepath}")
    print(f"  Open to review: {filepath}")
    return filepath
