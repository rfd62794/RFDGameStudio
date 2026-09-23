# Slime Breeder: Economy & Progression Design

This document outlines the finalized progression mechanics and economic tension models for Slime Breeder, ensuring the game creates intentional, meaningful gameplay friction rather than degrading into pure abundance.

## 1. Core Economic Principles
- **Hatching is Never Free**: Costs scale depending on the tier of the parents combined. 
- **Knowledge is Power**: You can only hatch combinations incorporating traits you have already specifically discovered.
- **Regulated Scarcity**: Passive income derived from Display Rooms must trail significantly behind the hatch costs of high-tier slimes, demanding deliberate inventory management.
- **Hard Caps**: The economy is clamped down by non-infinite limits to Pens, Tanks, and Display capacity.

---

## 2. Infrastructure Scaling & Hard Caps

### Pen Capacity (The General Roster Storage)
To stop runaway savings behavior, base costs are reduced but curve aggressively upwards based on current ownership.
- **Max Pen Cap**: 30 Units (Creating absolute limitations)
- **Base Cost**: Starts modestly (~10G)
- **Math Scale Model**: Follows roughly a `1.2x` cumulative exponential curve against the current count (TBD on exact constant).

### Tank / Roost Constraints (Parallel Breeding Rate Limiter)
Controls exactly how fast players can roll on probabilistic gachas per minute.
- **Base**: `2 Tanks`.
- **Tank 3**: Costs `40G`, requires discovering a specific Tier 3 trait to unlock.
- **Tank 4 (Max Cap)**: Costs `60G`, requires unlocking a specific Tier 4 trait.
- Limits parallel breeding potential heavily, making long breeding hunts deliberate.

### Display Slots (Passive Income Gating)
The core passive revenue generation loop.
- **Base**: `2 Slots`.
- **Slot 3**: Unlocked via Milestone (e.g. Completing 5 Special Requests) + `100G` Cost.
- **Slot 4 (Max Cap)**: Unlocked via finding a Tier 3 accessory + `300G` Cost.

---

## 3. Passive Income vs Hatch Costs Balance (The Math)

The target model operates strictly on creating tension between passive yields and active gacha costs. Earning capacity shrinks dramatically in relativity as tier combinations mature.

### Display Yield Formula
`Passive Rate = 0.05G per second × colorTier × shapeTier`

**Hourly Pacing Examples:**
- **Tier 1 (T1 Color + T1 Shape)**: 180G / Hour
- **Tier 2 (T2 Color + T2 Shape)**: 720G / Hour
- **Tier 3 (T3 Color + T3 Shape)**: 1,620G / Hour
- **Tier 4 (T4 Color + T4 Shape)**: 2,880G / Hour

### The Hatch Config Model
Hatching pulls directly from treasury based on selection. The minimum flat threshold establishes the friction points.
*To calculate total hatch cost, you add the costs of all desired configuration traits.*

**Base Trait Costs (Per Tree: Color & Shape)**:
- **Tier 1**: 5G
- **Tier 2**: 15G
- **Tier 3**: 50G
- **Tier 4**: 150G

**Cosmetic Overlay Costs (Patterns & Accessories)**:
- **Tier 2 Pattern**: +5G 
- **Tier 3 Pattern**: +15G
- **Tier 3 Accessory**: +20G
- **Tier 4 Accessory**: +50G

---

## 4. Regent Gatekeeping
Earning and applying Regent boosters maintain exact 1:1 equilibrium. Force-locking traits with Regents costs exactly their tier yield:
- **Earnings (Discovery):** T1: 0 | T2: 5 | T3: 15 | T4: 40
- **Earnings (Patterns/Accessories):** T2 Pattern: 10 | T3 Pattern: 25 | T3/T4 Accessories: 50 -> 100.
- **Costs (Spend):** Matching symmetric 1-to-1 ratio required. A T4 trait demands exactly 40 Regents. 

---

## 5. Genetic Trait Progression Constraints
The hunting behavior operates off of a specific, non-procedural tree relying on specific curated parent recipes per tier.

### Rule 1: The Child is the Key
Unlocking a component for future selective breeding **requires yielding that precise offspring randomly successfully first.** Reaching the correct parent grouping enables the drop chance, and only once the offspring lands does the trait permanently add to their inventory unlock pool.

### Rule 2: Diminishing Return Probabilities
Mutating upward in a tier grows explicitly harder as rarity increases.
- **T1 + T1 -> Attempt T2**: 40% Discovery Mutation Rate
- **T2 + T2 -> Attempt T3**: 25% Discovery Mutation Rate 
- **T3 + T3 -> Attempt T4**: 5% Discovery Mutation Rate (Legendary execution required)
*(Failure forces inheritance from either the host/donor generic line)*

### Rule 3: Tier Requirements & Hand-Authored Combos
The highest bounds **cannot** be brute-forced from generic low pairings. There are 5-6 highly curated combos that lock the final milestones forcing methodical intent.

**Examples:**
- **T3 Specialized Prerequisites (Colors):**
  - Scarlet = Crimson + Gold
  - Burgundy = Rust + Indigo
  - Jade = Green + Teal
- **T4 Legendaries Requirement:** Only possible when breeding directly overlapping T3 Specialized Prerequisites explicitly.
  - Void = Scarlet + Burgundy *(Needs the 5% roll success!)*

This structure mirrors exactly against **Shapes**, **Patterns**, and **Accessories**.
