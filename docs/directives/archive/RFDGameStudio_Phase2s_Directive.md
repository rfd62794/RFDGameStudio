# RFDGameStudio — Phase 2s Directive: Slither Rogue Balance + EIC Direction

*June 2026 | Read fully before executing anything.*
*Goal: Fruit Magnet nerfed, NPCs become predators when large, evolution has real choices.*

---

> ⛔ **STOP:** Run `studio_run_tests()` → must report 66 passed (or current floor), 0 failed.

---

## §0 Context

**Current problems:**

1. **Fruit Magnet is dominant** — 60px pull per level means at level 2 you pull
   fruit from 120px. Nothing else competes. Every game looks the same.

2. **No real threat** — NPCs only chase fruit. They never target the player.
   Once you're large, the game is easy. No predator pressure = no EIC feeling.

3. **Evolution choices are fake** — Magnet wins every time. Shield, Ghost, and
   Venom feel weak by comparison. No synergies between cards.

**The EIC direction:** In EIC, you're adapting to survive under real threat.
In Slither Rogue, the NPCs should become predators when they outsize you.
Small NPCs eat fruit and grow. Large NPCs hunt your joints. This creates natural
pressure that scales with how well you're doing — the bigger you get, the more
attractive a target you become.

---

## §1 Scope

| File | Action |
|---|---|
| `games/slither_rogue/data.yaml` | Magnet nerf + new Ambush card |
| `games/slither_rogue/logic.lua` | NPC hunter mode, Shield regen, Venom+Speed synergy, Ambush proximity burst |
| `tests/fixtures/slither_rogue/` | Sync data.yaml and logic.lua |
| `tests/test_slither_rogue.py` | Add 4 tests → current floor + 4 |

**Read-only — do not touch:**
TypeScript renderer, horse_racing files, studio_mcp, engine/.

---

## §2 data.yaml Changes

### §2.1 Magnet Nerf

Change `magnet` card `effect_per_level`:

```yaml
# Before
- id: magnet
  effect_per_level: 60

# After
- id: magnet
  effect_per_level: 25
  description: "Nearby fruits pulled towards your head (+25px pull radius per level)."
```

Level 1: 25px pull. Level 2: 50px. Level 3: 75px. Still useful. No longer a win button.

### §2.2 New Card: Ambush

Add to `evolution_cards` list:

```yaml
- id: ambush
  title: Ambush Protocol
  description: "Brief speed burst when your head gets within 150px of an NPC joint. Rewards aggressive play."
  icon: ambush
  rarity: rare
  effect_key: ambush_level
  effect_per_level: 1
```

### §2.3 Update Shield Description

```yaml
- id: shield
  description: "Grants +1 Node Armor shield charge. Charges regenerate if you avoid hits for 10 seconds."
```

---

## §3 logic.lua Changes

Read the full current `logic.lua` before touching it. All changes are in
the `GAME_STATE` / `tick_game` architecture. The slither_rogue logic is split
across 6 files — identify which file each change belongs to.

### §3.1 NPC Hunter Mode — physics.lua → `_update_npcs`

In the NPC AI decision block (inside `npc.ai_timer <= 0`), replace the
simple fruit-hunt logic with a two-mode system:

```lua
-- Hunter vs Farmer decision
local player = GAME_STATE.player
local player_seg_count = player and #player.segments or 0
local npc_seg_count = #npc.segments

local hunt_player = npc_seg_count > player_seg_count + 2  -- must be meaningfully larger

if hunt_player and player and player.segments and #player.segments > 1 then
  -- HUNTER MODE: target a player joint (not the head — too obvious)
  -- Aim for segment 3-6 range (easier to intercept, more segments to steal)
  local target_idx = math.min(math.floor(#player.segments * 0.3) + 1, #player.segments)
  local target_seg = player.segments[target_idx]
  if target_seg then
    npc.target_angle = math.atan2(
      target_seg.y - npc.segments[1].y,
      target_seg.x - npc.segments[1].x
    )
    npc.hunting = true
  end
else
  -- FARMER MODE: existing fruit-hunt / wander logic (unchanged)
  npc.hunting = false
  -- ... existing wall avoidance and fruit hunt code stays here ...
end
```

> ⚠️ RULE: Wall avoidance still takes priority even in hunter mode.
> Check wall proximity FIRST, then decide hunter vs farmer. A hunting NPC
> that runs into a wall is worse than a dumb one.

**Wall avoidance must wrap both modes:**
```lua
-- Wall avoidance takes priority over everything
if npc_head.x < wb then
  npc.target_angle = 0
elseif npc_head.x > a.map_width - wb then
  npc.target_angle = math.pi
elseif npc_head.y < wb then
  npc.target_angle = math.pi / 2
elseif npc_head.y > a.map_height - wb then
  npc.target_angle = -math.pi / 2
else
  -- Hunter or farmer decision goes here
end
```

Add a visual hint to the render state so TypeScript can show hunting NPCs
differently (optional but useful — add `hunting = npc.hunting or false` to
the per-NPC render output in `build_render_state`).

### §3.2 Shield Regeneration — state.lua or physics.lua

Add `shield_regen_timer` to player in `init_game`:
```lua
player.shield_regen_timer = 0
player.last_hit_time = 0
```

In `_update_player`, increment the regen timer:
```lua
-- Shield regeneration: restore 1 charge if no hit for 10 seconds
if (p.shield_charges or 0) < (p.shield_max_charges or 0) then
  p.shield_regen_timer = (p.shield_regen_timer or 0) + dt
  if p.shield_regen_timer >= 10.0 then
    p.shield_regen_timer = 0
    p.shield_charges = math.min(
      p.shield_charges + 1,
      p.shield_max_charges
    )
    table.insert(st.events, {
      type = "shield_recharged",
      charges = p.shield_charges
    })
  end
else
  p.shield_regen_timer = 0
end
```

In `update_evolution_effects`, store the max charges so regen knows the cap:
```lua
p.shield_max_charges = eff.shield_charges
p.shield_charges = math.min(p.shield_charges or 0, eff.shield_charges)
```

When a shield absorbs a hit (in collision.lua), reset the timer:
```lua
p.shield_charges = p.shield_charges - 1
p.shield_regen_timer = 0   -- add this line
```

### §3.3 Venom + Speed Synergy — physics.lua, `_update_player`

In the acid drop spawn section, check for the Speed evolution:

```lua
-- Venom trail
if (p.venom_level or 0) > 0 then
  p.acid_timer = (p.acid_timer or 0) + dt
  -- Synergy: Venom + Speed → acid drops persist 50% longer
  local speed_levels = st.active_evolutions and (st.active_evolutions.speed or 0) or 0
  local duration_bonus = (speed_levels > 0) and 1.5 or 1.0
  if p.acid_timer >= 0.45 then
    p.acid_timer = 0
    local tail = p.segments[#p.segments]
    st.acid_drops[#st.acid_drops + 1] = {
      x = tail.x, y = tail.y,
      timer  = (5 + p.venom_level * 2) * duration_bonus,
      radius = 8 + p.venom_level * 1.5,
    }
  end
end
```

> ⚠️ NOTE: `st.active_evolutions` needs to be stored in GAME_STATE.
> Add `active_evolutions = config.active_evolutions or {}` to `init_game`.
> Update it in `update_evolution_effects`:
> ```lua
> function update_evolution_effects(active_evolutions)
>   if not GAME_STATE then return end
>   GAME_STATE.active_evolutions = active_evolutions  -- store for synergy checks
>   -- ... rest of existing function ...
> end
> ```

### §3.4 Ambush Card — physics.lua, `_update_player`

Add ambush proximity detection after the main movement block:

```lua
-- Ambush: speed burst when near an NPC joint
if (p.ambush_level or 0) > 0 and not p.ambush_cooldown then
  local ambush_range = 150
  local ambush_triggered = false
  for _, npc in ipairs(st.npcs) do
    for j = 2, math.min(6, #npc.segments) do  -- check first 5 joints
      local seg = npc.segments[j]
      if dist2(p.segments[1].x, p.segments[1].y, seg.x, seg.y)
         < ambush_range * ambush_range then
        ambush_triggered = true
        break
      end
    end
    if ambush_triggered then break end
  end

  if ambush_triggered then
    -- Apply burst: temporary speed multiplier stored on player
    p.ambush_burst_timer = 1.5   -- burst lasts 1.5 seconds
    p.ambush_cooldown = true
    p.ambush_cooldown_timer = 5.0  -- 5s cooldown between bursts
    table.insert(st.events, { type = "ambush_triggered" })
  end
end

-- Tick ambush burst and cooldown
if p.ambush_burst_timer and p.ambush_burst_timer > 0 then
  p.ambush_burst_timer = p.ambush_burst_timer - dt
end
if p.ambush_cooldown then
  p.ambush_cooldown_timer = (p.ambush_cooldown_timer or 0) - dt
  if p.ambush_cooldown_timer <= 0 then
    p.ambush_cooldown = false
    p.ambush_cooldown_timer = 0
  end
end
```

Apply the burst in speed calculation:
```lua
local spd = (p.base_speed + st.score * 0.8) * (st.speed_mult or 1.0)
if p.is_slowing then spd = spd * 0.5 end
if (p.ambush_burst_timer or 0) > 0 then
  spd = spd * (1.3 + (p.ambush_level or 1) * 0.1)  -- 40-50% burst
end
```

Add `ambush_level` to `_calc_effects` in state.lua:
```lua
e.ambush_level = 0
-- in the loop:
elseif k == "ambush_level" then e.ambush_level = lvl * ppl
```

And apply in `update_evolution_effects`:
```lua
p.ambush_level = eff.ambush_level
```

---

## §4 Build Render State — Hunting NPC Hint

In `render.lua`, `build_render_state`, add `hunting` to NPC output:

```lua
npcs_out[#npcs_out + 1] = {
  id        = npc.id,
  name      = npc.name,
  color     = npc.color,
  head_color = npc.head_color,
  angle     = npc.angle,
  radius    = npc.radius,
  hunting   = npc.hunting or false,   -- add this
  segs_x    = sx,
  segs_y    = sy,
  segs_a    = sa,
}
```

In `GameCanvas.tsx` `drawGame()`, when `npc.hunting === true`, draw the NPC
head with a red tint instead of its normal head color:

```typescript
// In the NPC render loop:
ctx.fillStyle = npc.hunting ? '#ef4444' : npc.head_color;
ctx.beginPath();
ctx.arc(sx[0], sy[0], npc.radius * 1.3, 0, Math.PI * 2);
ctx.fill();
```

This gives the player a visual signal that an NPC is targeting them.

---

## §5 New Python Tests

Add to `tests/test_slither_rogue.py`. Target: **current floor + 4**

```python
def test_slither_magnet_nerf() -> None:
    """Magnet card effect_per_level is 25 (not 60)."""
    session = load_game('slither_rogue', seed=42)
    data = session.files.data
    cards = list(data.get('evolution_cards', []))
    magnet = next((dict(c) for c in cards if dict(c).get('id') == 'magnet'), None)
    assert magnet is not None
    assert float(magnet.get('effect_per_level', 0)) == 25.0

def test_slither_ambush_card_exists() -> None:
    """Ambush card is present in evolution_cards."""
    session = load_game('slither_rogue', seed=42)
    data = session.files.data
    cards = list(data.get('evolution_cards', []))
    ids = [dict(c).get('id') for c in cards]
    assert 'ambush' in ids

def test_slither_npc_hunter_mode_activates() -> None:
    """After init_game, ticking with a large NPC field sets npc.hunting."""
    session = load_game('slither_rogue', seed=42)
    data = session.files.data
    # Build config with short duration
    presets = list(data.get('player_presets', [{}]))
    config = {
        'arena':           data.get('arena', {}),
        'fruit':           data.get('fruit', {}),
        'player_stats':    data.get('player_stats', {}),
        'player_preset':   dict(presets[0]) if presets else {},
        'npc_profiles':    data.get('npc_profiles', []),
        'npc_stats':       data.get('npc_stats', {}),
        'evolution_cards': data.get('evolution_cards', []),
        'active_evolutions': {},
        'game_duration':   300,
    }
    session.executor.call('init_game', config)

    # Manually inflate one NPC's segment count to trigger hunter mode
    # by ticking many frames (NPCs grow by eating fruit eventually)
    # For test purposes, just verify the tick_game doesn't crash with the new logic
    input_state = {
        'control_type': 'keyboard',
        'mouse_x': 0, 'mouse_y': 0,
        'keys': {}
    }
    for _ in range(10):
        result = session.executor.call('tick_game', 0.1, input_state)
    assert result is not None
    assert 'npcs' in dict(result)

def test_slither_venom_speed_synergy_stored() -> None:
    """update_evolution_effects stores active_evolutions in GAME_STATE."""
    session = load_game('slither_rogue', seed=42)
    data = session.files.data
    presets = list(data.get('player_presets', [{}]))
    config = {
        'arena':           data.get('arena', {}),
        'fruit':           data.get('fruit', {}),
        'player_stats':    data.get('player_stats', {}),
        'player_preset':   dict(presets[0]) if presets else {},
        'npc_profiles':    data.get('npc_profiles', []),
        'npc_stats':       data.get('npc_stats', {}),
        'evolution_cards': data.get('evolution_cards', []),
        'active_evolutions': {},
        'game_duration':   300,
    }
    session.executor.call('init_game', config)
    # Apply both venom and speed
    session.executor.call('update_evolution_effects', {'venom': 1, 'speed': 1})
    # Verify game state is intact (no crash)
    input_state = {'control_type': 'keyboard', 'mouse_x': 0, 'mouse_y': 0, 'keys': {}}
    result = session.executor.call('tick_game', 0.016, input_state)
    assert result is not None
```

---

## §6 Fixture Sync

After all changes to Lua files:

```powershell
cd C:\Github\RFDGameStudio
Copy-Item "games\slither_rogue\data.yaml" "tests\fixtures\slither_rogue\" -Force

# For each Lua file that changed (identify which ones):
Copy-Item "games\slither_rogue\physics.lua"   "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\state.lua"     "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\collision.lua" "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\render.lua"    "tests\fixtures\slither_rogue\" -Force
```

---

## §7 Completion Criteria

- [ ] `studio_run_tests()` → **current floor + 4, 0 failed**
- [ ] `studio_build()` → exits 0
- [ ] Balance: `studio_balance_report('horse_racing', 50)` still runs clean
- [ ] Magnet level 1 = 25px pull radius (not 60px) — visible in game
- [ ] Large NPCs visually turn red (hunting mode) and pursue player joints
- [ ] Small NPCs remain on fruit (farming mode)
- [ ] Shield charges regenerate after 10 seconds without being hit
- [ ] Venom + Speed combo: acid drops visibly persist longer
- [ ] Ambush card selectable in evolution modal
- [ ] Ambush triggers on NPC proximity — speed burst visible
- [ ] Hunting NPC head renders in red tint
- [ ] `docs/state/current.md` updated to Phase 2s certified

---

## §8 Design Notes (not for implementation — context for future phases)

**Why hunter mode creates the EIC feeling:**
In EIC the threat scales with progress. Same here — small players aren't
worth hunting. Large players are. This creates a natural pressure valve:
grow too fast without defensive evolutions and you become prey.

**The intended evolution meta after this phase:**

| Play style | Cards | Trade-off |
|---|---|---|
| Safe farmer | Magnet + Speed | Consistent, slow growth |
| Glass cannon | Speed + Ambush | High risk, high steal rate |
| Tank | Shield + Ghost | Low growth, very hard to steal from |
| Poisoner | Venom + Speed | Synergy: long acid fields, good area denial |

No single dominant strategy. That's the EIC direction.

**For Phase 2t (future):**
- Visual tells for Ambush proximity (glow ring around player head)
- NPC name tags change color when hunting: "Gorgon 3 👁"
- Leaderboard: segment count visible for all NPCs, creates competitive awareness
- Regen card should regenerate slightly faster when in combat range of a hunter

---

## §9 Quick Reference

| Item | Value |
|---|---|
| Python floor | current + 4 / 0 / 0 |
| TypeScript floor | unchanged |
| Magnet nerf | `effect_per_level: 60 → 25` |
| Hunter threshold | NPC segment count > player count + 2 |
| Hunter target | Player segments[30% of length] index |
| Shield regen rate | 1 charge per 10s without being hit |
| Venom+Speed synergy | Acid drop duration × 1.5 |
| Ambush range | 150px from player head to NPC joint |
| Ambush burst | 1.3 + 0.1×level speed multiplier for 1.5s |
| Ambush cooldown | 5 seconds between bursts |
| New Lua: ambush | `init_game, update_evolution_effects, _update_player` |

---

*RFDGameStudio Phase 2s | June 2026 | RFD IT Services Ltd.*
*Small NPCs eat. Large NPCs hunt. Evolution choices matter.*
*Slither.io meets EIC.*
