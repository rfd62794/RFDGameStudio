# Demo Inventory Audit
## DGT Engine - Canonical vs Exploratory Demos

### **Executive Summary**
- **Total Demos**: 9 applications in src/apps/
- **Canonical Demos**: 4 (proving core thesis)
- **Exploratory Demos**: 5 (prototypes, one-offs, future directions)
- **Test Coverage**: 685 passing tests (all demos)

---

## **Demo Inventory Table**

| Demo | Purpose | Status | Test Coverage | Integration | Last Modified | Key Files |
|------|---------|--------|---------------|-------------|---------------|-----------|
| **Racing** | Physics-driven movement, speed mechanics | ✅ Complete | 50+ tests | **Canonical** | Feb 2025 | race_scene.py, race_engine.py |
| **Dungeon** | Behavior, combat, exploration | ✅ Complete | 100+ tests | **Canonical** | Feb 2025 | scene_dungeon_*.py, combat.py |
| **Breeding** | Genetics, inheritance, lineage | ✅ Complete | 80+ tests | **Canonical** | Feb 2025 | breeding_scene.py, genetics.py |
| **Slime Breeder** | UI hub, creature management | ✅ Complete | 200+ tests | **Canonical** | Feb 2025 | scene_garden.py, run_slime_breeder.py |
| **Tower Defense** | Grid-based strategy, ECS integration | ✅ Complete | 23 tests | **Canonical** | Feb 2025 | scene_tower_defense.py |
| **Slime Clan** | Territory mechanics, faction strategy | 🚧 In-Progress | 0 tests | **Exploratory** | Feb 2025 | run_slime_clan.py |
| **Space Demos** | Various space prototypes | 🚧 In-Progress | 0 tests | **Exploratory** | Feb 2025 | space/*.py |
| **Space Trader** | Economy simulation | 🚧 In-Progress | 0 tests | **Exploratory** | Feb 2025 | run_space_trader.py |
| **Asteroids** | Action roguelike | 🚧 In-Progress | 0 tests | **Exploratory** | Feb 2025 | run_asteroids.py |
| **Last Appointment** | Narrative dialogue | 🚧 In-Progress | 0 tests | **Exploratory** | Feb 2025 | run_last_appointment.py |
| **Turbo Shells** | Turtle racing management | ❓ Stub | 0 tests | **Exploratory** | Feb 2025 | run_turbo_shells.py |

---

## **Canonical Demos (Core Thesis)**
These demos prove the unified creature system scales across genres:

### **1. Racing Demo** ✅
- **Purpose**: Physics-driven movement and speed mechanics
- **Thesis**: Unified creatures can have physics-based behaviors
- **Key Files**: race_scene.py, race_engine.py
- **Status**: Complete, integrated

### **2. Dungeon Demo** ✅
- **Purpose**: Behavior, combat, exploration
- **Thesis**: Unified creatures can handle complex combat and exploration
- **Key Files**: scene_dungeon_path.py, scene_dungeon_combat.py
- **Status**: Complete, integrated

### **3. Breeding Demo** ✅
- **Purpose**: Genetics, inheritance, lineage
- **Thesis**: Unified creatures can have genetic systems
- **Key Files**: breeding_scene.py, genetics.py
- **Status**: Complete, integrated

### **4. Slime Breeder** ✅
- **Purpose**: UI hub, creature management
- **Thesis**: Unified creatures can be managed through UI systems
- **Key Files**: scene_garden.py, run_slime_breeder.py
- **Status**: Complete, integrated

### **5. Tower Defense** ✅
- **Purpose**: Grid-based strategy, ECS integration
- **Thesis**: Unified creatures can become towers in strategic gameplay
- **Key Files**: scene_tower_defense.py
- **Status**: Complete, integrated

---

## **Exploratory Demos (Prototypes/Future)**

### **Slime Clan** 🚧
- **Purpose**: Territory mechanics, faction strategy
- **Assessment**: Could become canonical if territory mechanics prove core thesis
- **Question**: Is this core to unified creature system or separate strategy game?

### **Space Demos** 🚧
- **Purpose**: Various space prototypes
- **Assessment**: Likely one-offs exploring space mechanics
- **Question**: Are these testing specific mechanics for future integration?

### **Space Trader** 🚧
- **Purpose**: Economy simulation
- **Assessment**: Could test economic systems for creatures
- **Question**: Is economy part of core thesis or separate genre?

### **Asteroids** 🚧
- **Purpose**: Action roguelike
- **Assessment**: Likely one-off testing action mechanics
- **Question**: Is this testing creature combat in different context?

### **Last Appointment** 🚧
- **Purpose**: Narrative dialogue
- **Assessment**: Could test creature personality/communication
- **Question**: Is narrative part of core thesis?

### **Turbo Shells** ❓
- **Purpose**: Turtle racing management
- **Assessment**: Stub, not implemented
- **Question**: Is this related to Racing demo or separate?

---

## **Recommendations**

### **Immediate Actions**
1. **Clarify Slime Clan** - Determine if territory mechanics are core thesis
2. **Assess Space Demos** - Identify which mechanics should be integrated
3. **Test Coverage** - Add tests for exploratory demos that become canonical

### **Codebase Organization**
1. **Move canonical demos** to `src/apps/canonical/`
2. **Move exploratory demos** to `src/apps/exploratory/`
3. **Archive stub demos** to `src/apps/archive/`

### **Governance**
1. **Establish demo lifecycle** - Stub → In-Progress → Complete → Canonical/Archive
2. **Test requirements** - Minimum test coverage for canonical status
3. **Documentation** - Each demo needs thesis alignment statement

---

## **Questions for Robert**

1. **Slime Clan**: Is territory mechanics part of core unified creature thesis?
2. **Space Demos**: Which space mechanics should be integrated into core system?
3. **Economy**: Is economic simulation part of creature behavior thesis?
4. **Narrative**: Should creature personality/communication be core thesis?
5. **Turbo Shells**: Is this related to Racing demo or separate exploration?

---

## **Next Steps**

1. **Robert clarifies** canonical vs exploratory status
2. **Reorganize codebase** based on decisions
3. **Update demos.json** to reflect canonical status
4. **Add governance** for demo lifecycle management
5. **Proceed to Phase 3** with clear inventory understanding
