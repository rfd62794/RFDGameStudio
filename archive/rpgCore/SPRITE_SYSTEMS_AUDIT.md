# Sprite Systems Audit
## DGT Engine - Existing Rendering Infrastructure
**Date**: 2025-02-28  
**Scope**: Archaeological audit of sprite/rendering systems for Phase 3 planning

---

## **1. EXISTING SPRITE SYSTEMS**

### **1.1 Core Rendering Infrastructure** ✅

#### **`src/shared/rendering/` - Complete System**
- **`slime_renderer.py`** - Pixel-gen slime rendering (179 lines)
  - **Purpose**: Procedural slime generation from genetics
  - **Features**: Breathing animation, cultural tendencies, shape rendering
  - **Shapes**: round, cubic, elongated, star, diamond, triangle
  - **Animation**: Pulse based on cultural wobble frequency
  - **Selection**: White highlight border
  - **Status**: ✅ Production ready, used by Slime Breeder

- **`sprite_loader.py`** - Sprite sheet loading system (46 lines)
  - **Purpose**: Caches images from disk with virtual resolution scaling
  - **Features**: Singleton pattern, dummy sprites for testing, error handling
  - **Methods**: `load()`, `get_sprite()`, `clear()`
  - **Status**: ✅ Production ready, supports sprite sheets

- **`pygame_renderer.py`** - Entity-based rendering (133 lines)
  - **Purpose**: Concrete RenderAdapter using PyGame
  - **Features**: Layered entities, headless testing support
  - **Methods**: `render_layered_entities()`, `render_entities()`
  - **Status**: ✅ Production ready, abstract interface

- **`layer_compositor.py`** - Multi-layer rendering
- **`font_manager.py`** - Text rendering system
- **`sovereign_surface.py`** - Fixed-resolution scaling

### **1.2 Pixel-Gen Implementation** ✅

#### **Slime Appearance Formula**
```python
# From slime_renderer.py
color = slime.genome.base_color
p_color = slime.genome.pattern_color
shape = slime.genome.shape
seed = sum(color)  # Deterministic seed based on color

# Cultural tendencies affect animation
culture = slime.genome.cultural_base
params = CULTURAL_PARAMETERS[culture]
pulse_speed = 3.0 * (params.wobble_frequency_range[0] + params.wobble_frequency_range[1]) / 2.0
```

#### **Genetics → Appearance Mapping**
- **`base_color`**: Primary slime color
- **`pattern_color`**: Secondary pattern color
- **`shape`**: round, cubic, elongated, star, diamond, triangle
- **`pattern`**: solid, spots, stripes, gradient
- **`cultural_base`**: Affects animation speed/wobble
- **`accessory`**: Visual decorations

### **1.3 Sprite Sheet Support** ✅

#### **SpriteLoader Capabilities**
- **Caching**: Singleton pattern prevents duplicate loads
- **Scaling**: Virtual resolution scaling support
- **Testing**: Dummy sprites for pytest environment
- **Error Handling**: Graceful failure with logging
- **Formats**: Any pygame-compatible image format

---

## **2. DEMO SPRITE USAGE PATTERNS**

### **2.1 Slime Breeder (Primary Tenant)** ✅
- **Rendering**: Uses `SlimeRenderer` for pixel-gen slimes
- **UI**: Shared UI components (Button, Label, Panel)
- **Pattern**: Pixel-gen only, no sprite sheets
- **Integration**: Full genetics → appearance pipeline

### **2.2 Dungeon Demo** ✅
- **Rendering**: Likely uses `SlimeRenderer` for creatures
- **Environment**: May use sprite sheets for tiles
- **Pattern**: Varied pixel-gen + sprite sheets
- **Status**: Needs verification

### **2.3 Racing Demo** ✅
- **Rendering**: Uses `SlimeRenderer` for racing slimes
- **Track**: Likely sprite-based or procedural
- **Pattern**: Pixel-gen creatures + sprite environment
- **Status**: Needs verification

### **2.4 Tower Defense** ✅
- **Rendering**: Will use `SlimeRenderer` for tower slimes
- **Enemies**: Could use sprite sheets
- **Projectiles**: Likely procedural
- **Pattern**: Pixel-gen towers + sprite enemies

### **2.5 Exploratory Demos** 🚧
- **Space Demos**: Varied sprite sheets + procedural
- **Slime Clan**: Sprite-based tiles + pixel-gen units
- **Asteroids**: Sprite-based entities

---

## **3. INTEGRATION ARCHITECTURE**

### **3.1 Current Rendering Pipeline**
```
Creature (genome) → SlimeRenderer → PyGame Surface → Display
```

### **3.2 ECS Integration** 🔄
- **No RenderComponent exists** - Gap identified
- **Current**: Direct rendering in scenes
- **Needed**: ECS-based rendering system

### **3.3 Session Persistence** ✅
- **Creature genome persists** - Appearance saved
- **Sprite selection persists** - Via creature state
- **Rendering state persists** - Via session data

---

## **4. MULTI-TENANT READINESS**

### **4.1 Pluggable Rendering Points** ✅

#### **1. SlimeRenderer Subclassing**
```python
class FantasySlimeRenderer(SlimeRenderer):
    def render(self, surface, slime, selected=False):
        # Override with fantasy sprites
        pass
```

#### **2. SpriteLoader Configuration**
```python
# Different sprite sheets per tenant
sprite_loader.load("fantasy_slime", "assets/fantasy/slimes.png")
sprite_loader.load("scifi_slime", "assets/scifi/slimes.png")
```

#### **3. Scene-Level Rendering**
```python
# Each scene can choose renderer
self.renderer = FantasySlimeRenderer()  # vs SlimeRenderer()
```

### **4.2 Tenant Isolation Points**
- **Asset Paths**: Configurable per tenant
- **Renderer Classes**: Subclassable per tenant
- **Genetics Mapping**: Different appearance rules
- **UI Themes**: Different visual styles

---

## **5. REFACTORING REQUIREMENTS**

### **5.1 Before Phase 3** 🔄
1. **Add RenderComponent** to ECS system
2. **Create RenderingSystem** for ECS updates
3. **Integrate SpriteLoader** with Tower Defense
4. **Add enemy sprite sheets** to assets
5. **Create projectile rendering** system

### **5.2 Phase 3 Implementation** 🚧
1. **Tower sprites** - Use existing SlimeRenderer
2. **Enemy sprites** - Use SpriteLoader + sprite sheets
3. **Projectile sprites** - Procedural or sprite-based
4. **UI sprites** - Use existing UI components
5. **Effect sprites** - Particle systems

---

## **6. RECOMMENDATIONS**

### **6.1 Immediate Actions**
1. **✅ Keep SlimeRenderer** - Perfect for tower sprites
2. **✅ Use SpriteLoader** - For enemy sprite sheets
3. **🔄 Add RenderComponent** - For ECS integration
4. **🔄 Create RenderingSystem** - For ECS updates

### **6.2 Asset Strategy**
1. **Enemy sprites** - Download from OpenGameArt/itch.io
2. **Tower sprites** - Keep pixel-gen (genetics-driven)
3. **Projectile sprites** - Simple procedural shapes
4. **UI sprites** - Use existing UI components

### **6.3 Multi-Tenant Strategy**
1. **Slime Breeder** - Keep pixel-gen only
2. **Fantasy RPG** - Sprite sheets + pixel-gen
3. **Sci-Fi** - Different sprite sheets + effects
4. **Custom Tenants** - Configurable asset paths

---

## **7. QUESTIONS FOR ROBERT**

1. **Enemy Sprite Sources**: Preferred asset sources (itch.io, OpenGameArt, custom)?
2. **Fantasy Integration**: Should we prepare fantasy sprite sheets now?
3. **RenderComponent ECS**: Should this be added before Phase 3?
4. **Projectile Style**: Procedural (like current) or sprite-based?
5. **Multi-Tenant Assets**: Should we prepare asset structure for multiple tenants?

---

## **8. PHASE 3 READINESS**

### **✅ What's Ready**
- **SlimeRenderer** - Perfect for tower sprites
- **SpriteLoader** - Ready for enemy sprite sheets
- **PyGameRenderer** - Supports layered rendering
- **UI Components** - Complete system ready

### **🔄 What Needs Work**
- **RenderComponent** - ECS integration missing
- **RenderingSystem** - ECS system missing
- **Enemy Assets** - Sprite sheets needed
- **Projectile System** - Rendering implementation needed

### **📋 Implementation Priority**
1. **Add ECS rendering components** (1-2 hours)
2. **Download/create enemy sprite sheets** (1-2 hours)
3. **Integrate with Tower Defense scene** (2-3 hours)
4. **Test multi-tenant rendering** (1 hour)

---

**Status**: Phase 3 can proceed with existing sprite systems. Minor ECS integration needed, but core infrastructure is solid.
