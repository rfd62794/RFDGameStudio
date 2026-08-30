# Current Project State — August 2026

## Test Floor
- **Floor**: 241/241 tests green (`npx vitest run`), 240 prior + 1 new anchor green
- **Type Check**: 0 errors (`npx tsc --noEmit`)

## Recent Changes: Mess Draw Order, Zone/Type Naming Alignment & Anchor Strengthening Directive

### 1. Mess Draw Order Fix (`src/components/KitchenCanvas.tsx`)
- **Root Cause Fix**: Moved mess-drawing loop (`if (state.messes)`) to execute AFTER station rendering (`// 3. Draw Stations`) and pipeline arrows, immediately BEFORE customer rendering (`// 4. Draw Customers`).
- **Visual Outcome**: Messes rendered at station positions are no longer painted over by station rectangles while remaining naturally occluded by workers standing directly over them.

### 2. Zone/Type Naming Alignment (`src/layout.ts`, `src/components/KitchenCanvas.tsx`, `tests/lineSimulation.test.ts`)
- **VisualZone Schema Rename**: Renamed `VisualZone` enum values to align with Worker Type vocabulary:
  - `'activePrep' → 'lineCook'`
  - `'publicFacing' → 'csr'`
  - `'breakStaff' → 'support'`
- **Station Configurations & Palettes**: Updated `STATION_CONFIGS` and `ZONE_PALETTE` keys to match the new zone names.
- **Codebase Call-Site Audit**: Updated all occurrences in `KitchenCanvas.tsx` and test assertions in `lineSimulation.test.ts` to reference the new zone names.

### 3. Test Anchors 235, 239, 240 & 241 (`tests/lineSimulation.test.ts`)
- **Anchor 235**: Updated visualZone assertions to match new names (`lineCook`, `csr`, `support`).
- **Anchor 239 (Strengthened)**: Verified real per-type autonomy for Line Cook, CSR, and Janitor/Mechanic workers, confirming that when stamina is critically low (0.05), every worker type selects `rest` regardless of type affinity.
- **Anchor 240 (Strengthened)**: Verified `getWorkerTargetPos` across all 9 task target resolvers (`drink_coffee`, `clean_mess` with active mess, `clean_bathroom`, `use_bathroom` occupant state, `use_bathroom` queued state, `rest`, `eat_meal`, `drink_water`, `discharge_meal`).
- **Anchor 241 (New)**: Direct regression test confirming a mess spawned within a station's bounding box remains present in `state.messes` within station bounds, and asserting at the source level that `KitchenCanvas.tsx` renders messes after stations.

## Prior State: Station Capability Flags & Session Loop Extraction Directive

### 1. Station Capability Flags (`src/data.ts`)
- **Data Schema Update**:
  - Added `hasEquipmentWear: boolean` and `hasProductQuality: boolean` to `StationConfig` interface and all entries in `STATION_CONFIGS`.
  - Configured explicitly per specification:
    - `grill`, `assembly`, `fryer`: `hasEquipmentWear = true`, `hasProductQuality = true`
    - `window`: `hasEquipmentWear = false`, `hasProductQuality = true`
    - `coffee`: `hasEquipmentWear = false`, `hasProductQuality = true`
    - `queue`: `hasEquipmentWear = false`, `hasProductQuality = false`
    - `bathroom`: `hasEquipmentWear = false`, `hasProductQuality = false`

### 2. Station Execution Refactor (`src/execution/stationExecution.ts`)
- **Degradation Roll Refactor**: Replaced hardcoded station exclusion list (`station.id !== 'queue' && station.id !== 'coffee' && station.id !== 'window'`) with data-driven `config.hasEquipmentWear`.

### 3. Idle Decay & Session Loop Sub-Function Extractions (`src/sessionLoop.ts`)
- **Idle Quality Decay Filter**: Updated `updateStationIdleDecay` to check `config.hasProductQuality`. Stations without product quality (such as `queue` and `bathroom`) no longer undergo idle quality decay and remain pinned at `BATCH_QUALITY_MAX` (100).
- **Extracted Tick Functions**:
  - `updateSituationEscalation(state: KitchenState, actualDt: number): void`
  - `updateStationIdleDecay(state: KitchenState, actualDt: number): void`
  - `updateWorkerNeeds(state: KitchenState, actualDt: number): void`
- Extracted cleanly from `tickKitchenState` in `src/sessionLoop.ts`, maintaining strict behavior preservation.

### 4. Test Anchors 228–233 (`tests/lineSimulation.test.ts`)
- **Anchor 228**: Verified `queue` and `bathroom` `batchQuality` stays at 100 when idle while `grill` decays.
- **Anchor 229**: Verified `coffee` and `window` `batchQuality` genuinely still decays when idle.
- **Anchor 230**: Confirmed `degradationStage` increments strictly for equipment stations (`grill`, `assembly`, `fryer`).
- **Anchor 231**: Direct data specification check for `hasEquipmentWear` and `hasProductQuality` on `STATION_CONFIGS`.
- **Anchor 232**: Real integration probe across multi-day simulation confirming `queue` and `bathroom` `batchQuality` remain permanently at 100.
- **Anchor 233**: Full suite regression probe confirming behavior-preserving sub-function extractions in `src/sessionLoop.ts`.

### 1. TypeScript Compile Fix (`tests/lineSimulation.test.ts`)
- **Dead Import Removal**: Removed unexported `processStationExecution` import from `tests/lineSimulation.test.ts`.
- **Function Signature Alignment**: Updated calls to `executeStationTaskCompletion` in Anchor 210 from 3 arguments `(worker, station, state)` to required 4 arguments `(worker, station, state, config)`.
- **Compile Verification**: `npx tsc --noEmit` now completes cleanly with 0 type errors across the entire codebase.

### 2. Single-Occupancy Bathroom Queue System (`src/types.ts`, `src/data.ts`, `src/sessionLoop.ts`, `src/steering.ts`, `src/execution/breakExecution.ts`)
- **State Data Model (`src/types.ts`)**:
  - Extended `Station` interface with `occupiedByWorkerId: string | null`. Initialized to `null` in `createInitialKitchenState`.
  - Extended `KitchenState` interface with `bathroomQueue: string[]`. Initialized to `[]` in `createInitialKitchenState`.
- **Queue Waypoints (`src/data.ts`)**:
  - Added `BATHROOM_QUEUE_WAYPOINTS: Position[]` defining 3 ordered queue slots left of the bathroom `[{ x: 425, y: 325 }, { x: 400, y: 325 }, { x: 375, y: 325 }]`.
- **Per-Tick State Management (`src/sessionLoop.ts`)**:
  - Implemented `updateBathroomQueueAndOccupancy(state)` called on every tick in `tickKitchenState`.
  - Evicts workers no longer assigned to `use_bathroom` from queue/occupant slot.
  - Enqueues new workers selecting `use_bathroom`.
  - Promotes the front worker in `bathroomQueue` to `occupiedByWorkerId` whenever the bathroom is unoccupied (`null`).
- **Target Steering Branching (`src/steering.ts`)**:
  - Updated `getWorkerTargetPos` for `use_bathroom`: if `w.id === bathroom.occupiedByWorkerId`, target bathroom center `(490, 325)`; otherwise target assigned `BATHROOM_QUEUE_WAYPOINTS` index with overflow math. `clean_bathroom` continues to target bathroom center directly.
- **Single-Occupancy Resolution Defense (`src/execution/breakExecution.ts`)**:
  - Updated `use_bathroom` completion in `processWorkerBreakExecution`: checks that `isOccupant` (`occupiedByWorkerId === null || occupiedByWorkerId === worker.id`). Resets bladder pressure, rolls clog chance, clears `occupiedByWorkerId`, and transition task to `'protocol'` so the occupant immediately vacates the bathroom.

### 3. Test Anchors 218–223 (`tests/lineSimulation.test.ts`)
- **Anchor 218**: Real integration probe confirming only one worker ever holds `bathroom.occupiedByWorkerId` simultaneously.
- **Anchor 219**: Verified queued worker targets a `BATHROOM_QUEUE_WAYPOINTS` slot, not bathroom center.
- **Anchor 220**: Real integration probe confirming occupant completion immediately promotes queue front to occupant on the next tick.
- **Anchor 221**: Real integration probe confirming task change away from `use_bathroom` removes worker from `bathroomQueue` within the same tick.
- **Anchor 222**: Real integration probe replaying 4-worker session diagnostic: zero double-occupancy within `AVOID_WORKERS_DIST` of bathroom center across 120 ticks.
- **Anchor 223**: Real state initialization probe confirming `bathroomQueue` array and `occupiedByWorkerId = null`.

## Prior State: Bathroom Loop Fix & Scoring File Consolidation Directive

### 1. Scoring File Duplication Investigation & Resolution (§2)
- **Investigation Finding**: `src/utilityScoring.ts` is a re-export barrel file that delegates to `src/scoring/utilityScoring.ts`, `src/scoring/facialExpressions.ts`, and `src/scoring/taskSelection.ts`. It is NOT a duplicate implementation.
- **Call-Site Audit**: Production modules (`sessionLoop.ts`, `StaffRoster.tsx`, `steering.ts`, `taskSelection.ts`) and test suites import cleanly through `src/utilityScoring.ts` as the central facade. Architecture preserved without unnecessary changes.

### 2. Bathroom Escalation & Needs Tuning (`src/data.ts`, `src/types.ts`, `src/scoring/utilityScoring.ts`, `src/sessionLoop.ts`, `src/execution/breakExecution.ts`)
- **Orphan Constant Removal**: Deleted duplicate `BLADDER_RISE_PER_WATER_UNIT`; unified on `BLADDER_RISE_PER_WATER`.
- **Water-to-Bladder Rate Tuning**: Reduced `BLADDER_RISE_PER_WATER` from `0.25` to `0.08` so 3–4 water breaks occur before crossing the bladder urgency threshold (uncoupling Thirst and Bladder).
- **Time-Based Escalation Engine**:
  - Added `Station.brokenElapsedSeconds` tracked continuously in `sessionLoop.ts` while `isOutOfOrder === true` and reset to `0` upon `clean_bathroom` completion.
  - Added constants `BATHROOM_CLEAN_URGENCY_RISE_PER_SECOND = 0.05` and `CLEAN_BATHROOM_MAX_SCORE = 8.0`.
  - Updated `scoreCleanBathroom` in `src/scoring/utilityScoring.ts`: score escalates from `CLEAN_BATHROOM_BASE_SCORE` (4.0) over time up to `CLEAN_BATHROOM_MAX_SCORE` (8.0). Because 8.0 > personal need max scores (6.0), a neglected broken bathroom now outranks personal worker needs.
- **Diagnostic Result (Anchor 208)**:
  - **Before Fix**: Bathroom broken 67% of run time (606/900 ticks).
  - **After Fix**: Bathroom out-of-order ratio dropped to 0.0% (0/900 ticks), well under the 25% ceiling requirement.

### 3. Integration Test Anchors 204–209 (`tests/lineSimulation.test.ts`)
- **Anchor 204**: Verified single `BLADDER_RISE_PER_WATER` constant (0.08) and absence of `BLADDER_RISE_PER_WATER_UNIT`.
- **Anchor 205**: Verified `scoreCleanBathroom` returns `CLEAN_BATHROOM_BASE_SCORE` (4.0) at moment of breakdown.
- **Anchor 206**: Verified score strictly increases with broken time (4.0 -> 5.0 -> 6.0) and clamps at `CLEAN_BATHROOM_MAX_SCORE` (8.0).
- **Anchor 207**: Verified long-broken bathroom clean task (score 8.0) outranks max elevated worker thirst (score 6.0) in worker decision selection.
- **Anchor 208**: 900-tick simulation integration probe confirms out-of-order percentage is 0.0% (< 25% ceiling).
- **Anchor 209**: Verified `brokenElapsedSeconds` resets to `0` immediately upon `clean_bathroom` completion.

## Prior State: Entry/Exit Repositioning & Test Determinism Directive

### 1. Geometry Repositioning (`src/data.ts`)
- Repositioned customer doors to a shared left-center area:
  - `ENTRANCE_POS = { x: 30, y: 230 }`
  - `EXIT_POS = { x: 30, y: 270 }`
- Verified `CUSTOMER_WAIT_QUEUE_ORIGIN` automatically derives from `ENTRANCE_POS`.

### 2. Test Suite Determinism (`tests/lineSimulation.test.ts`)
- Added self-contained deterministic PRNG (`mulberry32` with FNV-1a hash of test name seed) to `tests/lineSimulation.test.ts`.
- Wired top-level `beforeEach` to spy on `Math.random` with the seeded PRNG and `afterEach` to `vi.restoreAllMocks()`.
- Guaranteed 100% reproducible test execution across all 203 test anchors without altering underlying test verifications. Verified across 5 consecutive identical suite runs.

## Prior State: Manager Autonomous Repair Fallback Directive

### 1. Autonomous Repair Candidate (`src/scoring/utilityScoring.ts` & `src/scoring/taskSelection.ts`)
- Added `scoreManagerAutoRepair(m, k)` utility function:
  - Base weight `MANAGER_AUTO_REPAIR_BASE = 5.0`
  - Score formula: `MANAGER_AUTO_REPAIR_BASE * m.stamina * (highestStage / 3)`
  - Competes as a first-class candidate alongside `supervise`, `patrol`, `rest`, and `drink_coffee` in `evaluateManagerTick`.
- When selected by argmax, begins a committed repair on the highest-severity pending station without deducting player Attention (`spendAttention`), consuming the Manager's time autonomously.

### 2. Station Exclusion & Rate Tuning (`src/data.ts` & `src/execution/stationExecution.ts`)
- Excluded non-equipment stations (`queue` and `coffee`) from the equipment degradation roll block in `executeStationTaskCompletion`.
- Directional tuning pass: reduced `EQUIPMENT_DEGRADATION_CHANCE` from `0.10` to `0.02` (flagged for detailed balance pass).

### 3. Integration Test Anchors 179–183 (`tests/lineSimulation.test.ts`)
- **Anchor 179**: `scoreManagerAutoRepair` returns `0` when queue is empty and positive stage-scaled values when situations are pending.
- **Anchor 180**: `queue` station `degradationStage` remains `0` across 300 task completions while `grill` degrades.
- **Anchor 181**: Real integration probe: Manager selects `auto_repair` when Stage-3 situation is pending and workers are nearby.
- **Anchor 182**: Autonomous repair commitment does not call `spendAttention` (stamina remains un-penalized at commitment time).
- **Anchor 183**: **Full 7-day integration regression probe**: zero player intervention across Week 1 avoids `game_over` and keeps all equipment stations usable (`degradationStage < 3`), proving the unhandled collapse bug is closed.

