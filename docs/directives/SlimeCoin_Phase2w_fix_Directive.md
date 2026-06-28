# SlimeCoin — Phase 2w-fix Directive: Shooter Mechanics + Starting Density

*June 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Must report **86 passed, 0 failed** (pytest) and **39 passed, 0 failed** (vitest).
> If counts differ, stop and report — do not proceed.

---

## §0 Context

### What's wrong (three issues, screenshot confirmed)

**Issue 1 — Dual-side spawning bug.** Coins appear on both sides of the shelf
simultaneously. Root cause: `fire_coin` fires on every game loop tick while the
key is held, not once per keypress. `input.fire` is not being reset correctly
between ticks in App.tsx.

**Issue 2 — Shooter position and direction wrong.** The current shooter is a
single node at the bottom-center of the screen (y=450) that fires upward.

**Correct design (from Raccoin reference + Design.md):**
- **Two shooters at the TOP of the shelf** — left edge and right edge
- **Left arrow** → fires from the **right** shooter, coin travels **left** across
  the shelf
- **Right arrow** → fires from the **left** shooter, coin travels **right** across
  the shelf
- Each arrow press fires **one coin** from that side — not an aim accumulation
- No SPACE key needed; arrows are the fire trigger

**Issue 3 — Shelf too sparse at start.** Zero coins on the shelf at game start.
The Raccoin reference shows a fully packed shelf from round 1. The pusher needs
something to push immediately or the game feels empty.

### What this phase changes

Three surgical fixes. No new features. No new chip card logic. No visual polish.

---

## §1 Scope

| File | Status | Action |
|---|---|---|
| `games/slime_coin/logic.lua` | Modify | Rewrite `fire_coin` (side param), rewrite `tick_game` input, add starting coins to `init_game` |
| `ts/src/games/slime_coin/App.tsx` | Modify | Rewrite keyboard handler (arrows = fire, not aim); reset fire correctly |
| `ts/src/games/slime_coin/components/BoardCanvas.tsx` | Modify | Draw two top shooters; remove bottom shooter and aim indicator |
| `ts/src/games/slime_coin/types.ts` | Modify | Add `side` field to `SlimeCoinInput` |

**Read-only — do not touch:**
`data.yaml`, `systems.yaml`, `ui.yaml`, `config.ts`, `CardSelectModal.tsx`,
`PocketPicker.tsx`, `styles.css`, all test files (unless existing tests break
due to `fire_coin` signature change — see §2 note)

---

## §2 Implementation

### `logic.lua` — Change 1: Starting coins in `init_game`

After the obstacles block in `init_game`, add a starting coin grid on the shelf.
40 coins, 5 rows × 8 columns, starting at x=30, spacing 45px horizontal, 28px
vertical. Mix of basic/heavy/light types in rotation.

```lua
-- Populate starting shelf (5 rows × 8 cols = 40 coins)
local start_types = {'basic', 'basic', 'basic', 'heavy', 'light'}
for row = 0, 4 do
  for col = 0, 7 do
    local idx = (row * 8 + col) % 5 + 1
    local type_id = start_types[idx]
    local slime = SLIME_TYPES[type_id]
    table.insert(GAME_STATE.shelf_coins, {
      id = next_id(),
      type_id = type_id,
      x = 30 + col * 45,
      y = 80 + row * 28,
      vx = 0,
      vy = 0,
      mass = slime.mass,
      radius = slime.radius,
      value = slime.value,
    })
  end
end
```

> ⚠️ RULE: This is a local Lua table — `#start_types` is safe. Do NOT apply
> the `collect()` pattern here. `collect()` is only for Python list proxies
> received from lupa as function parameters.

---

### `logic.lua` — Change 2: Rewrite `fire_coin`

Replace the current `fire_coin` function entirely. New signature: `fire_coin(type_id, side)`.

**Left arrow → right shooter, coin fires LEFT:**
- Spawns at x = `BOARD.shelf_width - 20`, y = 15
- vx = -280 (leftward), vy = 80 (slight downward arc)

**Right arrow → left shooter, coin fires RIGHT:**
- Spawns at x = 20, y = 15
- vx = 280 (rightward), vy = 80 (slight downward arc)

```lua
function fire_coin(type_id, side)
  if GAME_STATE.hand_in <= 0 then
    return {error = 'No hand in remaining'}
  end

  local slime = SLIME_TYPES[type_id] or SLIME_TYPES.basic

  local spawn_x, vx
  if side == 'left' then
    -- Left arrow → right-side shooter → coin travels LEFT
    spawn_x = BOARD.shelf_width - 20
    vx = -280
  else
    -- Right arrow → left-side shooter → coin travels RIGHT
    spawn_x = 20
    vx = 280
  end

  local coin = {
    id = next_id(),
    type_id = type_id,
    x = spawn_x,
    y = 15,
    vx = vx,
    vy = 80,
    mass = slime.mass,
    radius = slime.radius,
    value = slime.value,
  }

  table.insert(GAME_STATE.shelf_coins, coin)
  GAME_STATE.hand_in = GAME_STATE.hand_in - 1

  -- Pocket coin effects
  if type_id == 'echo' then
    GAME_STATE.hand_in = GAME_STATE.hand_in + 5
  elseif type_id == 'giga' then
    coin.mass = coin.mass * 10
    coin.radius = coin.radius * 3
  end

  return {coin_id = coin.id, hand_in = GAME_STATE.hand_in}
end
```

> ⚠️ RULE: Remove `trigger_pocket_boom` call from this function (boom is a
> pocket coin that explodes on shelf contact, not on spawn — deferred to a
> later phase). Remove the aim_x angle calculation entirely.

---

### `logic.lua` — Change 3: Update `tick_game` input handling

In `tick_game`, replace the aim/fire input block with:

```lua
-- Handle fire input — one coin per keypress (fire resets each tick in TS)
if input.fire then
  local coin_type = input.pocket_coin_type or 'basic'
  local side = input.side or 'right'
  fire_coin(coin_type, side)
end

-- Remove: GAME_STATE.shooter_aim update (no longer used)
-- Remove: Return shooter_aim in the render state dict
```

Also remove `shooter_aim` from the returned state dict at the bottom of
`tick_game`. It is no longer a meaningful value.

> ⚠️ RULE: If existing Python tests call `fire_coin` with the old two-argument
> signature `(type_id, aim_x)`, update those test calls to use the new
> `(type_id, side)` signature. `side` values are `'left'` or `'right'`.
> Do NOT change the test assertions — only fix the call signature.

---

### `types.ts` — Update `SlimeCoinInput`

```typescript
export interface SlimeCoinInput {
  fire: boolean;
  side: 'left' | 'right';
  pocket_coin_type?: string;
}
```

Remove `aim_x` from the interface. If `aim_x` is referenced elsewhere in
types.ts, remove it there too.

---

### `App.tsx` — Rewrite keyboard handler

Replace the entire `handleKeyDown` switch block with:

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (!state || state.phase !== 'playing') return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      // Left arrow fires from RIGHT shooter, coin travels LEFT
      setInput({ fire: true, side: 'left', pocket_coin_type: state.pocket_coin_type ?? undefined });
      break;
    case 'ArrowRight':
      e.preventDefault();
      // Right arrow fires from LEFT shooter, coin travels RIGHT
      setInput({ fire: true, side: 'right', pocket_coin_type: state.pocket_coin_type ?? undefined });
      break;
    case 'p':
    case 'P':
      setShowPocketPicker(true);
      break;
    case 'Escape':
      setShowPocketPicker(false);
      break;
  }
};
```

> ⚠️ RULE: Remove the `ArrowLeft` aim accumulation and `ArrowRight` aim
> accumulation. Remove the `' '` (Space) case. There is no longer an aim
> state — each arrow press fires exactly one coin from the correct side.

**Fix fire reset in `tick`:** The current reset `if (input.fire) { setInput(prev => ({ ...prev, fire: false })); }`
is fine but runs async. Ensure `fire` is set to `false` immediately after the
Lua call returns within the same tick, not on the next render. Change the reset
to run before returning from tick:

```typescript
const tick = useCallback((dt: number) => {
  if (!state || state.phase !== 'playing') return;

  const currentInput = input;

  // Reset fire immediately so it only fires once per keypress
  if (currentInput.fire) {
    setInput(prev => ({ ...prev, fire: false }));
  }

  const result = call('tick_game', dt, currentInput) as SlimeCoinRenderState;
  // ... rest unchanged
}, [state, input, call, setState]);
```

**Update initial input state:**
```typescript
const [input, setInput] = useState<SlimeCoinInput>({ fire: false, side: 'right' });
```

**Update footer text:**
```tsx
<span>← Right shooter fires left | → Left shooter fires right | P: Pocket Coins</span>
```

**Remove:** `shooterAim` prop from `<BoardCanvas>` — it is no longer passed.
Update the `BoardCanvas` call to remove the prop.

---

### `BoardCanvas.tsx` — Rewrite shooter rendering

**Remove:**
- The single bottom shooter circle at y=460
- The aim indicator dashed line from bottom
- The `shooterAim` prop from the component interface

**Add two top shooters:**

```typescript
// Left-side shooter indicator (top-left of shelf, fires RIGHT)
// Visually positioned at LEFT edge of shelf — player presses RIGHT arrow
ctx.fillStyle = '#8b5cf6';
ctx.beginPath();
ctx.arc(60, 70, 12, 0, Math.PI * 2);
ctx.fill();
// Arrow pointing right
ctx.strokeStyle = '#c4b5fd';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(72, 70);
ctx.lineTo(88, 70);
ctx.lineTo(83, 65);
ctx.moveTo(88, 70);
ctx.lineTo(83, 75);
ctx.stroke();

// Right-side shooter indicator (top-right of shelf, fires LEFT)
// Player presses LEFT arrow
ctx.fillStyle = '#8b5cf6';
ctx.beginPath();
ctx.arc(440, 70, 12, 0, Math.PI * 2);
ctx.fill();
// Arrow pointing left
ctx.strokeStyle = '#c4b5fd';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(428, 70);
ctx.lineTo(412, 70);
ctx.lineTo(417, 65);
ctx.moveTo(412, 70);
ctx.lineTo(417, 75);
ctx.stroke();
```

**Update component signature:**
```typescript
// Remove shooterAim prop entirely
interface BoardCanvasProps {
  renderState: SlimeCoinRenderState | null;
}

export default function BoardCanvas({ renderState }: BoardCanvasProps) {
```

> ⚠️ RULE: The shooter indicators are drawn at fixed positions — they do not
> animate. No aim indicator, no moving arrow. Static glyphs only.

---

## §3 Completion Criteria

- [ ] `pytest -v` reports **86 passed, 0 failed, 0 skipped** (or higher if
  fire_coin test signatures required updating)
- [ ] `npx vitest run` reports **39 passed, 0 failed, 0 skipped**
- [ ] Left arrow fires one coin from right side traveling left — confirmed
  visually in browser
- [ ] Right arrow fires one coin from left side traveling right — confirmed
  visually in browser
- [ ] Each keypress fires exactly one coin (no duplicate spawns)
- [ ] Shelf starts with ~40 coins visible at game load
- [ ] Two static shooter indicators visible at top-left and top-right of shelf
- [ ] No bottom shooter or aim indicator visible
- [ ] Footer text updated

---

## §4 Quick Reference

| Issue | Root | Fix location |
|---|---|---|
| Dual-side spawning | fire reset async | App.tsx tick — reset before call |
| Wrong shooter direction/position | Old aim_x model | logic.lua fire_coin + App.tsx keys |
| Empty shelf start | No init coins | logic.lua init_game |
| Bottom shooter | Old design | BoardCanvas.tsx |

| Key | Shooter | Direction |
|---|---|---|
| ← Left arrow | Right-edge shooter | Coin fires LEFT |
| → Right arrow | Left-edge shooter | Coin fires RIGHT |
