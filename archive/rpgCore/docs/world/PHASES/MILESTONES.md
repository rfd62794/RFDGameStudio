- id: M_VISION
  type: milestone
  title: "VISION.md complete and in Archivist corpus"
  status: ACTIVE
  goals: [G8, G9]
  owner: human
  created: 2026-02-26
  modified: 2026-02-26

- id: M_CULTURAL
  type: milestone
  title: "Cultural Renderer — Five slime types visually distinct"
  status: ACTIVE
  goals: [G6]
  owner: human
  created: 2026-02-26
  modified: 2026-02-26

- id: M_BROWSER
  type: milestone
  title: "Browser Deployment — Slime Breeder playable at rfditservices.com"
  status: ACTIVE
  goals: [G1, G10]
  tasks:
    - Install pygbag and verify Slime Breeder launches
    - Configure pygbag build output for browser
    - Test in browser tab locally
    - Deploy to rfditservices.com
  owner: human
  created: 2026-02-26
  modified: 2026-02-27

- id: M_LOOP
  type: milestone
  title: "Core Loop — Slime Breeder feeds Dungeon Crawler"
  status: ACTIVE
  goals: [G2]
  tasks:
    - Connect bred slime to dungeon party slot
    - Verify slime stats affect combat
    - Test breed → dungeon → loss → breed cycle
  owner: human
  created: 2026-02-26
  modified: 2026-02-27

- id: M_HUB
  type: milestone
  title: "Garden hub connects all worlds"
  status: ACTIVE
  goals: [G3]
  owner: human
  created: 2026-02-26
  modified: 2026-02-27

- id: M_ENGINE
  type: milestone
  title: "Shared infrastructure — all demos use src/shared/"
  status: PARKED
  goals: [G9]
  owner: human
  created: 2026-02-26
  modified: 2026-02-26

- id: M_APJ
  type: milestone
  title: "APJ swarm vision-aligned — recommends demo work"
  status: PARKED
  goals: [G8]
  owner: human
  created: 2026-02-26
  modified: 2026-02-26

- id: M_V2
  type: milestone
  title: "v2 complete — Racing and Conquest playable"
  status: PARKED
  goals: [G4, G5]
  owner: human
  created: 2026-02-26
  modified: 2026-02-26

- id: M_V3
  type: milestone
  title: "v3 complete — Living World with faction memory"
  status: PARKED
  goals: [G7]
  owner: human
  created: 2026-02-26
  modified: 2026-02-26

- id: M_PHASE3
  type: milestone
  title: "Phase 3: Tower Defense Integration - Modular Sprite-Driven Engine"
  status: ACTIVE
  goals: [G3, G4, G5]
  tasks:
    - Phase 3.0: ECS Rendering Refactor (RenderComponent + RenderingSystem)
    - Phase 3.1: Grid System & Components (TowerComponent, WaveComponent, EnemyComponent)
    - Phase 3.2: Tower Defense Systems (TowerDefenseBehaviorSystem, WaveSystem, UpgradeSystem)
    - Phase 3.3: TD Session & Persistence (TowerDefenseSession, save/load JSON)
    - Phase 3.4: TD Scene & Integration (TowerDefenseScene, UI, rendering)
    - Phase 3.5: Fantasy RPG Tenant (multi-tenant proof-of-concept)
    - Phase 3.6: Archive & Documentation (demo inventory, governance)
  owner: human
  created: 2025-02-28
  modified: 2025-02-28
  success_criteria:
    - "785+ tests passing"
    - "Tower Defense playable with pixel-gen towers + sprite enemies"
    - "Fantasy RPG playable with same code, different assets"
    - "Multi-tenant configuration proven"
    - "Zero breaking changes to existing demos"

# PARKED — previous milestones not yet mapped to vision
- id: M_PARKED
  type: milestone
  title: "Previous milestones — review after v1 ships"
  status: PARKED
  notes: "Migrate relevant items to active milestones after browser demo is live"
  owner: human
  created: 2026-02-26
  modified: 2026-02-26
