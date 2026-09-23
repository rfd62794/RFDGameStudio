# Systems Integration Map
## DGT Engine - Phase 3 Rendering Integration
**Date**: 2025-02-28  
**Scope**: How sprite system integrates with ECS, creatures, sessions, and multi-tenant architecture

---

## **1. CURRENT RENDERING ARCHITECTURE**

### **1.1 Existing Rendering Pipeline**
```
Creature (genome) → SlimeRenderer → PyGame Surface → Display
```

### **1.2 Current Integration Points**
- **Direct Scene Rendering** - Scenes call renderers directly
- **No ECS Integration** - Rendering bypasses ECS system
- **Pixel-Gen Only** - SlimeRenderer for procedural generation
- **Sprite Loader Available** - But not integrated with ECS

---

## **2. ECS LAYER INTEGRATION**

### **2.1 Current ECS Components** ✅

#### **Existing Components**
```python
# From src/shared/ecs/components/
@dataclass
class KinematicsComponent:
    """Physics state component - wrapper around creature's kinematics data"""
    # Note: This component doesn't own the kinematics data
    # It provides the ECS interface to the creature's existing kinematics

@dataclass
class BehaviorComponent:
    """Behavior state component - stores behavior-specific state"""
    target: Optional[Vector2] = None
    wander_timer: float = 0.0

@dataclass
class TowerComponent:
    """Tower-specific state for a slime acting as tower"""
    tower_type: str = "balanced"  # "scout", "rapid_fire", "cannon", "balanced"

@dataclass
class GridPositionComponent:
    """Grid placement for slimes in tower defense"""
    grid_x: int
    grid_y: int

@dataclass
class WaveComponent:
    """Enemy wave state"""
    wave_number: int = 1
    enemies_spawned: int = 0
```

### **2.2 Missing ECS Components** ❌

#### **RenderComponent (Needed)**
```python
@dataclass
class RenderComponent:
    """Rendering state component"""
    visible: bool = True
    layer: str = "midground"  # "background", "midground", "foreground", "ui"
    sprite_key: Optional[str] = None  # For sprite sheets
    color_override: Optional[Tuple[int, int, int]] = None
    scale: float = 1.0
    rotation: float = 0.0
    animation_state: str = "idle"
    animation_frame: int = 0
    animation_timer: float = 0.0
```

#### **AnimationComponent (Needed)**
```python
@dataclass
class AnimationComponent:
    """Animation state component"""
    current_animation: str = "idle"
    frame: int = 0
    timer: float = 0.0
    playing: bool = True
    loop: bool = True
    speed: float = 1.0
```

### **2.3 ECS Systems Integration**

#### **Current Systems**
- **TowerDefenseBehaviorSystem** - Tower behavior logic
- **WaveSystem** - Enemy wave spawning
- **UpgradeSystem** - Tower upgrade mechanics
- **CollisionSystem** - Projectile collision detection

#### **Missing Systems**
- **RenderingSystem** - ECS-based rendering
- **AnimationSystem** - Animation state management
- **SpriteSystem** - Sprite sheet management

---

## **3. CREATURE MODEL INTEGRATION**

### **3.1 Current Creature Structure** ✅

#### **From src/shared/entities/creature.py**
```python
@dataclass
class Creature:
    """Unified creature entity across all demos"""
    
    # Primary Identity (Immutable)
    slime_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Display (Mutable)
    name: str = "Unnamed"
    
    # Core Components
    genome: SlimeGenome = field(default_factory=lambda: SlimeGenome(...))
    
    # Physics State
    kinematics: Kinematics = field(default_factory=lambda: Kinematics(...))
    
    # Progression
    level: int = 1
    experience: int = 0
    # ... more fields
```

### **3.2 Genetics → Appearance Mapping** ✅

#### **Current Pixel-Gen Pipeline**
```python
# From slime_renderer.py
def render(self, surface: pygame.Surface, slime: Slime, selected: bool = False):
    color = slime.genome.base_color
    p_color = slime.genome.pattern_color
    shape = slime.genome.shape
    pattern = slime.genome.pattern
    
    # Cultural tendencies affect animation
    culture = slime.genome.cultural_base
    params = CULTURAL_PARAMETERS[culture]
```

#### **Appearance Fields Available**
- **`genome.base_color`** - Primary color
- **`genome.pattern_color`** - Secondary color
- **`genome.shape`** - Shape type
- **`genome.pattern`** - Pattern type
- **`genome.cultural_base`** - Animation behavior
- **`genome.accessory`** - Visual decorations

### **3.3 Missing Sprite/Appearance Fields** ❌

#### **Proposed Additions**
```python
@dataclass
class Creature:
    # ... existing fields ...
    
    # Rendering (New)
    sprite_sheet: Optional[str] = None  # Sprite sheet name
    sprite_index: Optional[int] = None  # Sprite index in sheet
    custom_renderer: Optional[str] = None  # Custom renderer class
    
    # Animation (New)
    animation_set: Optional[str] = None  # Animation set name
    current_animation: str = "idle"
    animation_frame: int = 0
```

---

## **4. SESSION/PERSISTENCE INTEGRATION**

### **4.1 Current Session Structure** ✅

#### **From TowerDefenseSession**
```python
@dataclass
class TowerDefenseSession:
    """Tower Defense game session"""
    session_id: str
    gold: int = 100
    lives: int = 20
    wave: int = 1
    score: int = 0
    
    # Game state
    towers: List[str] = field(default_factory=list)  # slime_ids
    enemies: List[Dict] = field(default_factory=list)
    projectiles: List[Dict] = field(default_factory=list)
    
    # Grid state
    grid: List[List[Optional[str]]] = field(default_factory=list)
    
    # Session metadata
    start_time: float = field(default_factory=time.time)
    game_active: bool = False
    game_paused: bool = False
    game_over: bool = False
    victory: bool = False
```

### **4.2 Rendering State Persistence** ✅

#### **What Persists Currently**
- **Creature genome** - Appearance via genetics
- **Tower positions** - Grid placement
- **Game state** - Wave, score, gold
- **Session metadata** - Timing, status

#### **Rendering State Gaps** ❌
- **Sprite selections** - Which sprite sheet used
- **Animation states** - Current animation/frame
- **Visual effects** - Particles, highlights
- **UI state** - Selected tower, menu states

### **4.3 Proposed Session Additions**
```python
@dataclass
class TowerDefenseSession:
    # ... existing fields ...
    
    # Rendering state (New)
    rendering_state: Dict[str, Any] = field(default_factory=dict)
    sprite_selections: Dict[str, str] = field(default_factory=dict)
    animation_states: Dict[str, Dict] = field(default_factory=dict)
    ui_state: Dict[str, Any] = field(default_factory=dict)
```

---

## **5. MULTI-TENANT INTEGRATION**

### **5.1 Current Multi-Tenant Support** ✅

#### **Existing Abstraction Points**
- **SlimeRenderer subclassing** - Different rendering per tenant
- **SpriteLoader configuration** - Different assets per tenant
- **Scene-level rendering** - Different renderers per scene
- **Genetics mapping** - Different appearance rules

#### **Tenant Isolation Examples**
```python
# Slime Breeder (Primary Tenant)
renderer = SlimeRenderer()  # Pixel-gen only

# Fantasy RPG Tenant
renderer = FantasySlimeRenderer()  # Sprite sheets + pixel-gen
sprite_loader.load("fantasy_slimes", "assets/fantasy/slimes.png")

# Sci-Fi Tenant
renderer = SciFiSlimeRenderer()  # Different sprite sheets
sprite_loader.load("scifi_slimes", "assets/scifi/slimes.png")
```

### **5.2 Multi-Tenant Architecture** ✅

#### **Configuration Points**
```python
# Tenant configuration
TENANT_CONFIG = {
    "slime_breeder": {
        "renderer": "SlimeRenderer",
        "sprite_sheets": [],
        "pixel_gen": True,
        "asset_path": "assets/slime_breeder/"
    },
    "fantasy_rpg": {
        "renderer": "FantasySlimeRenderer",
        "sprite_sheets": ["fantasy_slimes.png", "fantasy_enemies.png"],
        "pixel_gen": True,
        "asset_path": "assets/fantasy/"
    },
    "scifi_tower_defense": {
        "renderer": "SciFiSlimeRenderer",
        "sprite_sheets": ["scifi_towers.png", "scifi_enemies.png"],
        "pixel_gen": False,
        "asset_path": "assets/scifi/"
    }
}
```

### **5.3 Tenant-Specific Rendering** ✅

#### **Renderer Factory Pattern**
```python
class RendererFactory:
    @staticmethod
    def create_renderer(tenant_config: Dict) -> SlimeRenderer:
        renderer_class = tenant_config["renderer"]
        return globals()[renderer_class]()
    
    @staticmethod
    def load_assets(tenant_config: Dict, sprite_loader: SpriteLoader):
        for sprite_sheet in tenant_config["sprite_sheets"]:
            path = tenant_config["asset_path"] + sprite_sheet
            sprite_loader.load(sprite_sheet, path)
```

---

## **6. INTEGRATION STRATEGY**

### **6.1 Phase 3 Integration Steps**

#### **Step 1: Add ECS Components**
1. **RenderComponent** - Rendering state
2. **AnimationComponent** - Animation state
3. **SpriteComponent** - Sprite sheet references

#### **Step 2: Create ECS Systems**
1. **RenderingSystem** - ECS-based rendering
2. **AnimationSystem** - Animation updates
3. **SpriteSystem** - Sprite management

#### **Step 3: Integrate with Creatures**
1. **Add rendering fields** - Sprite references
2. **Update genome mapping** - Appearance rules
3. **Connect to ECS** - Component registration

#### **Step 4: Session Integration**
1. **Persist rendering state** - Save/restore
2. **Track sprite selections** - Asset management
3. **Save animation states** - Continuity

### **6.2 Multi-Tenant Integration**

#### **Step 1: Tenant Configuration**
1. **Define tenant configs** - Asset paths, renderers
2. **Create renderer factory** - Dynamic renderer creation
3. **Asset loading system** - Per-tenant assets

#### **Step 2: Rendering Abstraction**
1. **Base renderer interface** - Common API
2. **Tenant-specific renderers** - Custom implementations
3. **Asset management** - Per-tenant isolation

---

## **7. IMPLEMENTATION PLAN**

### **7.1 Immediate (Phase 3)**
1. **Add RenderComponent** - ECS rendering state
2. **Create RenderingSystem** - ECS rendering pipeline
3. **Integrate SlimeRenderer** - Tower sprite rendering
4. **Add SpriteLoader usage** - Enemy sprite sheets

### **7.2 Short-term (Post-Phase 3)**
1. **Add AnimationComponent** - Animation state
2. **Create AnimationSystem** - Animation updates
3. **Multi-tenant support** - Tenant configuration
4. **Session persistence** - Rendering state save/restore

### **7.3 Long-term (Future)**
1. **Advanced rendering** - Effects, particles
2. **Performance optimization** - Batch rendering
3. **Asset pipeline** - Automated asset loading
4. **Tenant management** - Dynamic tenant creation

---

## **8. QUESTIONS FOR ROBERT**

1. **ECS Components**: Should I add RenderComponent now or wait until after Phase 3?
2. **Animation System**: Is animation needed for Phase 3 or can it wait?
3. **Multi-Tenant**: Should we implement tenant configuration now or later?
4. **Session Persistence**: Should rendering state persist between sessions?
5. **Performance**: Is batch rendering needed for Phase 3 or can it wait?

---

## **9. RECOMMENDATIONS**

### **9.1 Phase 3 Recommendations**
1. **✅ Use existing SlimeRenderer** - Perfect for tower sprites
2. **✅ Add RenderComponent** - ECS integration
3. **✅ Use SpriteLoader** - Enemy sprite sheets
4. **🔄 Defer AnimationComponent** - Post-Phase 3
5. **🔄 Defer multi-tenant** - Post-Phase 3

### **9.2 Architecture Recommendations**
1. **ECS-first rendering** - All rendering through ECS
2. **Component-based design** - Modular rendering state
3. **Session persistence** - Save rendering state
4. **Multi-tenant ready** - Prepare for future tenants

### **9.3 Implementation Recommendations**
1. **Incremental integration** - Add components gradually
2. **Backward compatibility** - Keep existing renderers
3. **Testing strategy** - Test rendering integration
4. **Documentation** - Document integration patterns

---

**Status**: Current architecture is solid. ECS integration needed for rendering, but core systems are ready for Phase 3.
