# Shared React/Vite Layer — Analysis Findings

**Scope:** Compare every confirmed Google AI Studio export in `examples/` against its finished RFDGameStudio port in `ts/src/games/`, then identify what is genuinely reusable versus what is game-specific by nature.

**Method:**
1. Confirm the `examples/` inventory using `metadata.json` and the real AI Studio marker `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
2. Catalogue structural facts from each example's `package.json` and `src/` tree.
3. Diff the four finished pairs: **Brewfield**, **SlimeWorld**, **Shoal**, and **Dissonance**.
4. Summarize what is identical across every case, what should never be shared, and unresolved questions.

---

## 1. `examples/` inventory

| Directory | `metadata.json` present | AI Studio marker | Port exists in `ts/src/games/` |
|-----------|--------------------------|------------------|-------------------------------|
| `brewfield` | yes | yes | `brewfield` ✅ |
| `slimeworld` | yes | yes | `slimeworld` ✅ |
| `shoal` | yes | yes | `shoal` ✅ |
| `corpworld` | yes | yes | `corpworld` (only `config.ts`) |
| `coin-pusher-arcade` | yes | yes | — |
| `horse-racing-&-breeding` | yes | yes | `horse_racing` ✅ |
| `ledger` | yes | yes | `ledger` (only `config.ts`) |
| `mutant-battle-ball` | yes | yes | `mutant_battle_ball` ✅ |
| `scrapcrawl` | yes | yes | `scrapcrawl` (partial) |
| `slither-rogue_-evolution` | yes | yes | `slither_rogue` ✅ |
| `trinity-siege` | yes | yes | `trinity_siege` (only `config.ts`) |
| `slimegarden` | yes | yes | `slimegarden` (only `config.ts`) |
| `SlimeBreeder` | **no** | — | `slimebreeder` (only `config.ts`) |
| `lua` | n/a | n/a | n/a |

**Result:** 12 of 13 non-`lua` directories are confirmed AI Studio exports. `examples/SlimeBreeder/` lacks `metadata.json` entirely and is therefore excluded from the shared-layer evidence set until proven otherwise.

---

## 2. Structural catalogue across confirmed examples

### 2.1 Toolchain / dependency baseline

Every confirmed example's `package.json` is nearly identical:

- **React:** `^19.0.1`
- **React DOM:** `^19.0.1`
- **Vite:** `^6.2.3`
- **TypeScript:** `~5.8.2`
- **Tailwind CSS:** `^4.1.14`
- **@tailwindcss/vite:** `^4.1.14`
- **@vitejs/plugin-react:** `^5.0.4`
- **lucide-react:** `^0.546.0`
- **motion:** `^12.23.24`
- **express:** `^4.21.2`
- **dotenv:** `^17.2.3`
- **@google/genai:** `^2.4.0`

Variations:
- `examples/horse-racing-&-breeding` also declares `framer-motion: ^12.41.0`.
- `examples/scrapcrawl` additionally declares `vitest: ^4.1.10` and `@types/react`/`@types/react-dom`.

### 2.2 `src/` folder shape

| Game | `src/` shape | Notes |
|------|-------------|-------|
| `brewfield` | `App.tsx` + `components/` (7 files) + `gameLogic.ts` + `types.ts` | Clear split between UI and logic. |
| `slimeworld` | `App.tsx` + `components/` (6) + `hooks/` (8 action hooks) + `gameLogic.ts` + `types.ts` | Most structured; domain actions wrapped in hooks. |
| `shoal` | `App.tsx` + `simulation.ts` + `types.ts` | Almost monolithic; simulation and render in `App.tsx`. |
| `corpworld` | `App.tsx` + `components/` (7) + `utils/` (2) + `types.ts` | Mid-size; logic in `utils/`. |
| `coin-pusher-arcade` | `App.tsx` + `components/` (3) + `data.ts` + `sound.ts` + `types.ts` | Smaller component surface. |
| `horse-racing-&-breeding` | `App.tsx` + `components/` (5) + `utils.ts` + `types.ts` | Logic consolidated in one `utils.ts`. |
| `ledger` | `App.tsx` + `components/` (6) + `utils.ts` + `types.ts` | Same pattern as horse racing. |
| `mutant-battle-ball` | `App.tsx` + `data.ts` + `matchEngine.ts` + `types.ts` | No `components/` dir; very flat. |
| `scrapcrawl` | `App.tsx` + many root `.ts` files (catalog, combat, companion, crafting, growth, index, llmContent, rooms, sculptDemo, state, trace, types) | Most fragmented; no `components/` folder. |
| `slither-rogue_-evolution` | `App.tsx` + `components/` (5) + `types.ts` | No obvious separate logic file visible in top-level `src/`. |
| `trinity-siege` | `App.tsx` + `components/` (3) + `combat.ts` + `types.ts` | Small component set, logic in `combat.ts`. |
| `slimegarden` | Identical to `slimeworld` | Even shares the same `metadata.json` name value ("SlimeGarden"). |

### 2.3 Where game logic lives in originals

- **Separate plain `.ts` file:** `brewfield` (`gameLogic.ts`), `slimeworld`/`slimegarden` (`gameLogic.ts`), `shoal` (`simulation.ts`), `corpworld` (`utils/combat.ts`, `utils/mapGenerator.ts`), `horse-racing-&-breeding` (`utils.ts`), `ledger` (`utils.ts`), `mutant-battle-ball` (`matchEngine.ts`, `data.ts`), `scrapcrawl` (many root `.ts` files), `trinity-siege` (`combat.ts`).
- **Inline in `App.tsx` / components:** `slither-rogue_-evolution` appears to inline logic; no separate logic file was found.
- **Hook-encapsulated:** `slimeworld`/`slimegarden` wrap actions in `hooks/use*Actions.ts`.

### 2.4 Styling approach

- **All 12 examples use Tailwind CSS v4** via `@import "tailwindcss"` in `src/index.css`.
- Some add custom `@theme` fonts/keyframes (e.g. `shoal` defines `Inter`, `Space Grotesk`, `JetBrains Mono`, and a `swim-wiggle` keyframe).
- Heavy use of arbitrary Tailwind values (`bg-[#090d16]`, `grid-cols-[repeat(50,minmax(0,1fr))]`, etc.) is present in every large example.
- No example uses CSS-in-JS, CSS Modules, or a styled-components equivalent.

---

## 3. Diff: original AI Studio export → finished RFDGameStudio port

### 3.1 Brewfield

| Aspect | Original (`examples/brewfield/src`) | Port (`ts/src/games/brewfield`) |
|--------|-------------------------------------|----------------------------------|
| `App.tsx` | 831 lines; owns all state, effect bootstrapping, and turn resolution inline. | Wraps `GameShell`; state lives in Lua; `App.tsx` only calls `useGameState`, `useLuaCall`, and delegates to components. |
| Logic | `gameLogic.ts` with deterministic functions (`solveBrew`, `updateResidueField`, `generateRunNodes`, etc.). | Same logic ported to Lua (`games/brewfield/logic/`). `App.tsx` calls `init_run`, `init_node`, `resolve_turn`, `advance_node`, `choose_forage`, `rest_stoke_furnace`, `rest_synthesize_element`. |
| Components | `IntroScreen`, `MapProgress`, `EnemySection`, `CauldronSection`, `PlayerSection`, `ForageNode`, `RestNode`, `GameOverScreen`. | Same component names; JSX largely preserved. Adds small helpers (`CombatOutcomeCard`, `Logbook`) inline in `App.tsx`. |
| State | React `useState` for deck, hand, enemy, player, residues, logs, etc. | Single `BrewfieldGameState` managed via `useGameState` and Lua returns. |
| Styling | Tailwind arbitrary values, stone/emerald/amber palette. | Same Tailwind classes; rendered inside `GameShell`. |
| `main.tsx` / entry | Vite standalone entry. | Replaced by `config.ts` exporting a `React.lazy` component. |

**Verdict:** The transformation is clean and mechanical: lift logic to Lua, replace state management with `GameShell`/`useLuaCall`, keep components visually identical.

### 3.2 SlimeWorld

| Aspect | Original (`examples/slimeworld/src`) | Port (`ts/src/games/slimeworld`) |
|--------|--------------------------------------|----------------------------------|
| `App.tsx` | 1,300 lines; `useState<LabState>` initialized from `localStorage`; tab/sub-tab state, selection state, many `useEffect`s. | Much shorter; `initialState` builds from `data.yaml` via Lua `create_seed_slime`; localStorage persistence removed in favor of session state. |
| Logic | `gameLogic.ts` plus 8 `hooks/use*Actions.ts` files encapsulating domain actions. | Logic ported to Lua. Port inlines most action handlers directly in `App.tsx`; `hooks/` directory removed entirely. |
| Components | `LabTab`, `PlanetTab`, `SlimeDexTab`, `SlimeVisual`, `SpecimenListItem`, `SpecimenPicker`. | Different tab split: `LabTab`, `RosterTab`, `MissionsTab`, `EconomyTab`, `SlimeVisual`, `SpecimenListItem`, `SpecimenPicker`. |
| State marshalling | Not needed (pure TS). | Heavy TS ↔ Lua translation: `stateToLua`, `luaSlimeToTs`, `luaNodeToTs`, `luaPetitionToTs`, `luaResult`. |
| Styling | Tailwind with `@theme`; dark slate/cyan theme. | Mostly preserved; moved to `styles.css` plus inline Tailwind. |
| `main.tsx` | Standalone. | `config.ts` + `GameShell`. |

**Verdict:** The port is structurally deeper than Brewfield because state is large and deeply nested; a big chunk of the "porting effort" is writing marshalling helpers, not UI. The original hook layer was discarded.

### 3.3 Shoal

| Aspect | Original (`examples/shoal/src`) | Port (`ts/src/games/shoal`) |
|--------|-----------------------------------|------------------------------|
| `App.tsx` | 824 lines; builds a 50×35 React DOM grid with `motion.div` per cell and absolute-positioned `LivingOccupant` overlays. | Replaces the entire React DOM renderer with an HTML5 `<canvas>` driven by `useGameLoop`; `App.tsx` is only shell + toolbar. |
| Logic | `simulation.ts` contains `generateBalancedWorld`, `resolveTick`, `burstFleshChunks`, toroidal math. | Logic ported to Lua; `App.tsx` calls `init_game` and `tick_game`; rendering is pure client-side canvas. |
| Components | None (render helpers `renderFishIcon`, `renderSharkIcon`, `renderFleshChunkIcon`, `LivingOccupant` inline in `App.tsx`). | No React components beyond `App.tsx` and `ShoalCanvas`. |
| State | Single `simState` object plus UI state. | Single `RenderState` returned from Lua each tick. |
| Styling | Tailwind; warm sand/water palette; custom fonts in `@theme`. | Tailwind for toolbar/shell; canvas for the world; `styles.css` for layout. |
| `main.tsx` | Standalone. | `config.ts` + `GameShell`. |

**Verdict:** The port keeps the game's data model but completely swaps the rendering technology. The shared layer cannot assume the original renderer is reusable.

### 3.4 Dissonance

| Aspect | Original (`tmp/dissonance-src/src`) | Port (`ts/src/games/dissonance`) |
|--------|-------------------------------------|----------------------------------|
| `App.tsx` | 244 lines; wires `usePersistentProgress`, `PhaseRouter`, and inline phase routing. | 281 lines inside `GameShell`; mirrors original phase routing but calls Lua for every state transition. |
| Phases | `components/PhaseRouter.tsx`, `components/TitlePhase.tsx`, `OpeningPhase.tsx`, etc. | Each phase is now a first-class file under `phases/`: `TitlePhase.tsx`, `OpeningPhase.tsx`, `FloorChoicePhase.tsx`, `DeckBuildPhase.tsx`, `MapPhase.tsx`, `CombatPhase.tsx`, `RewardPhase.tsx`, `RestCraftPhase.tsx`. |
| Logic | `state/runState.ts`, `logic/deck.ts`, `logic/mapGraph.ts`, `logic/combat.ts`, `logic/builds.ts`, etc. | Ported to Lua under `games/dissonance/logic/run_state.lua`, `builds.lua`, `combat.lua`, etc. |
| State | Persistent progress + per-run `RunState`. | Persistent progress still in `localStorage`; per-run state lives in Lua returns. |
| Styling | Tailwind slate/amber/rose palette. | Same palette; rendered inside `GameShell`. |
| `main.tsx` | Standalone. | `config.ts` + `GameShell`. |

**Verdict:** Dissonance's transformation matches Brewfield's shape (phase components + Lua calls), but has more phases and a separate persistent-progress layer that stays in TypeScript.

---

## 4. Cross-case patterns

### 4.1 What is identical or near-identical across every confirmed case

1. **Toolchain lock-step.** All 12 confirmed examples use React 19.0.1, Vite 6.2.3, TypeScript ~5.8.2, Tailwind CSS 4.1.14, `@vitejs/plugin-react` 5.0.4, `lucide-react` 0.546.0, `motion` 12.23.24. A shared adapter layer can safely assume this baseline.
2. **Entry replacement.** Every finished port replaces `main.tsx` with `config.ts` that exports a `React.lazy(() => import('./App'))` component registered in `ts/src/games/registry.ts`.
3. **GameShell wrapping.** Every port's `App.tsx` renders inside `GameShell` and receives `{ session }` from `GameRendererProps`.
4. **Lua call wiring.** Every finished port uses either `useLuaCall(session)` or the lower-level `call(session, fnName, ...)` from `engine/runtime`.
5. **State outsourcing.** Game state that lived in `useState`/`useReducer` in the original is now returned by Lua functions; the React layer becomes a thin coordinator.
6. **Tailwind styling preserved.** Classes are copied almost verbatim; the shared layer does not need to translate CSS frameworks.
7. **Component name reuse.** Phase or section component names generally survive the port (e.g. `CauldronSection`, `MapProgress`, `LabTab`).

### 4.2 What is genuinely game-specific and should never be shared

1. **Phase/tab structure and component hierarchy.** Brewfield has `intro/run/game_over` screens; Dissonance has 8+ discrete phases; SlimeWorld has roster/missions/economy/lab tabs; Shoal has a single canvas. No generic adapter can predict this.
2. **State shape and serialization.** SlimeWorld requires `stateToLua`/`luaSlimeToTs`; Dissonance's `RunState` is flatter; Shoal's `RenderState` is tick-oriented. Marshalling code is inherently game-specific.
3. **Rendering technology.** Shoal proves that the original React DOM renderer may be discarded for Canvas; Brewfield/Dissonance keep DOM; other games may use SVG/WebGL. A shared layer must not enforce a renderer.
4. **Game mechanics and balance constants.** Enemy intents, card pools, culture synergies, breeding formulas, economy numbers — all specific.
5. **Persistence strategy.** Dissonance keeps `localStorage` for unlocks; SlimeWorld's original used `localStorage` for the whole lab state, but the port dropped it. This is a per-game decision.
6. **Action granularity.** Brewfield exposes coarse functions (`resolve_turn`, `advance_node`); SlimeWorld exposes many fine-grained calls (`initiate_breeding`, `recycle_slime`, `advance_cycle`, `launch_dispatch`, etc.).

### 4.3 Open questions this analysis could not resolve

1. **`examples/SlimeBreeder/` has no `metadata.json`.** Is it an AI Studio export that lost its marker, or a different kind of source? It should not be treated as confirmed evidence until `metadata.json` is located.
2. **`examples/slimeworld/` and `examples/slimegarden/` share identical `metadata.json` content and identical `src/` trees.** Are they two names for the same export, or a copy/paste artifact? This affects whether "SlimeGarden" is a distinct data point.
3. **`examples/slither-rogue_-evolution/src/` has no visible separate logic file.** Does game logic live inline in `App.tsx`/components, or in an untracked subdirectory?
4. **`horse_racing`, `mutant_battle_ball`, and `slither_rogue` ports exist but were not part of the requested four-way diff.** Do they follow the same transformation shape, or introduce new divergences (e.g. Canvas, SVG racers, real-time loop)?
5. **`scrapcrawl` is highly fragmented** and only partially ported. Is its structure representative of a whole class of AI Studio exports, or an outlier?
6. **Config export style varies.** `brewfield`, `shoal`, and `dissonance` use `export default config`; `slimeworld` uses `export const slimeworldConfig`. A future shared layer would need to normalize this, but it is a small convention issue, not a structural one.

---

## 5. Explicit statement of confidence

The evidence supports **one shared adapter pattern**, not one shared component/hook library.

The invariant shape across every finished port is:

- take the original React 19 + Vite 6 + Tailwind 4 export,
- move game logic/state into Lua + `data.yaml`,
- replace the entry point with `config.ts` registering a `React.lazy` `App`,
- wrap `App` in `GameShell`,
- wire user actions to Lua via `useLuaCall`/`call`,
- preserve the original JSX/components as much as possible.

What **cannot** be shared is the content that changes per game: state shape, serialization, phase/component hierarchy, rendering technology, and mechanics. Attempting to build a "universal game component" would fail on Shoal's canvas and SlimeWorld's deep state marshalling.

**Recommendation:** Invest in a *porting scaffold* (entry/config generator, GameShell, `useLuaCall`, build wiring) rather than a shared UI layer. The scaffold would automate the identical 30% and get out of the way for the game-specific 70%.
