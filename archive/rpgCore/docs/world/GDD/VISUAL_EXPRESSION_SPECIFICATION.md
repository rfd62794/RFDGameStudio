# rpgCore Visual Expression Guide
**Design Document v1.0 — Living World Engine**

---

## 🎨 Core Philosophy

Every slime is rendered in pure mathematics. No sprites. No external art assets required for slimes. The rendering system expresses genetic identity visually — a player who understands the visual grammar can read a slime's tier, culture, mood, and life stage without checking a stats screen.

The rendering has two primary modes:
- **World Mode:** Slimes in gameplay context — garden, dispatch track, combat, exploration
- **Intimate Mode:** Slimes in visual novel scenes — centered, enlarged, expressive, character-forward

Same slime, same genetics, different framing and scale.

---

## 🔷 Shape System

Shape is inherited from parent shape genes with small variance per generation. Over generations, deliberate shape breeding produces increasingly refined forms.

### Base Shape Types

| Shape | Physical Profile | Gameplay Relevance |
|-------|-----------------|-------------------|
| **Round** | Balanced, average mass, stable center of gravity | Default. Reliable in all contexts. |
| **Wide/Flat** | Low center of gravity, high mass distribution | Sumo advantage. Hard to push. |
| **Tall/Narrow** | Extended reach, faster movement, easier to topple | Speed and reach trades stability. |
| **Compact** | Dense, heavy, slow but hits hard | Strength/Defense emphasis. |
| **Irregular** | Unpredictable physics, harder to read | Trickster archetype. Combat wildcards. |

### Shape Parameters (stored as floats in genome)

```python
shape_params = {
    'width_ratio': 1.0,      # relative to base unit
    'height_ratio': 1.0,
    'irregularity': 0.0,     # 0.0 = perfect geometry, 1.0 = highly irregular
    'edge_softness': 0.8,    # 0.0 = angular, 1.0 = perfectly smooth
}
```

### Shape × Generation

First generation shapes are rougher approximations. Deliberate lineage breeding refines them over generations — a tenth-generation wide/flat breeding line produces something approaching a perfect disc. The history is visible in the geometry.

---

## 🌈 Color System

### Culture Color Palette

Each culture has a base HSV color range. Slimes express these based on culture expression weights in their genome.

| Culture | Element | Primary Hue | Character |
|---------|---------|-------------|-----------|
| Ember | Fire | Warm reds, oranges (0-30°) | Vivid, saturated, intense |
| Gale | Wind | Sky blues, pale yellows (180-210°, 50-60°) | Light, airy, shifting |
| Marsh | Water | Deep greens, blue-greens (120-180°) | Rich, dark, persistent |
| Crystal | Earth | Whites, pale greys, clear (0° low sat) | Translucent, precise, cool |
| Tundra | Ice | Pale blues, silver (200-220°) | Desaturated, crisp, distant |
| Tide | Lightning | Deep blues, electric yellow (240°, 60°) | Charged, shifting, dynamic |
| Void | All | Full iridescent spectrum | All colors simultaneously |

### Blend Modes

Blend mode is determined by tier and genetic relationship between expressed cultures:

| Mode | When Used | Visual Effect |
|------|-----------|---------------|
| **Solid** | Tier 1 Blooded | Single saturated culture color |
| **Gradient** | Tier 2 Bordered (adjacent) | Smooth transition between two harmonious colors |
| **Sectional** | Tier 3 Sundered (opposite) | Hard boundary between two opposing colors |
| **Soft Edge** | Tier 4 Drifted | Partial blend with soft, undefined boundary |
| **Complex Mix** | Tier 5 Threaded | Multiple hues visible, no clear dominant |
| **Deepening** | Tier 6 Convergent | Colors darkening toward Void, slight iridescence begins |
| **Near-Void** | Tier 7 Liminal | Five colors present, one visibly absent or muted |
| **Iridescent** | Tier 8 Void | Full spectrum, time-based color cycling |

### Color Inheritance

```python
def inherit_color(parent_a_genome, parent_b_genome):
    # Weighted blend of parent primary colors
    weight_a = parent_a_genome.culture.expression  # culture weights
    weight_b = parent_b_genome.culture.expression
    
    # Small mutation chance per breeding event
    mutation_delta = random.gauss(0, 0.05) if random.random() < MUTATION_RATE else 0.0
    
    return blended_hsv + mutation_delta
```

---

## 🎭 Pattern System

Patterns layer on top of base color. They are inherited as dominant or recessive genes. Recessive patterns have a percentage chance to express per generation — they can skip generations and resurface.

### Pattern Types

| Pattern | Description | Genetic Type |
|---------|-------------|--------------|
| **Spots** | Discrete circles of secondary color | Dominant |
| **Stripes** | Parallel bands of alternating color | Dominant |
| **Marbled** | Organic swirling mix of two colors | Recessive |
| **Speckle** | Fine grain texture of secondary color | Recessive |
| **Shimmer** | Soft glow overlay, shifts with angle | Void-proximity marker |
| **Void-bloom** | Dark center radiating outward | Appears at Tier 6+ |

### Pattern Parameters

```python
pattern_genes = {
    'type': 'spots',          # or 'stripes', 'marbled', 'speckle', None
    'dominant': True,          # False = recessive, may not express
    'intensity': 0.4,          # 0.0 - 1.0 how visible the pattern is
    'scale': 0.3,              # relative to slime size
    'secondary_color': hsv,    # color of the pattern itself
}
```

### Pattern Mathematics

All patterns are procedural:
- **Spots:** Circle SDF (signed distance field) at noise-determined positions
- **Stripes:** Sine wave modulation across the slime surface
- **Marbled:** Fractal noise function with two color inputs
- **Speckle:** High-frequency noise threshold
- **Shimmer:** Time-based HSV shift with low amplitude

---

## ✨ Mutation Visual Expression

Mutations that occurred in lineage can have visible effects:

| Mutation Type | Visual Marker |
|---------------|---------------|
| Color mutation | Hue slightly outside expected culture range. Distinctive. |
| Shape mutation | One dimension beyond parent range. A notably unusual form. |
| Pattern emergence | Pattern appearing that neither parent expressed. Throwback. |
| Void-proximity | Slight iridescence appearing in otherwise non-Void lineage. |

Mutations are tracked in the genome record with the generation they occurred. The player can see a slime's mutation history and understand why it looks unusual.

---

## 😊 Expression System (Emotion)

Slimes communicate emotionally through simple visual cues. All are mathematical:

### Primary Expressions

| Emotion | Eye Shape | Brow Angle | Mouth Curve | Additional |
|---------|-----------|------------|-------------|------------|
| **Happy** | Round, open | Neutral/raised | Upward curl | Pink cheek blush circles |
| **Sad** | Half-closed | Angled inward | Downward curl | Small tear drop (symbol) |
| **Angry** | Narrowed | Sharply angled down | Tight line | Red heat waves above head |
| **Curious** | Wide, asymmetric | One raised | Slight open | Question mark symbol |
| **Scared** | Wide, pupils small | Raised high | Open O | Sweat drop symbol |
| **Content** | Closed/squint | Soft | Gentle curve | Slow body pulse |
| **Excited** | Stars or sparkles | Raised | Wide open | Bounce animation |
| **Confused** | Asymmetric | Varied | Crooked | Spiral symbol above |

### Expression Parameters (math)

```python
expression_state = {
    'eye_openness': 0.8,        # 0.0 closed - 1.0 wide open
    'eye_shape': 'round',       # 'round', 'narrow', 'star', 'half'
    'pupil_size': 0.5,          # relative
    'brow_angle': 0.0,          # negative = furrowed, positive = raised
    'brow_asymmetry': 0.0,      # 0.0 = symmetric
    'mouth_curve': 0.3,         # negative = frown, positive = smile
    'mouth_open': 0.0,          # 0.0 = closed
    'cheek_blush': 0.0,         # 0.0 = none, 1.0 = full blush
    'symbol': None,             # 'tear', 'sweat', 'question', 'heart', etc.
}
```

### Personality × Expression

A slime's personality (derived from culture weights) influences default expression state and how expressively they react:

- **Ember tendency:** Default expression leans intense. Anger and excitement are more pronounced.
- **Gale tendency:** Expressions shift quickly. Curiosity is their resting state.
- **Marsh tendency:** Slow, subtle expression changes. Content is their natural baseline.
- **Crystal tendency:** Reserved. Expressions are smaller amplitude. Trust takes time.
- **Tundra tendency:** Minimal expression. Hard to read — this is intentional.
- **Tide tendency:** Highly expressive. Charisma reads in the face.

---

## 🎬 Visual Novel Mode (Intimate Mode)

When a slime appears in a visual novel scene:

**Rendering differences:**
- Larger render scale — the slime fills meaningful screen space
- Background simplified or replaced with context-appropriate scene
- Expression system at full fidelity — subtle microexpressions visible
- Animation: gentle breathing idle, expression transitions are smooth
- No UI overlays — the slime and the dialogue box only

**Silhouette mode:**
For scenes where identity is withheld or dramatic, slimes render as dark silhouettes with a subtle glow matching their culture color. Shape is still readable. The mystery is maintained.

---

## 👨‍🚀 The Astronaut (Player Avatar)

The player's avatar is never represented in gameplay — the slimes are the player's hands in the world. But in visual novel scenes, the astronaut appears as the perspective anchor.

**Astronaut rendering (SVG/procedural):**
- Helmet: rounded rectangle or circle
- Visor: darker ellipse inset
- Body: rounded rectangle, wider than tall
- Arms: simple curved forms
- Suit detail: minimal line work

The astronaut has no expression system — they are the camera, not a character with emotional display. Their emotional state is expressed through dialogue choices.

**Damaged ship (background asset):**
The only significant visual asset that may require a static image or careful SVG work. The ship silhouette with:
- Scorch marks as noise patterns
- Steam/smoke particles (math)
- Flickering damage glow (time-based math)
- Visible but not the focus — it is backdrop, not subject

---

## 📊 Rendering Context Summary

| Context | Scale | Mode | Detail Level |
|---------|-------|------|-------------|
| Garden overview | Small | World | Shape + color + basic expression |
| Garden interaction | Medium | World | Full expression system |
| Dispatch track | Small | World | Shape + color only (performance) |
| Combat/Sumo | Medium | World | Shape + physics expression |
| Visual novel scene | Large | Intimate | Full fidelity, expression priority |
| Silhouette | Any | Intimate | Shape + culture glow only |
| Lore record portrait | Medium | Static | Full genetics expression, frozen |

---

## 🏗️ ECS Integration Specifications

### Visual Components
```python
@dataclass
class VisualComponent:
    """Complete visual profile of a slime"""
    shape_params: ShapeParameters
    color_profile: ColorProfile
    pattern_params: PatternParameters
    expression_state: ExpressionState
    rendering_context: RenderingContext
    
    def get_world_render_data(self) -> WorldRenderData:
        """Get rendering data for world mode"""
        
    def get_intimate_render_data(self) -> IntimateRenderData:
        """Get rendering data for visual novel mode"""

@dataclass
class ExpressionComponent:
    """Emotional expression state and transitions"""
    current_emotion: EmotionType
    target_emotion: EmotionType
    transition_progress: float
    expression_intensity: float
    
    def set_emotion(self, emotion: EmotionType, intensity: float) -> None:
        """Set target emotion with intensity"""
        
    def update_expression(self, dt: float) -> None:
        """Update expression transition"""

@dataclass
class RenderingContextComponent:
    """Rendering context and mode"""
    mode: RenderMode  # WORLD, INTIMATE, SILHOUETTE
    scale: float
    detail_level: DetailLevel  # LOW, MEDIUM, HIGH, FULL
    background_context: Optional[str]
    
    def set_world_mode(self) -> None:
        """Set rendering for world context"""
        
    def set_intimate_mode(self) -> None:
        """Set rendering for visual novel context"""
```

### Visual Systems
```python
class VisualRenderingSystem:
    """Main visual rendering system"""
    def render_slime(self, entity: Entity, context: RenderingContext) -> None:
        """Render slime based on visual components and context"""
        
    def update_expression(self, entity: Entity, dt: float) -> None:
        """Update expression animations"""
        
    def apply_mutation_effects(self, entity: Entity) -> None:
        """Apply visual mutation markers"

class ShapeRenderingSystem:
    """Shape geometry rendering"""
    def generate_shape_mesh(self, shape_params: ShapeParameters) -> Mesh:
        """Generate procedural shape mesh"""
        
    def apply_generation_refinement(self, mesh: Mesh, generation: int) -> Mesh:
        """Refine shape based on generation depth"""

class ColorRenderingSystem:
    """Color and pattern rendering"""
    def apply_culture_colors(self, base_mesh: Mesh, color_profile: ColorProfile) -> Mesh:
        """Apply culture-based colors with blend modes"""
        
    def render_patterns(self, mesh: Mesh, pattern_params: PatternParameters) -> Mesh:
        """Render procedural patterns"""
        
    def apply_tier_effects(self, mesh: Mesh, tier: int) -> Mesh:
        """Apply tier-specific visual effects (iridescence, etc.)"

class ExpressionRenderingSystem:
    """Emotional expression rendering"""
    def render_face(self, base_mesh: Mesh, expression: ExpressionState) -> Mesh:
        """Render facial features based on expression"""
        
    def render_symbols(self, entity: Entity, symbol: SymbolType) -> None:
        """Render emotion symbols above slime"""
        
    def update_expression_animation(self, entity: Entity, dt: float) -> None:
        """Animate expression transitions"""
```

---

## 🎯 Performance Specifications

### Memory Usage
- **Per Slime**: ~300 bytes for visual data
- **Population**: 100 slimes = ~30KB visual data
- **Pattern Cache**: Shared pattern definitions, minimal per-slime overhead

### Computation Requirements
- **Shape Generation**: <1ms per slime (cached after generation)
- **Color Blending**: <0.5ms per slime
- **Pattern Rendering**: <1ms per slime
- **Expression Updates**: <0.2ms per slime

### Rendering Performance
- **World Mode**: 60 FPS with 50+ slimes on screen
- **Intimate Mode**: 30 FPS with full fidelity rendering
- **Pattern Complexity**: Adaptive detail based on distance and context

---

## 🔧 Math Renderer Extension Requirements

To support all of the above, the existing math renderer needs:

1. **Blend mode system** — gradient, sectional, marbled interpolation between two color values
2. **Pattern layer** — noise functions with pattern type switching
3. **Expression parameter system** — eye/brow/mouth/cheek as controllable float parameters
4. **Symbol overlay system** — small symbolic elements drawn above/near the slime
5. **Scale/framing modes** — world versus intimate rendering contexts
6. **Time-based animation** — iridescence cycling, breathing idle, expression transitions
7. **Silhouette mode** — dark fill with culture-colored glow

All of these are pure math/pygame drawing operations. No external art assets required for slimes.

---

## 🎯 Implementation Priority

### Phase 1: Core Visual System
1. Shape generation and rendering
2. Basic culture color system
3. Simple expression rendering
4. World vs intimate rendering modes

### Phase 2: Advanced Features
1. Pattern system (spots, stripes, marbled)
2. Tier-based blend modes
3. Expression animation system
4. Mutation visual markers

### Phase 3: Polish & Effects
1. Void iridescence effects
2. Symbol overlay system
3. Silhouette rendering mode
4. Performance optimization for large populations

---

## 🔄 Integration with Existing Systems

### Genetics Integration
- **Visual Expression**: Genetics directly determine visual appearance
- **Tier Effects**: Visual tier indicators (blend modes, iridescence)
- **Mutation Markers**: Visual indication of genetic mutations
- **Generation Refinement**: Shape refinement based on generation depth

### Lifecycle Integration
- **Stage-Based Rendering**: Visual changes based on lifecycle stage
- **Expression Development**: Expression complexity increases with stage
- **Size Scaling**: Physical size changes based on age and development
- **Elder Effects**: Special visual effects for Elder slimes

### World System Integration
- **Context Rendering**: Different rendering modes for different contexts
- **Performance Scaling**: Adaptive detail based on scene complexity
- **Cultural Recognition**: Visual cues for cultural hub interactions
- **Environmental Effects**: Lighting and environmental influences on rendering

---

**Specified**: 2026-03-01  
**Version**: 1.0  
**Status**: READY FOR IMPLEMENTATION  
**Dependencies**: Constitution v1.0, Genetics Specification v1.0, Lifecycle Specification v1.0
