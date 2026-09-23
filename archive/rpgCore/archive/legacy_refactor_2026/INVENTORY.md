# rpgCore Repository Inventory

## 1. Directory Structure
`	ext
Folder PATH listing for volume Acer
Volume serial number is 1A9B-1708
C:\GITHUB\RPGCORE\SRC
+---apps
|   |   dgt_launcher.py
|   |   
|   +---interface
|   |   |   adaptive_workspace.py
|   |   |   dashboard.py
|   |   |   large_workspace.py
|   |   |   manual_control_widget.py
|   |   |   menu_system.py
|   |   |   size_control_widget.py
|   |   |   
|   |   \---__pycache__
|   |           adaptive_workspace.cpython-314.pyc
|   |           dashboard.cpython-314.pyc
|   |           large_workspace.cpython-314.pyc
|   |           manual_control_widget.cpython-314.pyc
|   |           menu_system.cpython-314.pyc
|   |           size_control_widget.cpython-314.pyc
|   |           
|   +---slime_clan
|   |   |   territorial_grid.py
|   |   |   __init__.py
|   |   |   
|   |   \---__pycache__
|   |           territorial_grid.cpython-314.pyc
|   |           __init__.cpython-314.pyc
|   |           
|   +---space
|   |   |   arcade_visual_asteroids.py
|   |   |   asteroids_clone_sdk.py
|   |   |   asteroids_slice.py
|   |   |   asteroids_strategy.py
|   |   |   combatant_evolution.py
|   |   |   cultural_evolution.py
|   |   |   input_handler.py
|   |   |   physics_body.py
|   |   |   scrap_entity.py
|   |   |   sentient_scavenger.py
|   |   |   ship_genetics.py
|   |   |   simple_visual_asteroids.py
|   |   |   space_di.py
|   |   |   space_physics.py
|   |   |   space_voyager_engine.py
|   |   |   terminal_handshake.py
|   |   |   tournament_mode.py
|   |   |   training_loop.py
|   |   |   turbo_scout_demo.py
|   |   |   visual_asteroids.py
|   |   |   __init__.py
|   |   |   
|   |   +---entities
|   |   |   |   space_entity.py
|   |   |   |   vector2.py
|   |   |   |   
|   |   |   \---__pycache__
|   |   |           space_entity.cpython-312.pyc
|   |   |           space_entity.cpython-314.pyc
|   |   |           vector2.cpython-314.pyc
|   |   |           
|   |   +---logic
|   |   |   |   __init__.py
|   |   |   |   
|   |   |   \---__pycache__
|   |   |           ai_controller.cpython-312.pyc
|   |   |           ai_controller.cpython-314.pyc
|   |   |           knowledge_library.cpython-312.pyc
|   |   |           knowledge_library.cpython-314.pyc
|   |   |           short_term_memory.cpython-312.pyc
|   |   |           short_term_memory.cpython-314.pyc
|   |   |           technique_extractor.cpython-312.pyc
|   |   |           technique_extractor.cpython-314.pyc
|   |   |           __init__.cpython-312.pyc
|   |   |           __init__.cpython-314.pyc
|   |   |           
|   |   +---scenarios
|   |   |       premiere_voyage.json
|   |   |       __init__.py
|   |   |       
|   |   \---__pycache__
|   |           arcade_visual_asteroids.cpython-312.pyc
|   |           arcade_visual_asteroids.cpython-314.pyc
|   |           asteroids_slice.cpython-312.pyc
|   |           asteroids_slice.cpython-314.pyc
|   |           asteroids_strategy.cpython-312.pyc
|   |     
... (truncated for brevity)
``n
## 2. Component Inventory
Below is a summary of the non-Slime Clan Python files:

- src\apps\dgt_launcher.py: DGT Platform Launcher - Three-Tier Architecture Entry Point
- src\apps\interface\adaptive_workspace.py: Adaptive Workspace - 320x240 Flight Space with Widgetized UI
- src\apps\interface\dashboard.py: Sovereign Dashboard - Modular Workspace Interface
- src\apps\interface\large_workspace.py: Large Workspace - 1280x720 Professional Development Environment
- src\apps\interface\manual_control_widget.py: Manual Control Widget - Human Player Control
- src\apps\interface\menu_system.py: Menu System - Main Menu and Pause Menu Overlay
- src\apps\interface\size_control_widget.py: Size Control Widget - Dynamic Gameplay Size Options
- src\apps\slime_clan\territorial_grid.py: Territorial Grid Prototype â€” Spec-001, Session 009
- src\apps\space\arcade_visual_asteroids.py: Arcade Visual Asteroids - Final Polish
- src\apps\space\asteroids_clone_sdk.py: Asteroids Clone SDK - Component-Based Arcade Classic
- src\apps\space\asteroids_slice.py: Contains classes: Asteroid, AsteroidsSlice, VisualRunner
- src\apps\space\asteroids_strategy.py: Asteroids Strategy - Lean Orchestrator
- src\apps\space\combatant_evolution.py: Combatant Evolution - Safe Respawn & Active Offense
- src\apps\space\cultural_evolution.py: Cultural Evolution - Epigenetic Learning Across Generations
- src\apps\space\input_handler.py: Input Handler - Space Game Input System
- src\apps\space\physics_body.py: Physics Body - Newtonian Physics Controller
- src\apps\space\scrap_entity.py: Scrap Entity - Resource Acquisition System
- src\apps\space\sentient_scavenger.py: Sentient Scavenger - Active Learning AI with Penalty Awareness
- src\apps\space\ship_genetics.py: Ship Genetics Proxy â€” Re-export from apps/rpg/logic/ship_genetics.py
- src\apps\space\simple_visual_asteroids.py: Simple Visual Asteroids - High-Fidelity Launch
- src\apps\space\space_di.py: Space Engine Dependency Injection Setup
- src\apps\space\space_physics.py: DGT Space Physics - ADR 130 Implementation
- src\apps\space\space_voyager_engine.py: Space Voyager Engine - Physics Runner for Star-Fleet
- src\apps\space\terminal_handshake.py: Terminal Handshake - Phosphor Terminal Integration
- src\apps\space\tournament_mode.py: Tournament Mode - Live Evolution Spectator
- src\apps\space\training_loop.py: Training Loop - NEAT Evolution for AI Pilot
- src\apps\space\turbo_scout_demo.py: Turbo-Scout Demo - Genetic Asteroids with Shell-Ships
- src\apps\space\visual_asteroids.py: Visual Asteroids - High-Fidelity Launch
- src\apps\space\entities\space_entity.py: Space Entity - Newtonian Physics Entity
- src\apps\space\entities\vector2.py: Vector2 - Newtonian Physics Vector
- src\apps\tycoon\dashboard.py: TurboShells Tycoon Dashboard - Integrated Game Loop
- src\apps\tycoon\components\kinetic_body.py: KineticBody Component - Physics Foundation for Entities
- src\apps\tycoon\entities\turtle.py: Sovereign Turtle Entity - First DGT-Native TurboShell
- src\apps\tycoon\rendering\turtle_renderer.py: Turtle Renderer - Visual Handshake for Sovereign Turtles
- src\apps\tycoon\systems\cycle_manager.py: Daily Cycle Manager - Tycoon Orchestration
- src\apps\tycoon\systems\economy_engine.py: Economy Engine - Tycoon Orchestration
- src\apps\tycoon\systems\stable_manager.py: Stable Manager - Tycoon Orchestration
- src\apps\tycoon\ui\views\breeding_view.py: Breeding View - Universal Breeding Interface using PyGame Shim
- src\apps\tycoon\ui\views\market_view.py: Market View - Universal Shop Interface using PyGame Shim
- src\apps\tycoon\ui\views\roster_view.py: Roster View - Universal Roster Interface using PyGame Shim
- src\dgt_engine\c_style_facades.py: C-Style API Facades for RPG Core Pillars
- src\dgt_engine\factories.py: Factories for Character Archetypes and Location Templates.
- src\dgt_engine\main.py: Main Heartbeat Controller - The DGT Autonomous Movie System
- src\dgt_engine\__compat__.py: Backward Compatibility Shim Layer
- src\dgt_engine\assets\fabricator.py: Asset Fabricator Component
- src\dgt_engine\assets\fabricator_tkinter.py: Asset Fabricator Component - PIL-Free Version
- src\dgt_engine\assets\parser.py: Asset Parser Component
- src\dgt_engine\assets\raw_loader.py: Raw File Loader - ADR 089 Implementation
- src\dgt_engine\assets\registry.py: Asset Registry Component
- src\dgt_engine\assets\sovereign_schema.py: Sovereign Schema - ADR 089: The Sovereign Schema Transformation
- src\dgt_engine\assets\starter_loader.py: Starter Loader - ADR 091: The Semantic Starter Protocol
- src\dgt_engine\assets\tiny_farm_asset_loader.py: Tiny Farm Asset Loader - ADR 107: Professional Asset Integration
- src\dgt_engine\assets\tiny_farm_bridge.py: Tiny Farm Bridge - ADR 107: Asset Supplementation Protocol
- src\dgt_engine\assets\tiny_farm_ingestor.py: Tiny Farm Ingestor - ADR 107: Professional Asset Ingestion
- src\dgt_engine\assets\tiny_farm_processor.py: Tiny Farm Processor - ADR 107: Professional Asset Integration using DGT Tools
- src\dgt_engine\assets\tiny_farm_rendering_loader.py: Tiny Farm Rendering Loader - Fix for Asset Display Issue
- src\dgt_engine\assets\tiny_farm_sheet_loader.py: Tiny Farm Sprite Sheet Loader - Professional Asset Import Tool
- src\dgt_engine\assets\tiny_farm_simple_loader.py: Tiny Farm Simple Loader - Focus on Image Rendering and Detection
- src\dgt_engine\common\types.py: Common Types - Shared type definitions
- src\dgt_engine\config\config_manager.py: Production-ready configuration management for DGT Autonomous Movie System
- src\dgt_engine\dgt_core\compat\pygame_shim.py: PyGame Compatibility Shim - Legacy UI Logic Bridge
- src\dgt_engine\dgt_core\engines\viewport\adaptive_renderer.py: Adaptive Renderer - Dual-Profile Rendering System
- src\dgt_engine\dgt_core\engines\viewport\logical_viewport.py: Logical Viewport System - Universal Coordinate Mapping
- src\dgt_engine\dgt_core\registry\dgt_registry.py: DGT Registry Bridge - Transaction-Safe State Management
- src\dgt_engine\dgt_core\rendering\lod_manager.py: LOD (Level of Detail) Manager - Resolution-Adaptive UI Rendering
- src\dgt_engine\dgt_core\systems\day_cycle_manager.py: Day Cycle Manager - Persistent State Integration
- src\dgt_engine\dgt_core\ui\proportional_layout.py: Proportional Layout System - Resolution-Independent UI Positioning
- src\dgt_engine\dgt_core\ui\components\adaptive_turtle_card.py: Adaptive TurtleCard - Universal Component for Cross-Platform Display
- src\dgt_engine\dgt_core\ui\views\breeding_view.py: Breeding View - Universal Breeding Interface using SLS
- src\dgt_engine\dgt_core\ui\views\shop_view.py: Shop View - Universal Shop Interface using SLS
- src\dgt_engine\dgt_core\verification\zero_friction_loop.py: Zero-Friction Loop Verification - Cross-Platform Save System
- src\dgt_engine\di\container.py: Dependency Injection Container
- src\dgt_engine\di\exceptions.py: Dependency Injection Exception Hierarchy
- src\dgt_engine\engine\arbiter_engine.py: Arbiter Engine: Pure Logic and State Resolution
- src\dgt_engine\engine\chronicler.py: Chronicler - The Movie Subtitle Generator
- src\dgt_engine\engine\chronicler_engine.py: Chronicler Engine: Pure Narrative Generation
- src\dgt_engine\engine\chronos.py: Chronos Engine: Time-Based World Evolution
- src\dgt_engine\engine\d20_core.py: D20 Core: Deterministic D&D Rules Engine
- src\dgt_engine\engine\deterministic_arbiter.py: Deterministic Arbiter: Rule-based Logic Core (Iron Frame)
- src\dgt_engine\engine\engine.py: Synthetic Reality Engine: Cinematic Orchestrator
- src\dgt_engine\engine\game_loop.py: Main Game Loop: REPL for Semantic RPG
- src\dgt_engine\engine\game_state.py: Game State Machine
- src\dgt_engine\engine\semantic_engine.py: Semantic Intent Resolution Engine
- src\dgt_engine\engine\sync_engines.py: Sync wrappers for Arbiter and Chronicler engines.
- src\dgt_engine\exceptions\core.py: DGT Platform - Core Exception Hierarchy
- src\dgt_engine\foundation\base.py: DGT Platform - Abstract Base Classes
- src\dgt_engine\foundation\constants.py: DGT Platform - Foundation Constants
- src\dgt_engine\foundation\legacy_bridge.py: Legacy Bridge - Architecture Preservation Layer
- src\dgt_engine\foundation\protocols.py: Foundation Types - Extended Protocol Definitions
- src\dgt_engine\foundation\registry.py: DGT Foundation Registry - Centralized Asset & Entity Management
- src\dgt_engine\foundation\system_clock.py: System Clock - Foundation Tier Time Management
- src\dgt_engine\foundation\types.py: DGT Foundation Types - Tier 1 System Foundation
- src\dgt_engine\foundation\vector.py: Vector2 - Newtonian Physics Vector
- src\dgt_engine\foundation\genetics\crossover.py: Genetic Crossover Engine - DGT Tier 1 Foundation
- src\dgt_engine\foundation\genetics\genome_engine.py: TurboGenome Engine - Type-Safe 17-Trait Genetic System
- src\dgt_engine\foundation\genetics\schema.py: Genetic Schema Foundation - DGT Tier 1 Architecture
- src\dgt_engine\foundation\interfaces\entity_protocol.py: Entity Protocol - Interface Definitions for Space Entities
- src\dgt_engine\foundation\interfaces\protocols.py: DGT Platform - Protocol Definitions
- src\dgt_engine\foundation\interfaces\visuals.py: Visual Types â€” Foundation-Tier Shared Protocols
- src\dgt_engine\foundation\persistence\successor_registry.py: Successor Registry - Genetic Pipeline for AI Evolution
- src\dgt_engine\foundation\types\race.py: Race Type Definitions - DGT Tier 1 Foundation
- src\dgt_engine\foundation\types\result.py: Result Type Pattern - DGT Foundation
- src\dgt_engine\foundation\utils\asset_baker.py: DGT Asset Baker - Unified Binary Asset Pipeline
- src\dgt_engine\foundation\utils\asset_loader_stub.py: Asset Loader - Minimal Stub for Import Compatibility
- src\dgt_engine\foundation\utils\bake_embeddings.py: Semantic Baker: Pre-compute Intent Embeddings
- src\dgt_engine\foundation\utils\circuit_breaker.py: Circuit Breaker Pattern Implementation for DGT System
- src\dgt_engine\foundation\utils\config_manager.py: Configuration Management System for DGT System
- src\dgt_engine\foundation\utils\context_manager.py: Token Compactor: Context Minifier for LLM Optimization
- src\dgt_engine\foundation\utils\delta_save.py: Delta Save System for DGT Prefabs
- src\dgt_engine\foundation\utils\historian.py: Historian: Deep Time Simulator for Sedimentary World Generation
- src\dgt_engine\foundation\utils\logger.py: Logger Utility - Centralized Logging Configuration
- src\dgt_engine\foundation\utils\mmap_assets.py: Memory-Mapped Asset Loader: Instant Boot Architecture
- src\dgt_engine\foundation\utils\performance_monitor.py: Performance Metrics Collection for DGT System
- src\dgt_engine\foundation\utils\persistence.py: Persistence Manager - Delta-based State Persistence
- src\dgt_engine\foundation\utils\verify_world.py: Schema Validator: World Integrity Checker
- src\dgt_engine\game_engine\breeding_logic.py: Breeding Logic Extractor - Legacy Logic Preservation
- src\dgt_engine\game_engine\character_factory.py: Character Factory: Archetype Generation with Vector Tags
- src\dgt_engine\game_engine\combat_resolver.py: Combat Resolver - Tag-Based Auto-Combat System
- src\dgt_engine\game_engine\dd_engine.py: D&D Engine - The Mind Pillar (Command Pattern Implementation)
- src\dgt_engine\game_engine\location_factory.py: Location Factory: Procedural Scene Generation
- src\dgt_engine\game_engine\loot_system.py: Quartermaster: Procedural Loot Generation
- src\dgt_engine\game_engine\market_logic.py: Market Logic Extractor - Legacy Logic Preservation
- src\dgt_engine\game_engine\model_factory.py: Model Factory: Singleton for Large Language Model Management
- src\dgt_engine\game_engine\objective_factory.py: Objective Factory: Procedural Narrative Goals
- src\dgt_engine\game_engine\probe_models.py: No top-level docstring or obvious classes found.
- src\dgt_engine\game_engine\probe_ship_genetics.py: No top-level docstring or obvious classes found.
- src\dgt_engine\game_engine\quartermaster.py: Quartermaster: Deterministic Logic Engine
- src\dgt_engine\game_engine\roster_logic.py: Roster Logic Extractor - Legacy Logic Preservation
- src\dgt_engine\game_engine\scenarios.py: Emerald City Scenario
- src\dgt_engine\game_engine\ship_genetics.py: DGT Ship Genetics - ADR 129 Implementation
- src\dgt_engine\game_engine\survival_game.py: 60-Second Survival Game - Energy Drain & Extraction Protocol
- src\dgt_engine\game_engine\tri_brain.py: Tri-Brain Architecture - Specialized Neural Sub-Systems
- src\dgt_engine\game_engine\world_engine.py: World Engine - The World Pillar (Deterministic Chaos Foundation)
- src\dgt_engine\game_engine\world_factory.py: World Factory: Procedural World Generation with Historical Layers
- src\dgt_engine\game_engine\world_ledger.py: World Ledger: Persistent Spatial-Temporal Database
- src\dgt_engine\game_engine\world_map.py: World Map Engine: Schema-Driven Locations and Props
- src\dgt_engine\game_engine\actors\ai_controller.py: Voyager - The Mind
- src\dgt_engine\game_engine\actors\asteroid_pilot.py: AI Controller - AsteroidPilot Restoration
- src\dgt_engine\game_engine\actors\intent_engine.py: Intent Engine Module
- src\dgt_engine\game_engine\actors\navigator.py: Pathfinding Navigator Module
- src\dgt_engine\game_engine\actors\pawn_navigation.py: Voyager Navigation â€” The Body
- src\dgt_engine\game_engine\actors\shell.py: Voyager Shell Module
- src\dgt_engine\game_engine\body\kinetic_pawn.py: Kinetic Pawn - The Physical Body
- src\dgt_engine\game_engine\logic\knowledge_library.py: Knowledge Library - Shared Epigenetic Learning System
- src\dgt_engine\game_engine\logic\short_term_memory.py: Short-Term Memory - In-Session Plasticity for AI Pilot
- src\dgt_engine\game_engine\logic\technique_extractor.py: Technique Extractor - Behavioral Fingerprinting for Knowledge Storage
- src\dgt_engine\game_engine\neat\fitness.py: Fitness Calculator - Performance Evaluation for NEAT Evolution
- src\dgt_engine\game_engine\neat\neat_engine.py: NEAT Engine - Neural Network Evolution for AI Pilot
- src\dgt_engine\game_engine\world\glade_of_trials.py: Glade of Trials - ADR 106: The Jewel-Box Demo
- src\dgt_engine\graphics\character_sprites.py: Character Sprite System - ADR 106: Visual-Mechanical Convergence
- src\dgt_engine\graphics\environmental_polish.py: Environmental Polish System - ADR 106: Procedural Clutter
- src\dgt_engine\logic\animator.py: Kinetic Sprite Controller - Living Sprite Heartbeat
- src\dgt_engine\logic\artifacts.py: Artifact System: Item Lineage & Context-Aware Loot
- src\dgt_engine\logic\director.py: Autonomous Director - The "Dramatic Director" Controller
- src\dgt_engine\logic\entity_ai.py: Entity AI: Dynamic Non-Player Agency
- src\dgt_engine\logic\faction_system.py: Faction System: Active World Simulation
- src\dgt_engine\logic\legacy.py: Legacy System: Avatar-Legacy Protocol
- src\dgt_engine\logic\location_resolver.py: Location Resolver - Geographic Soul for the DGT World
- src\dgt_engine\logic\orientation.py: Player Orientation System
- src\dgt_engine\logic\pathfinding.py: Pathfinding System for Autonomous Navigation
- src\dgt_engine\logic\perception.py: Perception System: Information Density Filtering
- src\dgt_engine\logic\playbook.py: Playbook - The Script for Theater Architecture
- src\dgt_engine\logic\scenic_anchor.py: Scenic Anchor - Pre-Baked Narrative Scaffolding for DGT Perfect Simulator
- src\dgt_engine\mechanics\d20_system.py: D20 Mechanic System - ADR 106: Deterministic Gameplay
- src\dgt_engine\models\asset_loader.py: Specialized asset loader following Single Responsibility Principle.
- src\dgt_engine\models\asset_schemas.py: Pydantic v2 models for type-safe asset validation.
- src\dgt_engine\models\cache_manager.py: Cache management following Single Responsibility Principle.
- src\dgt_engine\models\container.py: Dependency Injection Container for loose coupling.
- src\dgt_engine\models\instantiation_factory.py: Instantiation factory following Single Responsibility Principle.
- src\dgt_engine\models\interfaces.py: Abstract interfaces for asset management and rendering.
- src\dgt_engine\models\metasprite.py: Metasprite System - Game Boy Hardware Parity
- src\dgt_engine\models\prefab_factory.py: Refactored PrefabFactory - SOLID Architecture
- src\dgt_engine\narrative\chronos.py: Chronos Engine - The Quest & Progression Pillar
- src\dgt_engine\narrative\narrative_bridge.py: Narrative Bridge - ADR 177: Loot-to-Lore Pipeline
- src\dgt_engine\narrative\narrative_engine.py: Narrative Engine: LLM-Driven Outcome Generation
- src\dgt_engine\narrative\narrator.py: Narrator: LLM Interface
- src\dgt_engine\narrative\persona.py: Persona Engine - The Social Soul Pillar
- src\dgt_engine\narrative\predictive_narrative.py: Narrative Pre-Caching System: Predictive Dialogue Generation
- src\dgt_engine\systems\base.py: Base Classes for DGT Platform Systems and Components
- src\dgt_engine\systems\protocols.py: Engine Protocols - Dependency Injection for Unidirectional Flow
- src\dgt_engine\systems\body\animation.py: Sprite Animation Engine - The "Beat" and "Flicker" System
- src\dgt_engine\systems\body\cockpit.py: Cockpit Body - Glass/Grid Modular Dashboard
- src\dgt_engine\systems\body\component_renderer.py: DGT Component Renderer - PPU Extension Framework
- src\dgt_engine\systems\body\dispatcher.py: Display Dispatcher - ADR 120: Tri-Modal Rendering Bridge
- src\dgt_engine\systems\body\graphics_engine.py: Graphics Engine - The Body Pillar (PPU Implementation)
- src\dgt_engine\systems\body\kinetics.py: Kinetic Service - The Physics of Motion
- src\dgt_engine\systems\body\legacy_adapter.py: Legacy Graphics Engine Adapter
- src\dgt_engine\systems\body\ppu_adapter.py: PPU Adapter â€” Environment-Aware Rendering Router
- src\dgt_engine\systems\body\ppu_input.py: DGT PPU Input Service - ADR 135 Implementation
- src\dgt_engine\systems\body\ppu_vector.py: DGT PPU Vector Engine - ADR 131 Implementation
- src\dgt_engine\systems\body\ship_compositor.py: DGT Ship Compositor - ADR 129 Implementation
- src\dgt_engine\systems\body\ship_renderer.py: DGT Ship Renderer - ADR 134 Implementation
- src\dgt_engine\systems\body\terminal.py: Terminal Body - Rich-based Console Display
- src\dgt_engine\systems\body\tri_modal_engine.py: Tri-Modal Engine - Unified Body Engine with Legacy Adapter
- src\dgt_engine\systems\body\unified_ppu.py: Unified PPU - Picture Processing Unit
- src\dgt_engine\systems\body\cinematics\movie_engine.py: Movie Engine - Core Cinematic System Logic
- src\dgt_engine\systems\body\components\game_state.py: GameState Component - Lives, Waves, and High Score Management
- src\dgt_engine\systems\body\components\genetic_component.py: GeneticComponent - Trait-Based Physics Modification
- src\dgt_engine\systems\body\components\kinetic_body.py: KineticBody Component - Newtonian Physics with Toroidal Wrapping
- src\dgt_engine\systems\body\components\shell_ship.py: Shell-Ship Component - Genetic Ship Selection with KineticBody Injection
- src\dgt_engine\systems\body\pipeline\asset_loader.py: Asset Loader - Foundation Tier Asset Management
- src\dgt_engine\systems\body\pipeline\building_registry.py: Building Registry - Manages connection to archived building assets
- src\dgt_engine\systems\body\pipeline\sprite_sheet_importer.py: Sprite Sheet Import Logic - Extracted from Legacy Tool
- src\dgt_engine\systems\body\systems\collision.py: Collision System - Interface-Agnostic Collision Detection
- src\dgt_engine\systems\body\systems\collision_shim.py: Collision System Backward Compatibility Shim (DEPRECATED)
- src\dgt_engine\systems\body\systems\entity_manager.py: Entity Manager - Component-Based Architecture
- src\dgt_engine\systems\body\systems\fracture_system.py: FractureSystem - Genetic Asteroid Splitting Logic with Cascading Cleanup
- src\dgt_engine\systems\body\systems\knowledge_library.py: Knowledge Library - Genetic Pattern Discovery and Tracking
- src\dgt_engine\systems\body\systems\projectile_system.py: ProjectileSystem - Bullet Pool Management with Rhythmic Cadence
- src\dgt_engine\systems\body\systems\race_runner.py: Race Runner System - Turbo-Scout Bridge
- src\dgt_engine\systems\body\systems\race_translator.py: Race Translator - Genetic Trait to Physics Mapping
- src\dgt_engine\systems\body\systems\spawner.py: Entity Spawner - Wave-Based Entity Generation
- src\dgt_engine\systems\body\systems\status_manager.py: Status Manager - Data-Driven Game State Management
- src\dgt_engine\systems\body\systems\sub_stepping_engine.py: Sub-Stepping Engine - 30Hz to 60Hz Compatibility Layer
- src\dgt_engine\systems\body\systems\terrain_engine.py: Terrain Engine - Strategic Racing Environment
- src\dgt_engine\systems\body\systems\wave_spawner.py: Wave Spawner - Arcade-Style Wave Management with Safe-Haven Respawning
- src\dgt_engine\systems\graphics\pixel_renderer.py: Pixel Renderer - Unicode Half-Block Implementation
- src\dgt_engine\systems\graphics\tile_bank.py: Tile Bank System - Game Boy Hardware Parity
- src\dgt_engine\systems\graphics\__compat__.py: Backward Compatibility Shim - Graphics Systems
- src\dgt_engine\systems\graphics\core\material_analyzer.py: Material Analyzer - Intelligent Asset Analysis
- src\dgt_engine\systems\graphics\fx\exhaust_system.py: DGT Exhaust System - ADR 130 Implementation
- src\dgt_engine\systems\graphics\fx\fx_system.py: FX System - Particle Engine
- src\dgt_engine\systems\graphics\fx\particle_effects.py: DGT Particle Effects System - ADR 132 Implementation
- src\dgt_engine\systems\kernel\batch_processor.py: Batch Update Logic - Thread-Safe Post-Battle Recording
- src\dgt_engine\systems\kernel\components.py: DGT Core Components - ADR 168
- src\dgt_engine\systems\kernel\config.py: System Configuration - Stateless Pillar Initialization
- src\dgt_engine\systems\kernel\constants.py: Core Constants - System Configuration and Magic Numbers
- src\dgt_engine\systems\kernel\controller.py: Controller Base Class - Three-Tier Architecture
- src\dgt_engine\systems\kernel\fleet_roles.py: Contains classes: FleetRole, RoleModifier
- src\dgt_engine\systems\kernel\gatekeeper.py: DGT Platform Version Gatekeeper
- src\dgt_engine\systems\kernel\models.py: DGT Core Models - Pydantic Data Contracts for Assets and Entities
- src\dgt_engine\systems\kernel\persistence.py: Legendary Registry - Fleet Performance Persistence
- src\dgt_engine\systems\kernel\post_battle_reporter.py: Post-Battle Reporter - MVP Identification & Performance Analysis
- src\dgt_engine\systems\kernel\spawner.py: Spawner - Entity Lifecycle Management
- src\dgt_engine\systems\kernel\universal_registry.py: Universal Registry - Cross-Engine Performance Tracking
- src\dgt_engine\systems\kernel\viewport_manager.py: Viewport Manager - Context-Aware Scaling and Layout Management
- src\dgt_engine\systems\kernel\world_state.py: World State - Sovereign Boundary Management
- src\dgt_engine\systems\kernel\state\constants.py: No top-level docstring or obvious classes found.
- src\dgt_engine\systems\kernel\state\effects.py: Contains classes: Effect, Trigger, SubtitleEvent
- src\dgt_engine\systems\kernel\state\enums.py: Contains classes: SurfaceState, TileType, BiomeType
- src\dgt_engine\systems\kernel\state\exceptions.py: Contains classes: SystemError, WorldGenerationError, ValidationError
- src\dgt_engine\systems\kernel\state\intents.py: Contains classes: MovementIntent, InteractionIntent, CombatIntent
- src\dgt_engine\systems\kernel\state\models.py: Contains classes: Tile, TileData, InterestPoint
- src\dgt_engine\systems\kernel\state\validation.py: Contains functions: validate_position, validate_tile_type, validate_intent
- src\dgt_engine\systems\mind\dd_engine.py: D&D Engine - The Mind Pillar
- src\dgt_engine\systems\models\asset_schemas.py: Asset Schemas â€” Engine-Tier Data Models
- src\dgt_engine\systems\race\physics_engine.py: Deterministic Race Physics Engine - DGT Tier 2 Architecture
- src\dgt_engine\systems\race\race_arbiter.py: Race Arbiter - DGT Tier 2 Architecture
- src\dgt_engine\systems\race\terrain_system.py: Terrain Interaction System - DGT Tier 2 Architecture
- src\dgt_engine\systems\view\render_panel.py: Render Panel - Sovereign Viewport with Integer Scaling
- src\dgt_engine\tools\asset_exporter.py: Asset Exporter - SOLID asset export component
- src\dgt_engine\tools\asset_ingestor_intelligent.py: Asset Ingestor with Intelligent Preview - ADR 098: WYSIWYG Pipeline
- src\dgt_engine\tools\asset_models.py: Asset Models â€” Backward-Compatibility Shim
- src\dgt_engine\tools\cartographer.py: Cartographer - Visual World Editor for DGT System
- src\dgt_engine\tools\design_lab.py: DGT Design Lab - Asset Design & Pre-Bake Tool
- src\dgt_engine\tools\developer_console.py: Developer Console - Live Pillar Manipulation
- src\dgt_engine\tools\dithering_engine.py: Dithering Engine - Game Boy Parity Textures
- src\dgt_engine\tools\dna_exporter.py: DNA Exporter - ADR 094: The Automated Harvesting Protocol
- src\dgt_engine\tools\error_handling.py: Error Handling - Comprehensive error boundaries and recovery patterns
- src\dgt_engine\tools\image_processor.py: Image Processor - SOLID image processing component
- src\dgt_engine\tools\optimized_image_processor.py: Optimized Image Processor - High-performance numpy vectorization
- src\dgt_engine\tools\palette_extractor.py: Palette Extractor - ADR 094: Automated Harvesting Protocol
- src\dgt_engine\tools\python_version_manager.py: Python Version Manager - Enforces Python 3.12 for DGT Platform
- src\dgt_engine\tools\studio_launcher.py: DGT Studio Suite Launcher
- src\dgt_engine\tools\weaver.py: Weaver - Rich Narrative Dashboard for DGT System
- src\dgt_engine\ui\character_renderer.py: Character Renderer - SOLID Refactor
- src\dgt_engine\ui\cinematic_camera.py: Cinematic Camera System
- src\dgt_engine\ui\cinematic_pauses.py: Cinematic Pauses System
- src\dgt_engine\ui\dashboard.py: Unified Tactical-Narrative Dashboard
- src\dgt_engine\ui\director_hud.py: Director HUD - Play/Pause/FF Controls
- src\dgt_engine\ui\font_manager.py: Font Manager - Sovereign Scout Font System
- src\dgt_engine\ui\iso_renderer.py: Isometric 2.5D Renderer
- src\dgt_engine\ui\layout_manager.py: Layout Manager: Director's Monitor UI
- src\dgt_engine\ui\narrative_scroll.py: Narrative Scroll HUD System - ADR 106: Storytelling Interface
- src\dgt_engine\ui\palette_manager.py: Palette System - Color Mood Management
- src\dgt_engine\ui\phosphor_terminal.py: Phosphor Terminal - ADR 187: CRT-Style Display for Sovereign Scout
- src\dgt_engine\ui\pixel_renderer.py: Pixel Renderer - Shim
- src\dgt_engine\ui\pixel_viewport.py: Pixel Viewport - Integration with Fixed-Grid Architecture
- src\dgt_engine\ui\raycasting_engine.py: Raycasting Engine - SOLID Refactor
- src\dgt_engine\ui\raycasting_profiler.py: Performance Profiling for Raycasting System
- src\dgt_engine\ui\raycasting_types.py: Raycasting Types - Shared Data Structures
- src\dgt_engine\ui\renderer_3d.py: ASCII Doom Renderer
- src\dgt_engine\ui\shape_avatar.py: Shape Language Avatar System
- src\dgt_engine\ui\sprite_billboard.py: Sprite Billboarding System
- src\dgt_engine\ui\sprite_factory.py: Sprite Factory - Multi-Layered Sprite Assembler
- src\dgt_engine\ui\sprite_registry.py: Sprite Registry - Pixel Art Character System
- src\dgt_engine\ui\static_canvas.py: Static Canvas Protocol
- src\dgt_engine\ui\tile_bank.py: Tile Bank - Shim
- src\dgt_engine\ui\virtual_ppu.py: Virtual PPU - Game Boy Hardware Parity
- src\dgt_engine\ui\adapters\gameboy_parity.py: Game Boy Parity Tkinter Adapter: Authentic 8-Bit Rendering
- src\dgt_engine\ui\adapters\tk_adapter.py: Tkinter Adapter: Windowed Framework Testing
- src\dgt_engine\ui\adapters\tk_metasprite.py: Enhanced Tkinter Adapter: Metasprite Integration
- src\dgt_engine\ui\adapters\tk_test.py: Simplified Tkinter Test: Direct Window Verification
- src\dgt_engine\ui\components\dashboard_ui.py: Dashboard UI Component Registry
- src\dgt_engine\ui\components\goals.py: Goals Component - Objective Tracking Panel
- src\dgt_engine\ui\components\inventory.py: Inventory Component - Item Management Panel
- src\dgt_engine\ui\components\viewport.py: Viewport Component - World View Panel
- src\dgt_engine\ui\components\vitals.py: Vitals Component - Real-time Character Sheet Panel
- src\dgt_engine\ui\render_passes\ansi_vitals.py: ANSI Vitals Pass - Progress Bar Rendering
- src\dgt_engine\ui\render_passes\braille_radar.py: Braille Radar - Sub-Pixel Mapping System
- src\dgt_engine\ui\render_passes\geometric_profile.py: Geometric Profile Pass - ASCII Line-Art Rendering
- src\dgt_engine\ui\render_passes\pixel_viewport.py: Pixel Viewport Pass - Game Boy Hardware Parity
- src\dgt_engine\vector_libraries\trait_library.py: Trait Library: Vectorized NPC/Location DNA
- src\dgt_engine\views\gui_view.py: GUI View - Observer of SimulatorHost
- src\dgt_engine\views\terminal_view.py: Terminal View - Observer of SimulatorHost
- src\game_engine\bootstrap.py: Bootstrap script for rpgCore Game Engine.
- src\game_engine\core\clock.py: SystemClock - Precise Timing for Game Engine
- src\game_engine\core\types.py: Core Type Definitions
- src\game_engine\engines\base_engine.py: Base Engine Class
- src\game_engine\engines\chronos.py: Chronos Engine: Time-Based World Evolution
- src\game_engine\engines\d20_core.py: D20 Core Engine: Deterministic D&D Rules
- src\game_engine\engines\godot_bridge.py: GodotBridge - Generic IPC Bridge for C# Godot Rendering.
- src\game_engine\engines\narrative_engine.py: Narrative Engine: LLM-Driven Narration
- src\game_engine\engines\pygame_bridge.py: PyGame Bridge - Adapts PyGame for AsteroidsNEATGame.
- src\game_engine\engines\semantic_engine.py: Semantic Engine: Intent Recognition and Parsing
- src\game_engine\engines\synthetic_reality.py: Synthetic Reality Engine: Cinematic Orchestrator
- src\game_engine\engines\terminal_bridge.py: Terminal Bridge - Adapts PixelRenderer for AsteroidsNEATGame.
- src\game_engine\foundation\asset_cache.py: Contains classes: AssetCache
- src\game_engine\foundation\asset_loaders.py: Contains classes: AbstractAssetLoader, SpriteAssetLoader, ConfigAssetLoader
- src\game_engine\foundation\base_system.py: Base System and Component Classes
- src\game_engine\foundation\config_manager.py: Contains classes: ConfigManager
- src\game_engine\foundation\config_schemas.py: Contains classes: PhysicsConfig, GraphicsConfig, EntityConfig
- src\game_engine\foundation\protocols.py: Foundation Protocols and Type Definitions
- src\game_engine\foundation\registry.py: System and Component Registry
- src\game_engine\foundation\result.py: Result Type - Structured Return Values
- src\game_engine\foundation\asset_system\asset_cache.py: Asset Cache - LRU caching layer for asset management.
- src\game_engine\foundation\asset_system\asset_loaders.py: Asset Loaders - Pluggable asset loading strategies.
- src\game_engine\foundation\asset_system\asset_registry.py: AssetRegistry - Centralized asset management and discovery.
- src\game_engine\foundation\asset_system\entity_templates.py: Entity Templates - Configuration-based entity prefab system.
- src\game_engine\foundation\config_system\config_manager.py: ConfigManager - Centralized configuration management with validation.
- src\game_engine\foundation\config_system\config_schemas.py: Configuration validation schemas using Pydantic.
- src\game_engine\godot\asteroids_clone_sdk.py: Asteroids Clone SDK - Python IPC Bridge for C# Godot Rendering.
- src\game_engine\godot\asteroids_game.py: Asteroids Game - Main game loop orchestrator for POC.
- src\game_engine\godot\asteroids_neat_game.py: Asteroids NEAT Game - Integration bridge between NEAT engine and game loop.
- src\game_engine\godot\input_handler.py: Input Handler - Processes input commands from Godot renderer.
- src\game_engine\systems\body\collision_system.py: Collision System - Interface-Agnostic Collision Detection
- src\game_engine\systems\body\entity_factories.py: Entity Factories - Convenience factory functions for creating entity templates.
- src\game_engine\systems\body\entity_manager.py: Entity Manager - Component-Based ECS Architecture
- src\game_engine\systems\body\entity_template.py: Contains classes: EntityTemplate, EntityTemplateRegistry
- src\game_engine\systems\body\fracture_system.py: Fracture System - Object Destruction with Debris Generation
- src\game_engine\systems\body\projectile_system.py: Projectile System - Lifecycle Management for Fast-Moving Objects
- src\game_engine\systems\body\status_manager.py: Status Manager - Effect and Buff/Debuff Tracking
- src\game_engine\systems\body\wave_spawner.py: Wave Spawner - Arcade-Style Wave Management with Safe-Haven Respawning
- src\game_engine\systems\graphics\godot_render_system.py: Contains classes: GodotRenderSystem
- src\game_engine\systems\graphics\pixel_renderer.py: Pixel Renderer - Unicode Half-Block Rendering System
- src\game_engine\systems\graphics\tile_bank.py: Tile Bank - Game Boy-Style Tile Pattern Management
- src\game_engine\systems\graphics\fx\exhaust_system.py: Exhaust System - Entity Movement Trails
- src\game_engine\systems\graphics\fx\fx_system.py: FX System - Particle Effects and Emission Management
- src\game_engine\systems\graphics\fx\particle_effects.py: Particle Effects - Pre-configured Effect Templates
- tools\deploy.py: Deployment automation script for DGT Platform - Wave 3 Production Hardening
- tools\production_validation.py: Three-Tier Production Validation Suite - Wave 3 Hardening
- scripts\benchmark_performance.py: Performance Benchmarking Suite: DGT Optimization Validation
- scripts\benchmark_solid_architecture.py: Performance benchmark for SOLID architecture refactoring.
- scripts\benchmark_turn_around.py: Turn-Around Latency Benchmark: Trajectory Drift Performance Testing
- scripts\cross_load_test.py: Cross-Load Test - Universal Registry Engine Swap Validation
- scripts\debug_eval.py: Contains functions: test_evaluation
- scripts\debug_imports.py: Debug Import Issues
- scripts\dgt_optimization.py: DGT Optimization Integration Script
- scripts\final_sanity_check.py: Final Sanity Check: Perfect Simulator Validation
- scripts\hardware_stress_test.py: Hardware Stress Test - Official Permadeath System Validation
- scripts\launch_asteroids_slice.py: Asteroids Slice Launcher - Sovereign Flight Protocol
- scripts\launch_miyoo.py: Miyoo Mini Launch Script - ADR 178: Embedded Deployment
- scripts\launch_rpg.py: Launch RPG Engine - D20 Turn-Based Combat Simulation
- scripts\launch_sovereign_scout.py: Tri-Modal Engine Demo - ADR 120 Production Verification
- scripts\launch_space.py: Launch Space Engine - Newtonian Vector Physics Simulation
- scripts\run_tests.py: Run Tests - Comprehensive Test Suite for DGT Platform
- scripts\setup_python_312.py: Setup Python 3.12 Environment for DGT Platform
- scripts\sweeper.py: DGT Platform â€” Sweeper: Import-Linkage Mapper & Dead Code Detector
- scripts\tier_enforcement_check.py: Tier Enforcement Check for DGT Platform Architecture
- scripts\universal_launcher.py: DGT Universal Launcher - CLI Entry Point for the Architectural Singularity
- scripts\validate_deterministic.py: D20 Core Deterministic Validation Suite
- scripts\validate_rust_build.py: Production validation script for Rust-Powered Sprite Scanner
- scripts\validate_sovereign_constraints.py: Sovereign Constraints Validation Suite
- scripts\validate_tri_modal.py: Production validation script for Tri-Modal Display Suite
- scripts\verify_kinetics.py: Verify Kinetic Core - Physics Service Verification
- scripts\verify_sprint2.py: Contains functions: verify_sweeper, verify_imports
- scripts\demos\demo_5v5_skirmish.py: Contains classes: SkirmishSimulator
- scripts\demos\demo_automated_space_battle.py: DGT Automated Space Battle Demo - ADR 130 Implementation
- scripts\demos\demo_composite_sprites.py: Composite Sprite System Demo - High-Fidelity Silhouette Assembly
- scripts\demos\demo_final_loot_test.py: Final Loot Test - ADR 188 Master Handover Verification
- scripts\demos\demo_fleet_skirmish.py: DGT Fleet Skirmish Demo - ADR 132 Implementation
- scripts\demos\demo_game_boy_parity.py: Game Boy Parity System Demo - Authentic Hardware Rendering
- scripts\demos\demo_multi_pass_rendering.py: Multi-Pass Rendering System Demo - Poly-Graphical Architecture
- scripts\demos\demo_neuro_evolution.py: DGT Neuro Evolution Demo - ADR 133 Implementation
- scripts\demos\demo_phosphor_terminal.py: Phosphor Terminal Demo - ADR 187 CRT-Style Display Verification
- scripts\demos\demo_pixel_art.py: Pixel Art Demo - Showcasing the Unicode Half-Block Rendering System
- scripts\demos\demo_pure_tkinter_ppu.py: Pure Tkinter PPU Demo - Showcasing Native Raster Pipeline
- scripts\demos\demo_refactored_tri_modal.py: Refactored Tri-Modal Demo - Showcasing Integrated Architecture
- scripts\demos\demo_sector_refactor.py: DGT Sector Refactor Demo - ADR 168
- scripts\demos\demo_semantic_resolver.py: Quick Demo: Test Semantic Resolver Independently
- scripts\demos\demo_space_battle_standalone.py: DGT Automated Space Battle Demo - Standalone Version
- scripts\demos\demo_theater_architecture.py: Grand Premiere: Theater Architecture Demo
- scripts\demos\demo_tri_modal_dispatcher.py: Tri-Modal Dispatcher Demo
- scripts\demos\demo_tri_modal_verification.py: Tri-Modal Engine Demo - ADR 120 Production Verification
- scripts\final\final_verification.py: Final Verification - Energy-to-Font Transition Test
- scripts\final\locker_verification.py: Locker Verification - Story Parsing Test
- scripts\final\neural_sync_success.py: Neural Sync Success - Final Caretaker Message
- scripts\setup\import_fonts.py: Error parsing file.
- scripts\setup\import_fonts_fixed.py: Font Import Script - Public Pixel Font Integration
- scripts\setup\setup_font_system.py: Font System Setup - Public Pixel Font Integration
- tests\conftest.py: No top-level docstring or obvious classes found.
- tests\integration\asset_config_entity_test.py: Contains classes: OrcEntity
- tests\integration\godot_bridge_test.py: Contains classes: MockEntity
- tests\unit\configuration_test.py: Contains functions: test_physics_config_defaults, test_physics_config_validation, test_game_config_version
- tests\unit\foundation_assets_test.py: Contains functions: registry, test_registry_singleton, test_register_and_get_asset
- legacy_logic_extraction\breeding_logic.py: Error parsing file.
- legacy_logic_extraction\roster_logic.py: Error parsing file.
- legacy_logic_extraction\shop_logic.py: Error parsing file.

## 3. System Inventory (Reusable Systems)
- **Game loops & Architecture**: dgt_engine/main.py, dgt_engine/engine/game_loop.py, game_engine/engines/ (Pygame/Godot/Terminal bridges).
- **Rendering Methods**: Adaptive Renderer (iewport/), PPU Adapter (systems/body/), Pixel Renderer, Iso Renderer, Godot Render System.
- **Input Handlers**: space/input_handler.py, Terminal/Godot IPC bridge inputs, GUI event handling in dapters/.
- **Entity Systems**: Component-Based Architecture in game_engine/systems/body/entity_manager.py, Space Entities (entities/space_entity.py), spawner.py.
- **Physics**: Newtonian Physics (space/space_physics.py, ody/kinetic_pawn.py), Collision Systems (collision.py, collision_system.py).
- **UI Components**: dgt_engine/ui/components/ (Dashboards, Vitals, Inventory, Viewport), dgt_engine/dgt_core/ui/ (Adaptive interfaces), Proportional Layouts.
- **Assets & Genetics**: sset_loader.py, genome_engine.py, schema.py, sset_registry.py.

## 4. Slime Clan Summary
The 	erritorial_grid.py file provides a self-contained, grid-based turn strategy prototype. It serves as a reusable 2D territorial control system offering:
- A discrete grid data structure (TileState enum representing Neutral, Blue, Red, Blocked).
- PyGame-based interactive visual rendering loop (_draw_grid, _draw_sidebar).
- An autonomous AI opponent featuring deterministic, weighted decision-making based on adjacency and risk (_ai_turn).
- A pure-function deterministic battle resolution mechanic (esolve_battle_weighted).
- A context-aware HUD generation pure function (get_hover_tooltip).
It is isolated and operates purely on primitive PyGame draw calls without external assets.

## 5. Gaps for an Overworld Screen
To build an Overworld screen to transition between battles, the following systems are currently missing or need adaptation:
- **Overworld Node Graph/Map State**: A system to represent the macro-map nodes (levels/territories), connection paths, and their locked/unlocked state.
- **Persistent Context Transition**: A lightweight state manager bridging the Overworld (Session 012) and the TerritorialGrid (Session 009+) to pass player stats/unlocks and return battle results.
- **Overworld UI Manager**: While there are tactical dashboards, a dedicated UI wrapper for macro-level node selection and progression tracking is needed.
- **Player Overworld Avatar**: A simple entity representation identifying the players current location on the macro map.

