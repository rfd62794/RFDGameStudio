-- Slither Rogue — State
-- GAME_STATE global and all functions that initialize or mutate it.
-- Depends on: utils.lua

GAME_STATE = nil

function _calc_effects(active, cards)
  local e = {
    speed_multiplier=1.0, magnetism_radius=0, shield_charges=0,
    wide_body_add=0, fruit_sense_range=0, ghost_tail_count=0,
    tail_growth_level=0, venom_trail_level=0, ambush_level=0,
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
      elseif k == "ambush_level"      then e.ambush_level      = lvl*ppl
      end
    end
  end
  return e
end

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
    shield_max_charges = eff.shield_charges or 0,
    shield_regen_timer = 0,
    last_hit_time     = 0,
    magnetism_radius  = eff.magnetism_radius or 0,
    fruit_sense_range = eff.fruit_sense_range or 0,
    ghost_tail_count  = eff.ghost_tail_count or 0,
    regen_level       = eff.tail_growth_level or 0,
    venom_level       = eff.venom_trail_level or 0,
    ambush_level      = eff.ambush_level or 0,
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
    active_evolutions = config.active_evolutions or {},
    events      = {},
  }
end

-- Called after player selects an evolution card.
function update_evolution_effects(active_evolutions)
  if not GAME_STATE then return end
  local st  = GAME_STATE
  st.active_evolutions = active_evolutions
  local eff = _calc_effects(active_evolutions, st.config.evolution_cards or {})
  local p   = st.player
  local base_r = st.config.player_stats.initial_radius or 11
  p.radius            = base_r + (eff.wide_body_add or 0)
  p.shield_max_charges = eff.shield_charges
  p.shield_charges    = math.min(p.shield_charges or 0, eff.shield_charges)
  p.magnetism_radius  = eff.magnetism_radius
  p.fruit_sense_range = eff.fruit_sense_range
  p.ghost_tail_count  = eff.ghost_tail_count
  p.regen_level       = eff.tail_growth_level
  p.venom_level       = eff.venom_trail_level
  p.ambush_level      = eff.ambush_level
  st.speed_mult       = eff.speed_multiplier
end
