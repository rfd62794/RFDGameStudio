# Asset Inventory Audit

This document provides a holistic view of all assets, asset-related data files, and legacy sprite generation tooling across the `rpgCore` repository, mapping the current state and recommending a unified structure for the future.

## Section 1: Existing Assets Table

| Path | Type | Size/Details | Demo | Reusable? |
| :--- | :--- | :--- | :--- | :--- |
| `assets/configs/game.yaml` | Config | Core game settings | All | Yes |
| `assets/configs/graphics.yaml` | Config | Core graphics settings | All | Yes |
| `assets/configs/physics.yaml` | Config | Core physics settings | All | Yes |
| `assets/entities/space_entities.yaml`| Data | Asteroids data definitions | Asteroids | No |
| `assets/fonts/public_pixel/ttf/PublicPixel.ttf`| Font | Base TTF Font | All | Yes |
| `assets/fonts/public_pixel/atlas/*.json` | Atlas Data | Amber, Green, Red, Normal UI JSONs | All | Yes |
| `assets/fonts/public_pixel/png/*.png` | Atlas Image | Amber, Green, Red, Normal UI PNGs | All | Yes |
| `src/apps/last_appointment/data/appointment.json` | Data | Dialogue and narrative beats | Last Appt | No |

## Section 2: Salvageable Tooling

Several legacy tools were discovered in `archive/`. These represent previous, now-dormant efforts to build asset pipelines:

- **`archive/legacy_refactor_2026/sprite_sheet_importer.py`**
  - **Intent**: Likely designed to read standard sprite sheets and dynamically slice them into Pygame-consumable sub-surfaces based on grid logic.
  - **State**: Dormant in the archive alongside `sample_spritesheet.png` and `test_spritesheet.png`.
  - **Resurrection**: Could be adapted to output standardized metadata files compatible with `src/shared/rendering/sprite_loader.py`.

- **`archive/legacy_refactor_2026/rust_sprite_scanner.py`**
  - **Intent**: High-performance pixel scanning/cutting layer leveraging Rust bindings (associated with compiled `.rlib` dependencies in `archive/`).
  - **State**: Test-bypassed and archived. The Rust extension environment is not fully compiled into the current Windows Python pipeline.
  - **Resurrection**: Would require establishing cross-platform rust compilation in CI (`uv run maturin` etc.), but could massively speed up large texture atlas generation.

- **`archive/superseded_v1/asset_ingestor_variants/asset_ingestor.py`**
  - **Intent**: An automated ingest pipeline designed to standardize loose assets into a `.dgt` or structured directory format.
  - **State**: Kept for reference but superseded by hand-rolled configurations.
  - **Resurrection**: Useful if we want an automated CLI tool to ingest raw `.png` or `.wav` files and copy them to `assets/shared/...` with valid metadata stubs.

## Section 3: Asset Gaps

Currently, the engine provides extreme structural flexibility but lacks basic media for polished demos:

1. **Audio**: No `.wav` or `.ogg` files exist. UI bumps, generic confirm/cancel sounds, and basic background atmospheres are completely absent.
2. **Sprites**: Aside from dead test sheets in the archive, there are no active sprite textures. Both Slime Clan and Asteroids depend heavily on Pygame's primitive geometric rendering.
3. **Color Palettes**: While `PublicPixel` supports tinted atlases, a highly-structured engine-wide color palette (e.g., Catppuccin, Nord, or a custom internal palette) is not codified in any data file.

## Section 4: Recommended Structure

To strictly enforce the Constitution's separation of shared systems from demo logic, the `assets/` directory should be refactored as follows:

```text
assets/
├── shared/
│   ├── configs/       (Move existing basic physics/graphics.yaml here)
│   ├── fonts/         (Move existing PublicPixel here)
│   ├── sounds/        (Gap: Add universal UI clicks here)
│   ├── sprites/       (Gap: Add universal UI cursors, button panels here)
│   └── themes/        (Gap: Add shared color definition files here)
└── demos/
    ├── slime_clan/
    ├── last_appointment/ (Move src/apps/last_appointment/data/appointment.json here)
    ├── turbo_shells/
    └── asteroids/        (Move assets/entities/space_entities.yaml here)
```

**Moves Required to conform to this structure:**
1. Move all `assets/fonts/*` -> `assets/shared/fonts/*`
2. Move all `assets/configs/*` -> `assets/shared/configs/*`
3. Move `src/apps/last_appointment/data/appointment.json` -> `assets/demos/last_appointment/appointment.json`
4. Move `assets/entities/space_entities.yaml` -> `assets/demos/asteroids/space_entities.yaml`

## Section 5: Particle and VFX Systems

An audit of `src/` and `archive/` reveals several dormant or fragmented visual effects systems, mostly tied to the legacy `dgt_engine` and `game_engine` donor archives.

### 1. Active Donor Logic (`src/`)
- **`src/game_engine/systems/graphics/fx/particle_effects.py`**: Foundation for particle pools and basic behaviors (fade, drift).
- **`src/dgt_engine/systems/graphics/fx/exhaust_system.py`**: A specialized particle system for engine trails, wired to ship kinetics.
- **`src/dgt_engine/systems/graphics/fx/fx_system.py`**: An orchestrator that manages multiple effect emitters.

### 2. Archived Legacy (`archive/`)
- **`archive/legacy_root_2026/scripts/test_phase_d_step6_particle_effects.py`**: High-coverage test suite for the legacy particle system.
- **`archive/legacy_refactor_2026/assets/animations.yaml`**: Configuration file defining animation sequences and frame timings.

### 3. Recommendations
- **Extraction Needed**: Harvest `ParticleEmitter` and `ExhaustSystem` from `src/dgt_engine/` into a new `src/shared/rendering/fx/` pillar.
- **Generalization**: The existing systems are heavily tied to "ships". They should be generalized to support generic "impact", "explosion", and "ui spark" effects for other demos.
