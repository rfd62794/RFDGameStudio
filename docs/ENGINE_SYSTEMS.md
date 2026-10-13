# Engine shared systems: who consumes what

One table, one row per entry directly inside `ts/src/engine/shared/` (`index.ts`, `.d.ts` files and `__tests__` folders excluded). Facts measured 2026-10-12 by grepping `engine/shared` imports under `ts/src/games/` and `examples/`; `ts/tests/test_engine_systems_doc.ts` keeps this table honest.

| System | Entry point | Consumers | Test | Seeded |
|---|---|---|---|---|
| `aiBehavior` | `ts/src/engine/shared/aiBehavior/index.ts` | shoal | `ts/tests/test_engine_aiBehavior.ts` | n/a |
| `anatomy` | `ts/src/engine/shared/anatomy/index.ts` | gladiator_arena, mutant_battle_ball | `ts/tests/test_engine_anatomy_contract.ts` | no |
| `combat` | `ts/src/engine/shared/combat/index.ts` | planetofgreed | `ts/tests/test_shared_combat.ts` | n/a |
| `components` | `ts/src/engine/shared/components/index.ts` | planetofgreed | none yet | n/a |
| `firestoreBackend` | `ts/src/engine/shared/firestoreBackend/paths.ts` | none yet | `ts/tests/test_firestore_backend_extraction.ts` | n/a |
| `personGenerator` | `ts/src/engine/shared/personGenerator/index.ts` | role_symbol_viewer, succession | `ts/tests/test_engine_personGenerator.ts` | yes |
| `portalAdapter` | `ts/src/engine/shared/portalAdapter/index.ts` | shoal | `ts/tests/test_engine_portalAdapter.ts` | n/a |
| `sfx` | `ts/src/engine/shared/sfx/index.ts` | chimera_wilds, choke_point, dissonance, mutant_battle_ball, planetofgreed, scrapcrawl, slither_rogue, slimeworld, succession, voiddrift_redux, wire_rust | `ts/tests/test_sfx.ts` | no |
| `sportsSim` | `ts/src/engine/shared/sportsSim/index.ts` | mutant_battle_ball | `ts/tests/test_sports_sim_engine_port.ts` | no |
| `voiceRecognition` | `ts/src/engine/shared/voiceRecognition/speechEngine.ts` | none yet | `ts/tests/test_voice_recognition_extraction.ts` | n/a |
| `componentTypes.ts` | `ts/src/engine/shared/componentTypes.ts` | planetofgreed | `ts/tests/test_shared_component_types.ts` | n/a |
| `math.ts` | `ts/src/engine/shared/math.ts` | mutant_battle_ball, shoal | `ts/tests/test_shared_math.ts` | yes |
| `partSlots.ts` | `ts/src/engine/shared/partSlots.ts` | chimera_wilds, mutant_battle_ball | `ts/tests/test_shared_part_slots.ts` | n/a |
| `persistence.ts` | `ts/src/engine/shared/persistence.ts` | chimera_wilds, coin_pusher_arcade, dissonance, early_learning_buddy, gladiator_arena, grainworks, horse_racing, mutant_battle_ball, planetofgreed, scrapcrawl, shoal, slime_coin, slimeworld, slither_rogue, succession, voiddrift_redux | `ts/tests/test_shared_persistence.ts` | n/a |
| `saveMigrations.ts` | `ts/src/engine/shared/saveMigrations.ts` | none yet | `ts/tests/test_save_namespace.ts` | n/a |
| `saveNamespace.ts` | `ts/src/engine/shared/saveNamespace.ts` | none yet | `ts/tests/test_save_namespace.ts` | n/a |
| `seededRandom.ts` | `ts/src/engine/shared/seededRandom.ts` | chimera_wilds, planetofgreed, slimeworld, wire_rust | `ts/tests/test_shared_mulberry32.ts` | yes |
| `wheelRelation.ts` | `ts/src/engine/shared/wheelRelation.ts` | brewfield | `ts/tests/test_shared_wheel_relation.ts` | n/a |

## How to read this table

`System` is the folder or file name as it sits in `ts/src/engine/shared/`; `Entry point` is the file a consumer imports. `Consumers` lists the demo folders under `ts/src/games/` (or `examples/`) that import the system — `none yet` is an honest gap, not an error, and it is the column this doc exists to expose. `Test` is the contract test under `ts/tests/` exercising the entry point. `Seeded` is `yes` when the system's output is driven by a seeded PRNG, `no` when it calls unseeded `Math.random()`, and `n/a` when the system has no randomness to seed.

## A second implementation of a shared system is a defect

Roadmap M7.2 enforces this rule: where two copies of a shared system live, one is a bug waiting to drift. The pattern to copy is `ts/src/engine/artGen/seededRandom.ts` — a thin re-export of `shared/seededRandom.ts`, so there is one canonical implementation and existing callers keep working. Three real second implementations this inventory found, listed here rather than fixed: `ts/src/games/early_learning_buddy/utils/speech.ts` still ships its own `SpeechEngine` even though `shared/voiceRecognition/speechEngine.ts` was generalized from it (which is why `voiceRecognition` shows `none yet` consumers), and `shoal` and `slime_coin` each keep a local `utils/sound.ts` Web Audio engine whose own header says to migrate to `shared/sfx`.

## Adding a system

Adding a system means adding its row in the same commit — `ts/tests/test_engine_systems_doc.ts` fails on a missing row, a stale row, or a dead path. Fill `Consumers` and `Test` from grep evidence only; write `none yet` where there is no evidence.
