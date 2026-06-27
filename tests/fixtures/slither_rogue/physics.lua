-- Slither Rogue — Physics
-- Per-tick movement, segment following, NPC AI, acid decay.
-- Depends on: utils.lua, state.lua

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
  if (p.ambush_burst_timer or 0) > 0 then
    spd = spd * (1.3 + (p.ambush_level or 1) * 0.1)  -- 40-50% burst
  end

  head.x = clamp(head.x + math.cos(p.angle)*spd*dt, p.radius, a.map_width  - p.radius)
  head.y = clamp(head.y + math.sin(p.angle)*spd*dt, p.radius, a.map_height - p.radius)
  _follow(p)

  -- Shield regeneration: restore 1 charge if no hit for 10 seconds
  if (p.shield_charges or 0) < (p.shield_max_charges or 0) then
    p.shield_regen_timer = (p.shield_regen_timer or 0) + dt
    if p.shield_regen_timer >= 10.0 then
      p.shield_regen_timer = 0
      p.shield_charges = math.min(p.shield_charges + 1, p.shield_max_charges)
      table.insert(st.events, {
        type = "shield_recharged",
        charges = p.shield_charges
      })
    end
  else
    p.shield_regen_timer = 0
  end

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
    -- Synergy: Venom + Speed → acid drops persist 50% longer
    local speed_levels = st.active_evolutions and (st.active_evolutions.speed or 0) or 0
    local duration_bonus = (speed_levels > 0) and 1.5 or 1.0
    if p.acid_timer >= 0.45 then
      p.acid_timer = 0
      local tail = p.segments[#p.segments]
      st.acid_drops[#st.acid_drops+1] = {
        x=tail.x, y=tail.y,
        timer  = (5 + p.venom_level*2) * duration_bonus,
        radius = 8 + p.venom_level*1.5,
      }
    end
  end

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

      -- Wall avoidance takes priority over everything
      if     nh.x < wb                then npc.target_angle = 0
      elseif nh.x > a.map_width  - wb then npc.target_angle = math.pi
      elseif nh.y < wb                then npc.target_angle = math.pi/2
      elseif nh.y > a.map_height - wb then npc.target_angle = -math.pi/2
      else
        -- Hunter vs Farmer decision
        local player = st.player
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

function _decay_acid_drops(st, dt)
  local alive = {}
  for _, d in ipairs(st.acid_drops) do
    d.timer = d.timer - dt
    if d.timer > 0 then alive[#alive+1] = d end
  end
  st.acid_drops = alive
end
