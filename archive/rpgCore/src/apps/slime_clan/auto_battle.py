#!/usr/bin/env python3
"""
Session 013 — Auto-Battle Scene
===============================
A 640x480 standalone auto-battler for Slime Clan squads.
3v3 deterministic battles with speed-based turn order.
"""

import sys
import enum
import math
import random
from dataclasses import dataclass
from typing import List, Optional

import pygame
from loguru import logger

# Session 020: D20 dice engine for combat resolution
from src.shared.combat.d20_resolver import D20Resolver

# Session 023: ECS Framework Integration
from src.game_engine.systems.body.entity_manager import RPGEntity, EntityManager

# Module-level resolver instance (shared across all combat)
_resolver = D20Resolver()

# Import the procedural slime drawer from the strategic layer
try:
    from src.apps.slime_clan.territorial_grid import draw_slime, SLIME_COLORS, TileState
except ImportError:
    # Fallback for standalone/testing if path issues occur
    class TileState(enum.IntEnum):
        NEUTRAL = 0
        BLUE = 1
        RED = 2
        BLOCKED = 3
    SLIME_COLORS = {TileState.BLUE: (50, 160, 255), TileState.RED: (255, 80, 80)}
    def draw_slime(surface, cx, cy, tile_size, color):
        pygame.draw.circle(surface, color, (cx, cy), int(tile_size * 0.435))

# ---------------------------------------------------------------------------
# Enums & Data Models
# ---------------------------------------------------------------------------
class Shape(enum.Enum):
    CIRCLE = "CIRCLE"      # Balanced
    SQUARE = "SQUARE"      # +Defense, -Speed
    TRIANGLE = "TRIANGLE"  # +Speed, -Defense

class Hat(enum.Enum):
    NONE = "NONE"      # No specialization
    SWORD = "SWORD"    # Attacker
    SHIELD = "SHIELD"  # Defender (Taunt)
    STAFF = "STAFF"    # Utility/Healer

class SlimeUnit(RPGEntity):
    """
    Session 023: Migrated to RPGEntity.
    Inherits from the engine's ECS framework while preserving the Slime Clan interface.
    """
    def __init__(self, **kwargs):
        super().__init__()
        self.entity_type = "slime_unit"
        self.team: TileState = None
        self.shape: Shape = None
        self.hat: Hat = None
        self.max_hp: int = 0
        self.attack: int = 0
        self.defense: int = 0
        self.speed: int = 0
        self.taunt_active: bool = False
        self.is_crit_focused: bool = False
        self.stunned_turns: int = 0
        self.weaken_turns: int = 0
        self.weaken_amount: int = 0
        self.mana_surge_active: bool = False
        self.rally_defense_bonus: int = 0
        self.max_mana: int = 5
        self.mana = 3  # RPGEntity field

        # Apply kwargs (important for EntityManager spawning and testing)
        for k, v in kwargs.items():
            setattr(self, k, v)
            if k == 'hp':
                self.health = v

    @property
    def hp(self) -> int:
        """Compatibility property for legacy code and tests."""
        return self.health

    @hp.setter
    def hp(self, value: int):
        self.health = value

    # RPGEntity Lifecycle Wrappers
    def initialize(self) -> bool:
        return True

    def tick(self, delta_time: float) -> None:
        pass

    def shutdown(self) -> None:
        pass

# ---------------------------------------------------------------------------
# Pure Functions: Stat Generation
# ---------------------------------------------------------------------------
def create_slime(unit_id: str, name: str, team: TileState, shape: Shape, hat: Hat, is_player: bool = False, difficulty_mult: float = 1.0, manager: Optional[EntityManager] = None) -> SlimeUnit:
    """Generate a SlimeUnit with stats modified by Shape and Hat."""
    # Base Stats
    hp = 20
    attack = 5
    defense = 2
    speed = 10

    # Shape Modifiers
    if shape == Shape.SQUARE:
        defense += 3
        speed -= 3
        hp += 5
    elif shape == Shape.TRIANGLE:
        speed += 4
        defense -= 1
        hp -= 3
    elif shape == Shape.CIRCLE:
        pass # Balanced

    # Hat Role specializations (minor stat bumps to fit role)
    if hat == Hat.SWORD:
        attack += 3
    elif hat == Hat.SHIELD:
        defense += 2
        hp += 5
    elif hat == Hat.STAFF:
        speed += 2
        attack -= 2 # Staff users hit weakly

    # Session 015 Player Bias: Elite Underdogs (+25% stats)
    if is_player:
        hp = int(hp * 1.25)
        attack = int(attack * 1.25)
        defense = int(defense * 1.25)
        speed = int(speed * 1.25)
    else:
        # Scale enemy stats based on difficulty (-20%, 0%, +20%)
        hp = max(1, int(hp * difficulty_mult))
        attack = max(1, int(attack * difficulty_mult))
        defense = max(1, int(defense * difficulty_mult))
        speed = max(1, int(speed * difficulty_mult))

    if manager:
        result = manager.spawn_entity("slime_unit",
            id=unit_id,
            name=name,
            team=team,
            shape=shape,
            hat=hat,
            hp=hp,
            max_hp=hp,
            attack=attack,
            defense=defense,
            speed=speed
        )
        return result.value

    return SlimeUnit(
        id=unit_id,
        name=name,
        team=team,
        shape=shape,
        hat=hat,
        hp=hp,
        max_hp=hp,
        attack=attack,
        defense=defense,
        speed=speed
    )

# ---------------------------------------------------------------------------
# Pure Functions: Combat Logic
# ---------------------------------------------------------------------------
def execute_action(actor: SlimeUnit, allies: List[SlimeUnit], enemies: List[SlimeUnit]) -> str:
    """Execute one turn for the actor. Returns a combat log string."""
    if actor.hp <= 0:
        return f"{actor.name} is dead and cannot act."

    # Tick down status effects
    if actor.weaken_turns > 0:
        actor.weaken_turns -= 1
        if actor.weaken_turns == 0:
            actor.attack += actor.weaken_amount
            actor.weaken_amount = 0

    # Stun check — skip turn entirely
    if actor.stunned_turns > 0:
        actor.stunned_turns -= 1
        return f"😵 {actor.name} is STUNNED and cannot act!"

    # Clear taunt at start of turn
    actor.taunt_active = False

    if actor.hat == Hat.SWORD:
        return _execute_sword(actor, allies, enemies)
    elif actor.hat == Hat.SHIELD:
        return _execute_shield(actor, allies, enemies)
    elif actor.hat == Hat.STAFF:
        return _execute_staff(actor, allies, enemies)
    elif actor.hat == Hat.NONE:
        return _execute_none(actor, allies, enemies)
        
    return f"{actor.name} did nothing."


def _execute_none(actor: SlimeUnit, allies: List[SlimeUnit], enemies: List[SlimeUnit]) -> str:
    """NONE AI: Basic unspecialized attacker. Just hits the weakest target."""
    alive_enemies = [e for e in enemies if e.hp > 0]
    if not alive_enemies:
        return f"{actor.name} finds no enemies to attack."

    # Default: Attack (with taunt redirection, generates +1 mana)
    taunted_enemies = [e for e in alive_enemies if e.taunt_active]
    if taunted_enemies:
        target = min(taunted_enemies, key=lambda e: e.hp)
    else:
        target = min(alive_enemies, key=lambda e: e.hp)
        
    # Session 020: D20 roll + attack modifier for damage
    roll = _resolver.roll_d20(modifier=actor.attack)
    base_roll = roll - actor.attack
    damage = max(1, roll - target.defense)
    
    # Crit logic: nat 20 always crits, else 5% chance (lower for unspecialized)
    is_crit = base_roll == 20 or random.random() < 0.05
    if is_crit:
        damage = int(damage * 1.5)
    
    target.hp = max(0, target.hp - damage)
    actor.mana = min(actor.max_mana, actor.mana + 1)
    
    if is_crit:
        return f"💥 {actor.name} lands a solid hit on {target.name} for {damage} dmg! ({target.hp}/{target.max_hp} HP)"
    return f"👊 {actor.name} bumps {target.name} for {damage} dmg! (🎲{base_roll}+{actor.attack}={roll} vs {target.defense} Def) ({target.hp}/{target.max_hp} HP)"


def _execute_sword(actor: SlimeUnit, allies: List[SlimeUnit], enemies: List[SlimeUnit]) -> str:
    """SWORD AI: Attack (default +1 mana), Crit Focus (2 mana), Taunt Break (1 mana)."""
    alive_enemies = [e for e in enemies if e.hp > 0]
    if not alive_enemies:
        return f"{actor.name} finds no enemies to attack."

    # Decision: Taunt Break (cost 1) — if a high-HP enemy is taunting, break it
    taunted_enemies = [e for e in alive_enemies if e.taunt_active]
    non_taunted_low = [e for e in alive_enemies if not e.taunt_active and e.hp < e.max_hp * 0.4]
    if taunted_enemies and non_taunted_low and actor.mana >= 1:
        actor.mana -= 1
        target = taunted_enemies[0]
        target.taunt_active = False
        return f"🔓 {actor.name} uses TAUNT BREAK on {target.name}! Taunt removed. ({actor.mana}/{actor.max_mana} MP)"

    # Decision: Crit Focus (cost 2) — if strongest enemy has > 75% HP and we're not already focused
    strongest = max(alive_enemies, key=lambda e: e.hp)
    if not actor.is_crit_focused and strongest.hp > strongest.max_hp * 0.75 and len(alive_enemies) > 1 and actor.mana >= 2:
        actor.mana -= 2
        actor.is_crit_focused = True
        return f"🎯 {actor.name} enters CRIT FOCUS! Next attack is a guaranteed critical. ({actor.mana}/{actor.max_mana} MP)"

    # Default: Attack (with taunt redirection, generates +1 mana)
    if taunted_enemies:
        target = min(taunted_enemies, key=lambda e: e.hp)
    else:
        target = min(alive_enemies, key=lambda e: e.hp)
        
    # Session 020: D20 roll + attack modifier for damage
    roll = _resolver.roll_d20(modifier=actor.attack)
    base_roll = roll - actor.attack  # Extract the raw d20 value
    damage = max(1, roll - target.defense)
    
    # Crit logic: nat 20 always crits, focused always crits, else 15% chance
    is_crit = base_roll == 20 or actor.is_crit_focused or random.random() < 0.15
    if is_crit:
        damage = int(damage * 1.75)
        actor.is_crit_focused = False
    
    target.hp = max(0, target.hp - damage)
    actor.mana = min(actor.max_mana, actor.mana + 1)
    
    if base_roll == 20 and is_crit:
        return f"🎲💥 NAT 20 CRIT! {actor.name} attacks {target.name} for {damage} dmg! ({target.hp}/{target.max_hp} HP)"
    if is_crit:
        return f"💥 CRITICAL HIT! {actor.name} attacks {target.name} for {damage} dmg! ({target.hp}/{target.max_hp} HP)"
    return f"⚔️ {actor.name} attacks {target.name} for {damage} dmg! (🎲{base_roll}+{actor.attack}={roll} vs {target.defense} Def) ({target.hp}/{target.max_hp} HP)"


def _execute_shield(actor: SlimeUnit, allies: List[SlimeUnit], enemies: List[SlimeUnit]) -> str:
    """SHIELD AI: Taunt (default +1 mana), Shield Bash (2 mana), Rally (1 mana). Solo: Bash as default."""
    alive_enemies = [e for e in enemies if e.hp > 0]
    alive_allies = [a for a in allies if a.hp > 0 and a.id != actor.id]
    is_last_alive = len(alive_allies) == 0
    
    # Session 017: SHIELD Solo Behavior — bash lowest HP enemy when last alive
    if is_last_alive and alive_enemies:
        target = min(alive_enemies, key=lambda e: e.hp)
        # Session 020: Desperate bash uses disadvantage roll
        roll = _resolver.roll_d20(modifier=actor.attack // 2, disadvantage=True)
        bash_damage = max(1, roll - target.defense)
        target.hp = max(0, target.hp - bash_damage)
        actor.mana = min(actor.max_mana, actor.mana + 1)
        return f"🔨 {actor.name} DESPERATE BASH on {target.name} for {bash_damage} dmg! ({target.hp}/{target.max_hp} HP)"

    # Decision: Shield Bash (cost 2) — stun enemy STAFF healers
    enemy_healers = [e for e in alive_enemies if e.hat == Hat.STAFF and e.stunned_turns == 0]
    if enemy_healers and actor.mana >= 2:
        actor.mana -= 2
        target = enemy_healers[0]
        # Session 020: Shield bash uses disadvantage roll (clumsy attack)
        roll = _resolver.roll_d20(modifier=actor.attack // 2, disadvantage=True)
        bash_damage = max(1, roll - target.defense)
        target.hp = max(0, target.hp - bash_damage)
        target.stunned_turns = 1
        return f"🔨 {actor.name} SHIELD BASHES {target.name} for {bash_damage} dmg + STUN! ({target.hp}/{target.max_hp} HP)"

    # Decision: Rally (cost 1) — if an ally is below 50% HP, boost their defense
    wounded_allies = [a for a in alive_allies if a.hp < a.max_hp * 0.5]
    if wounded_allies and actor.mana >= 1:
        actor.mana -= 1
        target = min(wounded_allies, key=lambda a: a.hp / a.max_hp)
        target.defense += 2
        target.rally_defense_bonus += 2
        return f"📣 {actor.name} RALLIES {target.name}! (+2 Defense) ({actor.mana}/{actor.max_mana} MP)"

    # Default: Taunt (generates +1 mana)
    actor.taunt_active = True
    actor.defense += 2
    actor.mana = min(actor.max_mana, actor.mana + 1)
    return f"🛡️ {actor.name} raises shield! (+2 Def, TAUNTING)"


def _execute_staff(actor: SlimeUnit, allies: List[SlimeUnit], enemies: List[SlimeUnit]) -> str:
    """STAFF AI: Heal (default +1 mana), Mana Surge (3 mana), Weaken (2 mana)."""
    alive_allies = [a for a in allies if a.hp > 0]
    alive_enemies = [e for e in enemies if e.hp > 0]
    
    # Calculate squad HP percentage for tactical decisions
    total_hp = sum(a.hp for a in allies)
    total_max = sum(a.max_hp for a in allies)
    squad_hp_pct = total_hp / total_max if total_max > 0 else 1.0
    
    # Decision: Weaken (cost 2) — if squad is losing (below 40% HP)
    if squad_hp_pct < 0.4 and alive_enemies and actor.mana >= 2:
        strongest_attacker = max(alive_enemies, key=lambda e: e.attack)
        if strongest_attacker.weaken_turns == 0:
            actor.mana -= 2
            # Session 020: Ability check vs target defense to determine weaken strength
            check = _resolver.ability_check(
                modifier=actor.attack,
                difficulty_class=10 + strongest_attacker.defense
            )
            reduce_amt = 3 if check.success else 1
            strongest_attacker.attack = max(1, strongest_attacker.attack - reduce_amt)
            strongest_attacker.weaken_turns = 2
            strongest_attacker.weaken_amount = reduce_amt
            result_str = "STRONG" if check.success else "WEAK"
            return f"🔮 {actor.name} WEAKENS {strongest_attacker.name}! ({result_str}: -{reduce_amt} Atk for 2 turns) (🎲{check.roll}+{actor.attack}={check.total_score} vs DC {check.difficulty_class}) ({actor.mana}/{actor.max_mana} MP)"

    # Decision: Mana Surge (cost 3) — if no ally is badly hurt, prep for a big heal
    worst_ally = min(alive_allies, key=lambda a: a.hp / a.max_hp)
    if not actor.mana_surge_active and worst_ally.hp > worst_ally.max_hp * 0.6 and actor.mana >= 3:
        actor.mana -= 3
        actor.mana_surge_active = True
        return f"✨ {actor.name} channels MANA SURGE! Next heal is doubled. ({actor.mana}/{actor.max_mana} MP)"

    # Default: Heal (lowest HP% ally, generates +1 mana)
    target = min(alive_allies, key=lambda a: a.hp / a.max_hp)
    
    missing_hp = target.max_hp - target.hp
    heal_amt = max(2, actor.attack) + int(missing_hp * 0.3)
    
    # Hard cap heal to 30% of max HP
    max_heal_cap = max(1, int(target.max_hp * 0.3))
    heal_amt = min(max_heal_cap, heal_amt)
    
    # Mana Surge doubles the heal
    if actor.mana_surge_active:
        heal_amt *= 2
        actor.mana_surge_active = False
    
    target.hp = min(target.max_hp, target.hp + heal_amt)
    actor.mana = min(actor.max_mana, actor.mana + 1)
    return f"✨ {actor.name} heals {target.name} for {heal_amt} HP! ({target.hp}/{target.max_hp} HP)"

# ---------------------------------------------------------------------------
# Auto-Battler Engine (PyGame)
# ---------------------------------------------------------------------------
WINDOW_WIDTH = 640
WINDOW_HEIGHT = 480
BACKGROUND_COLOR = (20, 25, 30)
TEXT_COLOR = (220, 220, 220)
FPS = 60
TICK_RATE_MS = 800

class AutoBattleScene:
    def __init__(self, region_name: str = "Unknown Region", difficulty: str = "NORMAL"):
        pygame.init()
        # TODO: Migrate to Scene subclass — tracked Phase N
        self.screen = pygame.display.get_surface()
        pygame.display.set_caption("rpgCore — Auto-Battle")
        self.region_name = region_name
        self.difficulty = difficulty
        self.turn_count = 0
        
        self.timer_ms = 0.0
        self.exit_code = 1 # Default to 1 (Loss/Cancel) if we exit early
        self.win_close_timer = 0.0 # Timer to auto-close after a winner is declared
        self.winner: Optional[str] = None

        try:
            self.font_name = pygame.font.Font(None, 20)
            self.font_log = pygame.font.Font(None, 24)
            self.font_banner = pygame.font.Font(None, 52)
        except Exception:
            self.font_name = pygame.font.SysFont("monospace", 14)
            self.font_log = pygame.font.SysFont("monospace", 16)
            self.font_banner = pygame.font.SysFont("monospace", 36)

        self.running = True
        
        # Session 023: EntityManager Setup
        self.entity_manager = EntityManager()
        self.entity_manager.initialize()
        self.entity_manager.register_entity_type("slime_unit", SlimeUnit)

        # Parse difficulty multiplier
        mult = 1.0
        if difficulty == "EASY": mult = 0.8
        elif difficulty == "HARD": mult = 1.2
        
        # Hard-coded Player Squad (Blue) per Session 014 Directive
        self.blue_squad = [
            create_slime("b1", "Rex", TileState.BLUE, Shape.CIRCLE, Hat.SWORD, is_player=True, manager=self.entity_manager),
            create_slime("b2", "Brom", TileState.BLUE, Shape.SQUARE, Hat.SHIELD, is_player=True, manager=self.entity_manager),
            create_slime("b3", "Pip", TileState.BLUE, Shape.TRIANGLE, Hat.STAFF, is_player=True, manager=self.entity_manager),
        ]
        
        self.red_squad = [
            create_slime("r1", "R-Brute", TileState.RED, Shape.SQUARE, Hat.SWORD, difficulty_mult=mult, manager=self.entity_manager),
            create_slime("r2", "R-Scout", TileState.RED, Shape.TRIANGLE, Hat.SWORD, difficulty_mult=mult, manager=self.entity_manager),
            create_slime("r3", "R-Cleric", TileState.RED, Shape.CIRCLE, Hat.STAFF, difficulty_mult=mult, manager=self.entity_manager),
        ]
        
        self.turn_queue: List[SlimeUnit] = []
        self._build_turn_queue()
        
        self.battle_logs: List[str] = [f"Battle Started in {self.region_name}!"]
        
        logger.info(f"⚔️ Auto-Battle Initialized for {self.region_name}")

    def on_enter(self, **kwargs) -> None:
        self.region_name = kwargs.get("region", "Unknown Region")
        self.difficulty = kwargs.get("difficulty", "NORMAL")

        # Context for return trip to BattleFieldScene
        self.bf_region = kwargs.get("bf_region", "")
        self.bf_difficulty = kwargs.get("bf_difficulty", "NORMAL")
        self.bf_node_id = kwargs.get("bf_node_id", "")
        self.bf_nodes = kwargs.get("bf_nodes", {})

        self.turn_count = 0
        self.timer_ms = 0.0
        self.winner: Optional[str] = None
        self.win_close_timer = 0.0

        try:
            self.font_name = pygame.font.Font(None, 20)
            self.font_log = pygame.font.Font(None, 24)
            self.font_banner = pygame.font.Font(None, 52)
        except Exception:
            self.font_name = pygame.font.SysFont("monospace", 14)
            self.font_log = pygame.font.SysFont("monospace", 16)
            self.font_banner = pygame.font.SysFont("monospace", 36)
        
        # Session 023: EntityManager Setup
        self.entity_manager = EntityManager()
        self.entity_manager.initialize()
        self.entity_manager.register_entity_type("slime_unit", SlimeUnit)

        # Difficulty multiplier
        mult = 1.0
        if self.difficulty == "EASY": mult = 0.8
        elif self.difficulty == "HARD": mult = 1.2

        self.blue_squad = [
            create_slime("b1", "Rex", TileState.BLUE, Shape.CIRCLE, Hat.SWORD, is_player=True, manager=self.entity_manager),
            create_slime("b2", "Brom", TileState.BLUE, Shape.SQUARE, Hat.SHIELD, is_player=True, manager=self.entity_manager),
            create_slime("b3", "Pip", TileState.BLUE, Shape.TRIANGLE, Hat.STAFF, is_player=True, manager=self.entity_manager),
        ]
        self.red_squad = [
            create_slime("r1", "R-Brute", TileState.RED, Shape.SQUARE, Hat.SWORD, difficulty_mult=mult, manager=self.entity_manager),
            create_slime("r2", "R-Scout", TileState.RED, Shape.TRIANGLE, Hat.SWORD, difficulty_mult=mult, manager=self.entity_manager),
            create_slime("r3", "R-Cleric", TileState.RED, Shape.CIRCLE, Hat.STAFF, difficulty_mult=mult, manager=self.entity_manager),
        ]

        self.turn_queue: List[SlimeUnit] = []
        self._build_turn_queue()
        self.battle_logs: List[str] = [f"Battle Started in {self.region_name}!"]

        logger.info(f"⚔️ Auto-Battle scene entered for {self.region_name}")

    def on_exit(self) -> None:
        self.entity_manager.shutdown()

    def _build_turn_queue(self) -> None:
        all_units = self.entity_manager.get_all_active_entities()
        alive = [u for u in all_units if u.hp > 0]
        # Sort by speed descending
        self.turn_queue = sorted(alive, key=lambda x: x.speed, reverse=True)
        self.turn_count += 1

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False

    def update(self, dt_ms: float):
        if self.winner:
            # Auto-close after 2 seconds so exit code propagates correctly
            self.win_close_timer += dt_ms
            if self.win_close_timer >= 2000:
                self.running = False
            return

        self.timer_ms += dt_ms
        if self.timer_ms >= TICK_RATE_MS:
            self.timer_ms -= TICK_RATE_MS
            self._process_next_turn()

    def _process_next_turn(self):
        # Filter queue to remove dead units before taking action
        self.turn_queue = [u for u in self.turn_queue if u.hp > 0]
        
        if not self.turn_queue:
            self._build_turn_queue()
            if not self.turn_queue:
                return # Everyone is dead?

        actor = self.turn_queue.pop(0)
        
        if actor.team == TileState.BLUE:
            allies = self.blue_squad
            enemies = self.red_squad
        else:
            allies = self.red_squad
            enemies = self.blue_squad
            
        log_msg = execute_action(actor, allies, enemies)
        logger.info(log_msg)
        self.battle_logs.append(log_msg)
        if len(self.battle_logs) > 5:
            self.battle_logs.pop(0)
            
        self._check_win_condition()

    def _check_win_condition(self):
        blue_alive = any(u.hp > 0 for u in self.blue_squad)
        red_alive = any(u.hp > 0 for u in self.red_squad)
        
        # Win Condition 1: Extermination
        if blue_alive and not red_alive:
            self.winner = "BLUE WINS!"
            self.exit_code = 0
            logger.info("🏆 Blue Squad Victory")
            return
        elif red_alive and not blue_alive:
            self.winner = "RED WINS!"
            self.exit_code = 1
            logger.info("🏆 Red Squad Victory")
            return
        elif not blue_alive and not red_alive:
            self.winner = "DRAW!"
            self.exit_code = 1
            return
            
        # Win Condition 2: Turn Limit Reached (Decision by HP Advantage)
        if hasattr(self, 'turn_count') and self.turn_count >= 50:
            b_hp_pct = sum(u.hp for u in self.blue_squad) / sum(u.max_hp for u in self.blue_squad)
            r_hp_pct = sum(u.hp for u in self.red_squad) / sum(u.max_hp for u in self.red_squad)
            if b_hp_pct > r_hp_pct:
                self.winner = "BLUE WINS (TIMEOUT)!"
                self.exit_code = 0
                logger.info(f"⌛ Turn Limit Reached. Blue wins by HP advantage: {b_hp_pct:.0%} vs {r_hp_pct:.0%}")
            else:
                self.winner = "RED WINS (TIMEOUT)!"
                self.exit_code = 1
                logger.info(f"⌛ Turn Limit Reached. Red wins by HP advantage: {r_hp_pct:.0%} vs {b_hp_pct:.0%}")

    def _get_shape_str(self, shape: Shape) -> str:
        if shape == Shape.CIRCLE: return "C"
        if shape == Shape.SQUARE: return "S"
        if shape == Shape.TRIANGLE: return "T"
        return "?"

    def _get_hat_str(self, hat: Hat) -> str:
        if hat == Hat.SWORD: return "⚔"
        if hat == Hat.SHIELD: return "🛡"
        if hat == Hat.STAFF: return "✨"
        return "?"

    def render(self):
        self.screen.fill(BACKGROUND_COLOR)
        
        center_y = WINDOW_HEIGHT // 2
        spacing = 80
        
        # Draw Blue Squad (Left)
        bx = WINDOW_WIDTH // 6
        for i, unit in enumerate(self.blue_squad):
            y = center_y + (i - 1) * spacing
            self._draw_unit(unit, bx, y)
            
        # Draw Red Squad (Right)
        rx = WINDOW_WIDTH - WINDOW_WIDTH // 6
        for i, unit in enumerate(self.red_squad):
            y = center_y + (i - 1) * spacing
            self._draw_unit(unit, rx, y)
            
        # Draw Battle Logs
        log_y = WINDOW_HEIGHT - 120
        for i, log_str in enumerate(self.battle_logs):
            surf = self.font_log.render(log_str, True, (180, 180, 180))
            self.screen.blit(surf, (WINDOW_WIDTH // 2 - surf.get_width() // 2, log_y + i * 20))

        # Draw Winner Banner
        if self.winner:
            banner_w, banner_h = 320, 80
            bx = (WINDOW_WIDTH - banner_w) // 2
            by = (WINDOW_HEIGHT - banner_h) // 2
            
            overlay = pygame.Surface((banner_w, banner_h))
            overlay.set_alpha(220)
            overlay.fill((10, 10, 15))
            self.screen.blit(overlay, (bx, by))
            
            color = (100, 200, 255) if "BLUE" in self.winner else (255, 100, 100)
            surf = self.font_banner.render(self.winner, True, color)
            self.screen.blit(surf, (bx + (banner_w - surf.get_width()) // 2, by + 15))
            
            esc_surf = self.font_name.render("ESC to Return", True, (150, 150, 150))
            self.screen.blit(esc_surf, (bx + (banner_w - esc_surf.get_width()) // 2, by + 60))

        pygame.display.flip()

    def _draw_unit(self, unit: SlimeUnit, x: int, y: int):
        if unit.hp <= 0:
            # Render faded gravestone or skip? For now, render faint outline
            pygame.draw.circle(self.screen, (50, 50, 50), (x, y), 20, 1)
            return

        # Name above
        name_surf = self.font_name.render(unit.name, True, TEXT_COLOR)
        self.screen.blit(name_surf, (x - name_surf.get_width() // 2, y - 35))
        
        # Slime body
        color = SLIME_COLORS[unit.team]
        draw_slime(self.screen, x, y, 48, color)
        
        # HP Bar below
        bar_w = 40
        bar_h = 6
        bx = x - bar_w // 2
        by = y + 25
        pygame.draw.rect(self.screen, (50, 50, 50), (bx, by, bar_w, bar_h))
        fill_w = max(0, int((unit.hp / unit.max_hp) * bar_w))
        hp_color = (50, 255, 50) if unit.hp > unit.max_hp * 0.3 else (255, 50, 50)
        pygame.draw.rect(self.screen, hp_color, (bx, by, fill_w, bar_h))
        
        # Indicators
        ind_str = f"[{self._get_shape_str(unit.shape)}] {self._get_hat_str(unit.hat)}"
        ind_surf = self.font_name.render(ind_str, True, (150, 150, 150))
        self.screen.blit(ind_surf, (x - ind_surf.get_width() // 2, by + 8))
        
        # Target/Taunt pulse (Optional polishing later)
        if unit.taunt_active:
            pygame.draw.circle(self.screen, (255, 200, 50), (x, y), 24, 1)

    def run(self):
        clock = pygame.time.Clock()
        while self.running:
            dt_ms = clock.tick(FPS)
            self.handle_events()
            self.update(dt_ms)
            self.render()
        pygame.quit()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--region", default="Unknown Region", help="Region name for the battle header")
    parser.add_argument("--difficulty", default="NORMAL", help="Difficulty multiplier modifier")
    args = parser.parse_args()
    
    app = AutoBattleScene(region_name=args.region, difficulty=args.difficulty)
    app.run()
    sys.exit(app.exit_code)
