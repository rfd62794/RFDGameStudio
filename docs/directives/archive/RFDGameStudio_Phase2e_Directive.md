# RFDGameStudio — Phase 2e Directive: Full Example Parity

*June 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 32 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 15 passed, 0 failed, 0 skipped.
> If either count differs, stop and report — do not proceed.

---

## §0 Context

**Goal:** Full feature and visual parity with `examples/horse-racing-&-breeding/`.
The example is the reference. Where behavior differs, the example wins.

**What's missing (prioritized):**

*Functional — affects gameplay:*
1. **Persistence** — state resets on refresh. Example saves to localStorage.
2. **Starter horse seeding** — we generate 3 random horses; example uses Vanguard Spirit + Starlight Dream from data.yaml `starter_horses`.
3. **Cooldown ticker** — resting badges don't update in real-time. Example runs a 1s interval.
4. **Skip race** — no way to generate a new race without betting. Example has "Skip & New Race."
5. **Rename horse** — not implemented in StableTab. Example has inline rename.
6. **Clear bets with refund** — not implemented. Example refunds all bet amounts.
7. **Purchase starter stock** — no way to buy replacement horses. Example has auction in BettingOffice.

*UI/polish — affects feel:*
8. No Lucide icons — header has plain text. Example has Trophy, History, etc.
9. No Framer Motion — tab transitions are instant. Example has smooth fade/slide.
10. Header is minimal — example has sticky styled header with logo brand + bank balance widget.
11. Footer is absent — example has "GAME RULES · PEDIGREE GENETICS DATA."
12. History tab is a basic table — example has rich styled cards with standings.
13. Mobile tab navigation — example has a second tab row for small screens.
14. Stable cooldown badge — example shows "Resting Xm Xs" overlay on resting horses.

**What is NOT in scope:**
- No new Lua functions
- No Python test changes — floor stays 32/0/0
- No changes to Python runtime or MCP server

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `ts/package.json` | Modify | Add `framer-motion`, `lucide-react` |
| `ts/src/App.tsx` | Modify | Persistence, ticker, starter seeding, skip race, purchase starter, all handlers |
| `ts/src/components/StableTab.tsx` | Modify | Rename horse, cooldown badge, sell horse |
| `ts/src/components/BettingTab.tsx` | Modify | Clear bets with refund, purchase starter section |
| `ts/src/index.css` | Modify | Header, footer, history card, cooldown badge, mobile nav styles |
| `ts/tests/test_runtime.ts` | Modify | Add 2 new TS tests → floor 15→17 |

**Read-only — do not touch:**
All Python files, `studio/`, `studio_mcp/`, `games/`, `ts/src/engine/`.

---

## §2 Implementation

### §2.1 Install packages

```bash
cd ts && npm install framer-motion lucide-react
```

Verify both appear in `node_modules` before proceeding.

---

### §2.2 App.tsx — Persistence

Save key: `derby_sim_state_v1`

**On mount** (in the existing `useEffect`): after `loadGame` succeeds, attempt to
restore from localStorage before calling `buildInitialState`. If valid save exists,
use it. Otherwise use `buildInitialState` with starter horses from data.yaml.

```typescript
const safeGetStorage = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSetStorage = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch { }
};
```

**Save schema** (serialize to JSON on every `gameState` change via `useEffect`):
```typescript
{
  funds: number,
  horses: Horse[],          // snake_case field names
  race_history: RaceHistoryEntry[],
  unlocked_slots: number,
}
```

**On restore:** validate that `horses` is a non-empty array before trusting the
save. If validation fails, fall through to fresh start with starter horses.

**Starter horse seeding** (when no valid save exists):
Read `data.yaml.starter_horses` array and use those two horses as the initial
stable. Do NOT generate random horses on a fresh start.

```typescript
// In buildInitialState — replace the random generation loop with:
const starterHorses = data['starter_horses'] as Array<Record<string, unknown>>;
const horses = starterHorses.map(h => luaHorseToTs(h));
```

---

### §2.3 App.tsx — Cooldown Ticker

Add a 1-second interval that increments a ticker value. Pass `ticker` to StableTab
so resting badges refresh without a full re-render.

```typescript
const [ticker, setTicker] = useState(0);

useEffect(() => {
  const t = setInterval(() => setTicker(prev => prev + 1), 1000);
  return () => clearInterval(t);
}, []);
```

Pass `ticker` to StableTab as a prop. StableTab uses it to derive live cooldown
display (`Math.max(0, Math.ceil((horse.cooldown_until - Date.now()) / 1000))`).

---

### §2.4 App.tsx — Skip Race

Add `handleSkipRace`:
```typescript
const handleSkipRace = useCallback(() => {
  if (!session || !gameState) return;
  const race = buildRace(session, gameState.horses);
  setGameState(prev => prev ? { ...prev, current_race: race } : prev);
}, [session, gameState]);
```

Pass to BettingTab as `onSkipRace`. BettingTab shows a "New Race" button that calls
it, also clearing `betEntries`.

---

### §2.5 App.tsx — Rename Horse

```typescript
const handleRenameHorse = useCallback((id: string, newName: string) => {
  setGameState(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      horses: prev.horses.map(h => h.id === id ? { ...h, name: newName.trim() } : h),
    };
  });
}, []);
```

Pass to StableTab as `onRenameHorse`.

---

### §2.6 App.tsx — Sell Horse

```typescript
const handleSellHorse = useCallback((id: string) => {
  if (!session || !gameState) return;
  const horse = gameState.horses.find(h => h.id === id);
  if (!horse) return;
  const price = call(session, 'calculate_horse_price', horse) as number;
  setGameState(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      funds: prev.funds + price,
      horses: prev.horses.filter(h => h.id !== id),
    };
  });
}, [session, gameState]);
```

Pass to StableTab as `onSellHorse`.

---

### §2.7 App.tsx — Purchase Starter Stock

```typescript
const handlePurchaseStarter = useCallback((gender: 'Stallion' | 'Mare', price: number) => {
  if (!session || !gameState) return;
  const data = session.files.data as Record<string, unknown>;
  const stable = (data['stable'] as Record<string, unknown>) ?? {};
  const minStat = (stable as Record<string, unknown>)['starter_min_stat'] as number ?? 35;
  const maxStat = (stable as Record<string, unknown>)['starter_max_stat'] as number ?? 55;
  const prefixes = data['name_prefixes'];
  const suffixes = data['name_suffixes'];
  const coatColors = data['coat_colors'];
  const silkColors = data['silk_colors'];
  const options = { min_stat: minStat, max_stat: maxStat, generation: 1,
                    player_owned: true, gender };
  const raw = call(session, 'generate_horse', options, coatColors, silkColors,
                   prefixes, suffixes) as Record<string, unknown>;
  const horse = luaHorseToTs({ ...raw, player_owned: true });
  setGameState(prev => {
    if (!prev) return prev;
    return { ...prev, funds: prev.funds - price, horses: [...prev.horses, horse] };
  });
}, [session, gameState]);
```

> ⚠️ NOTE: Add `starter_min_stat: 35` and `starter_max_stat: 55` to
> `data.yaml` under the `stable` block. Also add to fixtures.

Pass to BettingTab as `onPurchaseStarter`.

---

### §2.8 App.tsx — Styled Header

Replace the existing minimal `<header>` with a styled sticky header matching the
example. Use Lucide `Trophy` icon for the logo. Tab navigation lives in the header
on desktop (hidden on mobile). Bank balance widget on the right.

Import from lucide-react:
```typescript
import { Trophy, History, Coins } from 'lucide-react';
```

Header structure:
```tsx
<header className="app-header-styled">
  <div className="header-brand">
    <div className="header-logo"><Trophy size={18} /></div>
    <div>
      <div className="header-title">DERBY SIM <span className="header-version">v1.2</span></div>
      <div className="header-subtitle">CHAMPIONSHIP SEASON • RACING & BREEDING</div>
    </div>
  </div>

  {/* Desktop tab nav */}
  {!isRacingActive && (
    <nav className="header-tabs">
      {tabs.map(t => (
        <button key={t['id'] as string}
          className={`header-tab-btn${activeTab === t['id'] ? ' active' : ''}`}
          onClick={() => setActiveTab(t['id'] as string)}>
          {t['label'] as string}
        </button>
      ))}
    </nav>
  )}

  <div className="header-bank">
    <div className="bank-icon"><Coins size={14} /></div>
    <div>
      <div className="bank-label">STABLE BANK</div>
      <div className="bank-amount">${gameState.funds.toLocaleString()}</div>
    </div>
  </div>
</header>
```

Remove the old `<nav className="tab-bar">` — tabs now live in the header.

---

### §2.9 App.tsx — Framer Motion Tab Transitions

Wrap the tab content switch in `AnimatePresence`:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15 }}
  >
    {/* tab content */}
  </motion.div>
</AnimatePresence>
```

---

### §2.10 App.tsx — Mobile Tab Navigation

Add a second tab row below the header, visible only on small screens:

```tsx
{!isRacingActive && (
  <div className="mobile-tab-bar">
    {tabs.map(t => (
      <button key={t['id'] as string}
        className={`mobile-tab-btn${activeTab === t['id'] ? ' active' : ''}`}
        onClick={() => setActiveTab(t['id'] as string)}>
        {t['label'] as string}
      </button>
    ))}
  </div>
)}
```

---

### §2.11 App.tsx — Footer

Add below `</main>`:

```tsx
<footer className="app-footer">
  <span className="footer-copy">© 2026 DERBY SIMULATOR. ALL RIGHTS RESERVED.</span>
  <div className="footer-links">
    <span>GAME RULES</span>
    <span className="footer-sep">•</span>
    <span>PEDIGREE GENETICS DATA</span>
  </div>
</footer>
```

---

### §2.12 App.tsx — History Tab Styled Cards

Replace the current basic table history with styled cards matching the example:

Each history entry card:
- Header row: race name + distance badge on left, prize pool on right
- Two columns: Official Standings (ranks 1-3 with player badge) + payouts
- Dark surface background, border, subtle shadow

```tsx
{gameState.race_history.map((entry, i) => (
  <div key={i} className="history-card">
    <div className="history-card-header">
      <div>
        <span className="history-race-name">{entry.race_name}</span>
        <span className="history-distance-badge">{entry.distance}m</span>
      </div>
      <span className="history-purse">Purse: ${entry.prize_pool}</span>
    </div>
    <div className="history-standings">
      {entry.results.slice(0, 3).map(r => (
        <div key={r.rank} className="history-standing-row">
          <span className={`rank-badge rank-${r.rank}`}>#{r.rank}</span>
          <span className="history-horse-name">{r.horse_name}</span>
          {r.player_owned && <span className="badge-player">You</span>}
          {r.payout > 0 && <span className="history-payout">+${r.payout}</span>}
        </div>
      ))}
    </div>
  </div>
))}
```

---

### §2.13 StableTab.tsx — Rename Horse

Add inline rename UI to each horse card. On click of horse name, show a text input.
On blur or Enter, call `onRenameHorse(horse.id, newName)`. On Escape, cancel.

```typescript
// Local state per card
const [editingId, setEditingId] = useState<string | null>(null);
const [editName, setEditName] = useState('');
```

---

### §2.14 StableTab.tsx — Sell Horse Button

Add a "Sell" button to each horse card below the stats. Shows estimated sale price
(read from `horse.price` or calculate via Lua if already wired). Requires confirm
click or just one click — match example behavior (single click with price shown).

---

### §2.15 StableTab.tsx — Cooldown Badge

When `horse.cooldown_until > Date.now()`, show a resting overlay on the horse card:

```tsx
{horse.cooldown_until > Date.now() && (
  <div className="cooldown-badge">
    Resting {Math.ceil((horse.cooldown_until - Date.now()) / 60000)}m
    {Math.ceil(((horse.cooldown_until - Date.now()) % 60000) / 1000)}s
  </div>
)}
```

`ticker` prop ensures this recomputes every second.

---

### §2.16 BettingTab.tsx — Clear Bets

Add "Clear Bets" button to the bet slip panel that calls `onClearBets()`.
`onClearBets` in App.tsx refunds all active bet amounts to funds:

```typescript
const handleClearBets = useCallback(() => {
  // BettingTab manages betEntries locally — pass a callback that resets them
  // and refunds nothing since bets haven't been deducted yet (they're deducted
  // on Run Race). Just clear the entries.
  setBetEntries({});  // handled inside BettingTab
}, []);
```

> ⚠️ NOTE: Bets are NOT deducted from funds until `handleRace` runs. The "clear"
> action just empties `betEntries` in BettingTab's local state. No refund needed
> since no money was taken yet. This matches the example's flow.

---

### §2.17 BettingTab.tsx — Purchase Starter Stock

Add a "Starter Market" section below the race table when the player has fewer than
`unlockedSlots` horses. Shows two buttons: "Buy Stallion ($400)" and "Buy Mare ($400)".

```tsx
{playerHorses.length < unlockedSlots && (
  <div className="starter-market">
    <h3>Starter Market</h3>
    <p>Acquire replacement foundation stock to grow your stable.</p>
    <div className="starter-buttons">
      <button onClick={() => onPurchaseStarter('Stallion', 400)}
        disabled={funds < 400}>
        Buy Stallion ($400)
      </button>
      <button onClick={() => onPurchaseStarter('Mare', 400)}
        disabled={funds < 400}>
        Buy Mare ($400)
      </button>
    </div>
  </div>
)}
```

Pass `playerHorses` (filtered `horses.filter(h => h.player_owned)`), `unlockedSlots`,
and `onPurchaseStarter` as props.

---

### §2.18 index.css — New Styles

Add all new CSS classes. Do not remove any existing classes.

Classes to add:
- `.app-header-styled` — sticky, blurred background, flex row, border-bottom
- `.header-brand` — flex row, gap, logo icon + text
- `.header-logo` — green accent box, border, rounded
- `.header-title` — bold, tracking-tight
- `.header-version` — small, accent color
- `.header-subtitle` — tiny, muted, uppercase
- `.header-tabs` — flex row, hidden on mobile
- `.header-tab-btn` — tab button base style
- `.header-tab-btn.active` — accent color + border-bottom
- `.header-bank` — flex row, border, rounded, padding
- `.bank-label` — tiny, muted, uppercase
- `.bank-amount` — bold, green
- `.mobile-tab-bar` — flex, hidden on desktop (show on max-width: 768px)
- `.mobile-tab-btn` — mobile tab style
- `.mobile-tab-btn.active` — active state
- `.app-footer` — border-top, flex, justify-between, tiny text
- `.footer-copy` — bold dark text
- `.footer-links` — flex gap, muted hover
- `.footer-sep` — lighter color
- `.history-card` — surface, border, rounded, padding, shadow
- `.history-card-header` — flex, justify-between, border-bottom, padding-bottom
- `.history-race-name` — bold, uppercase
- `.history-distance-badge` — small, muted, bg, rounded-full, margin-left
- `.history-purse` — accent green, mono, small, border, rounded
- `.history-standings` — flex column, gap
- `.history-standing-row` — flex, items-center, gap, font-small
- `.history-horse-name` — bold
- `.history-payout` — green, bold, mono, margin-left auto
- `.rank-badge` — small circle, bg, flex center, bold
- `.rank-badge.rank-1` — gold color
- `.rank-badge.rank-2` — silver color
- `.rank-badge.rank-3` — bronze color
- `.cooldown-badge` — small, amber, italic, margin-top
- `.starter-market` — surface2, border, rounded, padding, margin-top

---

## §3 data.yaml additions

Add to `stable` block:
```yaml
stable:
  starter_min_stat: 35
  starter_max_stat: 55
```

Apply same change to `tests/fixtures/horse_racing/data.yaml`.

---

## §4 Test Anchors

**Python floor (must not regress):**
`uv run pytest -v` → 32 passed, 0 failed, 0 skipped (unchanged)

**TypeScript floor:**
`cd ts && npx vitest run` → currently 15 passed. Target: **17 passed, 0 failed**

New TS tests (add to `ts/tests/test_runtime.ts`):

| # | Test | Behavior |
|---|---|---|
| 16 | `test_starter_horses_in_data_yaml` | `session.files.data.starter_horses` is array of length 2 |
| 17 | `test_starter_horse_has_required_fields` | First starter horse has `name`, `speed`, `stamina` fields |

---

## §5 Completion Criteria

- [ ] `uv run pytest -v` → 32 passed, 0 failed, 0 skipped (unchanged)
- [ ] `cd ts && npx vitest run` → 17 passed, 0 failed, 0 skipped
- [ ] `cd ts && npx vite build` → exits 0
- [ ] Fresh browser load: Vanguard Spirit + Starlight Dream appear in stable (not random horses)
- [ ] Refresh browser: stable state persists — same horses, same funds
- [ ] Skip race button visible in BettingTab — clicking generates new race
- [ ] Horse rename works: click name → edit → press Enter → name updates
- [ ] Sell horse works: button appears, click removes horse + adds funds
- [ ] Cooldown badge appears on horses that ran — counts down in real-time
- [ ] Clear bets button in bet slip — clears all entries
- [ ] Starter market visible when player has fewer horses than slots
- [ ] Header shows Derby Sim logo with Trophy icon + bank balance widget
- [ ] Tab transitions animate on switch
- [ ] Footer visible at bottom: GAME RULES · PEDIGREE GENETICS DATA
- [ ] History tab shows styled cards, not a basic table
- [ ] Mobile tab bar visible on small screens
- [ ] `docs/state/current.md` updated to Phase 2e certified

**Proof required:**
- Raw `uv run pytest -v` output (32/0/0)
- Raw `npx vitest run` output (17/0/0)
- Browser screenshot: stable with Vanguard Spirit + Starlight Dream
- Browser screenshot: styled header with logo visible
- Browser screenshot: history tab with a card after completing one race
- Browser screenshot: refresh → same state loaded

---

## §6 Quick Reference

| Item | Value |
|---|---|
| Python floor | 32 / 0 / 0 (unchanged) |
| TypeScript floor | 15 → 17 / 0 / 0 |
| localStorage key | `derby_sim_state_v1` |
| Starter horses | `data.yaml.starter_horses[0]` (Vanguard Spirit), `[1]` (Starlight Dream) |
| Ticker interval | 1000ms |
| New packages | `framer-motion`, `lucide-react` |
| Starter stock cost | $400 each (from data.yaml `stable.starter_horse_cost`) |
| Starter stat range | min 35, max 55 |
| Sell price | `calculate_horse_price(horse)` via Lua |
| Reference | `examples/horse-racing-&-breeding/` — behavior wins on any conflict |

---

*RFDGameStudio Phase 2e | June 2026 | RFD IT Services Ltd.*
*After this phase: Derby Sim is a complete, persistable, polished game.*
