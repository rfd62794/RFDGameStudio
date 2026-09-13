"""
Combat Resolver - Tag-Based Auto-Combat System
ADR 077: The Tag-Based Auto-Combat System

Implements turn-based D20 combat between entities with tag-based synergies.
"""

import time
import random
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger
from dgt_engine.systems.kernel.state.models import WorldDelta, GameState
from dgt_engine.systems.kernel.state.intents import Command, CommandResult
from dgt_engine.systems.body.pipeline.asset_loader import AssetDefinition


class CombatState(Enum):
    """Combat encounter states"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    VICTORY = "victory"
    DEFEAT = "defeat"
    FLED = "fled"


@dataclass
class Combatant:
    """Combat participant with stats and state"""
    entity_id: str
    asset_def: AssetDefinition
    current_hp: int
    max_hp: int
    str_mod: int
    def_mod: int
    initiative: int
    position: Tuple[int, int]
    tags: List[str]
    
    @classmethod
    def from_asset_def(cls, entity_id: str, asset_def: AssetDefinition, position: Tuple[int, int]) -> 'Combatant':
        """Create combatant from asset definition"""
        if not asset_def.characteristics:
            # Default combat stats for entities without combat data
            return cls(
                entity_id=entity_id,
                asset_def=asset_def,
                current_hp=20,
                max_hp=20,
                str_mod=5,
                def_mod=5,
                initiative=10,
                position=position,
                tags=[]
            )
        
        combat_stats = asset_def.characteristics.combat_stats
        return cls(
            entity_id=entity_id,
            asset_def=asset_def,
            current_hp=combat_stats.get('hp', 20),
            max_hp=combat_stats.get('hp', 20),
            str_mod=combat_stats.get('str', 5),
            def_mod=combat_stats.get('def', 5),
            initiative=combat_stats.get('initiative', 10),
            position=position,
            tags=asset_def.characteristics.tags
        )
    
    def is_alive(self) -> bool:
        """Check if combatant is still fighting"""
        return self.current_hp > 0
    
    def take_damage(self, damage: int) -> int:
        """Apply damage, return actual damage dealt"""
        actual_damage = min(damage, self.current_hp)
        self.current_hp -= actual_damage
        return actual_damage
    
    def heal(self, amount: int) -> int:
        """Heal combatant, return actual amount healed"""
        actual_heal = min(amount, self.max_hp - self.current_hp)
        self.current_hp += actual_heal
        return actual_heal


@dataclass
class CombatRound:
    """Single combat round with actions"""
    round_number: int
    attacker: str
    defender: str
    attack_roll: int
    defense_roll: int
    damage: int
    hit: bool
    critical: bool
    message: str
    timestamp: float


class CombatResolver:
    """Tag-based auto-combat resolver"""
    
    def __init__(self, seed: str = "combat_resolver"):
        self.seed = seed
        self.random = random.Random(seed)
        self.state = CombatState.NOT_STARTED
        self.combatants: Dict[str, Combatant] = {}
        self.rounds: List[CombatRound] = []
        self.current_round = 0
        self.winner: Optional[str] = None
        
        # Tag-based synergies
        self.tag_bonuses = {
            # Weapon vs Armor
            'sharp_vs_organic': 2,
            'blunt_vs_armored': 1,
            'fire_vs_wood': 3,
            'magic_vs_stone': 2,
            # Elemental advantages
            'acid_vs_armored': 2,
            'holy_vs_undead': 3,
            'poison_vs_organic': 2,
        }
        
        logger.info("⚔️ Combat Resolver initialized")
    
    def start_combat(self, voyager_pos: Tuple[int, int], guardian_pos: Tuple[int, int], 
                     voyager_def: AssetDefinition, guardian_def: AssetDefinition) -> None:
        """Initialize combat between voyager and guardian"""
        self.state = CombatState.IN_PROGRESS
        self.current_round = 0
        self.rounds = []
        self.winner = None
        
        # Create combatants
        self.combatants['voyager'] = Combatant.from_asset_def('voyager', voyager_def, voyager_pos)
        self.combatants['guardian'] = Combatant.from_asset_def('guardian', guardian_def, guardian_pos)
        
        logger.info(f"⚔️ Combat started: Voyager (HP: {self.combatants['voyager'].current_hp}) vs Guardian (HP: {self.combatants['guardian'].current_hp})")
    
    def resolve_combat(self) -> List[CombatRound]:
        """Resolve entire combat encounter"""
        if self.state != CombatState.IN_PROGRESS:
            return []
        
        combat_log = []
        
        # Roll initiative
        voyager_init = self._roll_initiative(self.combatants['voyager'])
        guardian_init = self._roll_initiative(self.combatants['guardian'])
        
        # Determine turn order
        if voyager_init >= guardian_init:
            turn_order = ['voyager', 'guardian']
        else:
            turn_order = ['guardian', 'voyager']
        
        logger.info(f"⚔️ Initiative: Voyager ({voyager_init}) vs Guardian ({guardian_init})")
        
        # Combat loop
        while self.state == CombatState.IN_PROGRESS:
            self.current_round += 1
            
            for attacker_id in turn_order:
                if self.state != CombatState.IN_PROGRESS:
                    break
                
                defender_id = 'guardian' if attacker_id == 'voyager' else 'voyager'
                
                # Execute attack round
                round_result = self._execute_attack_round(attacker_id, defender_id)
                combat_log.append(round_result)
                self.rounds.append(round_result)
                
                # Check for combat end
                if not self.combatants[defender_id].is_alive():
                    self.winner = attacker_id
                    self.state = CombatState.VICTORY
                    logger.info(f"⚔️ {attacker_id.title()} wins the combat!")
                    break
                elif not self.combatants[attacker_id].is_alive():
                    self.winner = defender_id
                    self.state = CombatState.DEFEAT
                    logger.info(f"⚔️ {defender_id.title()} wins the combat!")
                    break
            
            # Safety check to prevent infinite loops
            if self.current_round > 50:
                logger.warning("⚔️ Combat exceeded 50 rounds - ending as draw")
                self.state = CombatState.DEFEAT
                break
        
        return combat_log
    
    def _roll_initiative(self, combatant: Combatant) -> int:
        """Roll initiative with bonus"""
        base_roll = self.random.randint(1, 20)
        total = base_roll + combatant.initiative
        logger.debug(f"🎲 {combatant.entity_id} initiative: {base_roll} + {combatant.initiative} = {total}")
        return total
    
    def _execute_attack_round(self, attacker_id: str, defender_id: str) -> CombatRound:
        """Execute single attack round"""
        attacker = self.combatants[attacker_id]
        defender = self.combatants[defender_id]
        
        # Calculate tag bonuses
        attack_bonus = self._calculate_tag_bonus(attacker.tags, defender.tags)
        defense_bonus = self._calculate_tag_bonus(defender.tags, attacker.tags)
        
        # Roll attack
        attack_roll = self.random.randint(1, 20) + attacker.str_mod + attack_bonus
        defense_roll = self.random.randint(1, 20) + defender.def_mod + defense_bonus
        
        # Determine hit
        hit = attack_roll > defense_roll
        critical = attack_roll >= 19 + attack_bonus
        
        # Calculate damage
        if hit:
            base_damage = self.random.randint(1, 6) + attacker.str_mod
            if critical:
                base_damage *= 2
            damage = defender.take_damage(base_damage)
        else:
            damage = 0
        
        # Create message
        if hit:
            if critical:
                message = f"💥 CRITICAL HIT! {attacker_id.title()} deals {damage} damage to {defender_id.title()}!"
            else:
                message = f"⚔️ {attacker_id.title()} hits {defender_id.title()} for {damage} damage!"
        else:
            message = f"🛡️ {attacker_id.title()} misses {defender_id.title()}!"
        
        logger.debug(f"⚔️ Round {self.current_round}: {attacker_id} ({attack_roll}) vs {defender_id} ({defense_roll}) - {'HIT' if hit else 'MISS'}")
        
        return CombatRound(
            round_number=self.current_round,
            attacker=attacker_id,
            defender=defender_id,
            attack_roll=attack_roll,
            defense_roll=defense_roll,
            damage=damage,
            hit=hit,
            critical=critical,
            message=message,
            timestamp=time.time()
        )
    
    def _calculate_tag_bonus(self, attacker_tags: List[str], defender_tags: List[str]) -> int:
        """Calculate tag-based attack bonuses"""
        bonus = 0
        
        # Check for tag synergies
        for tag_bonus_key, bonus_value in self.tag_bonuses.items():
            attacker_tag, defender_tag = tag_bonus_key.split('_vs_')
            
            if attacker_tag in attacker_tags and defender_tag in defender_tags:
                bonus += bonus_value
                logger.debug(f"🏷️ Tag bonus: {attacker_tag} vs {defender_tag} = +{bonus_value}")
        
        return bonus
    
    def get_combantant_status(self, entity_id: str) -> Optional[Combatant]:
        """Get current status of a combatant"""
        return self.combatants.get(entity_id)
    
    def get_combat_summary(self) -> Dict[str, Any]:
        """Get combat summary for world state"""
        return {
            "state": self.state.value,
            "winner": self.winner,
            "rounds_completed": self.current_round,
            "voyager_hp": self.combatants.get('voyager', Combatant('', None, 0, 0, 0, 0, 0, (), [])).current_hp,
            "guardian_hp": self.combatants.get('guardian', Combatant('', None, 0, 0, 0, 0, 0, (), [])).current_hp,
            "total_rounds": len(self.rounds)
        }
