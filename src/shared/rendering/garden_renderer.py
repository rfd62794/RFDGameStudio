"""
GardenRenderer - Environmental rendering for garden scenes
Renders ground layers, ship wreck, and environmental elements
"""

import pygame
import random
import math
import time
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class Plant:
    """Procedural plant for foraging zone"""
    x: float
    y: float
    radius: float
    color: Tuple[int, int, int]
    phase: float  # For sway animation


@dataclass
class Rock:
    """Procedural rock for training zone"""
    points: List[Tuple[float, float]]
    color: Tuple[int, int, int]


@dataclass
class SteamParticle:
    """Animated steam particle for ship wreck"""
    x_offset: float
    y_offset: float
    speed: float
    max_offset: float = 25.0


class GardenRenderer:
    """Renders garden environment with zones and procedural elements"""
    
    def __init__(self, garden_rect: pygame.Rect, session_id: Optional[str] = None):
        self.garden_rect = garden_rect
        self.session_id = session_id or str(time.time())
        
        # Zone calculations
        self._calculate_zones()
        
        # Zone colors (base, level 0)
        self.zone_colors = {
            'nursery': (40, 55, 40),
            'training': (35, 45, 50),
            'foraging': (35, 50, 35),
            'outpost': (45, 40, 35)
        }
        
        # Animation state
        self.time_accumulator = 0.0
        self.shimmer_phase = 0.0
        
        # Generate procedural elements
        self.plants: List[Plant] = []
        self.rocks: List[Rock] = []
        self.steam_particles: List[SteamParticle] = []
        
        self._generate_environmental_elements()
        self._generate_steam_particles()
        
        # Cache static surfaces
        self._cached_surfaces: Dict[str, pygame.Surface] = {}
        self._cache_static_elements()
    
    def _calculate_zones(self):
        """Calculate zone rectangles based on garden dimensions"""
        cx, cy = self.garden_rect.center
        
        # Nursery: center 25%
        nursery_w = self.garden_rect.width * 0.25
        nursery_h = self.garden_rect.height * 0.25
        self.nursery_rect = pygame.Rect(
            cx - nursery_w // 2,
            cy - nursery_h // 2,
            nursery_w,
            nursery_h
        )
        
        # Training: center 60%
        training_w = self.garden_rect.width * 0.60
        training_h = self.garden_rect.height * 0.60
        self.training_rect = pygame.Rect(
            cx - training_w // 2,
            cy - training_h // 2,
            training_w,
            training_h
        )
        
        # Foraging: full garden area (outer ring)
        self.foraging_rect = self.garden_rect
        
        # Outpost: thin border ring (10px inset)
        self.outpost_rect = self.garden_rect.inflate(-20, -20)
    
    def _generate_environmental_elements(self):
        """Generate plants and rocks with seeded randomness"""
        # Seed for consistent generation
        seed = hash(self.session_id) % 10000
        random.seed(seed)
        
        # Generate plants in foraging zone (outer ring)
        plant_count = 8  # Base level, will be adjusted by garden_level
        for _ in range(plant_count):
            # Generate in foraging ring (outside training zone)
            angle = random.uniform(0, 2 * math.pi)
            distance = random.uniform(
                max(self.training_rect.width, self.training_rect.height) // 2 + 20,
                min(self.garden_rect.width, self.garden_rect.height) // 2 - 30
            )
            
            cx, cy = self.garden_rect.center
            x = cx + math.cos(angle) * distance
            y = cy + math.sin(angle) * distance
            
            # Ensure within garden bounds
            if self.garden_rect.collidepoint(x, y):
                radius = random.uniform(3, 6)
                color = random.choice([
                    (40, 120, 40),
                    (60, 140, 50),
                    (80, 160, 60)
                ])
                phase = random.uniform(0, 2 * math.pi)
                
                self.plants.append(Plant(x, y, radius, color, phase))
        
        # Generate rocks in training zone
        rock_count = 5
        for _ in range(rock_count):
            # Random position in training zone
            x = random.uniform(
                self.training_rect.left + 30,
                self.training_rect.right - 30
            )
            y = random.uniform(
                self.training_rect.top + 30,
                self.training_rect.bottom - 30
            )
            
            # Keep away from nursery center
            nursery_center = self.nursery_rect.center
            if math.sqrt((x - nursery_center[0])**2 + (y - nursery_center[1])**2) > 60:
                # Generate irregular polygon for rock
                points = []
                num_points = random.randint(5, 6)
                for i in range(num_points):
                    angle = (2 * math.pi * i) / num_points + random.uniform(-0.3, 0.3)
                    radius = random.uniform(8, 15)
                    px = x + math.cos(angle) * radius
                    py = y + math.sin(angle) * radius
                    points.append((px, py))
                
                color = random.choice([(80, 80, 90), (70, 70, 80)])
                self.rocks.append(Rock(points, color))
        
        # Reset random seed
        random.seed()
    
    def _generate_steam_particles(self):
        """Generate steam particles for ship wreck"""
        self.steam_particles = [
            SteamParticle(5, 0, 0.8),
            SteamParticle(15, 8, 1.0),
            SteamParticle(25, 16, 0.6)
        ]
    
    def _cache_static_elements(self):
        """Cache static environmental elements for performance"""
        try:
            # Cache rocks (static)
            rock_surface = pygame.Surface((self.garden_rect.width, self.garden_rect.height), pygame.SRCALPHA)
            for rock in self.rocks:
                if len(rock.points) >= 3:
                    pygame.draw.polygon(rock_surface, rock.color, rock.points)
            self._cached_surfaces['rocks'] = rock_surface
        except Exception as e:
            # If caching fails, we'll render dynamically
            self._cached_surfaces.clear()
    
    def update(self, dt: float):
        """Update animation states"""
        self.time_accumulator += dt
        self.shimmer_phase += dt * 1.2
        
        # Update steam particles
        for particle in self.steam_particles:
            particle.y_offset += particle.speed * dt * 30  # Scale for visible movement
            if particle.y_offset > particle.max_offset:
                particle.y_offset = 0
    
    def render_ground(self, surface: pygame.Surface, garden_level: int = 0):
        """Render ground layers with zones"""
        try:
            brightness = min(1.0, 0.6 + (garden_level * 0.15))
            
            # Render zones back to front
            zones = [
                ('foraging', self.foraging_rect),
                ('training', self.training_rect),
                ('nursery', self.nursery_rect)
            ]
            
            for zone_name, zone_rect in zones:
                base_color = self.zone_colors[zone_name]
                color = tuple(int(c * brightness) for c in base_color)
                
                # Draw main zone
                pygame.draw.rect(surface, color, zone_rect)
                
                # Draw soft edge glow
                glow_surface = pygame.Surface((zone_rect.width + 16, zone_rect.height + 16), pygame.SRCALPHA)
                glow_color = (*color, 80)  # 30% alpha
                pygame.draw.rect(glow_surface, glow_color, glow_surface.get_rect(), border_radius=8)
                surface.blit(glow_surface, (zone_rect.x - 8, zone_rect.y - 8))
            
            # Draw outpost border (thin ring)
            if self.outpost_rect.width > 0 and self.outpost_rect.height > 0:
                outpost_color = tuple(int(c * brightness) for c in self.zone_colors['outpost'])
                pygame.draw.rect(surface, outpost_color, self.garden_rect, 3)
                pygame.draw.rect(surface, outpost_color, self.outpost_rect, 1)
                
        except Exception as e:
            # Fallback to simple dark background
            surface.fill((20, 20, 30), self.garden_rect)
    
    def render_ship(self, surface: pygame.Surface):
        """Render ship wreck with animated steam"""
        try:
            # Ship position: bottom-left corner
            ship_x = self.garden_rect.left + 60
            ship_y = self.garden_rect.bottom - 70
            
            # Hull points (elongated octagon)
            hull_points = [
                (ship_x, ship_y + 20),
                (ship_x + 15, ship_y),
                (ship_x + 65, ship_y),
                (ship_x + 80, ship_y + 20),
                (ship_x + 75, ship_y + 40),
                (ship_x + 5, ship_y + 40)
            ]
            
            # Draw hull
            pygame.draw.polygon(surface, (60, 60, 70), hull_points)
            
            # Draw damage patches
            damage_patches = [
                [(ship_x + 20, ship_y + 15), (ship_x + 30, ship_y + 10), (ship_x + 25, ship_y + 25)],
                [(ship_x + 50, ship_y + 25), (ship_x + 60, ship_y + 20), (ship_x + 55, ship_y + 35)]
            ]
            for patch in damage_patches:
                pygame.draw.polygon(surface, (40, 40, 50), patch)
            
            # Draw steam particles
            for particle in self.steam_particles:
                steam_x = ship_x + particle.x_offset
                steam_y = ship_y - particle.y_offset
                
                # Fade based on height
                alpha = max(0, 1.0 - (particle.y_offset / particle.max_offset))
                color = tuple(int(c * alpha) for c in (120, 120, 130))
                
                pygame.draw.circle(surface, color, (int(steam_x), int(steam_y)), 3)
                
        except Exception as e:
            # Ship rendering is optional
            pass
    
    def render_environment(self, surface: pygame.Surface, garden_level: int = 0):
        """Render environmental elements"""
        try:
            brightness = min(1.0, 0.6 + (garden_level * 0.15))
            
            # Render rocks (from cache if available)
            if 'rocks' in self._cached_surfaces:
                surface.blit(self._cached_surfaces['rocks'], self.garden_rect.topleft)
            else:
                # Fallback: render rocks dynamically
                for rock in self.rocks:
                    if len(rock.points) >= 3:
                        color = tuple(int(c * brightness) for c in rock.color)
                        pygame.draw.polygon(surface, color, rock.points)
            
            # Render plants with sway
            for plant in self.plants:
                sway = math.sin(self.time_accumulator * 0.8 + plant.phase) * 1.5
                plant_x = plant.x + sway
                
                color = tuple(int(c * brightness) for c in plant.color)
                pygame.draw.circle(surface, color, (int(plant_x), int(plant.y)), int(plant.radius))
            
            # Render water feature in nursery
            nursery_center = self.nursery_rect.center
            water_x = nursery_center[0] + random.uniform(-5, 5)  # Slight random offset
            water_y = nursery_center[1] + random.uniform(-3, 3)
            
            # Shimmer effect
            shimmer = math.sin(self.shimmer_phase) * 15
            water_color = tuple(int(min(255, c + shimmer)) for c in (30, 60, 90))
            
            # Draw water ellipse
            water_rect = pygame.Rect(0, 0, 50, 36)  # rx=25, ry=18
            water_rect.center = (water_x, water_y)
            
            water_surface = pygame.Surface((50, 36), pygame.SRCALPHA)
            pygame.draw.ellipse(water_surface, (*water_color, 180), water_surface.get_rect())
            surface.blit(water_surface, water_rect.topleft)
            
        except Exception as e:
            # Environmental elements are optional
            pass
    
    def get_idle_zone_target(self, slime) -> Optional[Tuple[float, float]]:
        """Get target position for idle slime based on personality"""
        try:
            # Read personality axes from genome
            axes = getattr(slime.genome, 'personality_axes', {})
            patience = axes.get('patience', 0.3)
            curiosity = axes.get('curiosity', 0.3)
            aggression = axes.get('aggression', 0.3)
            sociability = axes.get('sociability', 0.3)
            
            # Zone selection logic
            if patience > 0.5 and curiosity < 0.3:
                zone = 'nursery'
            elif aggression > 0.5:
                zone = 'training'
            elif curiosity > 0.5:
                zone = 'foraging'
            else:
                zone = 'training'
            
            # Get zone rectangle
            zone_rects = {
                'nursery': self.nursery_rect,
                'training': self.training_rect,
                'foraging': self.foraging_rect
            }
            
            zone_rect = zone_rects.get(zone, self.training_rect)
            
            # Generate random point within zone (20px inset from boundaries)
            inset = 20
            x = random.uniform(
                zone_rect.left + inset,
                zone_rect.right - inset
            )
            y = random.uniform(
                zone_rect.top + inset,
                zone_rect.bottom - inset
            )
            
            return (x, y)
            
        except Exception as e:
            # Fallback to center of training zone
            return self.training_rect.center
