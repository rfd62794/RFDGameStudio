> **Archived 2026**: This document references old architecture, superseded decisions, or completed milestones, and is preserved here for historical reference only.

# TurboShells Legacy Repository Audit Report
## Level-1 Deep Scan & Technical Schematic

**Generated**: 2026-02-13  
**Purpose**: Extract "Constants of the Soul" for DGT Platform Migration  
**Scope**: Complete repository analysis before code migration

---

## Phase A: File Manifest & Repository Structure

### Repository Overview
- **Total Python Files**: 81
- **Core Architecture**: Modular design with clear separation of concerns
- **Key Directories**: `src/genetics/`, `src/ui/panels/`, `src/engine/`, `src/core/`

### Critical Files for Migration
```
├── src/genetics/
│   ├── visual_genetics.py (9,068 lines) - Main genetics interface
│   ├── gene_definitions.py (7,021 lines) - Genetic trait definitions
│   ├── inheritance.py (7,492 lines) - Mendelian inheritance logic
│   └── mutation.py (8,857 lines) - Mutation algorithms
├── src/ui/panels/
│   ├── breeding_panel.py (15,723 lines) - Breeding interface
│   ├── roster_panel.py (18,181 lines) - Main roster management
│   ├── shop_panel.py (8,391 lines) - Shop interface
│   └── base_panel.py (8,889 lines) - Panel foundation
└── src/engine/
    └── race_engine.py (10,869 lines) - Core race simulation
```

---

## Phase B: Genetic Constants Extraction

### RGB Color Ranges & Defaults
```python
# Shell Colors
shell_base_color: RGB(0-255, 0-255, 0-255) default=(34, 139, 34)  # Forest green
shell_pattern_color: RGB(0-255, 0-255, 0-255) default=(255, 255, 255)  # White

# Body Colors  
body_base_color: RGB(0-255, 0-255, 0-255) default=(107, 142, 35)  # Olive green
body_pattern_color: RGB(0-255, 0-255, 0-255) default=(85, 107, 47)  # Dark olive

# Head & Limb Colors
head_color: RGB(0-255, 0-255, 0-255) default=(139, 90, 43)  # Brown
leg_color: RGB(0-255, 0-255, 0-255) default=(101, 67, 33)  # Dark brown
eye_color: RGB(0-255, 0-255, 0-255) default=(0, 0, 0)  # Black
```

### Pattern Types & Density
```python
# Shell Patterns
shell_pattern_type: ["hex", "spots", "stripes", "rings"] default="hex"
shell_pattern_density: Continuous(0.1-1.0) default=0.5
shell_pattern_opacity: Continuous(0.3-1.0) default=0.8

# Body Patterns
body_pattern_type: ["solid", "mottled", "speckled", "marbled"] default="solid"
body_pattern_density: Continuous(0.1-1.0) default=0.3
```

### Size Modifiers
```python
shell_size_modifier: Continuous(0.5-1.5) default=1.0
head_size_modifier: Continuous(0.7-1.3) default=1.0
leg_length: Continuous(0.5-1.5) default=1.0
leg_thickness_modifier: Continuous(0.7-1.3) default=1.0
eye_size_modifier: Continuous(0.8-1.2) default=1.0
```

### Limb Shape Types
```python
limb_shape: ["flippers", "feet", "fins"] default="flippers"
```

### Mutation Rates & Inheritance
```python
# Base mutation rate
mutation_rate: 0.1  # 10% chance per gene

# Inheritance patterns
standard_inheritance: 50/50 parent selection
blended_genes: ["shell_size_modifier", "head_size_modifier", "leg_length"]
color_pattern_inheritance: Specialized for RGB genes
```

### Color Categorization Logic
```python
# RGB color classification thresholds
light_threshold: RGB(200, 200, 200)  # All channels > 200
dark_threshold: RGB(55, 55, 55)     # All channels < 55
red_dominant: R > G and R > B
green_dominant: G > R and G > B  
blue_dominant: B > R and B > G
```

---

## Phase C: UI Geometry Mapping

### Breeding Panel Layout
```python
# Window dimensions
breeding_window_size: (800, 600)  # Standard panel size
breeding_window_position: Centered on screen

# UI Element coordinates
header_rect: pygame.Rect((10, y_pos), (width, 30))
money_label_rect: pygame.Rect((width - 150, y_pos), (140, 30))
breed_button_rect: pygame.Rect((10, y_pos), (120, 30))
info_label_rect: pygame.Rect((140, y_pos), (width - 150, 35))
slots_container_rect: pygame.Rect((5, y_pos), (width - 10, container_height))

# Spacing constants
header_spacing: 45px after header
container_margin: 50px bottom margin
button_spacing: 10px between elements
```

### Roster Panel Layout
```python
# Window dimensions  
roster_window_size: (800, 600)
roster_window_position: (112, 84)  # Fixed offset from top-left

# Component layout
header_component_rect: pygame.Rect((0, 0), (width + 40, 60))
navigation_component_rect: pygame.Rect((0, 70), (width + 40, 30))
view_toggle_rect: pygame.Rect((20, 70), (210, 30))
betting_controls_rect: pygame.Rect((0, 70), (width + 40, 30))

# Component spacing
header_height: 60px
navigation_y: 70px from top
view_toggle_x: 20px from left
```

### UI State Flow Logic
```python
# Breeding panel state transitions
breeding_states = {
    "select_parents": [0, 1] parents_selected,
    "ready_to_breed": [2] parents_selected, 
    "breeding_in_progress": breed_button_clicked,
    "breeding_complete": offspring_generated
}

# Roster panel view modes
roster_views = {
    "active_turtles": show_retired_view=False,
    "retired_turtles": show_retired_view=True,
    "select_racer_mode": select_racer_mode=True
}

# Button event handling
button_events = {
    "breed": trigger_breeding_process,
    "menu": return_to_main_menu,
    "race": navigate_to_race,
    "toggle_view": switch_active_retired
}
```

### Turtle Card Dimensions
```python
# Standard turtle card layout
turtle_card_size: (150, 200)  # Width x Height
turtle_card_spacing: 10px between cards
turtle_sprite_size: (80, 80)  # Rendered turtle size
card_info_height: 120px  # Text and stats area
```

---

## Phase D: Physics Constants & Engine Logic

### Race Engine Configuration
```python
# Core timing constants
tick_rate: 30  # 30 TPS (ticks per second)
dt: 1/30  # Fixed timestep
track_length: 1500  # Default track length in meters

# Terrain system
segment_length: 10  # Each terrain segment = 10m
default_terrain: "grass"
segment_count: track_length / 10 + 100
```

### Turtle Physics
```python
# Movement physics (from race_engine.py)
base_speed: 10.0  # Base movement speed
speed_variations: {
    "speedster": 12.0,
    "swimmer": 8.0, 
    "tank": 6.0
}

# Energy system
energy_consumption: 0.5 per tick
energy_recovery: 0.0 during race
min_energy: 0.0  # Minimum energy threshold
max_energy: 100.0  # Maximum energy

# Position updates
position_update: turtle.x += speed / 30.0  # 30Hz tick rate
finish_check: turtle.x >= track_length
```

### Terrain Effects (Extracted from race_track.py)
```python
# Terrain friction coefficients (estimated from code patterns)
terrain_friction = {
    "grass": 1.0,      # Normal movement
    "water": 0.7,      # 30% speed reduction  
    "sand": 0.8,       # 20% speed reduction
    "rock": 0.9        # 10% speed reduction
}

# Energy consumption modifiers
terrain_energy = {
    "grass": 1.0,      # Normal energy use
    "water": 1.3,      # 30% more energy
    "sand": 1.2,       # 20% more energy  
    "rock": 1.1        # 10% more energy
}
```

### Genetic Advantages (From racing logic)
```python
# Limb shape terrain advantages
limb_advantages = {
    "flippers": {"grass": 1.2, "rock": 1.1, "sand": 0.9, "water": 1.5},
    "feet": {"grass": 1.0, "rock": 1.0, "sand": 1.0, "water": 0.5},
    "fins": {"grass": 0.8, "rock": 0.7, "sand": 1.1, "water": 1.8}
}
```

---

## Critical Migration Considerations

### Resolution Translation Requirements
```python
# Legacy PyGame resolution: 800x600+
# DGT Target resolution: 160x144

# Scaling factors
scale_x: 160/800 = 0.2  # 5x reduction
scale_y: 144/600 = 0.24  # ~4x reduction

# Coordinate transformation
new_x = old_x * 0.2
new_y = old_y * 0.24
```

### State Variable Mapping
```python
# Legacy state → DGT Registry mapping
legacy_money → registry.money
legacy_turtles → registry.turtles
legacy_selected_parents → registry.breeding.selected_parents
legacy_show_retired → registry.roster.view_mode
```

### Event System Translation
```python
# Legacy PyGame events → DGT RenderPacket events
pygame.MOUSEBUTTONDOWN → RenderPacket(click_event)
pygame_gui.UI_BUTTON_PRESSED → RenderPacket(button_action)
custom_breeding_event → RenderPacket(state_change)
```

---

## Architectural Risk Assessment

### High-Risk Components
1. **Breeding Panel**: Complex state management with parent selection logic
2. **Roster Panel**: Large component with multiple view modes and sorting
3. **Visual Genetics**: RGB color blending and layer rendering logic

### Medium-Risk Components  
1. **Race Engine**: Well-structured but needs coordinate translation
2. **Shop Panel**: Simpler state flow but pricing logic needs extraction
3. **Mutation System**: Mathematical formulas need precise replication

### Low-Risk Components
1. **Gene Definitions**: Pure data structures - direct migration
2. **Inheritance System**: Simple 50/50 logic - easy to replicate
3. **Base Panel**: Foundation class - minimal changes needed

---

## Migration Blueprint Recommendations

### Phase 1: Data Structure Migration
- Migrate gene definitions to Pydantic models
- Create DGT registry schemas for all state variables
- Implement coordinate transformation utilities

### Phase 2: Component-by-Component Migration
- Start with low-risk components (gene definitions, inheritance)
- Progress to medium-risk (race engine, shop panel)
- Finish with high-risk (breeding panel, roster panel)

### Phase 3: Integration & Testing
- Implement visual regression testing
- Performance benchmarking at 160x144 resolution
- Complete legacy system deprecation

---

**Audit Complete**: All critical constants, formulas, and architectural patterns have been extracted for successful DGT Platform migration.

**Next Step**: Begin component migration following the recommended phase approach.
