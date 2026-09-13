# RFDGameStudio — Phase 2c Directive: Race Animation

*June 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 21 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 12 passed, 0 failed, 0 skipped.
> If either count differs, stop and report — do not proceed.

---

## §0 Context

**What exists:**
- `simulate_race` runs in Lua and returns predetermined results before animation starts
- `RaceParticipant.final_rank` and `finish_time` are set by Lua
- `SVGRacer.tsx` exists and accepts `colorBody`, `colorMane`, `colorSocks`, `colorSilk`,
  `isRunning`, `runTick`, `size`, `gateNumber` props
- BettingTab calls `simulate_race` and stores results — those results are available
  before any animation frame renders
- No race animation component exists yet

**What this phase delivers:**
- `RaceTrack.tsx` — animated race view, cinematic only
- 6 lanes, one per participant, SVGRacer sprite per horse
- Speed multiplier: 1x, 3x, 5x (not 1x/3x as in example)
- Skip button: immediately snap to Lua results
- Race commentary announcer line
- Results panel after race completes showing Lua-determined ranks
- App.tsx wired: clicking "GO TO TRACK" shows RaceTrack, not BettingTab

**What is NOT in scope:**
- No new Lua functions
- No data.yaml changes
- No Python test changes — floors stay 21/0/0 and 12/0/0
- No betting UI changes
- No leaderboard persistence
- No sound

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `ts/src/components/RaceTrack.tsx` | New | Full animated race component |
| `ts/src/App.tsx` | Modify | Wire RaceTrack into race flow |

**Read-only — do not touch:**
All studio engine files, all test files, all other components, logic.lua, data.yaml.

---

## §2 Implementation

### §2.1 RaceTrack.tsx

**Props interface:**

```typescript
interface RaceTrackProps {
  race: Race;                    // from App state — has participants with Lua results
  bets: Bet[];
  onRaceFinish: (results: RaceResult[]) => void;
  onClose: () => void;
}

interface RaceResult {
  horse_id: string;
  final_rank: number;
  finish_time: number;
  prize_earnings: number;
  bet_payout: number;
}
```

**State:**

```typescript
const [isRunning, setIsRunning] = useState(false);
const [speedMultiplier, setSpeedMultiplier] = useState<1 | 3 | 5>(1);
const [resultsDeclared, setResultsDeclared] = useState(false);
const [raceTime, setRaceTime] = useState(0);
const [announcement, setAnnouncement] = useState("Horses are heading to the starting gates...");

// Animation state — separate from Lua results
// These track visual positions only. Never used to determine winner.
const [animParticipants, setAnimParticipants] = useState(
  race.participants.map(p => ({
    ...p,
    anim_progress: 0,       // 0–100, display only
    anim_energy: 100,       // display only
    anim_speed: 0,          // display only
    anim_finished: false    // display only
  }))
);
```

**Physics tick (animation only):**

Run a `setInterval` at `TICK_RATE_MS = 50ms` when `isRunning` is true.
Each tick advances `anim_progress`, `anim_energy`, `anim_speed` using the same
formulas as the example's `RaceTrack.tsx` interval (lines 124–244).
This produces a plausible-looking race — it does NOT determine the winner.

When all `anim_finished` flags are true OR the last horse crosses the line:
- Clear the interval
- Set `resultsDeclared = true`
- Display ranks from `race.participants[n].final_rank` (Lua values)
- Do NOT use animation finish order for ranks

> ⚠️ RULE: `anim_progress` and `anim_finished` are display state.
> `race.participants[n].final_rank` is the authoritative result from Lua.
> These two things may disagree — if they do, Lua wins.
> The visual race is a cinematic approximation of the predetermined outcome.

**Skip button behavior:**

When clicked:
- Clear any running interval
- Set all `anim_progress` to 100
- Set `resultsDeclared = true` immediately
- Display Lua results (ranks, finish times) — no physics needed

**Speed controls:**

Three buttons: `1x` | `3x` | `5x`
`speedMultiplier` scales the `timeStep` per tick: `timeStep = (TICK_RATE_MS / 1000) * speedMultiplier`
Only visible while `isRunning` is true.

**Race track layout:**

6 lanes, stacked vertically. Each lane:
- Lane number on left
- SVGRacer sprite positioned by `anim_progress` percentage
- Energy bar above sprite (green → amber → red as energy drops)
- Grid lines at 25%, 50%, 75%
- Finish line on right
- Rank badge appears when `resultsDeclared` — shows Lua `final_rank`, not animation order

**Controls layout:**
- START RACE button (hidden after race starts or results declared)
- Speed buttons 1x / 3x / 5x (visible while running)
- SKIP ANIMATION button (hidden after results declared)
- CONTINUE button (visible only after results declared) — calls `onClose`

**Results declaration:**

When `resultsDeclared` is true, show a results panel alongside the track:
- Sorted by `final_rank` (from Lua)
- Horse name, rank, finish time, prize earnings
- Bet payout per bet (won/lost indicator)
- Total payout

**Announcer:**

Single text line below the track. Updates on a timer while running:
- Start: "And they're off!"
- Leader > 40% progress: "[leader name] is setting the pace!"
- Leader > 75%: "Approaching the home stretch!"
- Leader > 95%: "[leader name] is crossing the line!"
- After results: "Race complete! [rank 1 horse name] wins!"

Use `race.participants` sorted by `anim_progress` for live announcer.
Use `final_rank` for the post-race announcement.

> ⚠️ RULE: SVGRacer already exists. Import it directly.
> Do not recreate or modify SVGRacer for this phase.

---

### §2.2 App.tsx — Wire RaceTrack

Add `isRacingActive: boolean` state — false by default.

When BettingTab calls `onStartRace`:
1. `simulate_race` has already been called and results are in `currentRace.participants`
2. Set `isRacingActive = true`
3. Render `RaceTrack` instead of the tab view

When RaceTrack calls `onClose`:
1. Call `onRaceFinish` handler (already exists from Phase 2b — updates horses, funds, history)
2. Set `isRacingActive = false`
3. Generate new race
4. Navigate to stable tab

```typescript
{isRacingActive && currentRace ? (
  <RaceTrack
    race={currentRace}
    bets={bets}
    onRaceFinish={handleRaceComplete}
    onClose={handleCloseRaceTrack}
  />
) : (
  // existing tab rendering
)}
```

> ⚠️ RULE: `simulate_race` must have been called BEFORE `isRacingActive` is set
> to true. The `RaceTrack` component reads predetermined results from
> `race.participants[n].final_rank`. It does not call any Lua functions.

---

## §3 Test Anchors

No new tests in this phase. Both floors must hold unchanged.

- [ ] `uv run pytest -v` → 21 passed, 0 failed, 0 skipped
- [ ] `cd ts && npx vitest run` → 12 passed, 0 failed, 0 skipped

---

## §4 Completion Criteria

- [ ] `uv run pytest -v` → 21 passed, 0 failed, 0 skipped (unchanged)
- [ ] `cd ts && npx vitest run` → 12 passed, 0 failed, 0 skipped (unchanged)
- [ ] `cd ts && npx vite build` → exits 0, no TypeScript errors
- [ ] Browser: "GO TO TRACK" transitions to RaceTrack view
- [ ] Browser: 6 SVGRacer sprites animate across 6 lanes
- [ ] Browser: 1x / 3x / 5x speed buttons work
- [ ] Browser: SKIP ANIMATION immediately shows Lua results
- [ ] Browser: Rank display uses Lua `final_rank` values
- [ ] Browser: CONTINUE returns to stable tab, funds updated
- [ ] `docs/state/current.md` updated to Phase 2c certified

**Proof required:**
- Raw `uv run pytest -v` output (21/0/0)
- Raw `npx vitest run` output (12/0/0)
- Browser screenshot: race in progress — horses mid-track, speed buttons visible
- Browser screenshot: results panel — ranks from Lua, payout displayed

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Python floor | 21 / 0 / 0 (unchanged) |
| TypeScript floor | 12 / 0 / 0 (unchanged) |
| Speed multipliers | 1x, 3x, 5x |
| Tick rate | 50ms |
| Animation state prefix | `anim_` — never used for game results |
| Race winner authority | `race.participants[n].final_rank` from Lua |
| Skip behavior | Snap all to 100% progress, reveal Lua results immediately |
| SVGRacer location | `ts/src/components/SVGRacer.tsx` — import, do not modify |
| New files | `RaceTrack.tsx` only |
| Modified files | `App.tsx` only |

---

*RFDGameStudio Phase 2c | June 2026 | RFD IT Services Ltd.*
*Animation is a cinematic. Lua already decided who won.*
