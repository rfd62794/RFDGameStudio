-- logic.lua — SlimeCoin game logic
-- Real-time coin pusher with shooter, two-layer board, and chip synergies

-- ── Global State ─────────────────────────────────────────────────────────────

GAME_STATE = {
  -- Round state
  round = 1,
  total_rounds = 15,
  score = 0,
  target_score = 100,
  score_rate = 1.0,
  hand_in = 10,
  max_hand_in = 10,
  
  -- Shooter state
  shooter_aim = 0.0,  -- -1.0 to 1.0 (left to right)
  pocket_coin_type = nil,
  
  -- Pusher state
  pusher_phase = 0.0,  -- sinusoidal phase
  pusher_speed = 1.0,
  
  -- Coins on shelf (upper layer)
  shelf_coins = {},  -- {id, type_id, x, y, vx, vy, mass, radius, value}
  
  -- Coins on floor (lower layer)
  floor_coins = {},  -- {id, type_id, x, y, vx, vy, mass, radius, value}
  
  -- Obstacles on shelf
  obstacles = {},  -- {id, type_id, x, y, hits_remaining}
  
  -- Chip cards owned this run
  owned_chips = {},  -- {card_id}
  
  -- Pocket coins available
  pocket_coins = {},  -- {type_id, count}
  
  -- Round modifiers
  active_modifiers = {},  -- {modifier_id}
  
  -- Combo tracking
  combo_count = 0,
  combo_timer = 0,
  last_score_time = 0,
  
  -- Game phase: 'playing', 'card_select', 'run_end'
  phase = 'playing',
  
  -- Card selection state
  offered_cards = {},  -- {card_id, name, rarity, description}
  selected_card = nil,
}

-- ── Constants ───────────────────────────────────────────────────────────────

local BOARD = {
  shelf_width = 400,
  shelf_height = 200,
  shelf_depth = 100,
  floor_width = 400,
  floor_height = 150,
  shooter_x = 200,
  shooter_y = 450,
  pusher_amplitude = 50,
  pusher_frequency = 1.0,
  shelf_gravity = 0.0,  -- No gravity on shelf - pusher provides all movement
  floor_gravity = 500.0,  -- Normal gravity on floor for landing
  friction = 0.96,
  restitution = 0.7,
}

local SLIME_TYPES = {
  basic = {mass = 1.0, radius = 14, value = 1},
  heavy = {mass = 2.2, radius = 16, value = 3},
  light = {mass = 0.8, radius = 13, value = 5},
  sticky = {mass = 1.5, radius = 15, value = 10},
  dense = {mass = 3.5, radius = 18, value = 15},
  rare = {mass = 1.8, radius = 17, value = 25},
  bad = {mass = 1.0, radius = 14, value = -5},
}

local POCKET_EFFECTS = {
  boom = {radius = 60, force = 300},
  pull = {radius = 100, force = 200},
  echo = {hand_bonus = 5},
  giga = {mass_mult = 10, size_mult = 3},
}

-- ── Helper Functions ─────────────────────────────────────────────────────────

local function copy_table(list)
  local result = {}
  for i, v in pairs(list) do
    result[i] = v
  end
  return result
end

local function distance(x1, y1, x2, y2)
  return math.sqrt((x2 - x1)^2 + (y2 - y1)^2)
end

local function next_id()
  GAME_STATE._next_id = (GAME_STATE._next_id or 0) + 1
  return GAME_STATE._next_id
end

-- ── Initialization ─────────────────────────────────────────────────────────

function init_game(config)
  config = config or {}
  
  -- Reset state
  GAME_STATE.round = 1
  GAME_STATE.score = 0
  GAME_STATE.score_rate = 1.0
  GAME_STATE.hand_in = 10
  GAME_STATE.max_hand_in = 10
  GAME_STATE.shelf_coins = {}
  GAME_STATE.floor_coins = {}
  GAME_STATE.obstacles = {}
  GAME_STATE.owned_chips = {}
  GAME_STATE.pocket_coins = {
    boom = 1,
    pull = 1,
    echo = 1,
    giga = 0,
  }
  GAME_STATE.active_modifiers = {}
  GAME_STATE.combo_count = 0
  GAME_STATE.combo_timer = 0
  GAME_STATE.last_score_time = 0
  GAME_STATE.phase = 'playing'
  GAME_STATE._next_id = 0
  
  -- Set target score for round 1
  GAME_STATE.target_score = 100
  
  -- Add initial obstacles
  GAME_STATE.obstacles = {
    {id = next_id(), type_id = 'peg', x = 100, y = 100, hits_remaining = 999},
    {id = next_id(), type_id = 'peg', x = 300, y = 100, hits_remaining = 999},
  }
  
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
  
  return {success = true}
end

-- ── Round Management ───────────────────────────────────────────────────────

function start_round(round_num)
  GAME_STATE.round = round_num
  GAME_STATE.score_rate = 1.0
  GAME_STATE.hand_in = GAME_STATE.max_hand_in
  GAME_STATE.combo_count = 0
  GAME_STATE.combo_timer = 0
  
  -- Calculate target score
  GAME_STATE.target_score = math.floor(100 * (1.5 ^ (round_num - 1)))
  
  -- Increase pusher speed
  GAME_STATE.pusher_speed = 1.0 + (round_num - 1) * 0.1
  
  -- Clear shelf for new round
  GAME_STATE.shelf_coins = {}
  
  -- Apply round modifiers
  GAME_STATE.active_modifiers = {}
  if round_num % 5 == 0 then
    table.insert(GAME_STATE.active_modifiers, 'bad_coins')
  end
  
  return {round = round_num, target = GAME_STATE.target_score}
end

function end_round()
  -- Check if target met
  local target_met = GAME_STATE.score >= GAME_STATE.target_score
  
  -- Offer chip cards
  GAME_STATE.phase = 'card_select'
  GAME_STATE.offered_cards = generate_card_offer(3)
  
  return {
    round = GAME_STATE.round,
    score = GAME_STATE.score,
    target = GAME_STATE.target_score,
    target_met = target_met,
    offered_cards = GAME_STATE.offered_cards,
  }
end

function select_card(card_id)
  table.insert(GAME_STATE.owned_chips, card_id)
  GAME_STATE.selected_card = card_id
  GAME_STATE.phase = 'playing'
  
  -- Advance to next round
  if GAME_STATE.round < GAME_STATE.total_rounds then
    start_round(GAME_STATE.round + 1)
  else
    GAME_STATE.phase = 'run_end'
  end
  
  return {card_id = card_id, next_round = GAME_STATE.round}
end

-- ── Card System ────────────────────────────────────────────────────────────

function generate_card_offer(count)
  -- Simplified: return random cards from pool
  local card_pool = {
    {id = 'zombie_slime', name = 'Zombie Slime', rarity = 'epic', description = 'Converts adjacent coins'},
    {id = 'crystal_burst', name = 'Crystal Burst', rarity = 'rare', description = 'Multiplies adjacent value'},
    {id = 'heavy_impact', name = 'Heavy Impact', rarity = 'common', description = 'Shockwave on landing'},
    {id = 'bubble_chain', name = 'Bubble Chain', rarity = 'rare', description = 'Chain pop bonus'},
    {id = 'tar_cluster', name = 'Tar Cluster', rarity = 'common', description = 'Cluster bonus'},
    {id = 'iron_path', name = 'Iron Path', rarity = 'rare', description = 'Wider path clear'},
  }
  
  local offer = {}
  for i = 1, count do
    local idx = math.random(1, #card_pool)
    table.insert(offer, card_pool[idx])
  end
  
  return offer
end

-- ── Shooter Mechanics ───────────────────────────────────────────────────────

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

function trigger_pocket_boom(coin)
  local effect = POCKET_EFFECTS.boom
  local shelf_coins = copy_table(GAME_STATE.shelf_coins)
  
  for _, other in pairs(shelf_coins) do
    if other.id ~= coin.id then
      local d = distance(coin.x, coin.y, other.x, other.y)
      if d < effect.radius then
        -- Launch forward
        other.vx = other.vx + effect.force
        other.vy = other.vy - 100
      end
    end
  end
end

-- ── Physics: Shelf Layer ───────────────────────────────────────────────────

function update_shelf_physics(dt)
  local shelf_coins = copy_table(GAME_STATE.shelf_coins)
  local obstacles = copy_table(GAME_STATE.obstacles)
  
  -- Update pusher phase
  GAME_STATE.pusher_phase = GAME_STATE.pusher_phase + dt * GAME_STATE.pusher_speed * BOARD.pusher_frequency
  local pusher_x = BOARD.shelf_width / 2 + math.sin(GAME_STATE.pusher_phase) * BOARD.pusher_amplitude
  
  -- Update coin positions
  for _, coin in pairs(shelf_coins) do
    -- Apply gravity (shelf has no gravity - pusher provides movement)
    coin.vy = coin.vy + BOARD.shelf_gravity * dt

    -- Apply friction
    coin.vx = coin.vx * BOARD.friction
    coin.vy = coin.vy * BOARD.friction
    
    -- Update position
    coin.x = coin.x + coin.vx * dt
    coin.y = coin.y + coin.vy * dt
    
    -- Wall collisions
    if coin.x < coin.radius then
      coin.x = coin.radius
      coin.vx = -coin.vx * BOARD.restitution
    elseif coin.x > BOARD.shelf_width - coin.radius then
      coin.x = BOARD.shelf_width - coin.radius
      coin.vx = -coin.vx * BOARD.restitution
    end
    
    if coin.y < coin.radius then
      coin.y = coin.radius
      coin.vy = -coin.vy * BOARD.restitution
    end
    
    -- Obstacle collisions
    for _, obs in pairs(obstacles) do
      local d = distance(coin.x, coin.y, obs.x, obs.y)
      if d < coin.radius + 10 then  -- 10 is obstacle radius
        -- Bounce
        local dx = coin.x - obs.x
        local dy = coin.y - obs.y
        local len = math.sqrt(dx*dx + dy*dy)
        if len > 0 then
          dx, dy = dx/len, dy/len
          coin.vx = coin.vx + dx * 100
          coin.vy = coin.vy + dy * 100
        end

        -- Check for slime tower collapse
        if obs.type_id == 'slime_tower' then
          obs.hits_remaining = (obs.hits_remaining or 3) - 1
          if obs.hits_remaining <= 0 then
            -- Remove obstacle and scatter coins
            obs.hits_remaining = 0
          end
        end
      end
    end

    -- Coin-to-coin collision on shelf
    for _, other in pairs(shelf_coins) do
      if other.id ~= coin.id then
        local d = distance(coin.x, coin.y, other.x, other.y)
        local min_dist = coin.radius + other.radius
        if d < min_dist and d > 0 then
          -- Position correction (separate overlapping coins)
          local overlap = min_dist - d
          local dx = (coin.x - other.x) / d
          local dy = (coin.y - other.y) / d

          -- Move coins apart proportional to inverse mass
          local total_mass = coin.mass + other.mass
          local coin_ratio = other.mass / total_mass
          local other_ratio = coin.mass / total_mass

          coin.x = coin.x + dx * overlap * coin_ratio
          coin.y = coin.y + dy * overlap * coin_ratio
          other.x = other.x - dx * overlap * other_ratio
          other.y = other.y - dy * overlap * other_ratio

          -- Elastic collision response
          local rel_vx = coin.vx - other.vx
          local rel_vy = coin.vy - other.vy
          local rel_v_dot_n = rel_vx * dx + rel_vy * dy

          if rel_v_dot_n < 0 then
            local impulse = 2 * rel_v_dot_n / total_mass
            coin.vx = coin.vx - impulse * other.mass * dx
            coin.vy = coin.vy - impulse * other.mass * dy
            other.vx = other.vx + impulse * coin.mass * dx
            other.vy = other.vy + impulse * coin.mass * dy
          end
        end
      end
    end
    
    -- Pusher collision
    local pusher_y = 50  -- Pusher is at back of shelf
    if math.abs(coin.x - pusher_x) < 30 and math.abs(coin.y - pusher_y) < 20 then
      coin.vx = coin.vx + 50  -- Push forward
    end
    
    -- Check for fall off shelf edge
    if coin.y > BOARD.shelf_height then
      -- Transition to floor
      transition_to_floor(coin)
    end
  end
  
  -- Remove coins that fell
  GAME_STATE.shelf_coins = {}
  for _, coin in pairs(shelf_coins) do
    if coin.y <= BOARD.shelf_height then
      table.insert(GAME_STATE.shelf_coins, coin)
    end
  end
  
  -- Remove collapsed obstacles
  GAME_STATE.obstacles = {}
  for _, obs in pairs(obstacles) do
    if obs.hits_remaining > 0 then
      table.insert(GAME_STATE.obstacles, obs)
    end
  end
end

function transition_to_floor(coin)
  -- Coin falls from shelf to floor - create a copy to avoid shared reference
  local floor_coin = {
    id = coin.id,
    type_id = coin.type_id,
    x = coin.x,
    y = 0,  -- Start at top of floor
    vx = coin.vx,
    vy = 100,  -- Downward velocity
    mass = coin.mass,
    radius = coin.radius,
    value = coin.value,
  }
  table.insert(GAME_STATE.floor_coins, floor_coin)

  -- Trigger landing effects on the floor copy
  trigger_landing_effects(floor_coin)
end

function trigger_landing_effects(coin)
  -- Check for chip synergies
  local slime = SLIME_TYPES[coin.type_id] or SLIME_TYPES.basic
  
  -- Heavy slime: push adjacent coins
  if coin.type_id == 'heavy' then
    local floor_coins = copy_table(GAME_STATE.floor_coins)
    for _, other in pairs(floor_coins) do
      if other.id ~= coin.id then
        local d = distance(coin.x, coin.y, other.x, other.y)
        if d < coin.radius + other.radius + 20 then
          other.vx = other.vx + 50
        end
      end
    end
  end
  
  -- Light slime: bounce
  if coin.type_id == 'light' then
    coin.vy = -200
  end
  
  -- Bad slime: reduce score rate
  if coin.type_id == 'bad' then
    GAME_STATE.score_rate = math.max(1.0, GAME_STATE.score_rate - 0.5)
  end
end

-- ── Physics: Floor Layer ───────────────────────────────────────────────────

function update_floor_physics(dt)
  local floor_coins = copy_table(GAME_STATE.floor_coins)
  
  for _, coin in pairs(floor_coins) do
    -- Apply gravity (floor has normal gravity for landing)
    coin.vy = coin.vy + BOARD.floor_gravity * dt

    -- Apply friction (floor has more friction)
    coin.vx = coin.vx * 0.95
    coin.vy = coin.vy * 0.95

    -- Update position
    coin.x = coin.x + coin.vx * dt
    coin.y = coin.y + coin.vy * dt
    
    -- Wall collisions
    if coin.x < coin.radius then
      coin.x = coin.radius
      coin.vx = -coin.vx * 0.5
    elseif coin.x > BOARD.floor_width - coin.radius then
      coin.x = BOARD.floor_width - coin.radius
      coin.vx = -coin.vx * 0.5
    end
    
    if coin.y < coin.radius then
      coin.y = coin.radius
      coin.vy = -coin.vy * 0.5
    elseif coin.y > BOARD.floor_height - coin.radius then
      coin.y = BOARD.floor_height - coin.radius
      coin.vy = -coin.vy * 0.5
    end
    
    -- Coin-to-coin collision
    for _, other in pairs(floor_coins) do
      if other.id ~= coin.id then
        local d = distance(coin.x, coin.y, other.x, other.y)
        local min_dist = coin.radius + other.radius
        if d < min_dist and d > 0 then
          -- Position correction (separate overlapping coins)
          local overlap = min_dist - d
          local dx = (coin.x - other.x) / d
          local dy = (coin.y - other.y) / d

          -- Move coins apart proportional to inverse mass
          local total_mass = coin.mass + other.mass
          local coin_ratio = other.mass / total_mass
          local other_ratio = coin.mass / total_mass

          coin.x = coin.x + dx * overlap * coin_ratio
          coin.y = coin.y + dy * overlap * coin_ratio
          other.x = other.x - dx * overlap * other_ratio
          other.y = other.y - dy * overlap * other_ratio

          -- Elastic collision response
          local rel_vx = coin.vx - other.vx
          local rel_vy = coin.vy - other.vy
          local rel_v_dot_n = rel_vx * dx + rel_vy * dy

          if rel_v_dot_n < 0 then
            local impulse = 2 * rel_v_dot_n / total_mass
            coin.vx = coin.vx - impulse * other.mass * dx
            coin.vy = coin.vy - impulse * other.mass * dy
            other.vx = other.vx + impulse * coin.mass * dx
            other.vy = other.vy + impulse * coin.mass * dy

            -- Trigger chip synergies on contact
            trigger_chip_synergy(coin, other)
          end
        end
      end
    end
  end
end

function trigger_chip_synergy(coin1, coin2)
  -- Check for owned chip cards and trigger effects
  local owned = copy_table(GAME_STATE.owned_chips)
  
  for _, card_id in pairs(owned) do
    if card_id == 'zombie_slime' and coin1.type_id == 'basic' then
      -- Convert adjacent to zombie (basic)
      coin2.type_id = 'basic'  -- Simplified: just mark as affected
    elseif card_id == 'crystal_burst' and coin1.type_id == 'rare' then
      -- Multiply adjacent value
      coin2.value = coin2.value * 2
    elseif card_id == 'bubble_chain' and coin1.type_id == 'light' then
      -- Check for chain
      local chain_count = count_adjacent_type(coin2, 'light')
      if chain_count >= 5 then
        -- Pop chain for bonus
        GAME_STATE.score = GAME_STATE.score + chain_count * 10
      end
    end
  end
end

function count_adjacent_type(coin, type_id)
  local count = 0
  local floor_coins = copy_table(GAME_STATE.floor_coins)
  
  for _, other in pairs(floor_coins) do
    if other.id ~= coin.id and other.type_id == type_id then
      local d = distance(coin.x, coin.y, other.x, other.y)
      if d < coin.radius + other.radius + 10 then
        count = count + 1
      end
    end
  end
  
  return count
end

-- ── Scoring ───────────────────────────────────────────────────────────────

function update_scoring(dt)
  local current_time = GAME_STATE._time or 0
  GAME_STATE._time = current_time + dt
  
  -- Decay combo timer
  if GAME_STATE.combo_timer > 0 then
    GAME_STATE.combo_timer = GAME_STATE.combo_timer - dt
    if GAME_STATE.combo_timer <= 0 then
      GAME_STATE.combo_count = 0
    end
  end
  
  -- Score coins on floor (simplified: all floor coins contribute)
  local floor_coins = copy_table(GAME_STATE.floor_coins)
  local round_score = 0
  
  for _, coin in pairs(floor_coins) do
    round_score = round_score + coin.value
  end
  
  -- Apply score rate
  round_score = math.floor(round_score * GAME_STATE.score_rate)
  GAME_STATE.score = GAME_STATE.score + round_score
  
  -- Update combo
  if round_score > 0 then
    GAME_STATE.combo_count = GAME_STATE.combo_count + 1
    GAME_STATE.combo_timer = 2.0  -- 2 second combo window
    
    -- Increase score rate with combos
    if GAME_STATE.combo_count > 10 then
      GAME_STATE.score_rate = 1.0 + (GAME_STATE.combo_count / 20)
    end
  end
end

-- ── Main Game Loop ─────────────────────────────────────────────────────────

function tick_game(dt, input)
  input = input or {}

  if GAME_STATE.phase ~= 'playing' then
    return {phase = GAME_STATE.phase}
  end

  -- Handle fire input — one coin per keypress (fire resets each tick in TS)
  if input.fire then
    local coin_type = input.pocket_coin_type or 'basic'
    local side = input.side or 'right'
    fire_coin(coin_type, side)
  end

  -- Update physics
  update_shelf_physics(dt)
  update_floor_physics(dt)

  -- Update scoring
  update_scoring(dt)

  -- Check round end
  if GAME_STATE.hand_in <= 0 and #GAME_STATE.shelf_coins == 0 then
    return end_round()
  end

  -- Return render state
  return {
    phase = GAME_STATE.phase,
    round = GAME_STATE.round,
    score = GAME_STATE.score,
    target_score = GAME_STATE.target_score,
    score_rate = GAME_STATE.score_rate,
    hand_in = GAME_STATE.hand_in,
    pusher_phase = GAME_STATE.pusher_phase,
    shelf_coins = copy_table(GAME_STATE.shelf_coins),
    floor_coins = copy_table(GAME_STATE.floor_coins),
    obstacles = copy_table(GAME_STATE.obstacles),
    combo_count = GAME_STATE.combo_count,
  }
end

-- ── Query Functions ───────────────────────────────────────────────────────

function get_state_summary()
  return {
    phase = GAME_STATE.phase,
    round = GAME_STATE.round,
    total_rounds = GAME_STATE.total_rounds,
    score = GAME_STATE.score,
    target_score = GAME_STATE.target_score,
    score_rate = GAME_STATE.score_rate,
    hand_in = GAME_STATE.hand_in,
    shelf_coin_count = #copy_table(GAME_STATE.shelf_coins),
    floor_coin_count = #copy_table(GAME_STATE.floor_coins),
    owned_chips = copy_table(GAME_STATE.owned_chips),
    combo_count = GAME_STATE.combo_count,
  }
end
