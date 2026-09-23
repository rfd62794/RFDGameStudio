"""
Asteroids Demo Orchestrator
SRP: Main game loop and multi-mode support
"""
import pygame
import sys
import argparse
from typing import List

from src.apps.asteroids.simulation.physics import update_kinetics
from src.apps.asteroids.simulation.spawner import Spawner
from src.apps.asteroids.simulation.collision import check_circle_collision
from src.apps.asteroids.entities.ship import Ship
from src.apps.asteroids.entities.asteroid import Asteroid
from src.apps.asteroids.entities.projectile import Projectile
from src.apps.asteroids.player.controller import Controller
from src.apps.asteroids.player.hud import HUD
from src.shared.entities.game_state import create_arcade_game_state
from src.shared.entities.projectiles import create_arcade_projectile_system

class AsteroidsGame:
    def __init__(self, mode: str = "human"):
        self.mode = mode
        self.running = True
        self.width, self.height = 160, 144
        self.scale = 4
        
        pygame.init()
        # TODO: Migrate to Scene subclass — tracked Phase N
        self.screen = pygame.display.get_surface()
        pygame.display.set_caption(f"rpgCore - Asteroids ({mode})")
        self.canvas = pygame.Surface((self.width, self.height))
        self.clock = pygame.time.Clock()
        
        # Systems
        self.spawner = Spawner((self.width, self.height))
        self.controller = Controller()
        self.hud = HUD()
        self.game_state = create_arcade_game_state()
        self.projectiles = create_arcade_projectile_system()
        
        # State
        self.ship = Ship()
        self.asteroids: List[Asteroid] = []
        self.game_time = 0.0
        
        self.game_state.start_new_game()
        self._next_wave()

    def _next_wave(self):
        wave = self.game_state.session.wave
        count = 2 + wave * 2
        safe_zone = (self.width/2, self.height/2, 40)
        self.asteroids = self.spawner.spawn_wave(count, safe_zone)

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            self.controller.handle_event(event)

    def update(self, dt: float):
        self.game_time += dt
        
        # Player
        self.controller.apply_input(self.ship, dt)
        update_kinetics(self.ship.kinetics, dt)
        
        # Firing
        if self.ship.alive and self.controller.apply_input(self.ship, dt):
            pos = self.ship.kinetics.get_position_tuple()
            angle = self.ship.kinetics.state.angle
            self.projectiles.fire_projectile("player", pos[0], pos[1], angle, self.game_time)
            
        # Asteroids
        for a in self.asteroids:
            update_kinetics(a.kinetics, dt)
            
        # Projectiles
        self.projectiles.update(dt, self.game_time)
        
        # Collisions
        self._process_collisions()
        
        # Wave progression
        if not self.asteroids:
            self.game_state.advance_wave()
            self._next_wave()

    def _process_collisions(self):
        if not self.ship.alive: return
        
        ship_pos = self.ship.kinetics.get_position_tuple()
        
        # Ship vs Asteroid
        for a in self.asteroids:
            if check_circle_collision(ship_pos, self.ship.radius, 
                                     a.kinetics.get_position_tuple(), a.radius):
                self._respawn_player()
                break
                
        # Bullet vs Asteroid
        def bullet_check(pos):
            for a in self.asteroids:
                if check_circle_collision(pos, 2, a.kinetics.get_position_tuple(), a.radius):
                    return a
            return None
            
        hits = self.projectiles.check_collisions(bullet_check)
        for _, asteroid in hits:
            self.game_state.add_score(asteroid.point_value)
            new_frags = self.spawner.fracture(asteroid)
            self.asteroids.remove(asteroid)
            self.asteroids.extend(new_frags)

    def _respawn_player(self):
        if self.game_state.lose_life():
            self.ship.alive = False # Simple game over for now
        else:
            self.ship.kinetics.set_position(self.width/2, self.height/2)
            self.ship.kinetics.stop()

    def render(self):
        self.canvas.fill((0, 0, 0))
        
        # Ship
        if self.ship.alive:
            pygame.draw.polygon(self.canvas, (0, 255, 0), self.ship.get_points(), 1)
            
        # Asteroids
        for a in self.asteroids:
            pos = a.kinetics.get_position_tuple()
            pygame.draw.circle(self.canvas, (255, 255, 255), (int(pos[0]), int(pos[1])), int(a.radius), 1)
            
        # Projectiles
        for p_pos in self.projectiles.get_active_positions():
            pygame.draw.circle(self.canvas, (255, 255, 255), (int(p_pos[0]), int(p_pos[1])), 1)
            
        # HUD
        self.hud.render(self.canvas, self.game_state.session, len(self.asteroids))
        
        # Scale and flip
        scaled = pygame.transform.scale(self.canvas, (self.width * self.scale, self.height * self.scale))
        self.screen.blit(scaled, (0, 0))
        pygame.display.flip()

    def run(self):
        while self.running:
            dt = self.clock.tick(60) / 1000.0
            self.handle_events()
            self.update(dt)
            self.render()
        pygame.quit()

def main():
    parser = argparse.ArgumentParser(description="rpgCore Asteroids")
    parser.add_argument("--mode", type=str, choices=["human", "watch", "train"], default="human")
    args, _ = parser.parse_known_args()
    
    if args.mode == "human":
        game = AsteroidsGame(mode="human")
        game.run()
    elif args.mode == "watch":
        print("AI pilot — coming in Phase 2")
    elif args.mode == "train":
        print("NEAT training — coming in Phase 2")

if __name__ == "__main__":
    main()
