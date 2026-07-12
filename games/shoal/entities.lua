-- shoal/entities.lua — spawning, killing, lineage, and algae nodule helpers

function new_fish(x, depth)
    local data = GAME_STATE.data
    local cfg = data.creatures.fish
    local id = uid("fish")
    return {
        id = id,
        type = "fish",
        x = x,
        depth = depth,
        vx = random_float(-1, 1),
        vd = random_float(-0.5, 0.5),
        age = 0,
        fed = 0,
        cold_exposure = 0,
        cold_damage = 0,
        radius = cfg.radius,
        max_speed = cfg.max_speed,
        max_force = cfg.max_force,
        lineage_color = generate_procedural_color(id),
        mature = false,
        alive = true,
    }
end

function new_shark(x, depth)
    local data = GAME_STATE.data
    local cfg = data.creatures.shark
    local id = uid("shark")
    return {
        id = id,
        type = "shark",
        x = x,
        depth = depth,
        vx = random_float(-1, 1),
        vd = random_float(-0.5, 0.5),
        age = 0,
        fed = 0,
        hunger = 0,
        exposure = 0,
        last_meal_tick = 0,
        ticks_with_target = 0,
        ticks_total = 0,
        radius = cfg.radius,
        max_speed = cfg.max_speed,
        max_force = cfg.max_force,
        lineage_color = generate_procedural_color(id),
        mature = false,
        alive = true,
        in_retreat = false,
    }
end

function new_algae_nodule(cx, cdepth, dir, dist)
    local dx, dy = 0, 0
    if dir == 0 then dy = -dist
    elseif dir == 1 then dy = dist
    elseif dir == 2 then dx = -dist
    elseif dir == 3 then dx = dist
    end
    return {
        id = uid("nodule"),
        x = cx + dx,
        depth = cdepth + dy,
        live = true,
        cooldown = 0,
        offset = { x = dx, y = dy },
    }
end

function spawn_algae_core(st, x, depth)
    local data = st.data
    local nodules = {}
    local distances = data.algae.spoke_distances
    for dir = 0, 3 do
        for _, dist in ipairs(distances) do
            nodules[#nodules + 1] = new_algae_nodule(x, depth, dir, dist)
        end
    end
    local core = {
        id = uid("algae"),
        x = x,
        depth = depth,
        target_depth = depth,
        nodules = nodules,
        max_nodules = #nodules,
    }
    st.algae[#st.algae + 1] = core
    return core
end

function spawn_fish(st, x, depth)
    local f = new_fish(x, depth)
    st.fish[#st.fish + 1] = f
    st.stats.fish_count = st.stats.fish_count + 1
    return f
end

function spawn_shark(st, x, depth)
    local s = new_shark(x, depth)
    s.spawn_tick = st.tick_count
    s.last_meal_tick = st.tick_count
    st.sharks[#st.sharks + 1] = s
    st.stats.shark_count = st.stats.shark_count + 1
    return s
end

function spawn_flesh_chunks(st, x, depth, count)
    local data = st.data
    for i = 1, count do
        local angle = random_float(0, math.pi * 2)
        local speed = random_float(20, 60)
        st.chunks[#st.chunks + 1] = {
            id = uid("chunk"),
            x = x + math.cos(angle) * random_float(0, 15),
            depth = depth + math.sin(angle) * random_float(0, 15),
            vx = math.cos(angle) * speed,
            vd = math.sin(angle) * speed,
            radius = data.flesh_chunk.radius,
        }
    end
    st.stats.chunk_count = #st.chunks
end

function kill_creature(st, creature)
    if not creature.alive then return end
    if creature.type == "shark" then
        st.diagnostics = st.diagnostics or { meals = {}, deaths = {} }
        local data = st.data
        table.insert(st.diagnostics.deaths, {
            shark_id = creature.id,
            tick = st.tick_count,
            ticks_since_spawn = st.tick_count - (creature.spawn_tick or 0),
            target_ratio = creature.ticks_total > 0 and (creature.ticks_with_target / creature.ticks_total) or 0,
            cause = creature.hunger >= data.creatures.shark.starve_limit and "starvation" or "exposure",
            hunger = creature.hunger,
            exposure = creature.exposure,
        })
    end
    creature.alive = false
    if creature.type == "fish" then
        st.stats.fish_count = st.stats.fish_count - 1
    elseif creature.type == "shark" then
        st.stats.shark_count = st.stats.shark_count - 1
    end
    local data = st.data
    spawn_flesh_chunks(st, creature.x, creature.depth, math.random(data.flesh_chunk.min_spawn, data.flesh_chunk.max_spawn))
end

function update_algae_core(core, st, dt)
    local data = st.data
    local live = 0
    for _, n in ipairs(core.nodules) do
        if n.live then
            live = live + 1
        else
            n.cooldown = n.cooldown - dt
            if n.cooldown <= 0 then
                n.live = true
            end
        end
    end

    local ratio = live / core.max_nodules
    local target = lerp(data.algae.max_sunk_depth, data.algae.min_surface_depth, ratio)
    local diff = target - core.depth
    local move = data.algae.depth_lerp_speed * dt
    if math.abs(diff) <= move then
        core.depth = target
    else
        core.depth = core.depth + (diff > 0 and move or -move)
    end

    -- Update nodule world positions relative to core.
    for _, n in ipairs(core.nodules) do
        n.x = wrap_x(core.x + n.offset.x, st.world)
        n.depth = clamp_depth(core.depth + n.offset.y, st.world)
    end
    core.x = wrap_x(core.x, st.world)
end

function graze_nodule(st, nodule, core)
    if not nodule.live then return false end
    nodule.live = false
    nodule.cooldown = st.data.algae.regrow_cooldown
    return true
end

function cull_at(st, x, depth, radius)
    local data = st.data
    -- Cull fish and sharks within radius
    for _, list in ipairs({ st.fish, st.sharks }) do
        for _, c in ipairs(list) do
            if c.alive and distance(c.x, c.depth, x, depth) <= radius + c.radius then
                kill_creature(st, c)
            end
        end
    end
    -- Cull nodules
    for _, core in ipairs(st.algae) do
        for _, n in ipairs(core.nodules) do
            if n.live and distance(n.x, n.depth, x, depth) <= radius + data.algae.nodule_radius then
                graze_nodule(st, n, core)
            end
        end
    end
end

function tag_lineage(st, x, depth, radius)
    -- Future hook: tap a creature to assign a specific lineage tint.
    -- For now, no-op.
    return nil
end
