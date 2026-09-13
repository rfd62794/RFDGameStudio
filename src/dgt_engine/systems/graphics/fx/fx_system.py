"""
FX System - Particle Engine
Optimized for 160x144 PPU.
"""

import random
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    life: float
    color: Tuple[int, int, int]
    
class ParticleEmitter:
    """Minimalist Particle Emitter"""
    
    def __init__(self, x: int, y: int, rate: int = 5):
        self.x = x
        self.y = y
        self.rate = rate
        self.particles: List[Particle] = []
        
    def emit(self, count: int = 1):
        for _ in range(count):
            p = Particle(
                x=self.x, 
                y=self.y,
                vx=random.uniform(-1, 1),
                vy=random.uniform(-1, 1),
                life=1.0,
                color=(255, 255, 255)
            )
            self.particles.append(p)
            
    def update(self, dt: float):
        # Update existing particles
        alive_particles = []
        for p in self.particles:
            p.life -= dt
            if p.life > 0:
                p.x += p.vx
                p.y += p.vy
                alive_particles.append(p)
        self.particles = alive_particles

    def render(self, buffer):
        # Placeholder for rendering to PPU buffer
        pass
