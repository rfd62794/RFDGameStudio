# rpgCore Genetics System Specification
**Design Document v1.0 — Living World Engine**

---

## 🧬 Core Philosophy

Every slime is the product of its lineage. Genetics determine culture heritage, stat potential, visual expression, and behavioral tendencies. Equipment determines class. These two systems are intentionally separate — what a slime *is* versus what it *does*.

The genetic system has three intersecting axes:
- **Tier** — genetic complexity and culture combination (0-8)
- **Level** — individual growth and life stage (0-10 + Elder)
- **Generation** — lineage depth and breeding intentionality (1-N)

---

## 📊 The 63 Combinations

Six cultures combine mathematically into 63 distinct genetic profiles before shape and color are considered.

| Level | Type | Count | Description |
|-------|------|-------|-------------|
| 6 choose 1 | Pure | 6 | Single culture heritage |
| 6 choose 2 | Dual | 15 | Two culture heritage |
| 6 choose 3 | Triple | 20 | Three culture heritage |
| 6 choose 4 | Quad | 15 | Four culture heritage |
| 6 choose 5 | Quint | 6 | Five culture heritage |
| 6 choose 6 | Void | 1 | All six unified |
| **Total** | | **63** | Before shape/color axes |

---

## 🏆 The Eight Tiers

### Tier 1 — Blooded (6 variants)
*"True to their origin."*

**Qualifier:** Single culture heritage. No mixing.
**Visual:** Solid, vivid culture color. Clear shape. Reads immediately.
**Perk:** Maximum culture-specific stat. Full native culture hub access. Strongest elemental affinity. Easiest to recruit from home region.
**Breeding Note:** Most common. The foundation of any roster.

### Tier 2 — Bordered (6 variants)
*"Where two neighbors meet."*

**Qualifier:** Two adjacent cultures on the hexagon.
**Visual:** Blended color gradient. Harmonious mixing — the cultures are compatible neighbors.
**Perk:** Intersection zone dispatch access. Named hybrid archetype (see Intersection Archetypes). Slightly broader equipment options.
**Breeding Note:** Adjacent culture parents. Stable and predictable outcome.

### Tier 3 — Sundered (3 variants)
*"Two natures at war within one body."*

**Qualifier:** Two cultures directly opposite on the hexagon. Pure duality tension.
**Visual:** Sectional color — hard boundary between two colors. The natures don't want to blend.
**Perk:** Highest stat ceiling in both opposing stats. But internal conflict manifests as unpredictable idle behavior. Rare and volatile but powerful.
**Breeding Note:** Opposite culture parents. Highest variance outcome. Worth the risk for specialists.

### Tier 4 — Drifted (6 variants)
*"Neither neighbor nor opposite. Something in between."*

**Qualifier:** Two cultures with one culture between them on the hexagon.
**Visual:** Partial blend with soft edges. Neither harmony nor tension — settled ambiguity.
**Perk:** Most stable dual breed. Balanced between two profiles without Sundered volatility. Reliable and workmanlike.
**Breeding Note:** Skip-one culture parents. The practical choice when you need consistency.

### Tier 5 — Threaded (20 variants)
*"Three voices, one slime."*

**Qualifier:** Three culture heritage.
**Visual:** Complex color mixing. Multiple hues visible. Pattern emergence begins here.
**Perk:** Resistance to elemental weaknesses of all three cultures. Specialty archetypes emerge. The system expresses them through stat profiles rather than lore names — too many to fully name.
**Breeding Note:** Requires deliberate multi-generation breeding strategy. Worth it for roster depth.

### Tier 6 — Convergent (15 variants)
*"Approaching something larger."*

**Qualifier:** Four culture heritage.
**Visual:** Void characteristics begin appearing. Darker coloration, slight iridescence. Hard to read at a glance.
**Perk:** Near immunity to two elemental weaknesses. Elder mentoring bonus increased. Other slimes are passively drawn to them.
**Breeding Note:** Rare without intentional generational strategy. Signals serious breeding investment.

### Tier 7 — Liminal (6 variants)
*"One culture away from completion. The absence is visible."*

**Qualifier:** Five culture heritage. One element missing.
**Visual:** Almost indistinguishable from Void except for one remaining cultural color bleed — the missing culture as visible absence. Other slimes and NPCs react to them.
**Perk:** The missing culture is their only weakness. Everything else approaches Void balance. Legendary status in world lore. Culture hubs notice them.
**Breeding Note:** Exceptional generational achievement. Each of the six possible Liminal variants has a different missing culture and therefore a different unique weakness.

### Tier 8 — Void (1 variant)
*"The original. The complete. The forgotten origin."*

**Qualifier:** All six cultures unified in genetics.
**Visual:** Full iridescent spectrum — all six culture colors present and shifting. Living light. Visually distinct at every age stage.
**Perk:** No elemental weakness. Perfectly balanced stat profile across all six dimensions. Visual novel scenes react differently — NPCs respond with fear, reverence, or disbelief depending on their culture. Garden resonates with them. Unique conversation branches unlock. Cannot be bred in one generation.
**Breeding Note:** Cannot hatch in the wild. Garden-exclusive birth condition. The mathematical and narrative terminal state of the breeding system. Breed long enough across enough cultures and you approach Void expression naturally.

---

## 🌍 Intersection Zone Archetypes (Tier 2 Named)

The six adjacent dual combinations produce named archetypes:

| Name | Cultures | Stat Profile |
|------|----------|--------------|
| **Magma** | Ember + Crystal | Strength + Defense. The immovable warrior. |
| **Firestorm** | Ember + Gale | Strength + Dexterity. The berserker. |
| **Squall** | Gale + Tide | Dexterity + Charisma. The trickster. |
| **Storm** | Tide + Marsh | Charisma + Constitution. The shaman. |
| **Bog** | Marsh + Tundra | Constitution + Intelligence. The sage. |
| **Frost** | Tundra + Crystal | Intelligence + Defense. The sentinel. |

---

## 🧪 Gene Structure

### Overview
Approximately 40-45 discrete gene values per slime, plus mutation history.

### Culture Genes — Simulation Grade
Culture inheritance uses dominant/recessive allele pairs because this is where the tier system lives and must be mathematically honest.

```python
@dataclass
class CultureGenes:
    # One allele inherited from each parent
    allele_a: tuple[str, float]  # (culture_name, expression_weight)
    allele_b: tuple[str, float]
    
    # Resolved expression weights across all six cultures (sums to 1.0)
    expression: dict[str, float]
    # Example: {'ember': 0.6, 'gale': 0.3, 'marsh': 0.1, 'crystal': 0.0, 'tundra': 0.0, 'tide': 0.0}
    
    # Derived tier (computed from expression, cached)
    tier: int
    tier_name: str  # 'Blooded', 'Bordered', 'Sundered', etc.
```

### Stat Genes — Moderate
```python
@dataclass
class StatGenes:
    # Base stat values (derived from culture expression + random variance)
    base: dict[str, int]
    # {'strength': 12, 'dexterity': 8, 'constitution': 14,
    #  'defense': 10, 'intelligence': 6, 'charisma': 9}
    
    # Inherited variance range for offspring (how much stats can drift)
    variance: dict[str, int]
    # {'strength': 2, 'dexterity': 1, ...}
```

### Physical Genes — Moderate
```python
@dataclass
class ShapeGenes:
    shape_type: str  # 'round', 'wide', 'tall', 'compact', 'irregular'
    width_ratio: float    # relative to base
    height_ratio: float
    irregularity: float   # 0.0 = perfect, 1.0 = highly irregular
```

### Visual Genes — Moderate
```python
@dataclass
class ColorGenes:
    # Primary and secondary colors as HSV
    # Derived from culture expression but with independent mutation potential
    primary_hsv: tuple[float, float, float]
    secondary_hsv: tuple[float, float, float]
    blend_mode: str  # 'gradient', 'sectional', 'marbled', 'iridescent'
    
    # Pattern (may be recessive — does not always express)
    pattern_type: str | None  # 'spots', 'stripes', 'marbled', 'speckle', None
    pattern_dominant: bool
    pattern_intensity: float  # 0.0 - 1.0
```

### Lineage Record
```python
@dataclass
class LineageRecord:
    generation: int
    parent_ids: tuple[UUID, UUID] | None  # None for wild/starter slimes
    
    # Mutation history — cheap to store, rich in gameplay meaning
    mutations: list[MutationRecord]

@dataclass
class MutationRecord:
    gene: str           # which gene mutated
    delta: float        # how much it changed
    generation: int     # when it occurred
    expressed: bool     # whether it's currently visible
```

### Complete Slime Gene Bundle
```python
@dataclass
class SlimeGenome:
    culture: CultureGenes
    stats: StatGenes
    shape: ShapeGenes
    color: ColorGenes
    lineage: LineageRecord
    
    # Personality derived from culture expression — no separate genes needed
    # See Personality System document
```

---

## 🔄 Breeding Logic

### Allele Resolution
Each parent contributes one allele. The dominant allele expresses more strongly. Recessive alleles persist in the genome and can surface in future generations.

```
Parent A: [Ember dominant, Gale recessive]
Parent B: [Marsh dominant, Crystal recessive]
         ↓
Offspring possibilities:
  - Ember + Marsh → Drifted (skip-one)
  - Ember + Crystal → Bordered (adjacent)
  - Gale + Marsh → Bordered (adjacent)
  - Gale + Crystal → Sundered (opposite)
```

### Stat Inheritance
Offspring stats = weighted average of parent base stats + random variance within inherited range + occasional mutation.

### Visual Inheritance
- Color: Weighted blend of parent colors with small mutation chance
- Shape: Random selection within range defined by parent shapes with occasional throwback
- Pattern: Dominant patterns always express. Recessive patterns have percentage chance per generation.

### Mutation Chance
Small percentage per breeding event. Increases with:
- Sundered parents (internal tension creates instability)
- High generation depth (accumulated complexity)
- Void proximity in lineage (approaching completeness creates pressure)

---

## 📈 Generation Depth

Generation is a modifier on top of tier and level. A first-generation Bordered slime differs from a fifth-generation Bordered slime whose lineage has been deliberately refining that same dual combination.

**Generation depth effects:**
- Subtle stat bonuses as genetics become more refined
- Visual richness increases — more defined colors, cleaner patterns
- Mutation history becomes visible in the genome record
- Void probability increases incrementally with each generation of diverse breeding

---

## 🎨 Visual Rarity Ladder

| Rarity | Visual Expression |
|--------|------------------|
| Common | Solid color, simple shape, no pattern |
| Uncommon | Blended color OR simple pattern |
| Rare | Sectional color with pattern |
| Very Rare | Complex pattern with mutation color shift |
| Legendary | Full iridescent, multiple pattern layers |
| Void | All of the above unified into living light |

---

## 🏗️ ECS Integration Specifications

### Genetics Components
```python
@dataclass
class GeneticsComponent:
    """Complete genetic profile of a slime"""
    genome: SlimeGenome
    level: int
    experience: int
    
    # Cached derived values
    tier: int
    generation: int
    visual_profile: VisualProfile
    
@dataclass
class BreedingComponent:
    """Breeding capability and history"""
    fertility: float
    breeding_cooldown: float
    offspring_count: int
    last_bred: datetime | None
```

### Genetics Systems
```python
class GeneticsSystem:
    """Manages genetic calculations and inheritance"""
    def calculate_offspring_genome(self, parent_a: SlimeGenome, parent_b: SlimeGenome) -> SlimeGenome
    def apply_mutation(self, genome: SlimeGenome, mutation_rate: float) -> SlimeGenome
    def calculate_tier(self, culture_expression: dict[str, float]) -> int

class BreedingSystem:
    """Handles breeding operations and cooldowns"""
    def can_breed(self, entity_a: Entity, entity_b: Entity) -> bool
    def breed_slimes(self, parent_a: Entity, parent_b: Entity) -> Entity
    def apply_breeding_cooldown(self, entity: Entity)
```

### Rendering Integration
```python
class GeneticsRenderingSystem:
    """Converts genetic data to visual output"""
    def generate_visual_profile(self, genome: SlimeGenome) -> VisualProfile
    def render_slime(self, entity: Entity, position: Vector2) -> None
    def update_appearance(self, entity: Entity, genome: SlimeGenome) -> None
```

---

## 📊 Performance Specifications

### Memory Usage
- **Per Slime**: ~1KB for complete genome
- **Population**: 100 slimes = ~100KB genetics data
- **Lineage History**: Mutation records capped at 50 per slime

### Computation Requirements
- **Breeding Calculation**: <1ms per breeding event
- **Tier Calculation**: <0.1ms (cached after first calculation)
- **Visual Generation**: <2ms for new slime appearance
- **Mutation Application**: <0.5ms per slime

### Storage Format
```python
# Compact JSON representation for save files
{
    "culture": {"allele_a": ["ember", 0.7], "allele_b": ["gale", 0.3]},
    "stats": {"base": {"strength": 12, "dexterity": 8}, "variance": {"strength": 2, "dexterity": 1}},
    "shape": {"type": "round", "width": 1.0, "height": 1.0, "irregularity": 0.1},
    "color": {"primary": [0.1, 0.8, 0.9], "secondary": [0.5, 0.3, 0.7], "pattern": "spots"},
    "lineage": {"generation": 3, "parents": [uuid1, uuid2], "mutations": []}
}
```

---

## 🎯 Implementation Priority

### Phase 1: Core Genetics
1. CultureGenes with allele resolution
2. Basic tier calculation (1-8)
3. Simple breeding logic
4. Visual generation for Tiers 1-3

### Phase 2: Advanced Features
1. Complete gene structure (all 4 types)
2. Mutation system
3. Generation depth tracking
4. Intersection archetype naming

### Phase 3: Visual Polish
1. Complex visual patterns (Tiers 4-8)
2. Void iridescence effects
3. Animation based on genetics
4. Visual rarity ladder implementation

---

**Specified**: 2026-03-01  
**Version**: 1.0  
**Status**: READY FOR IMPLEMENTATION  
**Dependencies**: Constitution v1.0, World Bible v1.0
