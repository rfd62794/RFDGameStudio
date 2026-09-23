# RFDGameStudio — Phase 2h Directive: Lua Physics Architecture

*June 2026 | Read fully before executing anything.*
*This phase replaces logic.lua and GameCanvas.tsx only. No new features.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 38 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 17 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

**The problem with Phase 2g's architecture:**
Phase 2g called Lua for discrete events only — `spawn_fruit`, `decide_npc_action`,
`calculate_grade`. Physics lived in TypeScript's `updatePhysics()` and
`checkCollisions()`. This defeats the studio's core promise: same logic runs
identically in TypeScript, Python, and Rust.

**The correct architecture:**
- `GAME_STATE` global lives in the Lua VM — persists between calls in the same
  `GameSession` without reloading
- `init_game(config)` initializes the world once, stored in `GAME_STATE`
- `tick_game(dt, input)` runs ALL physics and collision in one Lua call per frame
- TypeScript's `GameCanvas` becomes a pure renderer: call tick, draw result
- `build_render_state()` returns compact flat arrays (faster to marshal than
  nested segment tables)

**What this phase delivers:**
- Replaced `games/slither_rogue/logic.lua` — full physics in Lua
- Replaced `ts/src/games/slither_rogue/components/GameCanvas.tsx` — pure renderer
- Updated `ts/src/games/slither_rogue/App.tsx` — calls `init_game` on start
- Updated `tests/test_slither_rogue.py` — tests tick_game and GAME_STATE
- Python floor: 38 → 42

---

## §1 Scope

| File | Action |
|---|---|
| `games/slither_rogue/logic.lua` | Full replace |
| `tests/fixtures/slither_rogue/logic.lua` | Sync after replace |
| `ts/src/games/slither_rogue/components/GameCanvas.tsx` | Full replace |
| `ts/src/games/slither_rogue/App.tsx` | Targeted edits |
| `tests/test_slither_rogue.py` | Add 4 new tests |

**Read-only — do not touch:**
`games/slither_rogue/data.yaml`, `systems.yaml`, `ui.yaml`,
all horse_racing files, `studio/`, `studio_mcp/`.

---

## §2 games/slither_rogue/logic.lua — Full Replace

Replace the entire file with the following. Do not preserve any existing content.

```lua
-- Slither Rogue — Full Game Logic
-- Architecture: GAME_STATE global persists in Lua VM between tick_game calls.
-- TypeScript calls init_game once, then tick_game(dt, input) every frame.
-- TypeScript is a pure renderer — no game logic.

-- ============================================================
-- UTILITIES
-- ============================================================

local function clamp(v, lo, hi)
  return math.max(lo, math.min(hi, v))
end

local function dist2(x1, y1, x2, y2)
  local dx, dy = x1-x2, y1-y2
  return dx*dx + dy*dy
end

local function normalize_angle(a)
  while a < -math.pi do a = a + math.pi*2 end
  while a >  math.pi do a = a - math.pi*2 end
  return a
end

local function build_segments(x, y, angle, length, radius)
  local segs = {}
  for i = 1, length do
    segs[i] = {
      x     = x - math.cos(angle) * (i-1) * radius * 1.6,
      y     = y - math.sin(angle) * (i-1) * radius * 1.6,
      angle = angle,
    }
  end
  return segs
end

local function spawn_fruit_from_config(cfg)
  local a, f = cfg.arena, cfg.fruit
  local golden = math.random() < (f.golden_chance or 0.08)
  local color  = golden and (f.golden_color or "#fbbf24")
                 or f.colors[math.random(#f.colors)]
  return {
    id        = "f" .. tostring(math.random(1000000)),
    x         = math.random() * (a.map_width  - 120) + 60,
    y         = math.random() * (a.map_height - 120) + 60,
    color     = color,
    points    = golden and (f.golden_points or 3) or (f.standard_points or 1),
    is_golden = golden,
    pulse_phase = math.random() * math.pi * 2,
  }
end

-- ============================================================
-- GLOBAL GAME STATE
-- ============================================================

GAME_STATE = nil

-- ============================================================
-- INIT
-- ============================================================

-- config keys expected:
--   arena, fruit, player_stats, player_preset {color, head_color},
--   npc_profiles[], npc_stats, evolution_cards[], active_evolutions{},
--   game_duration
function init_game(config)
  local a   = config.arena
  local ps  = config.player_stats
  local eff = _calc_effects(config.active_evolutions or {}, config.evolution_cards or {})

  local radius = (ps.initial_radius or 11) + (eff.wide_body_add or 0)
  local cx, cy = a.map_width/2, a.map_height/2

  local player = {
    is_npc            = false,
    color             = config.player_preset.color,
    head_color        = config.player_preset.head_color,
    segments          = build_segments(cx, cy, 0, ps.initial_length or 5, radius),
    angle             = 0,
    target_angle      = 0,
    base_speed        = ps.initial_speed or 160,
    radius            = radius,
    shield_charges    = eff.shield_charges or 0,
    magnetism_radius  = eff.magnetism_radius or 0,
    fruit_sense_range = eff.fruit_sense_range or 0,
    ghost_tail_count  = eff.ghost_tail_count or 0,
    regen_level       = eff.tail_growth_level or 0,
    venom_level       = eff.venom_trail_level or 0,
    regen_timer       = 0,
    acid_timer        = 0,
    is_slowing        = false,
    slow_timer        = 0,
  }

  local npcs = {}
  local ns   = config.npc_stats
  local prof = config.npc_profiles
  for i = 1, a.num_npcs do
    local p   = prof[((i-1) % #prof) + 1]
    local r   = ns.min_radius + math.random() * (ns.max_radius  - ns.min_radius)
    local spd = ns.min_speed  + math.random() * (ns.max_speed   - ns.min_speed)
    local len = ns.min_initial_length +
                math.floor(math.random() * (ns.max_initial_length - ns.min_initial_length + 1))
    local nx  = math.random() * (a.map_width  - 200) + 100
    local ny  = math.random() * (a.map_height - 200) + 100
    local na  = math.random() * math.pi * 2
    npcs[i] = {
      id           = "npc_" .. i,
      name         = p.name .. " " .. i,
      color        = p.color,
      head_color   = p.head_color,
      segments     = build_segments(nx, ny, na, len, r),
      angle        = na,
      target_angle = na,
      speed        = spd,
      radius       = r,
      is_slowing   = false,
      slow_timer   = 0,
      ai_timer     = math.random() * 0.4,
    }
  end

  local fruits = {}
  for i = 1, a.num_fruits do
    fruits[i] = spawn_fruit_from_config(config)
  end

  GAME_STATE = {
    config       = config,
    player       = player,
    npcs         = npcs,
    fruits       = fruits,
    acid_drops   = {},
    time_left    = config.game_duration or 300,
    score        = 0,
    peak_length  = ps.initial_length or 5,
    speed_mult   = eff.speed_multiplier or 1.0,
    events       = {},
  }
end

-- ============================================================
-- EVOLUTION HELPERS
-- ============================================================

function _calc_effects(active, cards)
  local e = {
    speed_multiplier=1.0, magnetism_radius=0, shield_charges=0,
    wide_body_add=0, fruit_sense_range=0, ghost_tail_count=0,
    tail_growth_level=0, venom_trail_level=0,
  }
  for _, card in ipairs(cards) do
    local lvl = active[card.id] or 0
    if lvl > 0 then
      local k, ppl = card.effect_key, card.effect_per_level
      if     k == "speed_multiplier"  then e.speed_multiplier  = e.speed_multiplier + lvl*ppl
      elseif k == "magnetism_radius"  then e.magnetism_radius  = lvl*ppl
      elseif k == "shield_charges"    then e.shield_charges    = lvl*ppl
      elseif k == "wide_body_add"     then e.wide_body_add     = lvl*ppl
      elseif k == "fruit_sense_range" then e.fruit_sense_range = lvl*ppl
      elseif k == "ghost_tail_count"  then e.ghost_tail_count  = lvl*ppl
      elseif k == "tail_growth_level" then e.tail_growth_level = lvl*ppl
      elseif k == "venom_trail_level" then e.venom_trail_level = lvl*ppl
      end
    end
  end
  return e
end

-- Called after player selects an evolution card.
-- active_evolutions: { speed=N, magnet=N, ... } from TypeScript state
function update_evolution_effects(active_evolutions)
  if not GAME_STATE then return end
  local st  = GAME_STATE
  local eff = _calc_effects(active_evolutions, st.config.evolution_cards or {})
  local p   = st.player
  local base_r = st.config.player_stats.initial_radius or 11
  p.radius            = base_r + (eff.wide_body_add or 0)
  p.shield_charges    = eff.shield_charges
  p.magnetism_radius  = eff.magnetism_radius
  p.fruit_sense_range = eff.fruit_sense_range
  p.ghost_tail_count  = eff.ghost_tail_count
  p.regen_level       = eff.tail_growth_level
  p.venom_level       = eff.venom_trail_level
  st.speed_mult       = eff.speed_multiplier
end

-- ============================================================
-- MAIN TICK — one call per requestAnimationFrame
-- ============================================================

-- input: { control_type, mouse_x, mouse_y, keys:{w,s,a,d,arrowup,...} }
-- Returns render state consumed by GameCanvas drawGame()
function tick_game(dt, input)
  if not GAME_STATE then
    return { events = {{ type="error", msg="call init_game first" }} }
  end
  local st = GAME_STATE
  if dt > 0.1 then dt = 0.1 end
  st.events = {}

  if st.time_left <= 0 then return build_render_state(st) end

  st.time_left = math.max(0, st.time_left - dt)
  if st.time_left <= 0 then
    table.insert(st.events, { type="game_over" })
  end

  _update_player(st, dt, input)
  _update_npcs(st, dt)
  _decay_acid_drops(st, dt)
  _collisions(st)

  return build_render_state(st)
end

-- ============================================================
-- PLAYER PHYSICS
-- ============================================================

function _update_player(st, dt, input)
  local p, a = st.player, st.config.arena
  local head  = p.segments[1]
  if not head then return end

  -- Steering
  if (input.control_type or "mouse") == "mouse" then
    local mx, my = input.mouse_x or 0, input.mouse_y or 0
    if mx*mx + my*my > 225 then
      p.target_angle = math.atan2(my, mx)
    end
  else
    local k = input.keys or {}
    local dx, dy = 0, 0
    if k.w or k.arrowup    then dy = -1 end
    if k.s or k.arrowdown  then dy =  1 end
    if k.a or k.arrowleft  then dx = -1 end
    if k.d or k.arrowright then dx =  1 end
    if dx ~= 0 or dy ~= 0 then p.target_angle = math.atan2(dy, dx) end
  end

  local diff = normalize_angle(p.target_angle - p.angle)
  local step = math.min(math.abs(diff), 5.2*dt) * (diff < 0 and -1 or 1)
  p.angle = (p.angle + step) % (math.pi*2)

  local spd = (p.base_speed + st.score*0.8) * (st.speed_mult or 1.0)
  if p.is_slowing then spd = spd * 0.5 end

  head.x = clamp(head.x + math.cos(p.angle)*spd*dt, p.radius, a.map_width  - p.radius)
  head.y = clamp(head.y + math.sin(p.angle)*spd*dt, p.radius, a.map_height - p.radius)
  _follow(p)

  -- Regen
  if (p.regen_level or 0) > 0 then
    p.regen_timer = (p.regen_timer or 0) + dt
    local cd = 16 - p.regen_level * 3
    if p.regen_timer >= cd then
      p.regen_timer = 0
      local last = p.segments[#p.segments]
      p.segments[#p.segments+1] = {
        x=last.x - math.cos(last.angle)*p.radius,
        y=last.y - math.sin(last.angle)*p.radius,
        angle=last.angle,
      }
      st.peak_length = math.max(st.peak_length, #p.segments)
      table.insert(st.events, { type="metrics_update",
        current_length=#p.segments, peak_length=st.peak_length, score=st.score })
    end
  end

  -- Acid trail
  if (p.venom_level or 0) > 0 then
    p.acid_timer = (p.acid_timer or 0) + dt
    if p.acid_timer >= 0.45 then
      p.acid_timer = 0
      local tail = p.segments[#p.segments]
      st.acid_drops[#st.acid_drops+1] = {
        x=tail.x, y=tail.y,
        timer  = 5 + p.venom_level*2,
        radius = 8 + p.venom_level*1.5,
      }
    end
  end
end

function _follow(snake)
  local sp = snake.radius * 1.5
  for i = 2, #snake.segments do
    local prev, curr = snake.segments[i-1], snake.segments[i]
    local dx, dy = prev.x-curr.x, prev.y-curr.y
    local d = math.sqrt(dx*dx + dy*dy)
    if d > sp then
      local ang = math.atan2(dy, dx)
      curr.x = prev.x - math.cos(ang)*sp
      curr.y = prev.y - math.sin(ang)*sp
      curr.angle = ang
    end
  end
end

-- ============================================================
-- NPC PHYSICS
-- ============================================================

function _update_npcs(st, dt)
  local a = st.config.arena
  for _, npc in ipairs(st.npcs) do
    if npc.is_slowing then
      npc.slow_timer = (npc.slow_timer or 0) - dt
      if npc.slow_timer <= 0 then npc.is_slowing = false end
    end

    npc.ai_timer = (npc.ai_timer or 0) - dt
    if npc.ai_timer <= 0 then
      npc.ai_timer = 0.4 + math.random()*0.4
      local nh = npc.segments[1]
      local wb = a.wall_buffer or 120

      if     nh.x < wb                   then npc.target_angle = 0
      elseif nh.x > a.map_width  - wb    then npc.target_angle = math.pi
      elseif nh.y < wb                   then npc.target_angle = math.pi/2
      elseif nh.y > a.map_height - wb    then npc.target_angle = -math.pi/2
      else
        local nearest, min_d2 = nil, 450*450
        for _, f in ipairs(st.fruits) do
          local d2 = dist2(nh.x, nh.y, f.x, f.y)
          if d2 < min_d2 then min_d2=d2; nearest=f end
        end
        if nearest then
          npc.target_angle = math.atan2(nearest.y-nh.y, nearest.x-nh.x)
        else
          npc.target_angle = npc.angle + (math.random()*1.2 - 0.6)
        end
      end
    end

    local diff = normalize_angle(npc.target_angle - npc.angle)
    local step = math.min(math.abs(diff), 4.2*dt) * (diff < 0 and -1 or 1)
    npc.angle = (npc.angle + step) % (math.pi*2)

    local spd = npc.speed * (npc.is_slowing and 0.4 or 1.0)
    local head = npc.segments[1]
    local a_cfg = st.config.arena
    head.x = clamp(head.x + math.cos(npc.angle)*spd*dt, npc.radius, a_cfg.map_width  - npc.radius)
    head.y = clamp(head.y + math.sin(npc.angle)*spd*dt, npc.radius, a_cfg.map_height - npc.radius)
    _follow(npc)
  end
end

-- ============================================================
-- ACID DROPS DECAY
-- ============================================================

function _decay_acid_drops(st, dt)
  local alive = {}
  for _, d in ipairs(st.acid_drops) do
    d.timer = d.timer - dt
    if d.timer > 0 then alive[#alive+1] = d end
  end
  st.acid_drops = alive
end

-- ============================================================
-- COLLISIONS
-- ============================================================

function _collisions(st)
  local p  = st.player
  local ph = p.segments[1]
  if not ph then return end

  -- Magnetism
  if (p.magnetism_radius or 0) > 0 then
    local pull = 160 + p.magnetism_radius*15
    local mr2  = p.magnetism_radius * p.magnetism_radius
    for _, f in ipairs(st.fruits) do
      if dist2(ph.x, ph.y, f.x, f.y) <= mr2 then
        local ang = math.atan2(ph.y-f.y, ph.x-f.x)
        f.x = f.x + math.cos(ang)*pull*0.016
        f.y = f.y + math.sin(ang)*pull*0.016
      end
    end
  end

  -- Fruit eating
  local new_fruits = {}
  for _, f in ipairs(st.fruits) do
    local eaten = false
    if dist2(ph.x, ph.y, f.x, f.y) < (p.radius+10)^2 then
      st.score = st.score + f.points
      for _ = 1, f.points do
        local last = p.segments[#p.segments]
        p.segments[#p.segments+1] = {
          x=last.x - math.cos(last.angle)*p.radius,
          y=last.y - math.sin(last.angle)*p.radius,
          angle=last.angle,
        }
      end
      st.peak_length = math.max(st.peak_length, #p.segments)
      table.insert(st.events, { type="fruit_eaten", is_golden=f.is_golden,
        score=st.score, current_length=#p.segments, peak_length=st.peak_length })
      eaten = true
    else
      for _, npc in ipairs(st.npcs) do
        local nh = npc.segments[1]
        if dist2(nh.x, nh.y, f.x, f.y) < (npc.radius+10)^2 then
          for _ = 1, f.points do
            local last = npc.segments[#npc.segments]
            npc.segments[#npc.segments+1] = {
              x=last.x - math.cos(last.angle)*npc.radius,
              y=last.y - math.sin(last.angle)*npc.radius,
              angle=last.angle,
            }
          end
          eaten = true; break
        end
      end
    end
    new_fruits[#new_fruits+1] = eaten and spawn_fruit_from_config(st.config) or f
  end
  st.fruits = new_fruits

  -- Venom: NPCs hit acid drops
  for _, npc in ipairs(st.npcs) do
    local nh = npc.segments[1]
    for _, d in ipairs(st.acid_drops) do
      if dist2(nh.x, nh.y, d.x, d.y) < (npc.radius+d.radius)^2 then
        npc.is_slowing = true
        npc.slow_timer = 4.0
      end
    end
  end

  -- NPC head steals player joints
  for _, npc in ipairs(st.npcs) do
    local nh = npc.segments[1]
    for j = 2, #p.segments do
      local pj = p.segments[j]
      if dist2(nh.x, nh.y, pj.x, pj.y) < (npc.radius+p.radius)^2 then
        if (p.ghost_tail_count or 0) > 0 and j >= #p.segments - p.ghost_tail_count then
          break
        end
        if (p.shield_charges or 0) > 0 then
          p.shield_charges = p.shield_charges - 1
          npc.angle = (npc.angle + math.pi) % (math.pi*2)
          npc.target_angle = npc.angle
          table.insert(st.events, { type="shield_consumed", charges=p.shield_charges })
          break
        end
        -- Steal
        local stolen, new_p = {}, {}
        for k = 1,   j-1           do new_p[#new_p+1]    = p.segments[k] end
        for k = j,   #p.segments   do stolen[#stolen+1]   = p.segments[k] end
        if #new_p < 2 then
          local h = new_p[1]
          new_p[2] = {x=h.x - math.cos(p.angle)*p.radius,
                      y=h.y - math.sin(p.angle)*p.radius, angle=p.angle}
        end
        p.segments = new_p
        for _, seg in ipairs(stolen) do
          local last = npc.segments[#npc.segments]
          npc.segments[#npc.segments+1] = {x=last.x, y=last.y, angle=seg.angle}
        end
        table.insert(st.events, { type="metrics_update",
          current_length=#p.segments, peak_length=st.peak_length, score=st.score })
        npc.angle = (npc.angle + math.pi/2) % (math.pi*2)
        npc.target_angle = npc.angle
        break
      end
    end
  end

  -- Player head steals NPC joints
  for _, npc in ipairs(st.npcs) do
    for j = 2, #npc.segments do
      local nj = npc.segments[j]
      if dist2(ph.x, ph.y, nj.x, nj.y) < (p.radius+npc.radius)^2 then
        local stolen, new_n = {}, {}
        for k = 1, j-1           do new_n[#new_n+1]  = npc.segments[k] end
        for k = j, #npc.segments do stolen[#stolen+1] = npc.segments[k] end
        if #new_n < 2 then
          local h = new_n[1]
          new_n[2] = {x=h.x - math.cos(npc.angle)*npc.radius,
                      y=h.y - math.sin(npc.angle)*npc.radius, angle=npc.angle}
        end
        npc.segments = new_n
        for _, seg in ipairs(stolen) do
          local last = p.segments[#p.segments]
          p.segments[#p.segments+1] = {x=last.x, y=last.y, angle=seg.angle}
        end
        st.peak_length = math.max(st.peak_length, #p.segments)
        table.insert(st.events, { type="metrics_update",
          current_length=#p.segments, peak_length=st.peak_length, score=st.score })
        p.angle = (p.angle + math.pi/4) % (math.pi*2)
        p.target_angle = p.angle
        break
      end
    end
  end

  -- NPC vs NPC
  for i = 1, #st.npcs do
    local thief = st.npcs[i]
    local th = thief.segments[1]
    for k = 1, #st.npcs do
      if i ~= k then
        local victim = st.npcs[k]
        for j = 2, #victim.segments do
          local vj = victim.segments[j]
          if dist2(th.x, th.y, vj.x, vj.y) < (thief.radius+victim.radius)^2 then
            local stolen, new_v = {}, {}
            for s = 1, j-1            do new_v[#new_v+1]   = victim.segments[s] end
            for s = j, #victim.segments do stolen[#stolen+1] = victim.segments[s] end
            if #new_v < 2 then
              local h = new_v[1]
              new_v[2] = {x=h.x - math.cos(victim.angle)*victim.radius,
                          y=h.y - math.sin(victim.angle)*victim.radius, angle=victim.angle}
            end
            victim.segments = new_v
            for _, seg in ipairs(stolen) do
              local last = thief.segments[#thief.segments]
              thief.segments[#thief.segments+1] = {x=last.x, y=last.y, angle=seg.angle}
            end
            thief.angle = (thief.angle + math.pi/2) % (math.pi*2)
            thief.target_angle = thief.angle
            break
          end
        end
      end
    end
  end
end

-- ============================================================
-- RENDER STATE (flat arrays — faster to marshal than nested tables)
-- ============================================================

function build_render_state(st)
  local p = st.player
  local px, py, pa = {}, {}, {}
  for _, s in ipairs(p.segments) do
    px[#px+1]=s.x; py[#py+1]=s.y; pa[#pa+1]=s.angle
  end

  local npcs_out = {}
  for _, npc in ipairs(st.npcs) do
    local sx, sy, sa = {}, {}, {}
    for _, s in ipairs(npc.segments) do
      sx[#sx+1]=s.x; sy[#sy+1]=s.y; sa[#sa+1]=s.angle
    end
    npcs_out[#npcs_out+1] = {
      id=npc.id, name=npc.name, color=npc.color, head_color=npc.head_color,
      angle=npc.angle, radius=npc.radius,
      segs_x=sx, segs_y=sy, segs_a=sa,
    }
  end

  local fruits_out = {}
  for _, f in ipairs(st.fruits) do
    fruits_out[#fruits_out+1] = {
      x=f.x, y=f.y, color=f.color, points=f.points,
      is_golden=f.is_golden, pulse_phase=f.pulse_phase,
    }
  end

  local acid_out = {}
  for _, d in ipairs(st.acid_drops) do
    acid_out[#acid_out+1] = {x=d.x, y=d.y, radius=d.radius, timer=d.timer}
  end

  return {
    player = {
      segs_x=px, segs_y=py, segs_a=pa,
      angle=p.angle, color=p.color, head_color=p.head_color,
      radius=p.radius, shield_charges=p.shield_charges,
      ghost_tail_count=p.ghost_tail_count or 0,
      magnetism_radius=p.magnetism_radius or 0,
      fruit_sense_range=p.fruit_sense_range or 0,
    },
    npcs       = npcs_out,
    fruits     = fruits_out,
    acid_drops = acid_out,
    time_left  = st.time_left,
    score      = st.score,
    peak_length = st.peak_length,
    events     = st.events,
  }
end

-- ============================================================
-- DISCRETE HELPERS (unchanged from Phase 2g)
-- ============================================================

function check_evolution_trigger(fruits_eaten_since, threshold)
  return (fruits_eaten_since + 1) >= threshold
end

function select_evolution_pool(all_cards, count)
  local pool = {}
  for _, c in ipairs(all_cards) do pool[#pool+1] = c end
  for i = #pool, 2, -1 do
    local j = math.random(1, i)
    pool[i], pool[j] = pool[j], pool[i]
  end
  local out = {}
  for i = 1, math.min(count, #pool) do out[#out+1] = pool[i] end
  return out
end

function calculate_grade(score, thresholds)
  for _, t in ipairs(thresholds) do
    if score >= t.min_score then
      return { title=t.title, description=t.description }
    end
  end
  local last = thresholds[#thresholds]
  return { title=last.title, description=last.description }
end

function spawn_fruit(fruit_config, arena)
  return spawn_fruit_from_config({ fruit=fruit_config, arena=arena })
end

function generate_npc(npc_profiles, npc_stats, arena, index)
  local p   = npc_profiles[(index % #npc_profiles) + 1]
  local r   = npc_stats.min_radius + math.random()*(npc_stats.max_radius-npc_stats.min_radius)
  local spd = npc_stats.min_speed  + math.random()*(npc_stats.max_speed -npc_stats.min_speed)
  local len = npc_stats.min_initial_length +
              math.floor(math.random()*(npc_stats.max_initial_length-npc_stats.min_initial_length+1))
  return {
    name=p.name.." "..(index+1), color=p.color, head_color=p.head_color,
    x=math.random()*(arena.map_width-200)+100,
    y=math.random()*(arena.map_height-200)+100,
    angle=math.random()*math.pi*2,
    speed=spd, radius=r, initial_length=len,
  }
end

function decide_npc_action(npc_head, npc_angle, nearby_fruits, arena)
  local wb = arena.wall_buffer or 120
  if     npc_head.x < wb                   then return 0
  elseif npc_head.x > arena.map_width - wb  then return math.pi
  elseif npc_head.y < wb                   then return math.pi/2
  elseif npc_head.y > arena.map_height - wb then return -math.pi/2
  end
  if nearby_fruits and #nearby_fruits > 0 then
    local nearest, min_d2 = nearby_fruits[1], math.huge
    for _, f in ipairs(nearby_fruits) do
      local d2 = dist2(f.x, f.y, npc_head.x, npc_head.y)
      if d2 < min_d2 then min_d2=d2; nearest=f end
    end
    return math.atan2(nearest.y-npc_head.y, nearest.x-npc_head.x)
  end
  return npc_angle + (math.random()*1.2 - 0.6)
end
```

---

## §3 GameCanvas.tsx — Full Replace

Replace `ts/src/games/slither_rogue/components/GameCanvas.tsx` entirely.

The new version:
- Calls `init_game(config)` once on mount via Lua
- Calls `tick_game(dt, input)` once per `requestAnimationFrame`
- Calls `update_evolution_effects(active)` when evolutions change
- `drawGame(ctx, renderState)` reads flat arrays from render state

```typescript
import React, { useRef, useEffect } from 'react';
import { GameSession } from '../../../../engine/types';
import { call } from '../../../../engine/runtime';

// ---- Render state types (matches Lua build_render_state output) ----
interface PlayerRender {
  segs_x: number[]; segs_y: number[]; segs_a: number[];
  angle: number; color: string; head_color: string; radius: number;
  shield_charges: number; ghost_tail_count: number;
  magnetism_radius: number; fruit_sense_range: number;
}
interface NpcRender {
  id: string; name: string; color: string; head_color: string;
  angle: number; radius: number;
  segs_x: number[]; segs_y: number[]; segs_a: number[];
}
interface FruitRender {
  x: number; y: number; color: string; points: number;
  is_golden: boolean; pulse_phase: number;
}
interface AcidRender { x: number; y: number; radius: number; timer: number; }
interface GameEvent {
  type: string; is_golden?: boolean; score?: number;
  current_length?: number; peak_length?: number; charges?: number;
}
interface RenderState {
  player: PlayerRender; npcs: NpcRender[]; fruits: FruitRender[];
  acid_drops: AcidRender[]; time_left: number; score: number;
  peak_length: number; events: GameEvent[];
}

// ---- Props ----
interface GameCanvasProps {
  session: GameSession;
  controlType: 'mouse' | 'keyboard';
  isPaused: boolean;
  activeEvolutions: Record<string, number>;
  onFruitEaten: () => void;
  onUpdateMetrics: (m: { currentLength: number; peakLength: number; score: number }) => void;
  onGameOver: () => void;
  onTick: (timeLeft: number) => void;
  onShieldConsumed: () => void;
}

const MAP_W = 2600, MAP_H = 2600;

export default function GameCanvas({
  session, controlType, isPaused, activeEvolutions,
  onFruitEaten, onUpdateMetrics, onGameOver, onTick, onShieldConsumed,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const stateRef     = useRef({
    mouseX: 0, mouseY: 0, keys: {} as Record<string, boolean>,
    lastTime: 0, dims: { w: 800, h: 600 }, initialized: false,
  });

  // Init game in Lua once on mount
  useEffect(() => {
    const data = session.files.data as Record<string, unknown>;
    call(session, 'init_game', {
      arena:           data['arena'],
      fruit:           data['fruit'],
      player_stats:    data['player_stats'],
      player_preset:   (data['player_presets'] as unknown[])[0],
      npc_profiles:    data['npc_profiles'],
      npc_stats:       data['npc_stats'],
      evolution_cards: data['evolution_cards'],
      active_evolutions: activeEvolutions,
      game_duration:   300,
    });
    stateRef.current.initialized = true;
  }, []);

  // Sync evolution effects when player picks a card
  useEffect(() => {
    if (!stateRef.current.initialized) return;
    call(session, 'update_evolution_effects', activeEvolutions);
  }, [activeEvolutions]);

  // Canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      canvasRef.current.width  = rect.width  * dpr;
      canvasRef.current.height = rect.height * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      stateRef.current.dims = { w: rect.width, h: rect.height };
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Input listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      stateRef.current.mouseX = e.clientX - r.left - stateRef.current.dims.w / 2;
      stateRef.current.mouseY = e.clientY - r.top  - stateRef.current.dims.h / 2;
    };
    const onDown = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const onUp   = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    let animId: number;
    const loop = (ts: number) => {
      const s   = stateRef.current;
      const dt  = Math.min((ts - (s.lastTime || ts)) / 1000, 0.1);
      s.lastTime = ts;

      if (!isPaused && s.initialized && canvasRef.current) {
        const rs = call(session, 'tick_game', dt, {
          control_type: controlType,
          mouse_x: s.mouseX,
          mouse_y: s.mouseY,
          keys: {
            w: !!s.keys['w'], s: !!s.keys['s'], a: !!s.keys['a'], d: !!s.keys['d'],
            arrowup:    !!s.keys['arrowup'],   arrowdown:  !!s.keys['arrowdown'],
            arrowleft:  !!s.keys['arrowleft'], arrowright: !!s.keys['arrowright'],
          },
        }) as RenderState;

        // Process events
        for (const ev of (rs.events || [])) {
          if (ev.type === 'fruit_eaten') {
            onFruitEaten();
            onUpdateMetrics({
              currentLength: ev.current_length ?? 0,
              peakLength:    ev.peak_length ?? 0,
              score:         ev.score ?? 0,
            });
            onTick(rs.time_left);
          } else if (ev.type === 'metrics_update') {
            onUpdateMetrics({
              currentLength: ev.current_length ?? 0,
              peakLength:    ev.peak_length ?? 0,
              score:         rs.score,
            });
          } else if (ev.type === 'shield_consumed') {
            onShieldConsumed();
          } else if (ev.type === 'game_over') {
            onGameOver();
          }
        }

        onTick(rs.time_left);
        drawGame(canvasRef.current, rs, s.dims);
      }

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, controlType]);

  return (
    <div ref={containerRef} className="sr-canvas-wrap">
      <canvas ref={canvasRef} className="sr-canvas" />
    </div>
  );
}

// ---- Pure draw function — reads render state, no game logic ----
function drawGame(canvas: HTMLCanvasElement, rs: RenderState, dims: { w: number; h: number }) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !rs.player) return;

  const px = rs.player.segs_x, py = rs.player.segs_y;
  if (!px || px.length === 0) return;

  const headX = px[0], headY = py[0];
  const camX  = dims.w / 2 - headX;
  const camY  = dims.h / 2 - headY;

  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.save();
  ctx.translate(camX, camY);

  // Arena background + grid
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, MAP_W, MAP_H);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = 0; x <= MAP_W; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, MAP_H); }
  for (let y = 0; y <= MAP_H; y += 100) { ctx.moveTo(0, y); ctx.lineTo(MAP_W, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(16,185,129,0.4)';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#10b981'; ctx.shadowBlur = 15;
  ctx.strokeRect(0, 0, MAP_W, MAP_H);
  ctx.shadowBlur = 0;

  // Acid drops
  for (const d of (rs.acid_drops || [])) {
    ctx.fillStyle = 'rgba(249,115,22,0.22)';
    ctx.beginPath(); ctx.arc(d.x, d.y, d.radius+6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(249,115,22,0.7)';
    ctx.beginPath(); ctx.arc(d.x, d.y, d.radius, 0, Math.PI*2); ctx.fill();
  }

  // Fruits
  const now = Date.now();
  for (const f of (rs.fruits || [])) {
    const pulse = 1 + Math.sin(now*0.006 + (f.pulse_phase || 0)) * 0.12;
    const r = (f.is_golden ? 12 : 8) * pulse;
    ctx.save();
    ctx.shadowColor = f.color; ctx.shadowBlur = f.is_golden ? 18 : 10;
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    if (f.is_golden) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(f.x, f.y, r*0.4, 0, Math.PI*2); ctx.fill();
    }
  }

  // NPCs
  for (const npc of (rs.npcs || [])) {
    const sx = npc.segs_x, sy = npc.segs_y;
    if (!sx || sx.length === 0) continue;
    ctx.strokeStyle = npc.color; ctx.lineWidth = npc.radius;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < sx.length; i++) {
      i === 0 ? ctx.moveTo(sx[i], sy[i]) : ctx.lineTo(sx[i], sy[i]);
    }
    ctx.stroke();
    // Head
    ctx.fillStyle = npc.head_color;
    ctx.beginPath(); ctx.arc(sx[0], sy[0], npc.radius*1.3, 0, Math.PI*2); ctx.fill();
    // Eyes
    _drawEyes(ctx, sx[0], sy[0], npc.angle, npc.radius, false);
    // Name
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(npc.name, sx[0], sy[0] - npc.radius*2);
  }

  // Player
  const p = rs.player;
  const r = p.radius;
  ctx.strokeStyle = p.color; ctx.lineWidth = r*1.2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < px.length; i++) {
    i === 0 ? ctx.moveTo(px[i], py[i]) : ctx.lineTo(px[i], py[i]);
  }
  ctx.stroke();

  // Player joints
  for (let i = 1; i < px.length; i++) {
    const ghost = (p.ghost_tail_count||0)>0 && i >= px.length - p.ghost_tail_count;
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#0b0f19';
    ctx.strokeStyle = ghost ? '#6366f1' : p.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px[i], py[i], r*0.9, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ghost ? '#818cf8' : '#fff';
    ctx.beginPath(); ctx.arc(px[i], py[i], r*0.3, 0, Math.PI*2); ctx.fill();
    if ((p.shield_charges||0) > 0 && !ghost && i%2===1) {
      ctx.strokeStyle = 'rgba(52,211,153,0.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px[i], py[i], r*1.4, 0, Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }

  // Player head
  ctx.fillStyle = p.head_color;
  ctx.beginPath(); ctx.arc(headX, headY, r*1.45, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(headX, headY, r*1.45, 0, Math.PI*2); ctx.stroke();
  _drawEyes(ctx, headX, headY, p.angle, r, true);

  // Magnetism ring
  if ((p.magnetism_radius||0) > 0) {
    ctx.strokeStyle = 'rgba(14,165,233,0.12)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(headX, headY, p.magnetism_radius, 0, Math.PI*2); ctx.stroke();
  }

  ctx.restore();

  // Fruit sense arrows (screen-space, after ctx.restore)
  if ((p.fruit_sense_range||0) > 0) {
    for (const f of (rs.fruits || [])) {
      const dx = f.x - headX, dy = f.y - headY;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d > 300 && d <= p.fruit_sense_range) {
        const ang = Math.atan2(dy, dx);
        const pr  = Math.min(dims.w, dims.h)/2 - 35;
        const ax  = dims.w/2 + Math.cos(ang)*pr;
        const ay  = dims.h/2 + Math.sin(ang)*pr;
        ctx.save();
        ctx.translate(ax, ay); ctx.rotate(ang);
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(8,0); ctx.lineTo(-6,-6); ctx.lineTo(-2,0); ctx.lineTo(-6,6);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  }
}

function _drawEyes(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number, r: number, isPlayer: boolean
) {
  const off = 0.52, dist = r * 0.85;
  const lx = x + Math.cos(angle - off)*dist, ly = y + Math.sin(angle - off)*dist;
  const rx = x + Math.cos(angle + off)*dist, ry = y + Math.sin(angle + off)*dist;
  const er = isPlayer ? 4.2 : 3.5;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(lx, ly, er, 0, Math.PI*2); ctx.arc(rx, ry, er, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = isPlayer ? '#0f172a' : '#ef4444';
  const pr = isPlayer ? 2.0 : 1.5;
  ctx.beginPath();
  ctx.arc(lx + Math.cos(angle)*1.5, ly + Math.sin(angle)*1.5, pr, 0, Math.PI*2);
  ctx.arc(rx + Math.cos(angle)*1.5, ry + Math.sin(angle)*1.5, pr, 0, Math.PI*2);
  ctx.fill();
}
```

---

## §4 App.tsx — Targeted Edits

In `ts/src/games/slither_rogue/App.tsx`:

1. Add `session` prop (received from `main.tsx` which loads it via `loadGame`)
   OR load it inside App.tsx using `loadGame('slither_rogue', 42)`

2. Pass `session` to `GameCanvas`

3. On `handleSelectEvolution`: remove the `call(session, 'calculate_evolution_effects')` 
   call — `update_evolution_effects` is now called automatically via the 
   `useEffect([activeEvolutions])` in GameCanvas

4. On `handleStartGame`: reset the Lua state by calling `init_game` via the 
   `init_game` effect in GameCanvas (which runs on mount — for restarts, 
   add a `restartKey` prop that increments and triggers GameCanvas remount)

---

## §5 Python Tests — Add 4 Tests

Add to `tests/test_slither_rogue.py`. Target: **38 → 42 passed**

| # | Test | Behavior |
|---|---|---|
| 39 | `test_init_game_sets_global_state` | After `init_game(config)`, call `tick_game(0.016, input)` returns dict with `player` key |
| 40 | `test_tick_game_moves_player` | After `init_game` + `tick_game(0.1, mouse_input)`, player head position differs from initial |
| 41 | `test_tick_game_returns_events_list` | `tick_game` result has `events` key as list |
| 42 | `test_tick_game_game_over_event` | After `init_game` with `game_duration=0.01`, `tick_game(0.1, input)` events contains `{type="game_over"}` |

Build a minimal `SLITHER_CONFIG` dict in the test file matching the structure
`init_game` expects. Use the fixture `data.yaml` loaded via yaml.

---

## §6 Completion Criteria

- [ ] `uv run pytest -v` → **42 passed, 0 failed, 0 skipped**
- [ ] `cd ts && npx vitest run` → 17 passed, 0 failed, 0 skipped (unchanged)
- [ ] `cd ts && npx vite build` → exits 0
- [ ] Browser `?game=slither_rogue` — game loads, snake moves, physics correct
- [ ] `GAME_STATE` persists: physics run without re-init on each tick
- [ ] No TypeScript physics logic remains in `GameCanvas.tsx` (grep confirms)
- [ ] `docs/state/current.md` updated to Phase 2h certified

**Grep proof required:**
```bash
grep -n "updatePhysics\|checkCollisions\|requestAnimationFrame.*physics" \
  ts/src/games/slither_rogue/components/GameCanvas.tsx
# Must return zero matches
```

---

## §7 Quick Reference

| Item | Value |
|---|---|
| Python floor before | 38 / 0 / 0 |
| Python floor after  | 42 / 0 / 0 |
| TypeScript floor    | 17 / 0 / 0 (unchanged) |
| Physics location    | `logic.lua: tick_game()` |
| Render location     | `GameCanvas.tsx: drawGame()` |
| State location      | `GAME_STATE` Lua global (persists in GameSession VM) |
| TS→Lua per frame    | 1 call: `tick_game(dt, input)` |
| Lua→TS per frame    | 1 return: flat arrays (segs_x[], segs_y[], ...) |
| Session reload      | None — Lua VM persists between ticks |

---

*RFDGameStudio Phase 2h | June 2026 | RFD IT Services Ltd.*
*Physics in Lua. Rendering in TypeScript. One call per frame. The studio promise kept.*
