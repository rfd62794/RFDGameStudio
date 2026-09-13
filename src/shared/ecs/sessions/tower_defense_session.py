"""
TowerDefenseSession - Tower Defense game state
ADR-009: Session Isolation
"""
import json
import random
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from loguru import logger

from src.shared.entities.creature import Creature
from src.shared.ecs.components.wave_component import WaveComponent


@dataclass
class TowerDefenseSession:
    """Tower Defense game state"""
    
    # Identity
    session_id: str = field(default_factory=lambda: str(random.randint(10000, 99999)))
    
    # Game State
    wave: int = 1
    gold: int = 100
    lives: int = 20
    score: int = 0
    
    # Towers (slimes placed on grid)
    towers: List[Creature] = field(default_factory=list)
    tower_grid: Dict[tuple, str] = field(default_factory=dict)  # (x,y) -> slime_id
    
    # Enemies
    enemies: List[Creature] = field(default_factory=list)
    
    # Wave Configuration
    seed: int = field(default_factory=lambda: random.randint(0, 10000))
    completed_waves: int = 0
    
    # Components & Systems
    wave_component: WaveComponent = field(default_factory=WaveComponent)
    
    # Game State
    game_active: bool = False
    game_paused: bool = False
    game_over: bool = False
    victory: bool = False
    
    # Statistics
    enemies_killed: int = 0
    enemies_escaped: int = 0
    total_damage_dealt: int = 0
    gold_earned: int = 0
    towers_placed: int = 0
    
    def start_game(self) -> None:
        """Start a new Tower Defense game"""
        self.game_active = True
        self.game_paused = False
        self.game_over = False
        self.victory = False
        self.wave = 1
        self.gold = 100
        self.lives = 20
        self.score = 0
        self.completed_waves = 0
        self.enemies_killed = 0
        self.enemies_escaped = 0
        self.total_damage_dealt = 0
        self.gold_earned = 0
        self.towers_placed = 0
        
        # Clear existing state
        self.towers.clear()
        self.tower_grid.clear()
        self.enemies.clear()
        
        # Start first wave
        self.wave_component.start_wave()
        
        logger.info(f"Started Tower Defense game (Session ID: {self.session_id})")
    
    def pause_game(self) -> None:
        """Pause the game"""
        self.game_paused = True
        logger.info(f"Paused Tower Defense game (Session ID: {self.session_id})")
    
    def resume_game(self) -> None:
        """Resume the game"""
        self.game_paused = False
        logger.info(f"Resumed Tower Defense game (Session ID: {self.session_id})")
    
    def end_game(self, victory: bool = False) -> None:
        """End the game"""
        self.game_active = False
        self.game_over = True
        self.victory = victory
        
        logger.info(f"Ended Tower Defense game (Session ID: {self.session_id}, Victory: {victory})")
    
    def place_tower(self, slime: Creature, grid_x: int, grid_y: int) -> bool:
        """Place a tower on the grid"""
        # Check if position is valid
        if (grid_x, grid_y) in self.tower_grid:
            return False  # Position already occupied
        
        # Check if slime is already placed
        if slime.slime_id in [tower.slime_id for tower in self.towers]:
            return False  # Slime already placed
        
        # Place tower
        self.towers.append(slime)
        self.tower_grid[(grid_x, grid_y)] = slime.slime_id
        self.towers_placed += 1
        
        logger.info(f"Placed tower {slime.name} at ({grid_x}, {grid_y})")
        return True
    
    def remove_tower(self, grid_x: int, grid_y: int) -> bool:
        """Remove a tower from the grid"""
        if (grid_x, grid_y) not in self.tower_grid:
            return False  # No tower at position
        
        slime_id = self.tower_grid[(grid_x, grid_y)]
        
        # Find and remove tower
        for i, tower in enumerate(self.towers):
            if tower.slime_id == slime_id:
                removed_tower = self.towers.pop(i)
                del self.tower_grid[(grid_x, grid_y)]
                logger.info(f"Removed tower {removed_tower.name} from ({grid_x}, {grid_y})")
                return True
        
        return False
    
    def add_gold(self, amount: int) -> None:
        """Add gold to the player"""
        self.gold += amount
        self.gold_earned += amount
    
    def spend_gold(self, amount: int) -> bool:
        """Spend gold if available"""
        if self.gold >= amount:
            self.gold -= amount
            return True
        return False
    
    def lose_life(self) -> None:
        """Lose a life"""
        self.lives -= 1
        if self.lives <= 0:
            self.end_game(victory=False)
    
    def add_score(self, points: int) -> None:
        """Add score"""
        self.score += points
    
    def complete_wave(self) -> None:
        """Complete current wave"""
        self.completed_waves += 1
        self.wave += 1
        
        # Prepare next wave
        self.wave_component.next_wave()
        self.wave_component.start_wave()
        
        # Bonus gold for completing wave
        wave_bonus = 10 * self.wave
        self.add_gold(wave_bonus)
        
        logger.info(f"Completed wave {self.wave - 1}, earned {wave_bonus} gold")
    
    def get_game_state(self) -> Dict[str, Any]:
        """Get current game state for UI"""
        return {
            "session_id": self.session_id,
            "wave": self.wave,
            "gold": self.gold,
            "lives": self.lives,
            "score": self.score,
            "game_active": self.game_active,
            "game_paused": self.game_paused,
            "game_over": self.game_over,
            "victory": self.victory,
            "towers_placed": self.towers_placed,
            "enemies_killed": self.enemies_killed,
            "enemies_escaped": self.enemies_escaped,
            "completed_waves": self.completed_waves,
            "wave_info": self.wave_component.get_wave_info(),
        }
    
    def get_tower_info(self) -> List[Dict[str, Any]]:
        """Get information about placed towers"""
        tower_info = []
        for tower in self.towers:
            tower_data = {
                "slime_id": tower.slime_id,
                "name": tower.name,
                "level": tower.level,
                "position": (tower.kinematics.position.x, tower.kinematics.position.y),
                "genome": {
                    "shape": tower.genome.shape,
                    "size": tower.genome.size,
                    "base_color": tower.genome.base_color,
                },
            }
            
            # Add tower component info if available
            if hasattr(tower, 'tower_component'):
                tower_data.update({
                    "tower_type": tower.tower_component.tower_type,
                    "damage": tower.tower_component.get_damage(),
                    "range": tower.tower_component.get_range(),
                    "fire_rate": tower.tower_component.get_fire_rate(),
                    "upgrades": {
                        "damage": tower.tower_component.damage_upgrades,
                        "range": tower.tower_component.range_upgrades,
                        "fire_rate": tower.tower_component.fire_rate_upgrades,
                    },
                })
            
            tower_info.append(tower_data)
        
        return tower_info
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get game statistics"""
        return {
            "session_id": self.session_id,
            "total_play_time": 0,  # Would need to track this
            "enemies_killed": self.enemies_killed,
            "enemies_escaped": self.enemies_escaped,
            "total_damage_dealt": self.total_damage_dealt,
            "gold_earned": self.gold_earned,
            "gold_spent": 0,  # Would need to track this
            "towers_placed": self.towers_placed,
            "completed_waves": self.completed_waves,
            "final_score": self.score,
            "victory": self.victory,
        }
    
    def save_to_file(self, filepath: Optional[Path] = None) -> None:
        """Persist session to JSON"""
        if filepath is None:
            filepath = Path(f"saves/tower_defense_session_{self.session_id}.json")
        
        filepath.parent.mkdir(exist_ok=True)
        
        # Save tower grid positions
        tower_grid_serializable = {str(k): v for k, v in self.tower_grid.items()}
        
        session_data = {
            "session_id": self.session_id,
            "wave": self.wave,
            "gold": self.gold,
            "lives": self.lives,
            "score": self.score,
            "tower_grid": tower_grid_serializable,
            "seed": self.seed,
            "completed_waves": self.completed_waves,
            "game_active": self.game_active,
            "game_paused": self.game_paused,
            "game_over": self.game_over,
            "victory": self.victory,
            "enemies_killed": self.enemies_killed,
            "enemies_escaped": self.enemies_escaped,
            "total_damage_dealt": self.total_damage_dealt,
            "gold_earned": self.gold_earned,
            "towers_placed": self.towers_placed,
            "statistics": self.get_statistics(),
        }
        
        filepath.write_text(json.dumps(session_data, indent=2))
        logger.info(f"Saved Tower Defense session to {filepath}")
    
    @classmethod
    def load_from_file(cls, filepath: Optional[Path] = None, session_id: Optional[int] = None) -> "TowerDefenseSession":
        """Load session from JSON"""
        if filepath is None and session_id is not None:
            filepath = Path(f"saves/tower_defense_session_{session_id}.json")
        
        if not filepath.exists():
            raise FileNotFoundError(f"Session file not found: {filepath}")
        
        data = json.loads(filepath.read_text())
        
        session = cls(
            session_id=data["session_id"],
            wave=data["wave"],
            gold=data["gold"],
            lives=data["lives"],
            score=data["score"],
            seed=data["seed"],
            completed_waves=data["completed_waves"],
            game_active=data["game_active"],
            game_paused=data["game_paused"],
            game_over=data["game_over"],
            victory=data["victory"],
            enemies_killed=data["enemies_killed"],
            enemies_escaped=data["enemies_escaped"],
            total_damage_dealt=data["total_damage_dealt"],
            gold_earned=data["gold_earned"],
            towers_placed=data["towers_placed"],
        )
        
        # Restore tower grid
        session.tower_grid = {eval(k): v for k, v in data["tower_grid"].items()}
        
        logger.info(f"Loaded Tower Defense session from {filepath}")
        return session
