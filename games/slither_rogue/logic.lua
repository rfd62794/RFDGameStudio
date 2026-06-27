-- Slither Rogue — Game Logic (entry point)
-- tick_game: main loop called once per frame by TypeScript.
-- Discrete helpers: called by TypeScript on specific game events.
-- Depends on: utils.lua, state.lua, physics.lua, collision.lua, render.lua

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
