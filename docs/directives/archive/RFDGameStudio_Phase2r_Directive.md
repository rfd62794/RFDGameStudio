# RFDGameStudio — Phase 2r Directive: Horse Racing Features

*June 2026 | Read fully before executing anything.*
*Three parts. A (fixes) → B (AI races) → C (race calendar). Verify after each.*

---

> ⛔ **STOP:** Run `studio_run_tests()` via Claude before touching anything.
> Must report 64 passed, 0 failed.

---

## §0 Context

**Three issues to fix:**

1. **Back button overlap** — `.arcade-back-btn` is `position: fixed; top: 1rem; left: 1rem`.
   It sits on top of the horse picker and betting UI. Needs repositioning.

2. **Resting horse enforcement** — A resting horse can still be entered into a
   race. Must be blocked. If the selected horse is resting, the race must be
   AI-only (player bets on the field, no horse earnings).

3. **Race Calendar + Tier Gates** — Players can't see what races are available,
   what tier their horse qualifies for, or plan ahead. A Calendar tab solves this.

**New Lua function:** `create_ai_race(race_class, data)` — full AI field, no
player horse. Returns same race object format as `create_race`, with `ai_only=true`.

---

## §1 Scope

| File | Action |
|---|---|
| `ts/src/ui/base.css` | Fix `.arcade-back-btn` positioning |
| `ts/src/main.tsx` | Move back button inside game header region |
| `games/horse_racing/logic.lua` | Add `create_ai_race()` |
| `tests/fixtures/horse_racing/logic.lua` | Sync |
| `ts/src/games/horse_racing/App.tsx` | Enforce resting check, AI-only race flow |
| `ts/src/games/horse_racing/components/BettingTab.tsx` | Show AI-only banner, race calendar |
| `tests/test_integration.py` | Add 2 tests → 64→66 |

---

## §2 Fix: Back Button

**Problem:** `position: fixed` overlaps game UI at top-left.

**Fix in base.css:** Change positioning so it only shows on the index page,
or make it non-overlapping in game view.

Replace the `.arcade-back-btn` style:

```css
.arcade-back-btn {
  position: relative;           /* not fixed */
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  text-decoration: none;
}

.arcade-back-btn:hover {
  color: var(--color-text);
  border-color: var(--color-accent);
}
```

**Fix in main.tsx:** Move the back button into a thin navbar strip ABOVE the
game content, not overlapping it. The `.arcade-game-wrap` becomes a column:

```tsx
function GameLoader({ gameId }: { gameId: string }) {
  // ... session loading unchanged ...

  return (
    <div className="arcade-game-wrap">
      <div className="arcade-game-nav">
        <button className="arcade-back-btn" onClick={navigateHome}>
          ← Arcade
        </button>
        <span className="arcade-game-nav-title">{config.label}</span>
      </div>
      <div className="arcade-game-content">
        <React.Suspense fallback={<div className="arcade-loading">Loading…</div>}>
          <GameApp session={session} />
        </React.Suspense>
      </div>
    </div>
  );
}
```

Add to base.css:
```css
.arcade-game-wrap {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.arcade-game-nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  height: 40px;
}

.arcade-game-nav-title {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.arcade-game-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
```

> ⚠️ NOTE: The game App.tsx uses `100vh` for its own height. Since the nav bar
> takes 40px, the game content needs to fill the remainder. Add to
> `horse_racing/styles.css`:
> ```css
> /* When rendered inside arcade-game-content, use 100% height */
> .arcade-game-content .app-root {
>   height: 100%;
> }
> ```
> Verify the game fills the space correctly in the browser.

---

## §3 Lua: create_ai_race

Add to `games/horse_racing/logic.lua` after `can_unlock_slot`:

```lua
-- ============================================================
-- AI-ONLY RACE CREATION
-- ============================================================

-- Create a race with no player horse — full AI field.
-- Used when the player's horse is resting or ineligible.
-- Player can still bet on any participant.
-- Returns same format as create_race, with ai_only = true.
--
-- race_class: one entry from data.race_classes
-- data: full data.yaml parsed table
function create_ai_race(race_class, data)
  local distances  = data.race_distances
  local venues     = data.race_venues
  local types      = data.race_types
  local coat_colors = data.coat_colors
  local silk_colors = data.silk_colors
  local prefixes   = data.name_prefixes
  local suffixes   = data.name_suffixes
  local field_size = (data.race and data.race.field_size) or 6

  local dist_entry = distances[math.random(#distances)]
  local venue      = venues[math.random(#venues)]
  local race_type  = types[math.random(#types)]
  local race_name  = venue .. " " .. race_type

  local npc_min  = race_class.stat_min or 10
  local npc_max  = race_class.stat_max or 100
  local npc_opts = { min_stat=npc_min, max_stat=npc_max,
                     generation=1, player_owned=false }

  local participants = {}
  for i = 1, field_size do
    local npc = generate_horse(npc_opts, coat_colors, silk_colors,
                               prefixes, suffixes)
    table.insert(participants, {
      horse            = npc,
      gate             = i,
      odds             = 0,
      progress         = 0,
      current_distance = 0,
      current_speed    = 0,
      energy           = 100,
      is_finished      = false,
    })
  end

  -- Calculate odds for the full AI field
  local horse_stats = {}
  for _, p in ipairs(participants) do
    table.insert(horse_stats, {
      speed        = p.horse.speed,
      stamina      = p.horse.stamina,
      acceleration = p.horse.acceleration,
      temperament  = p.horse.temperament,
    })
  end
  local odds_arr = calculate_odds(horse_stats, dist_entry.meters)
  for i, p in ipairs(participants) do
    p.odds = odds_arr[i] or 4.0
  end

  local prize_split = race_class.prize_split or {0.60, 0.25, 0.15}

  return {
    id          = "race_" .. tostring(math.random(100000, 999999)),
    name        = race_name,
    description = (race_class.name or "Race") .. " \xc2\xb7 " ..
                  tostring(dist_entry.meters) .. "m \xc2\xb7 Prize $" ..
                  tostring(race_class.prize_pool or 0),
    distance    = dist_entry.meters,
    race_class  = race_class.name or "Unknown",
    prize_pool  = race_class.prize_pool or 0,
    prize_split = prize_split,
    entry_fee   = race_class.fee or 0,
    participants = participants,
    status      = "scheduled",
    ai_only     = true,
  }, nil
end
```

Sync to `tests/fixtures/horse_racing/logic.lua`.

---

## §4 App.tsx — Resting Horse Enforcement

In `horse_racing/App.tsx`, in `handleNewRace` and `handleSkipRace`:

**Before building the race, check if the selected horse is resting:**

```typescript
const handleNewRace = useCallback((horseId?: string) => {
  if (!session || !gameState) return;

  const playerHorses = gameState.horses.filter(h => h.player_owned);
  const target = horseId
    ? playerHorses.find(h => h.id === horseId)
    : playerHorses.find(h => (h.cooldown_until ?? 0) < Date.now())
      ?? playerHorses[0];

  if (!target) {
    // No player horses — build AI-only race at lowest eligible class
    _buildAiOnlyRace();
    return;
  }

  const isResting = (target.cooldown_until ?? 0) > Date.now();
  if (isResting) {
    // Horse is resting — AI-only race
    _buildAiOnlyRace(target);
    return;
  }

  // Horse is ready — normal race
  const race = buildRace(session, gameState.horses, target.id);
  setGameState(prev => prev ? { ...prev, current_race: race } : prev);
}, [session, gameState]);
```

Add `_buildAiOnlyRace`:

```typescript
const _buildAiOnlyRace = useCallback((forHorse?: Horse) => {
  if (!session || !gameState) return;
  const data = session.files.data as Record<string, unknown>;
  const raceClasses = data['race_classes'] as Array<Record<string, unknown>>;

  // Select a race class the horse would qualify for (or lowest class)
  let raceClass = raceClasses[0];
  if (forHorse) {
    const avg = (forHorse.speed + forHorse.stamina +
                 forHorse.acceleration + forHorse.temperament) / 4;
    raceClass = raceClasses.find(rc =>
      avg >= (rc['stat_min'] as number) && avg <= (rc['stat_max'] as number)
    ) ?? raceClasses[0];
  }

  const result = call(session, 'create_ai_race', raceClass, data) as [Record<string, unknown>, string | null];
  const [race] = result;
  if (race) {
    setGameState(prev => prev ? {
      ...prev,
      current_race: { ...luaRaceToTs(race), ai_only: true },
    } : prev);
  }
}, [session, gameState]);
```

> ⚠️ RULE: When `current_race.ai_only === true`, the post-race flow must NOT:
> - Update the player horse's career stats
> - Apply cooldown to the player horse
> - Credit horse earnings
> It MUST: settle bets normally, update player funds.

Update `handleRace` to check `current_race.ai_only` before applying career updates.

---

## §5 Race Calendar Tab

Add a 5th tab to horse_racing: **"Calendar"** (or replace an existing tab).

Tab layout: `1 Stable | 2 Betting | 3 Breed | 4 History | 5 Calendar`

### §5.1 Calendar Tab Data

In App.tsx, derive calendar rows from `session.files.data.race_classes`:

```typescript
interface CalendarRow {
  raceClass: Record<string, unknown>;
  playerStatus: 'eligible-ready' | 'eligible-resting' | 'ineligible' | 'no-horse';
  restingSecondsLeft: number;
}

const calendarRows = useMemo((): CalendarRow[] => {
  if (!session || !gameState) return [];
  const data = session.files.data as Record<string, unknown>;
  const raceClasses = data['race_classes'] as Array<Record<string, unknown>> ?? [];
  const playerHorses = gameState.horses.filter(h => h.player_owned);
  const horse = playerHorses[0]; // selected horse

  return raceClasses.map(rc => {
    if (!horse) return { raceClass: rc, playerStatus: 'no-horse', restingSecondsLeft: 0 };

    const avg = (horse.speed + horse.stamina + horse.acceleration + horse.temperament) / 4;
    const min = rc['stat_min'] as number ?? 0;
    const max = rc['stat_max'] as number ?? 100;
    const eligible = avg >= min && avg <= max;

    if (!eligible) return { raceClass: rc, playerStatus: 'ineligible', restingSecondsLeft: 0 };

    const resting = (horse.cooldown_until ?? 0) > Date.now();
    const secsLeft = resting
      ? Math.ceil(((horse.cooldown_until ?? 0) - Date.now()) / 1000)
      : 0;

    return {
      raceClass: rc,
      playerStatus: resting ? 'eligible-resting' : 'eligible-ready',
      restingSecondsLeft: secsLeft,
    };
  });
}, [session, gameState, ticker]); // ticker refreshes countdown
```

### §5.2 CalendarTab Component

Create `ts/src/games/horse_racing/components/CalendarTab.tsx`:

```tsx
import React from 'react';

interface CalendarRow {
  raceClass: Record<string, unknown>;
  playerStatus: 'eligible-ready' | 'eligible-resting' | 'ineligible' | 'no-horse';
  restingSecondsLeft: number;
}

interface CalendarTabProps {
  rows: CalendarRow[];
  funds: number;
  onEnterRace: (raceClass: Record<string, unknown>, aiOnly: boolean) => void;
}

export default function CalendarTab({ rows, funds, onEnterRace }: CalendarTabProps) {
  return (
    <div className="calendar-wrap">
      <h2 className="calendar-title">RACE CALENDAR</h2>
      <p className="calendar-subtitle">
        Select a race tier to enter. Resting horses run AI-only — you can still bet on the field.
      </p>

      <div className="calendar-table">
        <div className="calendar-header-row">
          <span>Tier</span>
          <span>Distance</span>
          <span>Prize Pool</span>
          <span>Entry</span>
          <span>Your Horse</span>
          <span></span>
        </div>

        {rows.map((row, i) => {
          const rc = row.raceClass;
          const name     = rc['name'] as string;
          const prize    = rc['prize_pool'] as number ?? 0;
          const fee      = rc['fee'] as number ?? 0;
          const canAfford = funds >= fee;
          const aiOnly   = row.playerStatus === 'eligible-resting';
          const canEnter = row.playerStatus !== 'ineligible' &&
                           row.playerStatus !== 'no-horse' && canAfford;

          return (
            <div key={i} className={`calendar-row ${row.playerStatus}`}>
              <span className="cal-tier">{name}</span>
              <span className="cal-distance">Mixed</span>
              <span className="cal-prize">${prize.toLocaleString()}</span>
              <span className="cal-fee">{fee === 0 ? 'Free' : `$${fee}`}</span>
              <span className="cal-status">
                {row.playerStatus === 'eligible-ready' && (
                  <span className="cal-badge cal-badge--ready">Ready</span>
                )}
                {row.playerStatus === 'eligible-resting' && (
                  <span className="cal-badge cal-badge--resting">
                    Resting {row.restingSecondsLeft}s
                  </span>
                )}
                {row.playerStatus === 'ineligible' && (
                  <span className="cal-badge cal-badge--locked">Locked</span>
                )}
                {row.playerStatus === 'no-horse' && (
                  <span className="cal-badge cal-badge--locked">No Horse</span>
                )}
              </span>
              <span className="cal-action">
                {canEnter && (
                  <button
                    className={`cal-enter-btn ${aiOnly ? 'ai-only' : ''}`}
                    onClick={() => onEnterRace(rc, aiOnly)}
                    disabled={!canAfford}
                  >
                    {aiOnly ? 'Watch & Bet' : 'Enter →'}
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### §5.3 Calendar CSS

Add to `horse_racing/styles.css`:

```css
.calendar-wrap {
  padding: 1rem;
}

.calendar-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 0.25rem;
}

.calendar-subtitle {
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 1.25rem;
}

.calendar-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-header-row {
  display: grid;
  grid-template-columns: 1fr 80px 100px 70px 120px 100px;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--muted);
  letter-spacing: 0.06em;
  padding: 0 0.75rem;
  text-transform: uppercase;
}

.calendar-row {
  display: grid;
  grid-template-columns: 1fr 80px 100px 70px 120px 100px;
  gap: 0.5rem;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
  font-size: 0.85rem;
}

.calendar-row.eligible-ready  { border-left: 3px solid var(--green); }
.calendar-row.eligible-resting { border-left: 3px solid var(--yellow); }
.calendar-row.ineligible       { opacity: 0.45; }

.cal-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}

.cal-badge--ready   { background: rgba(52,211,153,0.15); color: var(--green); }
.cal-badge--resting { background: rgba(251,191,36,0.15);  color: var(--yellow); }
.cal-badge--locked  { background: rgba(138,143,168,0.1);  color: var(--muted); }

.cal-enter-btn {
  padding: 4px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 5px;
  border: 1px solid var(--accent);
  background: rgba(108,142,247,0.12);
  color: var(--accent);
  cursor: pointer;
  transition: background 0.15s;
}

.cal-enter-btn:hover { background: rgba(108,142,247,0.22); }

.cal-enter-btn.ai-only {
  border-color: var(--yellow);
  background: rgba(251,191,36,0.1);
  color: var(--yellow);
}
```

---

## §6 New Python Tests (64→66)

Add to `tests/test_integration.py`:

```python
def test_create_ai_race_returns_full_field() -> None:
    """create_ai_race returns a race with 6 AI horses and ai_only=True."""
    session = load_game('horse_racing', seed=42)
    data = session.files.data
    race_classes = list(data.get('race_classes', [{}]))
    race_class = dict(race_classes[0])

    result = session.executor.call('create_ai_race', race_class, data)
    assert result is not None
    if isinstance(result, (list, tuple)) and len(result) == 2:
        race, err = result
    else:
        race = result
    assert race is not None
    race_dict = dict(race)
    assert race_dict.get('ai_only') is True
    parts = list(race_dict.get('participants', []))
    assert len(parts) == 6
    # None should be player-owned
    for p in parts:
        p_dict = dict(p)
        horse = dict(p_dict.get('horse', {}))
        assert horse.get('player_owned') is not True

def test_create_ai_race_has_valid_odds() -> None:
    """All participants in an AI race have odds > 1.0."""
    session = load_game('horse_racing', seed=99)
    data = session.files.data
    race_class = dict(list(data.get('race_classes', [{}]))[0])

    result = session.executor.call('create_ai_race', race_class, data)
    if isinstance(result, (list, tuple)) and len(result) == 2:
        race, _ = result
    else:
        race = result
    assert race is not None
    parts = list(dict(race).get('participants', []))
    for p in parts:
        odds = float(dict(p).get('odds', 0))
        assert odds > 1.0, f"Expected odds > 1.0, got {odds}"
```

---

## §7 Completion Criteria

- [ ] `studio_run_tests()` → **66 passed, 0 failed**
- [ ] `studio_build()` → exits 0
- [ ] Back button renders in a 40px navbar strip, not overlapping game UI
- [ ] Clicking "← Arcade" from any game returns to index page
- [ ] Stable tab: horse picker still works (select horse → enter race)
- [ ] Betting tab: resting horse → banner "Horse is Resting — AI-only race"
- [ ] Calendar tab visible as 5th tab
- [ ] Calendar shows all 5 race tiers with correct status per horse
- [ ] Clicking "Enter →" on ready row enters normal race
- [ ] Clicking "Watch & Bet" on resting row enters AI-only race (no player horse in field)
- [ ] AI-only race: player can bet Win/Place/Show → winnings collected if correct
- [ ] AI-only race: player horse career stats NOT updated after race
- [ ] `docs/state/current.md` updated to Phase 2r certified

---

## §8 Quick Reference

| Item | Value |
|---|---|
| Python floor | 64 → 66 / 0 / 0 |
| TypeScript floor | 29 / 0 / 0 (unchanged) |
| New Lua function | `create_ai_race(race_class, data)` |
| AI-only race marker | `race.ai_only = true` |
| Nav bar height | 40px (shrink from game's 100vh) |
| Calendar tab index | 5 (after History) |
| Resting check | `(horse.cooldown_until ?? 0) > Date.now()` |

---

*RFDGameStudio Phase 2r | June 2026 | RFD IT Services Ltd.*
*Resting horses watch from the rail. The betting window stays open.*
