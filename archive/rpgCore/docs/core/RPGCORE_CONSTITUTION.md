# rpgCore — Dugger's Green Box

## 4 Walls, 4 Pillars
- **`src/shared/`** — The Engine (systems every demo consumes)
- **`src/apps/`** — The Demos (four distinct games, one voice)
- **`src/launcher/`** — The Entry (manifest-driven front door)
- **`src/tools/`** — The Toolchain (developer utilities that build the engine)

## What rpgCore Is
rpgCore is a shared game engine and collection of demos built by one developer across multiple creative directions. It is not a single game. It is a platform that supports multiple games sharing a common technical and creative foundation.

## The Four Laws
1. `src/shared/` is the engine. If a system is useful to more than one demo it lives in shared. It does not live in the demo.
2. Demos live in `src/apps/`. Each demo is self-contained above the shared layer. Demos consume shared systems. They do not reimplement them.
3. Nothing gets built twice. If it exists in shared you use it. If it doesn't exist in shared and two demos need it, you extract it into shared before building it again.
4. `src/tools/` serve the developer, never the player.
5. No code before the plan. Present significant architectural decisions as options (Headlong / Divert / Alt), confirm with Overseer, THEN implement.

## The Fourth Pillar — src/tools/
- Tools are developer-facing. They are not consumed at runtime by players.
- Tools help build, inspect, validate, and generate assets and systems.
- Each tool is a self-contained module under `src/tools/<tool_name>/`.
- Tools may consume `src/shared/` systems but never `src/apps/` logic.
- Known tools in development: `sprite_sheet_importer`, `asset_ingestor`, `apj` (Automated Project Journal)
- Tools are invoked directly: `python -m src.tools.sprite_sheet_importer`

## Asset Directory Contract
Demo-specific assets live under `assets/demos/<id>/`. Shared assets live under `assets/shared/`. Nothing else is valid.
```text
assets/
├── shared/
│   ├── configs/
│   ├── fonts/
│   ├── sounds/
│   ├── sprites/
│   └── themes/
└── demos/
    ├── slime_clan/
    ├── last_appointment/
    ├── turbo_shells/
    └── asteroids/
```

## The Engine Layer Decision
`src/shared/` is the canonical engine layer. It was built deliberately, extracted cleanly, and proven by a working demo.

`src/dgt_engine/` and `src/game_engine/` are donor archives. They contain valuable components that have not yet been harvested. They are not active engine layers. No new code should be added to either. Components worth keeping get extracted into `src/shared/` properly then the source is archived.

## The Shared Layer Structure
```text
src/shared/
ui/              # Universal components: Panel, Label, TextWindow, Button, ProgressBar
combat/          # D20Resolver, damage resolution, status effects*
engine/          # BaseSystem, SystemClock, SceneManager*
entities/        # Entity base, EntityManager*
world/           # FactionManager, ColonyManager*
narrative/       # ConversationGraph, StateTracker, KeywordRegistry (planned)*
rendering/       # RenderAdapter contract, pygame bridge*
genetics/        # GeneticInheritance, TraitSystem (planned)*
persistence/     # SaveLoad, SQLite adapter (planned)*
```

## The Demos
Each demo proves a different expression of the shared engine:
- Slime Clan — strategy/tactics. Civ meets FFT meets DQM. The deep game.
- TurboShells — management/breeding. Genetic inheritance, racing, nurture loop.
- Last Appointment — dialogue/narrative. Conversation graph, stance system, single scene.
- Asteroids Roguelike — action/progression. Run-based, procedural, reflex plus strategy.

These four demos share entity management, relationship tracking, scene management, resource economy, and universal UI components. Their genres differ. Their foundation does not.

## What Gets Archived
- Fragmented docs: `PHASE_.md`, `README_.md shards`, `INVENTORY.md`
- Features not serving an active demo or shared vision.

## The Active Docs
These documents are canonical and maintained:
- `RPGCORE_CONSTITUTION.md` — this document
- `SESSION_PROTOCOL.md` — how to start a new agent session
- `ASSET_INVENTORY.md` — maps the known media/tools state
- `TEST_HEALTH_REPORT.md` — tracks test floors
- `DEMOS.md` — design pillars for the four games

## Known Tech Debt
See `docs/TECH_DEBT.md` for the full list. Structural priorities:
- Pydantic V1 validators in `src/dgt_engine/` and `src/game_engine/` — will break on Pydantic V3.
- `src/dgt_engine/` and `src/game_engine/` are donor archives pending full harvest and archival.

## The Platform Vision
rpgCore is one developer's Orange Box. Four games, one engine, one creative voice. Different genres, different tones, different audiences. The shared foundation makes each game stronger by what the others built.

The engine does not belong to any one demo. The demos are expressions of the engine.

## Scope Boundary
If a feature does not serve at least one active demo it does not get built. If a system cannot be shared across at least two demos it lives in the demo not the engine. If a document does not help a future agent session or a future design decision it gets archived.
