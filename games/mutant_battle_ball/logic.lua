-- Mutant Battle Ball — Match Simulation & Management
-- 2v2 arena sport with possession-based roles, part system, and infirmary

GAME_STATE = {}

-- Derive combat stats from a mutant's equipped parts.
-- mutant: { parts: { head: part, chest: part, ... } }
-- Returns: { accuracy, endurance, power, speed, max_health }
function calculate_stats(mutant)
  local acc, end_, pow, spd = 0, 0, 0, 0
  local part_ids = { 'head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg' }
  for _, slot in ipairs(part_ids) do
    local part = mutant.parts and mutant.parts[slot]
    if part then
      acc  = acc  + (part.accuracy  or 0)
      end_ = end_ + (part.endurance or 0)
      pow  = pow  + (part.power     or 0)
      spd  = spd  + (part.speed     or 0)
    end
  end
  return {
    accuracy   = acc,
    endurance  = end_,
    power      = pow,
    speed      = spd,
    max_health = math.max(20, end_),
  }
end

-- Initialize GAME_STATE for a match.
-- player_mutants: array of 2 mutant tables (active squad)
-- opponent_mutants: array of 2 opponent tables
-- config: { match: {...}, scoring: {...} }
function init_match(player_mutants, opponent_mutants, config)
  local m = config.match or {}
  local court_w = m.court_width  or 100
  local court_h = m.court_height or 60

  -- Build agents from mutants
  local function make_agent(mutant, team, idx, has_ball)
    local stats
    if mutant.accuracy then
      -- Opponent format (flat stats)
      stats = { accuracy=mutant.accuracy, endurance=mutant.endurance,
                power=mutant.power, speed=mutant.speed,
                max_health=mutant.max_health or mutant.endurance }
    else
      stats = calculate_stats(mutant)
    end
    return {
      id             = mutant.id or (team .. "_" .. idx),
      name           = mutant.name or "Unknown",
      team           = team,
      color          = mutant.color or "#ffffff",
      x              = (team == "player") and 30 or 70,
      y              = court_h * (idx == 1 and 0.35 or 0.65),
      vx             = 0,
      vy             = 0,
      speed          = stats.speed,
      power          = stats.power,
      accuracy       = stats.accuracy,
      endurance      = stats.endurance,
      health         = stats.max_health,
      max_health     = stats.max_health,
      has_ball       = has_ball,
      role           = has_ball and "carrier" or "escort",
      status         = "active",
      stun_timer     = 0,
      mutant_id      = mutant.id,
    }
  end

  local agents = {}
  local pm = player_mutants
  local om = opponent_mutants

  -- Player team starts with possession → player_mutants[1] is Carrier
  agents[1] = make_agent(pm[1], "player",   1, true)
  agents[2] = make_agent(pm[2], "player",   2, false)
  agents[3] = make_agent(om[1], "opponent", 1, false)
  agents[4] = make_agent(om[2], "opponent", 2, false)

  GAME_STATE = {
    agents          = agents,
    ball_x          = 50,
    ball_y          = court_h / 2,
    possession      = "player",
    score_player    = 0,
    score_opponent  = 0,
    time_remaining  = m.duration or 180,
    timeouts_left   = m.timeouts or 3,
    state           = "playing",
    events          = {},
    config          = config,
  }
end

-- Reassign roles based on current possession.
-- Call after every possession change.
local function assign_roles(agents, possession)
  local carrier_set = false
  for _, ag in ipairs(agents) do
    if ag.status ~= "active" then
      ag.role = "inactive"
    elseif ag.team == possession then
      if not carrier_set and ag.has_ball then
        ag.role = "carrier"
        carrier_set = true
      else
        ag.role = "escort"
      end
    else
      ag.role = "tackler"
    end
  end
end

-- Move an agent toward a target point.
-- Returns dx, dy applied.
local function move_toward(agent, tx, ty, speed, dt)
  local dx = tx - agent.x
  local dy = ty - agent.y
  local d  = math.sqrt(dx*dx + dy*dy)
  if d < 0.5 then return end
  local nx = dx / d
  local ny = dy / d
  agent.x = agent.x + nx * speed * dt
  agent.y = agent.y + ny * speed * dt
end

-- Get the carrier agent (has ball).
local function get_carrier(agents)
  for _, ag in ipairs(agents) do
    if ag.has_ball and ag.status == "active" then return ag end
  end
  return nil
end

-- Get nearest enemy to an agent.
local function nearest_enemy(agent, agents)
  local best, best_d2 = nil, 999999
  for _, ag in ipairs(agents) do
    if ag.team ~= agent.team and ag.status == "active" then
      local dx = ag.x - agent.x
      local dy = ag.y - agent.y
      local d2 = dx*dx + dy*dy
      if d2 < best_d2 then best_d2 = d2; best = ag end
    end
  end
  return best, math.sqrt(best_d2)
end

-- Attempt tackle: tackler tries to take ball from carrier.
-- Returns: "possession_change", "wound_limb", "fail"
local function resolve_tackle(tackler, carrier, config)
  local m = config.match or {}
  -- Attack roll: tackler power vs carrier endurance * accuracy weight
  local atk = math.random() * tackler.power
  local def = math.random() * (carrier.endurance * 0.6 + carrier.accuracy * 0.4)

  if atk > def then
    -- Tackle succeeded
    -- Wound chance: power advantage over endurance
    local wound_roll = (tackler.power - carrier.endurance) / 100
    if math.random() < math.max(0, wound_roll) then
      return "wound"
    end
    return "possession_change"
  else
    return "fail"
  end
end

-- Attempt block: escort tries to intercept a tackler.
local function resolve_block(escort, tackler)
  local atk = math.random() * escort.power
  local def = math.random() * tackler.power
  return atk > def and "block_success" or "block_fail"
end

-- Apply a wound to an agent.
-- wound_type: "limb_loss" or "heavy"
function apply_wound(agent, wound_type)
  if wound_type == "limb_loss" then
    -- Randomly lose one arm or leg stat contribution
    agent.power = math.max(5, agent.power - math.random(8, 18))
    agent.speed = math.max(5, agent.speed - math.random(5, 12))
    table.insert(GAME_STATE.events, {
      type     = "limb_loss",
      agent_id = agent.id,
      team     = agent.team,
    })
  else
    agent.health = agent.health - math.random(15, 30)
  end
  if agent.health <= 0 then
    agent.status = "down"
    table.insert(GAME_STATE.events, {
      type     = "agent_down",
      agent_id = agent.id,
      team     = agent.team,
      fatal    = math.random() < 0.35,
    })
  end
end

function tick_match(dt)
  local st = GAME_STATE
  if not st or st.state ~= "playing" then
    return build_match_render_state()
  end

  st.events = {}
  st.time_remaining = st.time_remaining - dt
  if st.time_remaining <= 0 then
    st.state = "ended"
    table.insert(st.events, { type = "match_ended",
      score_player = st.score_player, score_opponent = st.score_opponent })
    return build_match_render_state()
  end

  local m = st.config.match or {}
  local court_w = m.court_width  or 100
  local court_h = m.court_height or 60
  local tackle_r = m.tackle_range or 6.0
  local block_r  = m.block_range  or 7.0
  local cs_mult  = m.carrier_speed_mult or 0.85
  local stun_t   = m.tackle_stun_time   or 1.2
  local ez_depth = m.end_zone_depth     or 10

  local carrier = get_carrier(st.agents)
  assign_roles(st.agents, st.possession)

  -- Agent AI movement
  for _, ag in ipairs(st.agents) do
    if ag.status == "stunned" then
      ag.stun_timer = ag.stun_timer - dt
      if ag.stun_timer <= 0 then ag.status = "active" end
    elseif ag.status == "active" then
      local base_spd = ag.speed * 0.5 * dt

      if ag.role == "carrier" then
        -- Move toward own end zone
        local target_x = (st.possession == "player") and (court_w - ez_depth/2) or ez_depth/2
        local target_y = court_h / 2
        -- Slight evasion: move away from nearest tackler
        local nearest, nd = nearest_enemy(ag, st.agents)
        if nearest and nd < 20 then
          local bx = ag.x - nearest.x
          local by = ag.y - nearest.y
          local bl = math.sqrt(bx*bx + by*by)
          if bl > 0 then
            target_x = target_x + (bx/bl) * 12
            target_y = target_y + (by/bl) * 8
          end
        end
        target_x = math.max(0, math.min(court_w, target_x))
        target_y = math.max(0, math.min(court_h, target_y))
        move_toward(ag, target_x, target_y, base_spd * cs_mult, 1)

        -- Update ball position
        st.ball_x = ag.x
        st.ball_y = ag.y

      elseif ag.role == "escort" then
        -- Position between carrier and nearest tackler
        if carrier then
          local nearest_tackler = nearest_enemy(ag, st.agents)
          if nearest_tackler then
            local tx = (carrier.x + nearest_tackler.x) / 2
            local ty = (carrier.y + nearest_tackler.y) / 2
            move_toward(ag, tx, ty, base_spd, 1)
          end
        end

      elseif ag.role == "tackler" then
        -- Chase the carrier
        if carrier then
          move_toward(ag, carrier.x, carrier.y, base_spd, 1)
        end
      end

      -- Clamp to court
      ag.x = math.max(0, math.min(court_w, ag.x))
      ag.y = math.max(0, math.min(court_h, ag.y))
    end
  end

  -- Scoring check
  if carrier then
    local scored = false
    if st.possession == "player" and carrier.x > court_w - ez_depth then
      st.score_player = st.score_player + 1
      scored = true
      table.insert(st.events, { type="scored", team="player",
        score_player=st.score_player, score_opponent=st.score_opponent })
    elseif st.possession == "opponent" and carrier.x < ez_depth then
      st.score_opponent = st.score_opponent + 1
      scored = true
      table.insert(st.events, { type="scored", team="opponent",
        score_player=st.score_player, score_opponent=st.score_opponent })
    end

    if scored then
      -- Reset positions, switch possession to conceding team
      st.possession = (st.possession == "player") and "opponent" or "player"
      local reset_carrier = nil
      for _, ag in ipairs(st.agents) do
        ag.has_ball = false
        if ag.team == st.possession and ag.status == "active" and not reset_carrier then
          ag.has_ball = true
          reset_carrier = ag
        end
        ag.x = (ag.team == "player") and 30 or 70
        ag.y = court_h * (math.random() * 0.4 + 0.3)
      end
      st.ball_x = 50
      st.ball_y = court_h / 2
      assign_roles(st.agents, st.possession)
    end
  end

  -- Collision detection: blocks and tackles
  if carrier then
    for _, ag in ipairs(st.agents) do
      if ag.status == "active" and ag.role == "tackler" then
        local dx = ag.x - carrier.x
        local dy = ag.y - carrier.y
        local d  = math.sqrt(dx*dx + dy*dy)

        -- Escort intercept: check if any escort is between tackler and carrier
        local intercepted = false
        for _, esc in ipairs(st.agents) do
          if esc.status == "active" and esc.role == "escort" then
            local edx = esc.x - ag.x
            local edy = esc.y - ag.y
            if math.sqrt(edx*edx + edy*edy) < block_r then
              local outcome = resolve_block(esc, ag)
              if outcome == "block_success" then
                ag.status  = "stunned"
                ag.stun_timer = stun_t
                table.insert(st.events, { type="block", blocker_id=esc.id, tackler_id=ag.id })
              else
                -- Block failed — escort takes damage
                apply_wound(esc, "heavy")
              end
              intercepted = true
              break
            end
          end
        end

        if not intercepted and d < tackle_r then
          local outcome = resolve_tackle(ag, carrier, st.config)
          if outcome == "possession_change" or outcome == "wound" then
            if outcome == "wound" then apply_wound(carrier, "limb_loss") end

            -- Only change possession if carrier is still active
            if carrier.status == "active" then
              carrier.has_ball = false
              ag.has_ball      = true
              st.possession    = ag.team
              assign_roles(st.agents, st.possession)
              table.insert(st.events, { type="tackle_success",
                tackler_id=ag.id, carrier_id=carrier.id, possession=st.possession })
            end
          else
            -- Failed tackle — stun tackler briefly
            ag.status     = "stunned"
            ag.stun_timer = stun_t * 0.5
            table.insert(st.events, { type="tackle_fail", tackler_id=ag.id })
          end
        end
      end
    end
  end

  -- Check if any agent went down — pause for substitution
  for _, ev in ipairs(st.events) do
    if ev.type == "agent_down" then
      st.state = "paused_sub"
      break
    end
  end

  return build_match_render_state()
end

function build_match_render_state()
  local st = GAME_STATE
  if not st then return nil end

  local agents_out = {}
  for _, ag in ipairs(st.agents) do
    agents_out[#agents_out+1] = {
      id        = ag.id,
      name      = ag.name,
      team      = ag.team,
      color     = ag.color,
      x         = ag.x,
      y         = ag.y,
      role      = ag.role,
      status    = ag.status,
      has_ball  = ag.has_ball,
      health    = ag.health,
      max_health = ag.max_health,
    }
  end

  return {
    agents         = agents_out,
    ball_x         = st.ball_x,
    ball_y         = st.ball_y,
    possession     = st.possession,
    score_player   = st.score_player,
    score_opponent = st.score_opponent,
    time_remaining = st.time_remaining,
    timeouts_left  = st.timeouts_left,
    state          = st.state,
    events         = st.events,
  }
end

-- Call timeout: pause match for strategic substitution.
function call_timeout()
  if not GAME_STATE or GAME_STATE.timeouts_left <= 0 then
    return false, "No timeouts remaining"
  end
  GAME_STATE.timeouts_left = GAME_STATE.timeouts_left - 1
  GAME_STATE.state = "timeout"
  return true, nil
end

-- Resume match after substitution or timeout.
function resume_match()
  if GAME_STATE then GAME_STATE.state = "playing" end
end

-- Make substitution: replace a downed agent with a bench mutant.
-- downed_agent_id: id of agent to replace
-- bench_mutant: mutant table from bench
function make_substitution(downed_agent_id, bench_mutant)
  if not GAME_STATE then return false end
  local stats = calculate_stats(bench_mutant)
  for i, ag in ipairs(GAME_STATE.agents) do
    if ag.id == downed_agent_id then
      local had_ball = ag.has_ball
      GAME_STATE.agents[i] = {
        id         = bench_mutant.id,
        name       = bench_mutant.name,
        team       = "player",
        color      = bench_mutant.color or "#3b82f6",
        x          = ag.x,
        y          = ag.y,
        vx         = 0, vy = 0,
        speed      = stats.speed,
        power      = stats.power,
        accuracy   = stats.accuracy,
        endurance  = stats.endurance,
        health     = stats.max_health,
        max_health = stats.max_health,
        has_ball   = had_ball,
        role       = ag.role,
        status     = "active",
        stun_timer = 0,
        mutant_id  = bench_mutant.id,
      }
      GAME_STATE.state = "playing"
      return true
    end
  end
  return false
end

-- Assemble a mutant from parts in inventory.
-- Returns: assembled mutant table or nil + error
function assemble_mutant(name, color, part_ids, parts_catalogue)
  local parts = {}
  local required = { "head", "chest", "left_arm", "right_arm", "left_leg", "right_leg" }
  local parts_map = {}
  for _, p in ipairs(parts_catalogue) do
    parts_map[p.id] = p
  end
  for _, slot in ipairs(required) do
    local part_id = part_ids[slot]
    if not part_id then
      return nil, "Missing part for slot: " .. slot
    end
    local part = parts_map[part_id]
    if not part then
      return nil, "Part not found: " .. part_id
    end
    parts[slot] = part
  end
  return {
    id     = "mutant_" .. tostring(math.random(100000, 999999)),
    name   = name,
    color  = color or "#6c8ef7",
    parts  = parts,
    status = "healthy",
    matches_played = 0,
  }, nil
end
