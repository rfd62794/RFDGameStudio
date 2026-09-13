"""
XP System for RPG Core
Single source of truth for all XP awards, stat training, and culture amplification.
"""
import random
from dataclasses import dataclass
from typing import Dict, Any, List

# --- Constants ---

ACTIVITY_REWARDS = {
    "Sumo win":            {"txp": 50, "vit": 30, "pwr": 20, "agi": 0,  "mnd": 0,  "res": 10, "chm": 5},
    "Sumo loss":           {"txp": 20, "vit": 15, "pwr": 10, "agi": 0,  "mnd": 0,  "res": 5,  "chm": 5},
    "Race win":            {"txp": 60, "vit": 0,  "pwr": 0,  "agi": 50, "mnd": 10, "res": 0,  "chm": 10},
    "Race finish":         {"txp": 40, "vit": 0,  "pwr": 0,  "agi": 30, "mnd": 5,  "res": 0,  "chm": 5},
    "Dungeon room clear":  {"txp": 30, "vit": 10, "pwr": 20, "agi": 5,  "mnd": 10, "res": 5,  "chm": 0},
    "Dungeon boss clear":  {"txp": 80, "vit": 20, "pwr": 40, "agi": 10, "mnd": 20, "res": 15, "chm": 0},
    "Training dummy perf": {"txp": 25, "vit": 0,  "pwr": 25, "agi": 5,  "mnd": 0,  "res": 0,  "chm": 0},
    "Foraging return":     {"txp": 20, "vit": 5,  "pwr": 0,  "agi": 10, "mnd": 15, "res": 0,  "chm": 5},
    "Garden idle (daily)": {"txp": 5,  "vit": 2,  "pwr": 0,  "agi": 0,  "mnd": 3,  "res": 2,  "chm": 3},
    "Player interaction":  {"txp": 10, "vit": 0,  "pwr": 0,  "agi": 0,  "mnd": 5,  "res": 0,  "chm": 15},
    "Obstacle course":     {"txp": 35, "vit": 0,  "pwr": 5,  "agi": 30, "mnd": 5,  "res": 0,  "chm": 0},
}

CULTURE_AMP_TABLE = {
    "ember":   {"vit": 1.0,  "pwr": 1.25, "agi": 1.1,  "mnd": 0.9,  "res": 0.9,  "chm": 1.0},
    "gale":    {"vit": 0.9,  "pwr": 0.9,  "agi": 1.25, "mnd": 1.1,  "res": 1.0,  "chm": 1.0},
    "marsh":   {"vit": 1.25, "pwr": 1.0,  "agi": 1.0,  "mnd": 0.9,  "res": 1.0,  "chm": 1.1},
    "crystal": {"vit": 1.0,  "pwr": 0.9,  "agi": 0.9,  "mnd": 1.25, "res": 1.1,  "chm": 0.8},
    "tundra":  {"vit": 1.1,  "pwr": 0.9,  "agi": 0.9,  "mnd": 1.0,  "res": 1.25, "chm": 0.9},
    "tide":    {"vit": 1.0,  "pwr": 1.1,  "agi": 1.0,  "mnd": 1.0,  "res": 0.9,  "chm": 1.25},
    "void":    {"vit": 1.0,  "pwr": 1.0,  "agi": 1.0,  "mnd": 1.0,  "res": 1.0,  "chm": 1.0},
}

CULTURE_PRIMARY_STATS = {
    "ember": ["pwr"], "gale": ["agi"], "marsh": ["vit"], 
    "crystal": ["mnd"], "tundra": ["res"], "tide": ["chm"], "void": []
}

ACTIVITY_PRIMARY_STATS = {
    "Sumo win": ["vit", "pwr"], "Sumo loss": ["vit", "pwr"],
    "Race win": ["agi"], "Race finish": ["agi"],
    "Dungeon room clear": ["pwr", "mnd"], "Dungeon boss clear": ["pwr", "mnd"],
    "Training dummy perf": ["pwr"], "Obstacle course": ["agi", "res"],
    "Foraging return": ["mnd"], "Garden idle (daily)": ["chm", "res"],
    "Player interaction": ["chm"]
}


@dataclass
class XPResult:
    total_xp_gained: int
    stat_xp_gained: Dict[str, int]
    leveled_up: bool
    new_level: int
    stage_advanced: bool
    new_stage: str
    culture_bonuses: Dict[str, float]
    critical_training: bool = False


# --- Core Functions ---

def get_stage_name(level: int) -> str:
    if level <= 1: return "Hatchling"
    if level <= 3: return "Juvenile"
    if level <= 5: return "Young"
    if level <= 7: return "Prime"
    if level <= 9: return "Veteran"
    return "Elder"


def training_efficiency(stat_xp: int) -> float:
    """
    Returns efficiency modifier [0.7, 1.0]
    Decreases as stat XP accumulates, resets on stage advance.
    """
    return max(0.7, 1.0 - (stat_xp / 200.0) * 0.3)


def activity_matches_primary_stat(activity: str, slime_culture: str) -> bool:
    culture_primary = CULTURE_PRIMARY_STATS.get(slime_culture.lower(), [])
    activity_primary = ACTIVITY_PRIMARY_STATS.get(activity, [])
    for stat in culture_primary:
        if stat in activity_primary:
            return True
    return False


def get_dominant_culture(culture_expression: Dict[str, float]) -> str:
    if not culture_expression:
        return "void"
    return max(culture_expression.items(), key=lambda x: x[1])[0]


def critical_training_chance(activity: str, slime_culture: str, performance: str) -> float:
    base_chance = 0.05
    if activity_matches_primary_stat(activity, slime_culture):
        base_chance += 0.03
    if performance == "perfect":
        base_chance += 0.05
    return min(0.10, base_chance)


def award_xp(slime: Any, activity: str, performance: str = "normal") -> XPResult:
    """
    Single point of truth for all XP awards.
    Never mutates slime directly — caller applies XPResult to slime.
    """
    if activity not in ACTIVITY_REWARDS:
        raise ValueError(f"Unknown activity: {activity}")
        
    rewards = ACTIVITY_REWARDS[activity]
    
    # Base performance multipliers
    perf_mult = 1.0
    stat_perf_mult = 1.0
    if performance == "perfect":
        perf_mult = 1.5
        stat_perf_mult = 1.5
    elif performance == "loss":
        perf_mult = 0.5
        stat_perf_mult = 0.4
        
    # Total XP
    total_xp_gained = int(rewards["txp"] * perf_mult)
    
    # Culture weighted bonuses
    culture_bonuses = {"vit": 0.0, "pwr": 0.0, "agi": 0.0, "mnd": 0.0, "res": 0.0, "chm": 0.0}
    expr = slime.genome.culture_expression or {"void": 1.0}
    for culture, weight in expr.items():
        culture_key = culture.lower()
        amp = CULTURE_AMP_TABLE.get(culture_key, CULTURE_AMP_TABLE["void"])
        for stat in culture_bonuses:
            culture_bonuses[stat] += weight * amp.get(stat, 1.0)
            
    # Critical training breakthrough
    dom_culture = get_dominant_culture(expr)
    crit_chance = critical_training_chance(activity, dom_culture, performance)
    is_critical = random.random() < crit_chance
    crit_mult = 2.0 if is_critical else 1.0
    
    # Stat XP calculations
    stat_xp_gained = {}
    for stat in ["vit", "pwr", "agi", "mnd", "res", "chm"]:
        raw_xp = rewards.get(stat, 0)
        current_stat_xp = getattr(slime, f"{stat}_xp", 0)
        
        eff = training_efficiency(current_stat_xp)
        amp = culture_bonuses[stat]
        
        final_xp = int(raw_xp * stat_perf_mult * eff * amp * crit_mult)
        stat_xp_gained[stat] = final_xp
        
    # Level & Stage calculations
    current_xp = getattr(slime, "experience", 0) + getattr(slime, "total_xp", 0)
    current_level = slime.level
    new_experience = current_xp + total_xp_gained
    
    # Simulate level ups
    loop_level = current_level
    loop_exp = new_experience
    while True:
        xp_to_next = 5 + (loop_level * 2)  # Based on RosterSlime logic
        if loop_exp >= xp_to_next:
            loop_exp -= xp_to_next
            loop_level += 1
        else:
            break
            
    leveled_up = loop_level > current_level
    
    old_stage = get_stage_name(current_level)
    new_stage = get_stage_name(loop_level)
    stage_advanced = old_stage != new_stage
    
    return XPResult(
        total_xp_gained=total_xp_gained,
        stat_xp_gained=stat_xp_gained,
        leveled_up=leveled_up,
        new_level=loop_level,
        stage_advanced=stage_advanced,
        new_stage=new_stage,
        culture_bonuses=culture_bonuses,
        critical_training=is_critical
    )
