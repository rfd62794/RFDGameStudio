import pygame
import math
import time
from typing import Tuple, List
from src.apps.slime_breeder.entities.slime import Slime

from src.shared.genetics.cultural_base import CULTURAL_PARAMETERS

class SlimeRenderer:
    def __init__(self):
        self.size_map = {
            "tiny": 8,
            "small": 15,
            "medium": 24,
            "large": 38,
            "massive": 56
        }

    def render(self, surface: pygame.Surface, slime: Slime, selected: bool = False) -> None:
        pos = (int(slime.kinematics.position.x), int(slime.kinematics.position.y))
        base_radius = self.size_map.get(slime.genome.size, 24)
        
        # Cultural tendencies
        culture = slime.genome.cultural_base
        params = CULTURAL_PARAMETERS[culture]
        
        # Breathing animation (slightly influenced by culture speed)
        pulse_speed = 3.0 * (params.wobble_frequency_range[0] + params.wobble_frequency_range[1]) / 2.0
        pulse = math.sin(time.time() * pulse_speed) * 0.05
        radius = int(base_radius * (1.0 + pulse))
        
        # Check if slime is dispatched (ghosted state)
        is_dispatched = (hasattr(slime, 'is_dispatched') and slime.is_dispatched) or \
                       (hasattr(slime, 'dispatched') and slime.dispatched) or \
                       (hasattr(slime, '_dispatched') and slime._dispatched)
        
        # Apply alpha for dispatched slimes
        alpha = 140 if is_dispatched else 255
        
        # Create surface with alpha for dispatched slimes
        if is_dispatched:
            temp_surface = pygame.Surface((base_radius * 4, base_radius * 4), pygame.SRCALPHA)
            temp_surface.fill((0, 0, 0, 0))
        else:
            temp_surface = surface
        
        # Tier-based visual effects
        tier = getattr(slime.genome, 'tier', 1)
        color = self._apply_tier_effects(slime.genome.base_color, tier, pos, radius)
        
        # Inner gradient color (lighter version of base color)
        inner_color = tuple(min(255, c + 50) for c in color)
        
        # Render slime body
        pygame.draw.circle(temp_surface, color, pos, radius)
        
        # Inner gradient
        gradient_radius = int(radius * 0.7)
        pygame.draw.circle(temp_surface, inner_color, pos, gradient_radius)
        
        # Team assignment ring (after body, before selection)
        if hasattr(slime, 'team') and slime.team and hasattr(slime.team, 'value') and slime.team.value != 'garden':
            from src.shared.ui.theme import DEFAULT_THEME
            team_color = DEFAULT_THEME.team_color(slime.team.value)
            ring_color = (*team_color, 180)  # Semi-transparent
            pygame.draw.circle(temp_surface, ring_color, pos, base_radius + 5, 3)
        
        # Stage indicator dot (below slime)
        if hasattr(slime, 'genome') and hasattr(slime.genome, 'stage'):
            from src.shared.ui.theme import DEFAULT_THEME
            stage_color = DEFAULT_THEME.stage_color(slime.genome.stage)
            dot_pos = (pos[0], pos[1] + base_radius + 8)
            pygame.draw.circle(temp_surface, stage_color, dot_pos, 4)
        
        # Dispatched arrow indicator (above slime)
        if is_dispatched:
            arrow_pos = (pos[0] + base_radius - 5, pos[1] - base_radius - 5)
            from src.shared.ui.theme import DEFAULT_THEME
            arrow_color = DEFAULT_THEME.text_secondary
            
            # Draw simple up-right arrow
            arrow_points = [
                (arrow_pos[0], arrow_pos[1] + 10),
                (arrow_pos[0] + 10, arrow_pos[1]),
                (arrow_pos[0] + 10, arrow_pos[1] - 10)
            ]
            pygame.draw.lines(temp_surface, arrow_color, False, arrow_points, 2)
        
        # Selection highlight
        if selected:
            pygame.draw.circle(temp_surface, (255, 255, 255), pos, radius + 2, 2)
        
        # Blit to main surface if using temporary surface
        if is_dispatched:
            surface.blit(temp_surface, (pos[0] - base_radius * 2, pos[1] - base_radius * 2), special_flags=pygame.BLEND_RGBA_ADD)
        
        p_color = slime.genome.pattern_color
        shape = slime.genome.shape
        seed = sum(color) # Deterministic seed based on color
        
        # 1. Base Shape
        if shape == "round":
            pygame.draw.circle(temp_surface, color, pos, radius)
        elif shape == "cubic":
            rect = pygame.Rect(pos[0] - radius, pos[1] - radius, radius * 2, radius * 2)
            pygame.draw.rect(temp_surface, color, rect)
        elif shape == "elongated":
            # Ellipse (wider than tall)
            rect = pygame.Rect(pos[0] - int(radius * 1.5), pos[1] - radius, radius * 3, radius * 2)
            pygame.draw.ellipse(temp_surface, color, rect)
        elif shape == "crystalline":
            # Hexagon
            points = []
            for i in range(6):
                angle = math.radians(i * 60)
                px = pos[0] + radius * math.cos(angle)
                py = pos[1] + radius * math.sin(angle)
                points.append((px, py))
            pygame.draw.polygon(temp_surface, color, points)
        elif shape == "amorphous":
            # Circle with wobble points influenced by culture
            points = []
            num_points = 12
            wobble_freq = (params.wobble_frequency_range[0] + params.wobble_frequency_range[1])
            for i in range(num_points):
                angle = math.radians(i * (360 / num_points))
                wobble = math.sin(time.time() * wobble_freq + i + seed) * (radius * 0.2)
                px = pos[0] + (radius + wobble) * math.cos(angle)
                py = pos[1] + (radius + wobble) * math.sin(angle)
                points.append((px, py))
            pygame.draw.polygon(temp_surface, color, points)

        # 2. Pattern Overlay (Void tier forces iridescent)
        pattern = 'iridescent' if tier == 8 else slime.genome.pattern
        if pattern == "spotted":
            # 3-5 small circles
            for i in range(4):
                off_x = math.sin(i * 1.5 + seed) * (radius * 0.4)
                off_y = math.cos(i * 1.5 + seed) * (radius * 0.4)
                pygame.draw.circle(temp_surface, p_color, (int(pos[0] + off_x), int(pos[1] + off_y)), max(2, radius // 6))
        elif pattern == "striped":
            # 2-3 horizontal lines
            line_w = max(1, radius // 8)
            for y_off in [-radius // 3, 0, radius // 3]:
                lx = pos[0] - radius + 2
                rx = pos[0] + radius - 2
                if shape == "elongated":
                    lx -= radius // 2
                    rx += radius // 2
                pygame.draw.line(temp_surface, p_color, (lx, pos[1] + y_off), (rx, pos[1] + y_off), line_w)
        elif pattern == "marbled":
            # Swirl suggestion using arc
            rect = pygame.Rect(pos[0] - radius//2, pos[1] - radius//2, radius, radius)
            pygame.draw.arc(temp_surface, p_color, rect, 0, math.pi, 2)
        elif pattern == "iridescent":
            # Second circle slightly offset, low alpha
            iri_surf = pygame.Surface((radius * 4, radius * 4), pygame.SRCALPHA)
            pygame.draw.circle(iri_surf, (*p_color, 80), (radius * 2, radius * 2), radius)
            temp_surface.blit(iri_surf, (pos[0] - radius * 2 + 3, pos[1] - radius * 2 + 3))

        # 3. Accessory indicator
        acc = slime.genome.accessory
        if acc == "crown":
            # Small yellow points above head
            pts = [(pos[0]-10, pos[1]-radius), (pos[0]-5, pos[1]-radius-10), (pos[0], pos[1]-radius), (pos[0]+5, pos[1]-radius-10), (pos[0]+10, pos[1]-radius)]
            pygame.draw.lines(temp_surface, (255, 215, 0), False, pts, 2)
        elif acc == "glow":
            # soft circle, low alpha, slightly larger than slime
            glow_surf = pygame.Surface((radius * 4, radius * 4), pygame.SRCALPHA)
            pygame.draw.circle(glow_surf, (255, 255, 200, 40), (radius * 2, radius * 2), radius + 10)
            temp_surface.blit(glow_surf, (pos[0] - radius * 2, pos[1] - radius * 2))
        elif acc == "shell":
            # small brown semicircle on back
            rect = pygame.Rect(pos[0] - radius, pos[1] - radius, radius, radius)
            pygame.draw.arc(temp_surface, (139, 69, 19), rect, 0, math.pi, 3)
        elif acc == "crystals":
            # 2-3 small diamond shapes
            for i in range(2):
                cx, cy = pos[0] + (i*15 - 7), pos[1] - radius - 5
                pygame.draw.polygon(temp_surface, (100, 200, 255), [(cx, cy-5), (cx+5, cy), (cx, cy+5), (cx-5, cy)])
        elif acc == "scar":
            # single dark line across face
            pygame.draw.line(temp_surface, (50, 0, 0), (pos[0]-radius//2, pos[1]), (pos[0]+radius//2, pos[1]+radius//2), 2)

        # 3.5 Elder Crown (Level 10+)
        if slime.level >= 10:
            # Persistent golden crown for Elders
            c_y = pos[1] - radius - 5
            pts = [(pos[0]-12, c_y), (pos[0]-6, c_y-12), (pos[0], c_y-4), (pos[0]+6, c_y-12), (pos[0]+12, c_y)]
            pygame.draw.polygon(temp_surface, (255, 215, 0), pts)
            pygame.draw.lines(temp_surface, (200, 160, 0), False, pts, 2)

        # 4. Simple eyes/face
        eye_color = (0, 0, 0)
        eye_off = radius // 3
        pygame.draw.circle(temp_surface, eye_color, (pos[0] - eye_off, pos[1] - eye_off), max(1, radius // 10))
        pygame.draw.circle(temp_surface, eye_color, (pos[0] + eye_off, pos[1] - eye_off), max(1, radius // 10))

        # Blit to main surface if using temporary surface
        if is_dispatched:
            surface.blit(temp_surface, (pos[0] - base_radius * 2, pos[1] - base_radius * 2), special_flags=pygame.BLEND_RGBA_ADD)

    def _apply_tier_effects(self, base_color: Tuple[int, int, int], tier: int, pos: Tuple[int, int], radius: int) -> Tuple[int, int, int]:
        """Apply tier-based visual effects to slime color"""
        if tier == 8:  # Void tier - color cycling
            # Slow color cycling: hue shifts +1 degree per second
            current_time = time.time()
            hue_offset = int(current_time * 60) % 360  # 60 degrees per second = 1 degree per frame at 60fps
            
            # Convert RGB to HSV, shift hue, convert back
            r, g, b = base_color
            # Simple hue shift approximation
            if hue_offset % 120 < 40:
                # Shift towards red
                r = min(255, r + 2)
                g = max(0, g - 1)
            elif hue_offset % 120 < 80:
                # Shift towards green
                g = min(255, g + 2)
                b = max(0, b - 1)
            else:
                # Shift towards blue
                b = min(255, b + 2)
                r = max(0, r - 1)
            
            return (r, g, b)
        elif tier == 7:  # Liminal tier - pulse effect
            # Alpha oscillation handled in rendering, just return base color
            return base_color
        else:
            # Tier 1-6: no visual changes
            return base_color

    def render_at(self, surface: pygame.Surface, slime: any, x: int, y: int, radius: int = None, selected: bool = False) -> None:
        """Utility to render a slime at a specific coordinate, for UI use."""
        # Create a temporary mock object to reuse the existing render logic
        class RenderProxy:
            def __init__(self, s, px, py):
                self.genome = s.genome
                self.level = getattr(s, 'level', 1)
                class Kinematics:
                    def __init__(self, kx, ky): self.position = pygame.Vector2(kx, ky)
                self.kinematics = Kinematics(px, py)
        
        proxy = RenderProxy(slime, x, y)
        
        # If radius is provided, we temporarily override the size_map for this render
        if radius is not None:
            old_size = self.size_map.get(slime.genome.size)
            self.size_map[slime.genome.size] = radius
            try:
                self.render(surface, proxy, selected)
            finally:
                if old_size is not None:
                    self.size_map[slime.genome.size] = old_size
        else:
            self.render(surface, proxy, selected)


def render_slime_from_genome(surface: pygame.Surface, genome, x: int, y: int, radius: int = 24) -> None:
    """
    Render a slime directly from a genome object without needing a full Slime entity.
    This is a convenience function for UI rendering.
    """
    # Create a minimal mock object with the required attributes
    class MockSlime:
        def __init__(self, genome, level=1):
            self.genome = genome
            self.level = level
    
    mock_slime = MockSlime(genome)
    renderer = SlimeRenderer()
    renderer.render_at(surface, mock_slime, x, y, radius)
