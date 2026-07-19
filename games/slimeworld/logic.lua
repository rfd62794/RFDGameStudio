function check_level_up(slime, color_specs)
  while (slime.xp or 0) >= 100 do
    slime.xp = (slime.xp or 0) - 100
    slime.level = (slime.level or 1) + 1
    slime.stats = calculate_stats(slime.color, slime.level, slime.hue, slime.saturation, slime.vertex_count, slime.irregularity, color_specs)
  end
end

function advance_cycle(state, color_specs)
  state.cycle = (state.cycle or 0) + 1

  -- Expire contracts
  for _, contract in ipairs(state.contracts or {}) do
    contract.cycles_remaining = contract.cycles_remaining - 1
  end
  for index = #(state.contracts or {}), 1, -1 do
    if state.contracts[index].cycles_remaining <= 0 then table.remove(state.contracts, index) end
  end

  -- Spawn new contracts (65% chance, cap 4, minimum 2)
  local contracts = state.contracts or {}
  if #contracts < 4 and (math.random() < 0.65 or #contracts < 2) then
    table.insert(contracts, generate_contract(state.cycle))
  end
  state.contracts = contracts

  for index = #(state.petitions or {}), 1, -1 do
    if state.petitions[index].expires_cycle < state.cycle then table.remove(state.petitions, index) end
  end

  -- Spawn new wanderer petitions (deterministic, up to WANDERER_REQUEST_MAX)
  if #(state.petitions or {}) < WANDERER_REQUEST_MAX then
    local new_petition = create_wanderer_petition(state.cycle, state.petitions or {})
    if new_petition ~= nil then
      state.petitions = state.petitions or {}
      table.insert(state.petitions, new_petition)
    end
  end

  -- Dual logging: deterministic cycle log + 45% chance flavor log
  if state.logs == nil then state.logs = {} end
  table.insert(state.logs, {
    id = "log_cycle_" .. os.time(),
    cycle = state.cycle,
    text = "CYCLE ADVANCED: Lab cycle " .. state.cycle .. " initiated. All energy cells replenished.",
    type = "system",
  })
  if math.random() < 0.45 then
    table.insert(state.logs, get_random_melancholic_log(state.cycle))
  end

  -- Worker income
  local nodes = state.planet_region and state.planet_region.nodes or {}
  for _, slime in ipairs(state.slimes or {}) do
    if slime.locked_role == "worker" then
      state.credits = (state.credits or 0) + calculate_worker_income(slime, state.has_auto_feeder == true, nodes)
    end
  end

  -- Capitol hardening bonus
  for _, node in ipairs(nodes) do
    if has_secure_capitol_garrison(state, node) and is_capitol_hardened(node, nodes) then
      state.credits = (state.credits or 0) + 15
    end
  end

  -- Planet territory simulation: supply/pressure, flips, revolts, cascade collapse
  local region = state.planet_region
  if region and region.nodes and #region.nodes > 0 then
    local sim_nodes, sim_logs = update_planet_supply_and_pressure(region.nodes)
    region.nodes = sim_nodes
    for _, sim_log in ipairs(sim_logs) do
      table.insert(state.logs, {
        id = "log_sim_" .. os.time() .. "_" .. math.random(1000),
        cycle = state.cycle,
        text = sim_log,
        type = "system",
      })
    end

    -- Stray generation on node flips (detect owner_color change)
    -- We detect flips by checking if a node has strength 0.3 and no garrison (post-flip state)
    -- and generate a stray matching the new owner color
    local slimes = state.slimes or {}
    for _, node in ipairs(region.nodes) do
      -- Check for recently flipped nodes (strength == 0.3, owner_color set, pressure cleared)
      -- This is a heuristic since we don't have prior state to compare
      -- We use the sim_logs to detect flips instead
    end
    -- Parse sim_logs for TERRITORY FLIP entries to generate strays
    for _, sim_log in ipairs(sim_logs) do
      if string.find(sim_log, "TERRITORY FLIP:") then
        -- Extract the new owner color from the log
        local new_color = string.match(sim_log, "to (%a+)%.")
        if new_color and #slimes < (state.roster_cap or 8) then
          local stray = create_seed_slime(new_color, "Solid", color_specs)
          stray.id = "stray_flip_" .. os.time() .. "_" .. math.random(1000)
          stray.locked_role = "worker"
          stray.name = "Refugee " .. stray.name
          table.insert(slimes, stray)
          table.insert(state.logs, {
            id = "log_stray_flip_" .. os.time() .. "_" .. math.random(1000),
            cycle = state.cycle,
            text = "STRAY DETECTION: A stray " .. new_color .. " refugee fled the conflict zone and arrived at containment. lockedRole assigned to WORKER.",
            type = "combat",
          })
        end
      end
    end
    state.slimes = slimes
  end

  -- Resolve active exploration
  if state.active_exploration and state.active_exploration.status == "active" then
    local exploration = state.active_exploration
    local region = state.planet_region
    local target_node = nil
    if region and region.nodes then
      for _, node in ipairs(region.nodes) do
        if node.id == exploration.target_node_id then target_node = node break end
      end
    end

    local scout_power = 0
    local party = {}
    for _, id in ipairs(exploration.slime_ids or {}) do
      for _, slime in ipairs(state.slimes or {}) do
        if slime.id == id then
          table.insert(party, slime)
          scout_power = scout_power + (slime.stats.int or 0) + (slime.stats.agi or 0)
          break
        end
      end
    end

    local success = false
    if target_node and #party > 0 then
      local target_power = 40 + math.floor((target_node.strength or 0) * 60 + 0.5)
      if target_power < 1 then target_power = 60 end
      local ratio = scout_power / target_power
      local chance
      if ratio > 1 then chance = 0.85 + (ratio - 1) * 0.1 else chance = 0.2 + ratio * 0.6 end
      chance = math.min(0.98, math.max(0.15, chance))
      success = math.random() <= chance

      if success and region and region.nodes then
        for _, node in ipairs(region.nodes) do
          if node.id == exploration.target_node_id then node.discovered = true break end
        end
      end
    end

    -- Award XP and return scouts to idle
    for _, slime in ipairs(state.slimes or {}) do
      for _, id in ipairs(exploration.slime_ids or {}) do
        if slime.id == id then
          slime.xp = (slime.xp or 0) + (success and 45 or 20)
          check_level_up(slime, color_specs)
          slime.role = "idle"
          break
        end
      end
    end

    table.insert(state.logs, {
      id = "log_exp_res_" .. os.time(),
      cycle = state.cycle,
      text = "EXPLORATION CONCLUDED: Scouting expedition at [" .. (target_node and target_node.name or "unknown") .. "] resolved. " .. (success and "Sector revealed." or "Mission failed."),
      type = "corporate",
    })

    state.active_exploration = nil
  end

  -- Resolve active mediation
  if state.active_mediation and state.active_mediation.status == "active" then
    local mediation = state.active_mediation
    local node = find_by_id(state.planet_region and state.planet_region.nodes, mediation.target_node_id)
    local party = select_slimes(state.slimes, mediation.slime_ids)

    if #party == 0 then
      -- empty party: abort with no stability change
    elseif node ~= nil then
      local total_chm = 0
      for _, slime in ipairs(party) do
        total_chm = total_chm + (slime.stats and slime.stats.chm or 0)
      end
      local strength = node.strength or 0
      local target_power = 40 + (strength > 0 and math.floor((1 - strength) * 60 + 0.5) or 35)
      local ratio = target_power > 0 and (total_chm / target_power) or 0
      local chance
      if ratio > 1 then chance = 0.85 + (ratio - 1) * 0.1
      else chance = 0.2 + ratio * 0.6 end
      chance = math.min(0.98, math.max(0.15, chance))

      local success = math.random() <= chance
      local stability_change
      if success then
        stability_change = math.floor(15 + total_chm / 6 + math.random() * 8)
      else
        stability_change = math.floor(5 + math.random() * 5)
      end
      node.strength = math.min(1, strength + stability_change / 100)

      table.insert(state.logs, {
        id = "log_med_res_" .. os.time(),
        cycle = state.cycle,
        text = "MEDIATION CONCLUDED: Diplomatic mission at [" .. (node.name or node.id) .. "] resolved. " .. (success and "Stability restored." or "Progress made, though tensions remain."),
        type = "corporate",
      })
    end

    for _, slime in ipairs(party) do slime.locked_role = nil end
    state.active_mediation = nil
  end

  -- Resolve active dispatch
  if state.active_dispatch and state.active_dispatch.status == "active" then
    local dispatch = state.active_dispatch
    local zone = find_by_id(state.zones, dispatch.zone_id)
    local party = select_slimes(state.slimes, dispatch.slime_ids)

    if #party == 0 or zone == nil then
      dispatch.status = "completed"
      dispatch.result = { success = false, xp_gained = 0, credits_gained = 0 }
    else
      local combat_rating = 0
      for _, slime in ipairs(party) do
        local match_bonus = (slime.color == zone.requiredColor) and 2.0 or 1.0
        combat_rating = combat_rating + (slime.level * 10 + (slime.stats.hp or 0) / 15 + (slime.stats.atk or 0) + (slime.stats.def or 0)) * match_bonus
      end
      local power_target = zone.recommendedLevel * 30 + zone.difficulty * 25
      local ratio = power_target > 0 and (combat_rating / power_target) or 0
      local chance
      if ratio > 1 then chance = 0.85 + (ratio - 1) * 0.1
      else chance = 0.2 + ratio * 0.6 end
      chance = math.min(0.98, math.max(0.1, chance))

      local success = math.random() <= chance
      local xp, credits, unlocked = 0, 0, nil
      if success then
        xp = zone.xpReward
        credits = zone.creditsReward
        if not zone.isFirstClearCompleted then
          zone.isFirstClearCompleted = true
          if zone.id == "zone_cinder" then unlocked = "zone_sulphur"
          elseif zone.id == "zone_sulphur" then unlocked = "zone_abyssal"
          elseif zone.id == "zone_abyssal" then unlocked = "zone_jungle" end
        end
      else
        xp = 15
      end

      for _, slime in ipairs(state.slimes or {}) do
        for _, id in ipairs(dispatch.slime_ids or {}) do
          if slime.id == id then
            slime.xp = (slime.xp or 0) + xp
            check_level_up(slime, color_specs)
            slime.role = "idle"
            break
          end
        end
      end

      state.credits = (state.credits or 0) + credits

      if unlocked then
        for _, z in ipairs(state.zones or {}) do
          if z.id == unlocked then z.isUnlocked = true break end
        end
      end

      dispatch.status = "completed"
      dispatch.result = { success = success, xp_gained = xp, credits_gained = credits, unlocked_zone_id = unlocked }
    end
  end

  -- Wilds unlock check
  if not state.wilds_unlocked and check_wilds_unlock_condition(state.slimes) then
    state.wilds_unlocked = true
    table.insert(state.logs, {
      id = "log_wilds_unlock_" .. os.time(),
      cycle = state.cycle,
      text = "PLANETARY TELEMETRY: Secondary color genetic signature detected in containment cells. Ring-2 [The Wilds] region orbital connection established!",
      type = "system",
    })
  end

  -- Prune recent_market_sales to 5-cycle window
  local kept_sales = {}
  for _, record in ipairs(state.recent_market_sales or {}) do
    if record.cycle >= state.cycle - 4 then table.insert(kept_sales, record) end
  end
  state.recent_market_sales = kept_sales

  return state
end
