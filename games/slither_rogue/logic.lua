-- Slither Rogue — Full Game Logic (Phase 2h)
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

local function atan2(y, x) return math.atan(y, x) end

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
    id          = "f" .. tostring(math.random(1000000)),
    x           = math.random() * (a.map_width  - 120) + 60,
    y           = math.random() * (a.map_height - 120) + 60,
    color       = color,
    points      = golden and (f.golden_points or 3) or (f.standard_points or 1),
    is_golden   = golden,
    pulse_phase = math.random() * math.pi * 2,
  }
end

-- ============================================================
-- GLOBAL GAME STATE
-- ============================================================

GAME_STATE = nil

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

-- ============================================================
-- INIT
-- ============================================================

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
    config      = config,
    player      = player,
    npcs        = npcs,
    fruits      = fruits,
    acid_drops  = {},
    time_left   = config.game_duration or 300,
    score       = 0,
    peak_length = ps.initial_length or 5,
    speed_mult  = eff.speed_multiplier or 1.0,
    events      = {},
  }
end

-- Called after player selects an evolution card.
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
-- PLAYER PHYSICS
-- ============================================================

function _update_player(st, dt, input)
  local p, a = st.player, st.config.arena
  local head  = p.segments[1]
  if not head then return end

  if (input.control_type or "mouse") == "mouse" then
    local mx, my = input.mouse_x or 0, input.mouse_y or 0
    if mx*mx + my*my > 225 then
      p.target_angle = atan2(my, mx)
    end
  else
    local k = input.keys or {}
    local dx, dy = 0, 0
    if k.w or k.arrowup    then dy = -1 end
    if k.s or k.arrowdown  then dy =  1 end
    if k.a or k.arrowleft  then dx = -1 end
    if k.d or k.arrowright then dx =  1 end
    if dx ~= 0 or dy ~= 0 then p.target_angle = atan2(dy, dx) end
  end

  local diff = normalize_angle(p.target_angle - p.angle)
  local step = math.min(math.abs(diff), 5.2*dt) * (diff < 0 and -1 or 1)
  p.angle = (p.angle + step) % (math.pi*2)

  local spd = (p.base_speed + st.score*0.8) * (st.speed_mult or 1.0)
  if p.is_slowing then spd = spd * 0.5 end

  head.x = clamp(head.x + math.cos(p.angle)*spd*dt, p.radius, a.map_width  - p.radius)
  head.y = clamp(head.y + math.sin(p.angle)*spd*dt, p.radius, a.map_height - p.radius)
  _follow(p)

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
      local ang = atan2(dy, dx)
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

      if     nh.x < wb                then npc.target_angle = 0
      elseif nh.x > a.map_width  - wb then npc.target_angle = math.pi
      elseif nh.y < wb                then npc.target_angle = math.pi/2
      elseif nh.y > a.map_height - wb then npc.target_angle = -math.pi/2
      else
        local nearest, min_d2 = nil, 450*450
        for _, f in ipairs(st.fruits) do
          local d2 = dist2(nh.x, nh.y, f.x, f.y)
          if d2 < min_d2 then min_d2=d2; nearest=f end
        end
        if nearest then
          npc.target_angle = atan2(nearest.y-nh.y, nearest.x-nh.x)
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
    head.x = clamp(head.x + math.cos(npc.angle)*spd*dt, npc.radius, a.map_width  - npc.radius)
    head.y = clamp(head.y + math.sin(npc.angle)*spd*dt, npc.radius, a.map_height - npc.radius)
    _follow(npc)
  end
end

-- ============================================================
-- ACID DROPS
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

  if (p.magnetism_radius or 0) > 0 then
    local pull = 160 + p.magnetism_radius*15
    local mr2  = p.magnetism_radius * p.magnetism_radius
    for _, f in ipairs(st.fruits) do
      if dist2(ph.x, ph.y, f.x, f.y) <= mr2 then
        local ang = atan2(ph.y-f.y, ph.x-f.x)
        f.x = f.x + math.cos(ang)*pull*0.016
        f.y = f.y + math.sin(ang)*pull*0.016
      end
    end
  end

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

  for _, npc in ipairs(st.npcs) do
    local nh = npc.segments[1]
    for _, d in ipairs(st.acid_drops) do
      if dist2(nh.x, nh.y, d.x, d.y) < (npc.radius+d.radius)^2 then
        npc.is_slowing = true
        npc.slow_timer = 4.0
      end
    end
  end

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
        local stolen, new_p = {}, {}
        for k = 1, j-1         do new_p[#new_p+1]   = p.segments[k] end
        for k = j, #p.segments do stolen[#stolen+1]  = p.segments[k] end
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
            for s = 1, j-1             do new_v[#new_v+1]   = victim.segments[s] end
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
-- RENDER STATE
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
    npcs        = npcs_out,
    fruits      = fruits_out,
    acid_drops  = acid_out,
    time_left   = st.time_left,
    score       = st.score,
    peak_length = st.peak_length,
    events      = st.events,
  }
end

-- ============================================================
-- MAIN TICK
-- ============================================================

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
-- DISCRETE HELPERS
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
  if     npc_head.x < wb                    then return 0
  elseif npc_head.x > arena.map_width  - wb then return math.pi
  elseif npc_head.y < wb                    then return math.pi/2
  elseif npc_head.y > arena.map_height - wb then return -math.pi/2
  end
  if nearby_fruits and #nearby_fruits > 0 then
    local nearest, min_d2 = nearby_fruits[1], math.huge
    for _, f in ipairs(nearby_fruits) do
      local d2 = dist2(f.x, f.y, npc_head.x, npc_head.y)
      if d2 < min_d2 then min_d2=d2; nearest=f end
    end
    return atan2(nearest.y-npc_head.y, nearest.x-npc_head.x)
  end
  return npc_angle + (math.random()*1.2 - 0.6)
end
