# Stat System — Engine SDD
**Authority: Hard build contract.**
**Agents treat as implementation specification.**
**Supersedes: Current three-stat StatBlock (HP/ATK/SPD only)**
**Companion docs:**
- `/docs/engine/GDD/CULTURE_COMBAT.md` — RPS triangles, role affinities
- `/docs/engine/SDD/ECS_EXTENSIONS.md` — StatBlock pattern
- `/docs/world/GDD/GENETICS_SPECIFICATION.md` — genome structure

---

## 1. Overview

rpgCore uses a **six-stat system** mapped to the six canonical cultures.
Every slime has all six stats. Culture expression amplifies specific stats
during training. Stats are computed by StatBlock from genome base values,
personality axes, culture expression weights, and accumulated stat XP.

The system serves all game modes without dead stats:
- Combat modes (Sumo, Dungeon): VIT, PWR, RES
- Agility modes (Racing, Obstacle Course): AGI
- Social/dispatch modes: CHM, MND
- Exploration/foraging: MND, AGI
- Breeding evaluation: all six

---

## 2. The Six Stats

### Combat Stats (already in StatBlock)
```
VIT  Vitality    — HP pool, endurance, survival
PWR  Power       — physical attack, raw force
AGI  Agility     — speed, dodge chance, initiative
```

### Soft Stats (new layer)
```
MND  Mind        — curiosity, magic attack, puzzle solving
RES  Resilience  — defense, resistance, saving throws
CHM  Charm       — social influence, morale, affection pull
```

All six stats are first-class. No stat is "soft" in the sense of being
less important — they govern different game modes equally.

---

## 3. Culture-Stat Mapping

Each culture has a PRIMARY stat (1.25x XP amplification) and a
SECONDARY stat (1.1x XP amplification). All other stats train at 1.0x.
Opposing culture stats train at 0.9x.

```
CULTURE   PRIMARY   SECONDARY   IDENTITY
Ember     PWR       AGI         Fast striker
Gale      AGI       MND         Elusive thinker
Marsh     VIT       CHM         Tough, beloved
Crystal   MND       RES         Wise defender
Tundra    RES       VIT         Immovable wall
Tide      CHM       PWR         Charismatic fighter
```

### Culture XP Amplification Table
```
           VIT   PWR   AGI   MND   RES   CHM
Ember      1.0   1.25  1.1   0.9   0.9   1.0
Gale       0.9   0.9   1.25  1.1   1.0   1.0
Marsh      1.25  1.0   1.0   0.9   1.0   1.1
Crystal    1.0   0.9   0.9   1.25  1.1   0.8
Tundra     1.1   0.9   0.9   1.0   1.25  0.9
Tide       1.0   1.1   1.0   1.0   0.9   1.25
Void       1.0   1.0   1.0   1.0   1.0   1.0  (no amplification)
```

### Philosophy B — Complete RPS Web (15% bonus to attacker)

Every culture has 2 wins, 2 losses, 2 neutrals. Void draws with all.

```
FULL MATCHUP TABLE (15% bonus to attacker):

ember   beats: gale, marsh
gale    beats: tundra, tide
marsh   beats: crystal, gale
crystal beats: tide, ember
tundra  beats: ember, crystal
tide    beats: marsh, tundra
void    draws: all
```

**Thematic Logic (World Justification):**
- **ember > gale**: fire consumes wind
- **ember > marsh**: fire burns swamp
- **gale > tundra**: wind erodes ice  
- **gale > tide**: wind scatters water
- **marsh > crystal**: roots crack stone
- **marsh > gale**: roots ground wind
- **crystal > tide**: stone channels water
- **crystal > ember**: structure contains fire
- **tundra > ember**: cold smothers flame
- **tundra > crystal**: frost shatters crystal
- **tide > marsh**: water drowns roots
- **tide > tundra**: current melts ice
- **void draws all**: void absorbs everything, threatens nothing

**Void Design**: Void is genuinely interesting — not weak but unpredictable. Every other culture has known counters. Void has none, making it the wildcard that breaks preparation in competitive play.

Varied culture slimes get weighted amplification:
```python
amplification[stat] = sum(
    culture_weight * CULTURE_AMP_TABLE[culture][stat]
    for culture, culture_weight in genome.culture_expression.items()
)
```

---

## 4. Stat Derivation

### 4.1 Base Values
Combat stats derive from genome fields (existing):
```
VIT base = genome.base_hp
PWR base = genome.base_atk
AGI base = genome.base_spd
```

Soft stats derive from personality axes (new, automatic):
```
MND base = (genome.curiosity * 8.0) + (genome.energy * 4.0)
           minimum 5.0
RES base = ((1.0 - genome.shyness) * 8.0) + (genome.energy * 2.0)
           minimum 5.0
CHM base = (genome.affection * 8.0) + ((1.0 - genome.shyness) * 4.0)
           minimum 5.0
```

This means all existing slimes automatically have soft stats derived
from their existing genome personality fields. No migration required.

### 4.2 Stat Growth Factor
Each stat has an independent growth factor derived from accumulated
stat XP relative to the slime's current level:

```python
def stat_growth_factor(stat_xp: int, level: int) -> float:
    """
    Returns multiplier in range [0.8, 1.5]
    0.8 = completely untrained at this level
    1.0 = normally trained
    1.5 = heavily specialized
    """
    xp_ceiling = level * 50  # expected XP per stat at this level
    if xp_ceiling == 0:
        return 1.0
    ratio = stat_xp / xp_ceiling
    return max(0.8, min(1.5, 0.8 + (ratio * 0.7)))
```

### 4.3 Final Stat Computation
```
final_stat = int(
    base_value
    * stage_modifier          # 0.6x → 1.2x by lifecycle stage
    * stat_growth_factor      # 0.8x → 1.5x by training
    + culture_modifier        # flat additive from culture expression
    + equipment_modifier      # flat additive from equipped items
)
minimum: 1
```

Culture modifiers (from CULTURE_COMBAT.md, existing):
```
ember:   pwr+3.0, agi+0.5, vit+0.5
gale:    agi+3.0, mnd+0.5, vit+0.5
marsh:   vit+3.0, chm+0.5, pwr+0.5
crystal: mnd+1.0, res+1.0, all others+0.5
tundra:  res+2.0, vit+1.0, agi-1.0
tide:    chm+2.0, pwr+2.0, vit+0.5
```

Soft stat culture modifiers (new):
```
ember:   mnd-0.5, res-0.5, chm+0.0
gale:    mnd+1.0, res+0.0, chm+0.0
marsh:   mnd-0.5, res+0.5, chm+1.5
crystal: mnd+2.0, res+1.5, chm+0.5
tundra:  mnd+0.5, res+2.0, chm-0.5
tide:    mnd+0.5, res-0.5, chm+2.5
```

---

## 5. XP Architecture

### 5.1 XP Pools on RosterSlime
```python
# Existing fields (keep)
total_xp: int = 0
level: int = 1

# New fields (add)
vit_xp: int = 0
pwr_xp: int = 0
agi_xp: int = 0
mnd_xp: int = 0
res_xp: int = 0
chm_xp: int = 0
```

### 5.2 Level Thresholds
```
Level = total_xp // 100
Maximum level: 10 (Elder stage)

Stage derived from level (10-level system):
  Level 0-1:  Hatchling  0.6x
  Level 2-3:  Juvenile   0.8x
  Level 4-5:  Young      1.0x
  Level 6-7:  Prime      1.2x
  Level 8-9:  Veteran    1.1x
  Level 10+:  Elder      1.0x
```

### 5.3 XP Awards by Activity
```
ACTIVITY            TXP   VIT   PWR   AGI   MND   RES   CHM

Sumo win            +50   +30   +20   +0    +0    +10   +5
Sumo loss           +20   +15   +10   +0    +0    +5    +5
Race win            +60   +0    +0    +50   +10   +0    +10
Race finish         +40   +0    +0    +30   +5    +0    +5
Dungeon room clear  +30   +10   +20   +5    +10   +5    +0
Dungeon boss clear  +80   +20   +40   +10   +20   +15   +0
Training dummy perf +25   +0    +25   +5    +0    +0    +0
Foraging return     +20   +5    +0    +10   +15   +0    +5
Garden idle (daily) +5    +2    +0    +0    +3    +2    +3
Player interaction  +10   +0    +0    +0    +5    +0    +15
Obstacle course     +35   +0    +5    +30   +5    +0    +0
```

All stat XP values are BEFORE culture amplification is applied.

### 5.4 XP Award Function (Single Point of Truth)
```python
@dataclass
class XPResult:
    total_xp_gained: int
    stat_xp_gained: dict[str, int]  # {stat: amount}
    leveled_up: bool
    new_level: int
    stage_advanced: bool
    new_stage: str
    culture_bonuses: dict[str, float]  # for display
    critical_training: bool = False  # NEW: Breakthrough moment

def award_xp(
    slime: RosterSlime,
    activity: str,
    performance: str = "normal"  # "perfect", "normal", "loss"
) -> XPResult:
    """
    Single point of truth for all XP awards.
    Called from every activity.
    Applies culture amplification.
    Applies training efficiency modifier.
    Checks for critical training breakthroughs.
    Checks level and stage advancement.
    Returns XPResult with all events.
    
    Never mutates slime directly —
    caller applies XPResult to slime.
    """
```

Performance multipliers:
```
"perfect"  → 1.5x all XP (timing-based activities)
"win"      → 1.0x all XP
"normal"   → 1.0x all XP
"loss"     → 0.5x TXP, 0.4x stat XP
```

Location: `src/shared/progression/xp_system.py` 

### 5.5 Training Efficiency Modifier

Each stat XP pool has a training efficiency that decreases with use and resets on stage advancement:

```python
def training_efficiency(stat_xp: int) -> float:
    """
    Returns efficiency modifier [0.7, 1.0]
    Decreases as stat XP accumulates, resets on stage advance.
    """
    return max(0.7, 1.0 - (stat_xp / 200) * 0.3)
```

Applied to incoming stat XP before culture amplification:
```python
adjusted_stat_xp = raw_stat_xp * efficiency * culture_amp
```

**Efficiency Tiers:**
- **0-50 XP**: 1.0x efficiency (fresh training)
- **50-100 XP**: 0.9x efficiency (getting harder)
- **100-200 XP**: 0.8x efficiency (diminishing returns)
- **200+ XP**: 0.7x efficiency (expert level)

**Stage advancement resets all efficiency modifiers to 1.0** (the "evolution moment" — the slime is ready to learn again).

### 5.6 Critical Training (Breakthrough Moments)

On any XP award, chance for breakthrough training:

```python
def critical_training_chance(
    activity: str, 
    slime_culture: str, 
    performance: str
) -> float:
    """
    Returns chance [0.05, 0.10] for critical training
    """
    base_chance = 0.05  # 5%
    
    # Culture affinity bonus (primary stat matches activity)
    if activity_matches_primary_stat(activity, slime_culture):
        base_chance += 0.03  # +3%
    
    # Perfect performance bonus
    if performance == "perfect":
        base_chance += 0.05  # +5%
    
    return min(0.10, base_chance)  # Cap at 10%
```

**Critical Training Effects:**
- **2x XP** for all stat gains in that award
- **Display**: "BREAKTHROUGH!" floating text
- **Visual**: Culture color flash on the slime
- **Sound**: Special breakthrough sound effect

**Critical Training Examples:**
- Ember slime in Sumo: 8% chance (5% + 3% culture affinity)
- Gale slime in perfect race: 10% chance (5% + 5% perfect)
- Random activity: 5% base chance 

---

## 6. StatBlock Extensions

### 6.1 Updated StatBlock Fields
```python
@dataclass
class StatBlock:
    # Combat stats (existing)
    base_hp: float
    base_atk: float
    base_spd: float

    # Soft stats (new)
    base_mnd: float
    base_res: float
    base_chm: float

    # Culture modifiers (existing + extended)
    culture_vit: float = 0.0
    culture_pwr: float = 0.0
    culture_agi: float = 0.0
    culture_mnd: float = 0.0
    culture_res: float = 0.0
    culture_chm: float = 0.0

    # Growth factors (new)
    vit_growth: float = 1.0
    pwr_growth: float = 1.0
    agi_growth: float = 1.0
    mnd_growth: float = 1.0
    res_growth: float = 1.0
    chm_growth: float = 1.0

    # Equipment modifiers (existing pattern)
    equipment_vit: float = 0.0
    equipment_pwr: float = 0.0
    equipment_agi: float = 0.0
    equipment_mnd: float = 0.0
    equipment_res: float = 0.0
    equipment_chm: float = 0.0

    stage_modifier: float = 1.0

    # Computed properties (read-only)
    @property
    def hp(self) -> int:   # VIT final
    def atk(self) -> int:  # PWR final
    def spd(self) -> int:  # AGI final
    def mnd(self) -> int:  # MND final
    def res(self) -> int:  # RES final
    def chm(self) -> int:  # CHM final
```

### 6.2 Backward Compatibility
`hp`, `atk`, `spd` properties are preserved exactly.
All existing code reading `stat_block.hp/atk/spd` continues working.
New code reads `stat_block.mnd/res/chm`.
No existing tests break.

### 6.3 StatBlock.from_slime() (replaces from_genome())
```python
@classmethod
def from_slime(cls, slime: RosterSlime) -> 'StatBlock':
    """
    Build StatBlock from full RosterSlime.
    Reads genome for base values.
    Reads stat XP pools for growth factors.
    Reads culture_expression for modifiers.
    Reads level for stage modifier.
    """
```

`from_genome()` remains as a fallback for contexts where
only a genome is available (breeding preview, etc.).
It returns growth factors of 1.0 (untrained baseline).

---

## 7. Stage Advancement Events

Stage advancement is an EVENT, not a silent stat tick.

When `award_xp()` detects a stage threshold crossed:
```python
XPResult.stage_advanced = True
XPResult.new_stage = "Prime"  # etc.
```

The calling scene is responsible for:
1. Playing stage advancement animation
2. Showing stat comparison (before/after)
3. Notifying nearby slimes (future: social reaction)
4. Saving updated slime state

Stage advancement gives a **reset bonus**:
All stat growth factors receive +0.1 (floor still 0.8).
This represents the "evolution moment" — the creature
refreshes and feels stronger across all dimensions.

---

## 8. Kairosoft-Inspired Design Principles

### 8.1 Transparent Stat Purpose (Lesson 1)
Every stat needs visible "this is what I train this for" labeling in the UI. Players shouldn't have to figure out that racing builds AGI — it should say so explicitly.

**StatsPanel Training Labels:**
```
AGI  ████░░  "Trained by: Racing, Obstacle Course"
PWR  ██░░░░  "Trained by: Sumo, Training Dummy"  
VIT  ████░░  "Trained by: Sumo (endurance)"
MND  █░░░░░  "Trained by: Dungeon, Foraging"
RES  ███░░░  "Trained by: Dungeon, Training Dummy"
CHM  ████░░  "Trained by: Garden, Social Interactions"
```

**Mini-Game Stat Training Matrix (Player-Facing):**
```
MINI-GAME          PRIMARY   SECONDARY   UI LABEL
Sumo               VIT+PWR   RES+CHM     "Builds toughness and power"
Racing             AGI       MND+CHM     "Builds speed and cleverness"
Dungeon combat     PWR+MND   VIT+AGI     "Builds strength and wisdom"
Training Dummy     PWR       AGI         "Builds power and reflexes"
Obstacle Course    AGI+RES   MND         "Builds agility and resilience"
Foraging zone      MND       AGI+CHM     "Builds cleverness and charm"
Garden idle        CHM+RES   MND         "Builds social bonds and wisdom"
Player interaction CHM       MND         "Builds charm and cleverness"
```

### 8.2 Diminishing Returns & Reset Rhythm (Lesson 2)
Training efficiency decreases with repeated use, but stage advancement resets the cycle, creating natural training rhythm.

**Training Cycle:**
1. **Train Hard**: Fresh slime gets 1.0x efficiency
2. **Efficiency Drops**: As XP accumulates, efficiency falls to 0.7x
3. **Stage Advance**: Evolution moment resets all efficiency to 1.0x
4. **Repeat**: Slime is ready to learn effectively again

This makes stage advancement meaningful not just for stat boosts but for training reset — players look forward to the "fresh start" moment.

### 8.3 Critical Training Breakthroughs (Lesson 3)
Random breakthrough moments create memorable training sessions and excitement.

**Breakthrough Display:**
- Floating "BREAKTHROUGH!" text in culture color
- Culture color flash effect on slime sprite
- Special breakthrough sound effect
- 2x XP multiplier for that training session

**Breakthrough Chances:**
- Base: 5% on any XP award
- Culture affinity: +3% (8% total)
- Perfect performance: +5% (10% total cap)

### 8.4 Roster Specialization > Balance (Lesson 4)
A 6-slime roster should develop natural role differentiation through focused training, not be identical units.

**Specialization Examples:**
- **Ember Sumo Specialist**: High VIT/PWR, your arena fighter
- **Gale Racing Scout**: High AGI/MND, your speed runner  
- **Tide Social Anchor**: High CHM/MND, your dispatch morale leader
- **Crystal Dungeon Crawler**: High MND/RES, your tactical explorer
- **Marsh Breeding Partner**: High VIT/CHM, your stable parent
- **Tundra Tank**: High VIT/RES, your defensive wall

**Roster Composition**: Players naturally build teams with complementary specialists rather than balanced generalists. The roster becomes "this is my team composition" rather than "these are my slimes."

---

## 9. Mini-Game Stat Training Matrix

Which stats each mini-game primarily trains:

```
MINI-GAME          PRIMARY   SECONDARY   NOTES
Sumo               VIT+PWR   RES+CHM     Winner gets more PWR
Racing             AGI       MND+CHM     Finishing matters
Dungeon combat     PWR+MND   VIT+AGI     Magic rooms → MND
Training Dummy     PWR       AGI         Timing = AGI bonus
Obstacle Course    AGI+RES   MND         Endurance + agility
Foraging zone      MND       AGI+CHM     Passive, slow
Garden idle        CHM+RES   MND         Very slow, ambient
Player interaction CHM       MND         Direct care
```

---

## 9. Implementation Sequence

### Phase A — Foundation (implement first)
1. Add six stat XP fields to RosterSlime
2. Extend StatBlock with soft stats + growth factors
3. Add `from_slime()` to StatBlock
4. Create `src/shared/progression/xp_system.py` 
   with `award_xp()` and `XPResult` 
5. Soft stat derivation from personality axes

### Phase B — Activity Integration
6. Wire `award_xp()` into Sumo scene
7. Wire `award_xp()` into Race scene
8. Wire `award_xp()` into Dungeon scene
9. Wire `award_xp()` into Foraging (Phase 5C)

### Phase C — Display
10. Extend StatsPanel to show all six stats
    (or tabbed: Combat / Social)
11. Stage advancement animation
12. XP gain display (floating numbers)

### Phase D — Training Dummy mini-game
13. New scene: Training Dummy
    Timing mechanic, PWR primary training
    Culture affinity widens perfect window

---

## 10. Test Anchors

Minimum required tests per component:

### xp_system.py (minimum 12)
1. test_award_xp_sumo_win_returns_correct_totals
2. test_award_xp_applies_culture_amplification_ember
3. test_award_xp_applies_culture_amplification_gale
4. test_award_xp_mixed_culture_weighted_amplification
5. test_award_xp_void_no_amplification
6. test_award_xp_detects_level_up
7. test_award_xp_detects_stage_advance
8. test_award_xp_performance_perfect_multiplier
9. test_award_xp_performance_loss_multiplier
10. test_award_xp_does_not_mutate_slime
11. test_stat_growth_factor_untrained_returns_0_8
12. test_stat_growth_factor_specialized_caps_at_1_5

### stat_block extensions (minimum 8)
13. test_soft_stats_derived_from_personality
14. test_from_slime_applies_growth_factors
15. test_from_genome_returns_growth_factor_1_0
16. test_vit_growth_affects_final_hp
17. test_backward_compat_hp_atk_spd_unchanged
18. test_stage_advance_bonus_applied_to_growth
19. test_culture_soft_stat_modifiers_crystal_mnd
20. test_culture_soft_stat_modifiers_tide_chm

---

## 11. Constraints

- `stat_calculator.py`: do not modify (legacy fallback)
- `from_genome()`: keep as fallback, do not remove
- `hp`, `atk`, `spd` properties: preserve exactly
- RosterSlime level field: keep as derived from total_xp
- No stat can go below 1 (minimum enforced in StatBlock)
- `award_xp()` never mutates slime directly
  (caller responsibility — clean functional design)
- Soft stats cannot be negative
- Growth factor range: [0.8, 1.5] hard clamped

---

## 12. Open Questions (Architect Decision Required)

Q1. Should MND affect breeding success probability?
    (Higher MND parents → more stable offspring genome)
    
**A1. YES** - ±5% variance reduction per 10 MND points
    
Q2. Should CHM affect dispatch outcomes?
    (High CHM squad gets morale bonus on dispatch)
    
**A2. YES** - +10% success probability per 15 CHM points
    
Q3. Should RES create a defense layer in dungeon?
    (damage = max(1, attacker_pwr - defender_res))
    
**A3. YES** - damage = max(1, attacker_pwr - defender_res*0.5)
    
Q4. Training Dummy — should "perfect" timing widen
    for culture affinity, or should it raise XP reward
    instead? (Wider window = more forgiving,
    Higher reward = same difficulty, better payoff)

**A4. WIDER PERFECT WINDOW** - Culture affinity widens perfect timing window
    by 20% at 1.0 culture weight, scaling linearly

---

**DECISIONS LOCKED** - Phase 5B implementation proceeds with these answers.
