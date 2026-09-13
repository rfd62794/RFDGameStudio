"""
Tower Defense Scene - Main game scene for Tower Defense demo
ADR-008: Slimes Are Towers
"""
import pygame
from typing import List, Optional, Tuple
from loguru import logger

from src.shared.engine.scene_manager import Scene, SceneManager
from src.shared.ui.spec import UISpec
from src.shared.ui.label import Label
from src.shared.ui.button import Button
from src.shared.ui.panel import Panel
from src.shared.teams.roster import Roster
from src.shared.teams.roster_save import load_roster, save_roster
from src.shared.ecs.sessions.tower_defense_session import TowerDefenseSession
from src.shared.ecs.registry.component_registry import ComponentRegistry
from src.shared.ecs.systems.system_runner import SystemRunner
from src.shared.ecs.systems.tower_defense_behavior_system import TowerDefenseBehaviorSystem
from src.shared.ecs.systems.wave_system import WaveSystem
from src.shared.ecs.systems.upgrade_system import UpgradeSystem
from src.shared.ecs.systems.collision_system import CollisionSystem
from src.shared.ecs.components.grid_position_component import GridPositionComponent
from src.shared.ecs.components.tower_component import TowerComponent
from src.shared.ecs.components.behavior_component import BehaviorComponent
from src.shared.ecs.components.wave_component import WaveComponent
from src.shared.ecs.utils.tower_defense_feedback import end_tower_defense_session, get_session_summary, format_session_results
from src.shared.entities.creature import Creature
from src.shared.genetics.genome import SlimeGenome
from src.shared.physics.kinematics import Vector2


class TowerDefenseScene(Scene):
    """Tower Defense game scene"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        
        # Load roster for tower selection
        self.roster = load_roster()
        
        # Create session
        self.session = TowerDefenseSession()
        
        # Grid configuration
        self.grid_size = 10
        self.tile_size = 48
        self.grid_offset_x = 80
        self.grid_offset_y = 0
        
        # ECS systems
        self.component_registry = ComponentRegistry()
        self.system_runner = SystemRunner(self.component_registry)
        self.tower_behavior_system = TowerDefenseBehaviorSystem()
        self.wave_system = WaveSystem()
        self.upgrade_system = UpgradeSystem()
        self.collision_system = CollisionSystem()
        
        # UI state
        self.selected_slime = None
        self.selected_upgrade = None
        self.selected_tower = None
        self.show_tower_selection = False
        self.show_upgrade_menu = False
        self.show_game_over = False
        
        # Game state
        self.game_started = False
        self.dt_accumulator = 0.0
        self.update_rate = 1.0 / 60.0  # 60 FPS
        
        # Initialize UI
        self._setup_ui()
        
        logger.info("Tower Defense scene initialized")
    
    def _setup_ui(self) -> None:
        """Initialize UI components"""
        # Main game panel
        self.game_panel = Panel(
            pygame.Rect(0, 0, self.spec.screen_width, self.spec.screen_height),
            self.spec,
            "surface",
            False
        )
        
        # HUD panel
        self.hud_panel = Panel(
            pygame.Rect(0, 0, self.spec.screen_width, 60),
            self.spec,
            "surface",
            False
        )
        
        # Tower selection panel
        self.tower_selection_panel = Panel(
            pygame.Rect(self.spec.screen_width - 300, 0, 300, self.spec.screen_height - 60),
            self.spec,
            "surface",
            False
        )
        
        # Upgrade menu panel
        self.upgrade_menu_panel = Panel(
            pygame.Rect(self.spec.screen_width - 200, self.spec.screen_height // 2 - 75, 200, 150),
            self.spec,
            "surface",
            False
        )
        
        # Game over panel
        self.game_over_panel = Panel(
            pygame.Rect(self.spec.screen_width // 2 - 200, self.spec.screen_height // 2 - 100, 400, 200),
            self.spec,
            "surface",
            False
        )
        
        # Labels
        self.wave_label = Label("Wave: 1", (10, 10), self.spec, "md", self.spec.color_text)
        self.gold_label = Label("Gold: 100", (150, 10), self.spec, "md", self.spec.color_text)
        self.lives_label = Label("Lives: 20", (300, 10), self.spec, "md", self.spec.color_text)
        self.score_label = Label("Score: 0", (450, 10), self.spec, "md", self.spec.color_text)
        
        # Buttons
        self.start_button = Button("Start Game", pygame.Rect(10, 30, 100, 30), None, self.spec)
        self.pause_button = Button("Pause", pygame.Rect(10, 30, 80, 30), None, self.spec)
        self.menu_button = Button("Menu", pygame.Rect(100, 30, 80, 30), None, self.spec)
        
        # Tower selection buttons
        self.tower_buttons = []
        for i in range(8):
            button = Button(f"Slot {i+1}", pygame.Rect(0, 0, 100, 30), None, self.spec)
            self.tower_buttons.append(button)
        
        # Upgrade buttons
        self.upgrade_buttons = {
            "damage": Button("Damage", pygame.Rect(0, 0, 100, 30), None, self.spec),
            "range": Button("Range", pygame.Rect(0, 0, 100, 30), None, self.spec),
            "fire_rate": Button("Fire Rate", pygame.Rect(0, 0, 100, 30), None, self.spec),
        }
    
    def handle_events(self, events) -> None:
        """Handle pygame events"""
        for event in events:
            self.handle_event(event)
    
    def handle_event(self, event: pygame.event.Event) -> None:
        """Process a single pygame event"""
        if event.type == pygame.MOUSEBUTTONDOWN:
            self._handle_mouse_click(event)
        elif event.type == pygame.KEYDOWN:
            self._handle_key_press(event)
    
    def _handle_mouse_click(self, event) -> None:
        """Handle mouse click events"""
        mouse_x, mouse_y = event.pos
        
        # Convert to grid coordinates
        grid_x = (mouse_x - self.grid_offset_x) // self.tile_size
        grid_y = (mouse_y - self.grid_offset_y) // self.tile_size
        
        if 0 <= grid_x < self.grid_size and 0 <= grid_y < self.grid_size:
            self._handle_grid_click(grid_x, grid_y, mouse_x, mouse_y)
        else:
            # Check UI buttons
            self._handle_ui_click(mouse_x, mouse_y)
    
    def _handle_grid_click(self, grid_x: int, grid_y: int, mouse_x: int, mouse_y: int) -> None:
        """Handle grid click events"""
        if self.show_tower_selection:
            self._handle_tower_selection_click(grid_x, grid_y)
        elif self.show_upgrade_menu and self.selected_tower:
            self._handle_upgrade_menu_click(mouse_x, mouse_y)
        elif self.session.game_active and not self.session.game_over:
            # Check if clicking on existing tower
            if (grid_x, grid_y) in self.session.tower_grid:
                self.selected_tower = self.session.tower_grid[(grid_x, grid_y)]
                self.show_upgrade_menu = True
            else:
                # Show tower selection
                self.show_tower_selection = True
        elif self.show_game_over:
            # Handle game over click
            self._handle_game_over_click(mouse_x, mouse_y)
    
    def _handle_tower_selection_click(self, grid_x: int, grid_y: int) -> None:
        """Handle tower selection click"""
        # Check if clicking on a tower button
        button_index = grid_y * 8 + grid_x  # 8 buttons per row
        if button_index < len(self.tower_buttons):
            button = self.tower_buttons[button_index]
            if self.selected_slime:
                # Place tower
                success = self.session.place_tower(self.selected_slime, grid_x, grid_y)
                if success:
                    self.show_tower_selection = False
                    self.selected_slime = None
                    self.selected_tower = None
                    # Add to ECS
                    self._add_tower_to_ecs(self.session.towers[-1])
        
        # Cancel tower selection
        self.show_tower_selection = False
        self.selected_slime = None
    
    def _handle_upgrade_menu_click(self, mouse_x: int, mouse_y: int) -> None:
        """Handle upgrade menu click"""
        for upgrade_type, button in self.upgrade_buttons.items():
            if button.is_clicked(mouse_x, mouse_y):
                if self.selected_tower:
                    tower = self._find_tower_by_id(self.selected_tower)
                    if tower and tower.tower_component:
                        success, remaining_gold = self.upgrade_system.upgrade_tower(
                            tower.tower_component, upgrade_type, self.session.gold
                        )
                        if success:
                            self.session.gold = remaining_gold
                            logger.info(f"Upgraded {upgrade_type} on tower {tower.name}")
                        else:
                            logger.warning(f"Failed to upgrade {upgrade_type} on tower {tower.name}")
        
        # Close upgrade menu
        self.show_upgrade_menu = False
        self.selected_tower = None
    
    def _handle_ui_click(self, mouse_x: int, mouse_y: int) -> None:
        """Handle UI button clicks"""
        if self.start_button.is_clicked(mouse_x, mouse_y):
            if not self.session.game_active:
                self.session.start_game()
                self.game_started = True
                self._add_all_towers_to_ecs()
        
        elif self.pause_button.is_clicked(mouse_x, mouse_y):
            if self.session.game_active:
                if self.session.game_paused:
                    self.session.resume_game()
                else:
                    self.session.pause_game()
        
        elif self.menu_button.is_clicked(mouse_x, mouse_y):
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            self.context.manager.switch_to(GardenScene(**self.context.resources))
        
        elif self.show_game_over:
            self._handle_game_over_click(mouse_x, mouse_y)
    
    def _handle_game_over_click(self, mouse_x: int, mouse_y: int) -> None:
        """Handle game over click"""
        # Check for menu button
        if self.menu_button.is_clicked(mouse_x, mouse_y):
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            self.context.manager.switch_to(GardenScene(**self.context.resources))
        else:
            # Close game over panel
            self.show_game_over = False
    
    def _handle_key_press(self, event) -> None:
        """Handle keyboard events"""
        if event.key == pygame.K_ESCAPE:
            if self.show_tower_selection:
                self.show_tower_selection = False
                self.selected_slime = None
            elif self.show_upgrade_menu:
                self.show_upgrade_menu = False
                self.selected_tower = None
            elif self.show_game_over:
                self.show_game_over = False
            elif self.session.game_active:
                self.session.pause_game()
            else:
                from src.apps.slime_breeder.ui.scene_garden import GardenScene
                self.context.manager.switch_to(GardenScene(**self.context.resources))
        
        elif event.key == pygame.K_SPACE:
            if not self.session.game_active:
                self.session.start_game()
                self.game_started = True
                self._add_all_towers_to_ecs()
            elif self.session.game_paused:
                self.session.resume_game()
    
    def tick(self, dt: float) -> None:
        """Update game logic"""
        if not self.session.game_active:
            return
        
        if self.session.game_paused or self.session.game_over:
            return
        
        # Update wave system
        new_enemies = self.wave_system.update(self.session.wave_component, dt)
        self.session.enemies.extend(new_enemies)
        
        # Add new enemies to ECS
        for enemy in new_enemies:
            self._add_enemy_to_ecs(enemy)
        
        # Update ECS systems
        self._update_ecs_systems(dt)
        
        # Check game over conditions
        if self.session.lives <= 0:
            self.session.end_game(victory=False)
            self.show_game_over = True
            self._handle_session_end()
    
    def _update_ecs_systems(self, dt: float) -> None:
        """Update ECS systems"""
        # Update tower behavior
        for tower in self.session.towers:
            tower_component = self.component_registry.get_component(tower.slime_id, TowerComponent)
            behavior_component = self.component_registry.get_component(tower.slime_id, BehaviorComponent)
            if tower_component and behavior_component:
                self.tower_behavior_system.update(tower, behavior_component, tower_component, dt)
        
        # Update collision system
        results = self.collision_system.update(
            self.session.towers, 
            self.session.enemies, 
            dt
        )
        
        # Update session statistics
        self.session.enemies_killed += results['enemies_killed']
        self.session.enemies_escaped += results['enemies_escaped']
        self.session.total_damage_dealt += results['damage_dealt']
        self.session.gold_earned += results['gold_earned']
        self.session.add_gold(results['gold_earned'])
        self.session.add_score(results['enemies_killed'] * 10)
        
        # Check wave completion
        if self.session.wave_component.wave_complete and len(self.session.enemies) == 0:
            self.session.complete_wave()
    
    def _add_tower_to_ecs(self, tower: Creature) -> None:
        """Add tower to ECS system"""
        # Add components
        tower_component = TowerComponent()
        self.component_registry.add_component(tower.slime_id, TowerComponent, tower_component)
        
        behavior_component = BehaviorComponent()
        self.component_registry.add_component(tower.slime_id, BehaviorComponent, behavior_component)
        
        # Add grid position
        grid_pos = self._find_tower_grid_position(tower)
        grid_component = GridPositionComponent(grid_pos[0], grid_pos[1])
        self.component_registry.add_component(tower.slime_id, GridPositionComponent, grid_component)
    
    def _add_enemy_to_ecs(self, enemy: Creature) -> None:
        """Add enemy to ECS system"""
        # Add behavior component
        behavior_component = BehaviorComponent()
        self.component_registry.add_component(enemy.slime_id, BehaviorComponent, behavior_component)
    
    def _find_tower_grid_position(self, tower: Creature) -> Tuple[int, int]:
        """Find tower's grid position"""
        for (grid_x, grid_y), slime_id in self.session.tower_grid.items():
            if slime_id == tower.slime_id:
                return grid_x, grid_y
        return 0, 0  # Default position
    
    def _find_tower_by_id(self, tower_id: str) -> Optional[Creature]:
        """Find tower by ID"""
        for tower in self.session.towers:
            if tower.slime_id == tower_id:
                return tower
        return None
    
    def _add_all_towers_to_ecs(self) -> None:
        """Add all existing towers to ECS"""
        for tower in self.session.towers:
            self._add_tower_to_ecs(tower)
    
    def _handle_session_end(self) -> None:
        """Handle session end"""
        # Save session
        self.session.save_to_file()
        
        # Feed back to roster
        from src.shared.teams.roster_save import load_roster, save_roster
        roster = load_roster()
        results = end_tower_defense_session(self.session, roster)
        save_roster(roster)
        
        # Log results
        logger.info("Tower Defense session completed:")
        logger.info(format_session_results(results))
    
    def render(self, surface) -> None:
        """Render the game"""
        # Clear surface
        surface.fill(self.spec.color_bg)
        
        # Draw grid
        self._render_grid(surface)
        
        # Draw towers
        self._render_towers(surface)
        
        # Draw enemies
        self._render_enemies(surface)
        
        # Draw projectiles
        self._render_projectiles(surface)
        
        # Draw UI
        self._render_ui(surface)
        
        # Draw overlays
        if self.show_tower_selection:
            self._render_tower_selection(surface)
        elif self.show_upgrade_menu:
            self._render_upgrade_menu(surface)
        elif self.show_game_over:
            self._render_game_over(surface)
    
    def _render_grid(self, surface) -> None:
        """Render the grid"""
        # Draw grid lines
        for x in range(self.grid_size + 1):
            x_pos = self.grid_offset_x + x * self.tile_size
            pygame.draw.line(surface, 
                           (x_pos, self.grid_offset_y), 
                           (x_pos, self.grid_offset_y + self.grid_size * self.tile_size), 
                           self.spec.color_border)
        
        for y in range(self.grid_size + 1):
            y_pos = self.grid_offset_y + y * self.tile_size
            pygame.draw.line(surface, 
                           (self.grid_offset_x, y_pos), 
                           (self.grid_offset_x + self.grid_size * self.tile_size, y_pos), 
                           self.spec.color_border)
        
        # Draw occupied tiles
        for (grid_x, grid_y), slime_id in self.session.tower_grid.items():
            x_pos = self.grid_offset_x + grid_x * self.tile_size
            y_pos = self.grid_offset_y + grid_y * self.tile_size
            pygame.draw.rect(surface, 
                           (x_pos, y_pos, self.tile_size, self.tile_size), 
                           self.spec.color_tower_bg)
    
    def _render_towers(self, surface) -> None:
        """Render towers"""
        for tower in self.session.towers:
            # Get tower position
            grid_pos = self._find_tower_grid_position(tower)
            x_pos = self.grid_offset_x + grid_pos[0] * self.tile_size
            y_pos = self.tile_size // 2  # Center of tile
            
            # Draw tower (simple circle for now)
            pygame.draw.circle(surface, (x_pos + self.tile_size // 2, y_pos + self.tile_size // 2), 
                           self.tile_size // 3, self.spec.color_success)
            
            # Draw tower type indicator
            if hasattr(tower, 'tower_component'):
                tower_type = tower.tower_component.tower_type
                color_map = {
                    "scout": (100, 200, 100),
                    "rapid_fire": (200, 100, 100),
                    "support": (100, 100, 200),
                    "bunker": (200, 200, 100),
                    "balanced": (150, 150, 150),
                }
                color = color_map.get(tower_type, (150, 150, 150))
                pygame.draw.circle(surface, (x_pos + self.tile_size // 2, y_pos + self.tile_size // 2), 
                               self.tile_size // 4, color)
    
    def _render_enemies(self, surface) -> None:
        """Render enemies"""
        for enemy in self.session.enemies:
            # Draw enemy (simple circle for now)
            pygame.draw.circle(surface, 
                           (int(enemy.kinematics.position.x), int(enemy.kinematics.position.y)), 
                           8, self.spec.color_danger)
    
    def _render_projectiles(self, surface) -> None:
        """Render projectiles"""
        for projectile in self.collision_system.projectiles:
            pygame.draw.circle(surface, 
                           (int(projectile.position.x), int(projectile.position.y)), 
                           3, self.spec.color_accent)
    
    def _render_ui(self, surface) -> None:
        """Render UI elements"""
        # Draw HUD
        pygame.draw.rect(surface, (0, 0, self.spec.screen_width, 60), self.spec.color_surface)
        
        # Update labels
        self.wave_label.set_text(f"Wave: {self.session.wave}")
        self.gold_label.set_text(f"Gold: {self.session.gold}")
        self.lives_label.set_text(f"Lives: {self.session.lives}")
        self.score_label.set_text(f"Score: {self.session.score}")
        
        # Draw labels
        self.wave_label.render(surface)
        self.gold_label.render(surface)
        self.lives_label.render(surface)
        self.score_label.render(surface)
        
        # Draw buttons
        if not self.session.game_active:
            self.start_button.render(surface)
        else:
            self.pause_button.render(surface)
        self.menu_button.render(surface)
        
        # Draw game state
        if self.session.game_paused:
            pause_text = Label("PAUSED", (self.spec.screen_width // 2 - 50, 30), self.spec, "md", self.spec.color_text)
            pause_text.render(surface)
        
        # Draw game over
        if self.session.game_over:
            game_over_text = Label("GAME OVER", (self.spec.screen_width // 2 - 100, self.spec.screen_height // 2 - 20), self.spec, "md", self.spec.color_text)
            game_over_text.render(surface)
            
            result_text = "VICTORY" if self.session.victory else "DEFEAT"
            result_label = Label(result_text, (self.spec.screen_width // 2 - 100, self.spec.screen_height // 2 + 20), self.spec, "md", 
                               self.spec.color_success if self.session.victory else self.spec.color_danger)
            result_label.render(surface)
    
    def _render_tower_selection(self, surface) -> None:
        """Render tower selection panel"""
        # Draw panel
        pygame.draw.rect(surface, 
                       (self.spec.screen_width - 300, 0, 300, self.spec.screen_height), 
                       self.spec.color_surface)
        
        # Draw title
        title = Label("Select Tower", (self.spec.screen_width - 280, 20), self.spec, "md", self.spec.color_text)
        title.render(surface)
        
        # Draw tower buttons
        for i, button in enumerate(self.tower_buttons):
            y_pos = 60 + i * 40
            button.rect.y = y_pos
            button.rect.x = self.spec.screen_width - 280
            button.render(surface)
        
        # Draw slime info if selected
        if self.selected_slime:
            info_text = f"Selected: {self.selected_slime.name}"
            info_label = Label(info_text, (self.spec.screen_width - 280, 400), self.spec, "md", self.spec.color_text)
            info_label.render(surface)
            
            # Draw stats
            stats_text = f"Level: {self.selected_slime.level}"
            stats_label = Label(stats_text, (self.spec.screen_width - 280, 420), self.spec, "md", self.spec.color_text)
            stats_label.render(surface)
    
    def _render_upgrade_menu(self, surface) -> None:
        """Render upgrade menu"""
        # Draw panel
        pygame.draw.rect(surface, 
                       (self.spec.screen_width - 200, 
                        self.spec.screen_height // 2 - 75, 200, 150), 
                       self.spec.color_surface)
        
        # Draw title
        tower_name = self.selected_tower.name if hasattr(self.selected_tower, 'name') else str(self.selected_tower)
        title = Label(f"Upgrade {tower_name}", (self.spec.screen_width - 180, self.spec.screen_height // 2 - 65), self.spec, "md", self.spec.color_text)
        title.render(surface)
        
        # Draw upgrade buttons
        y_offset = self.spec.screen_height // 2 - 35
        for i, (upgrade_type, button) in enumerate(self.upgrade_buttons.items()):
            button.rect.y = y_offset + i * 35
            button.rect.x = self.spec.screen_width - 180
            button.render(surface)
        
        # Draw gold
        gold_label = Label(f"Gold: {self.session.gold}", (self.spec.screen_width - 180, self.spec.screen_height // 2 + 5), self.spec, "md", self.spec.color_text)
        gold_label.render(surface)
    
    def _render_game_over(self, surface) -> None:
        """Render game over screen"""
        # Draw panel
        pygame.draw.rect(surface, 
                       (self.spec.screen_width // 2 - 200, 
                        self.spec.screen_height // 2 - 100, 400, 200), 
                       self.spec.color_surface)
        
        # Draw title
        title = Label("GAME OVER", (self.spec.screen_width // 2 - 100, self.spec.screen_height // 2 - 80), self.spec, "md", self.spec.color_text)
        title.render(surface)
        
        # Draw result
        result_text = "VICTORY" if self.session.victory else "DEFEAT"
        result_label = Label(result_text, (self.spec.screen_width // 2 - 100, self.spec.screen_height // 2 - 40), self.spec, "md", 
                           self.spec.color_success if self.session.victory else self.spec.color_danger)
        result_label.render(surface)
        
        # Draw statistics
        stats = self.session.get_statistics()
        stats_text = f"Waves: {stats['completed_waves']} | Killed: {stats['enemies_killed']} | Score: {stats['final_score']}"
        stats_label = Label(stats_text, (self.spec.screen_width // 2 - 180, self.spec.screen_height // 2), self.spec, "md", self.spec.color_text)
        stats_label.render(surface)
        
        # Draw menu button
        self.menu_button.rect.x = self.spec.screen_width // 2 - 50
        self.menu_button.rect.y = self.spec.screen_height - 50
        self.menu_button.render(surface)
        
        # Draw achievements
        if stats.get('achievements'):
            achievements_text = "Achievements: " + ", ".join(stats['achievements'][:3])
            achievements_label = Label(achievements_text, (self.spec.screen_width // 2 - 180, self.spec.screen_height // 2 + 20), self.spec, "md", self.spec.color_text)
            achievements_label.render(surface)
