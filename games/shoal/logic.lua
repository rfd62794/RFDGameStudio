-- shoal/logic.lua — main loop and render state

function init_game(data)
    GAME_STATE = new_game_state(data)
    spawn_initial_entities(GAME_STATE, data)
    local st = GAME_STATE
    st.stats.fish_count = count_alive(st.fish)
    st.stats.shark_count = count_alive(st.sharks)
    st.stats.algae_count = count_algae_nodules(st)
    st.stats.chunk_count = #st.chunks
    return build_render_state(GAME_STATE)
end

function tick_game(dt, input)
    if not GAME_STATE then
        return { error = "call init_game first" }
    end
    if dt > 0.1 then dt = 0.1 end
    local st = GAME_STATE
    st.tick_count = st.tick_count + 1
    st.events = {}

    handle_input(st, input)

    rebuild_spatial_hash(st)
    update_creatures(st, dt)
    update_algae(st, dt)
    update_chunks(st, dt)
    update_discrete_events(st, dt)

    st.stats.fish_count = count_alive(st.fish)
    st.stats.shark_count = count_alive(st.sharks)
    st.stats.algae_count = count_algae_nodules(st)
    st.stats.chunk_count = #st.chunks

    return build_render_state(st)
end

function handle_input(st, input)
    if not input then return end
    local tool = input.tool
    if not tool or not input.clicked then return end
    if not input.x or not input.y then return end
    if tool == "cull" then
        cull_at(st, input.x, input.y, 40)
    elseif tool == "fish" then
        spawn_fish(st, input.x, input.y)
    elseif tool == "shark" then
        spawn_shark(st, input.x, input.y)
    elseif tool == "algae" then
        spawn_algae_core(st, input.x, input.y)
    end
end

function rebuild_spatial_hash(st)
    local data = st.data
    local hash = { fish = {}, shark = {} }
    local bw = data.spatial_hash.bucket_width
    local bd = data.spatial_hash.bucket_depth
    for _, f in ipairs(st.fish) do
        if f.alive then
            local bx = math.floor(f.x / bw) % math.ceil(st.world.width / bw)
            local by = math.floor(f.depth / bd) % math.ceil(st.world.height / bd)
            local key = bx .. "," .. by
            if not hash.fish[key] then hash.fish[key] = {} end
            table.insert(hash.fish[key], f)
        end
    end
    for _, s in ipairs(st.sharks) do
        if s.alive then
            local bx = math.floor(s.x / bw) % math.ceil(st.world.width / bw)
            local by = math.floor(s.depth / bd) % math.ceil(st.world.height / bd)
            local key = bx .. "," .. by
            if not hash.shark[key] then hash.shark[key] = {} end
            table.insert(hash.shark[key], s)
        end
    end
    st.spatial_hash = hash
end

function get_nearby(hash, key, type)
    local list = {}
    for dx = -1, 1 do
        for dy = -1, 1 do
            local k = key
            if hash[type][k] then
                for _, ent in ipairs(hash[type][k]) do
                    table.insert(list, ent)
                end
            end
        end
    end
    return list
end

function update_creatures(st, dt)
    local data = st.data
    for _, f in ipairs(st.fish) do
        if f.alive then
            move_creature(f, dt)
        end
    end
    for _, s in ipairs(st.sharks) do
        if s.alive then
            move_creature(s, dt)
            s.hunger = s.hunger + dt
        end
    end
end

local function limit_turn(old_vx, old_vy, new_vx, new_vy, max_turn_rate, max_speed, dt)
    local old_angle = math.atan(old_vy, old_vx)
    local new_angle = math.atan(new_vy, new_vx)
    local speed = math.sqrt(new_vx * new_vx + new_vy * new_vy)

    if speed < 0.01 then
        return new_vx, new_vy
    end

    local speed_ratio = math.min(speed / max_speed, 1.0)
    local effective_turn_rate = max_turn_rate * (2.0 - speed_ratio)

    local diff = new_angle - old_angle
    while diff > math.pi do diff = diff - 2 * math.pi end
    while diff < -math.pi do diff = diff + 2 * math.pi end

    local max_delta = effective_turn_rate * dt
    if diff > max_delta then diff = max_delta
    elseif diff < -max_delta then diff = -max_delta end

    local clamped_angle = old_angle + diff
    return math.cos(clamped_angle) * speed, math.sin(clamped_angle) * speed
end

function move_creature(c, dt)
    local st = GAME_STATE
    local data = st.data
    local fx, fy = 0, 0
    if c.type == "fish" then
        fx, fy = compute_fish_forces(c, st, nil)
    else
        fx, fy = compute_shark_forces(c, st, nil)
    end

    local old_vx, old_vd = c.vx, c.vd
    fx, fy = limit_vector(fx, fy, c.max_force)
    c.vx = c.vx + fx * dt
    c.vd = c.vd + fy * dt

    local vx, vd = limit_vector(c.vx, c.vd, c.max_speed)
    c.vx, c.vd = limit_turn(old_vx, old_vd, vx, vd, data.creatures[c.type].max_turn_rate, c.max_speed, dt)

    local drag = 0.995
    c.vx = c.vx * drag
    c.vd = c.vd * drag

    c.x = wrap_x(c.x + c.vx * dt, st.world)
    c.depth = clamp_depth(c.depth + c.vd * dt, st.world)

    if c.type == "shark" then
        local rate = compute_exposure_rate(c.depth, data)
        c.exposure = c.exposure + rate * dt
        if c.exposure >= data.creatures.shark.exposure.threshold then
            c.exposure = data.creatures.shark.exposure.threshold
            c.hunger = c.hunger + data.creatures.shark.exposure.damage_rate * dt
        end
    elseif c.type == "fish" then
        local rate = compute_fish_cold_rate(c.depth, data)
        c.cold_exposure = c.cold_exposure + rate * dt
        if c.cold_exposure >= data.creatures.fish.cold.threshold then
            c.cold_exposure = data.creatures.fish.cold.threshold
            c.cold_damage = c.cold_damage + data.creatures.fish.cold.damage_rate * dt
            if c.cold_damage >= data.creatures.fish.cold.damage_limit then
                kill_creature(st, c)
            end
        end
    end
end

function compute_fish_cold_rate(depth, data)
    local bands = data.depth_bands
    for i = 1, #bands do
        if depth <= bands[i].bottom then
            if i == 1 then
                return bands[i].fish_cold_rate
            else
                local prev = bands[i - 1]
                local t = (depth - prev.bottom) / (bands[i].bottom - prev.bottom)
                return lerp(prev.fish_cold_rate, bands[i].fish_cold_rate, t)
            end
        end
    end
    return bands[#bands].fish_cold_rate
end

function update_algae(st, dt)
    for _, core in ipairs(st.algae) do
        update_algae_core(core, st, dt)
    end
end

function update_chunks(st, dt)
    local sink_rate = st.data.flesh_chunk.sink_rate
    local floor_depth = st.world.floor_depth
    for i = #st.chunks, 1, -1 do
        local c = st.chunks[i]
        c.x = wrap_x(c.x + c.vx * dt, st.world)
        c.depth = clamp_depth(c.depth + c.vd * dt + sink_rate * dt, st.world)
        c.vx = c.vx * 0.95
        c.vd = c.vd * 0.95
        if c.depth >= floor_depth - 0.5 then
            table.remove(st.chunks, i)
        end
    end
end

function update_discrete_events(st, dt)
    st.discrete_accum = (st.discrete_accum or 0) + dt
    if st.discrete_accum < st.data.world.discrete_tick then return end
    st.discrete_accum = 0

    local data = st.data

    -- fish grazing
    for _, f in ipairs(st.fish) do
        if not f.alive then goto next_fish end
        for _, core in ipairs(st.algae) do
            for _, n in ipairs(core.nodules) do
                if n.live and distance(f.x, f.depth, n.x, n.depth) <= f.radius + data.algae.nodule_radius then
                    if graze_nodule(st, n, core) then
                        f.fed = f.fed + 1
                        if f.fed >= data.creatures.fish.breed_fed_threshold and f.age >= data.creatures.fish.breed_age then
                            spawn_fish(st, f.x, f.depth)
                            f.fed = 0
                            f.age = 0
                        end
                    end
                    break
                end
            end
        end
        ::next_fish::
    end

    -- shark hunting / chunk eating
    for _, s in ipairs(st.sharks) do
        if not s.alive then goto next_shark end
        local ate = false

        -- find nearest overlapping fish
        local nearest_fish, nearest_fish_d2 = nil, nil
        for _, f in ipairs(st.fish) do
            if f.alive then
                local d2 = dist2(s.x, s.depth, f.x, f.depth)
                local touch_radius = s.radius + f.radius
                if d2 <= touch_radius * touch_radius then
                    if not nearest_fish_d2 or d2 < nearest_fish_d2 then
                        nearest_fish, nearest_fish_d2 = f, d2
                    end
                end
            end
        end

        -- find nearest overlapping chunk
        local nearest_chunk, nearest_chunk_d2, chunk_index = nil, nil, nil
        for i, c in ipairs(st.chunks) do
            local d2 = dist2(s.x, s.depth, c.x, c.depth)
            local touch_radius = s.radius + c.radius
            if d2 <= touch_radius * touch_radius then
                if not nearest_chunk_d2 or d2 < nearest_chunk_d2 then
                    nearest_chunk, nearest_chunk_d2, chunk_index = c, d2, i
                end
            end
        end

        if nearest_fish and (not nearest_chunk or nearest_fish_d2 <= nearest_chunk_d2) then
            local speed = math.sqrt(nearest_fish.vx * nearest_fish.vx + nearest_fish.vd * nearest_fish.vd)
            local speed_ratio = speed / nearest_fish.max_speed
            local escape_chance = data.creatures.fish.escape_chance
            if speed_ratio > 0.8 then
                escape_chance = escape_chance + data.creatures.fish.escape_speed_bonus
            end
            if math.random() < escape_chance then
                -- escaped: knock the fish away so it isn't re-caught next tick
                local dx, dy = nearest_fish.x - s.x, nearest_fish.depth - s.depth
                local dist = math.sqrt(dx * dx + dy * dy)
                if dist > 0 then
                    local kb = data.creatures.fish.escape_knockback
                    nearest_fish.x = wrap_x(nearest_fish.x + (dx / dist) * kb, st.world)
                    nearest_fish.depth = clamp_depth(nearest_fish.depth + (dy / dist) * kb, st.world)
                end
            else
                kill_creature(st, nearest_fish)
                s.hunger = math.max(0, s.hunger - 4)
                s.fed = (s.fed or 0) + 1
                ate = true
            end
        elseif nearest_chunk then
            table.remove(st.chunks, chunk_index)
            s.hunger = math.max(0, s.hunger - 2)
            s.fed = (s.fed or 0) + 1
            ate = true
        end
        if s.hunger >= data.creatures.shark.starve_limit then
            kill_creature(st, s)
        end
        if s.age >= data.creatures.shark.breed_age and (s.fed or 0) >= data.creatures.shark.breed_fed_threshold then
            spawn_shark(st, s.x, s.depth)
            s.fed = 0
            s.age = 0
        end
        s.age = s.age + 1
        ::next_shark::
    end

    -- age fish
    for _, f in ipairs(st.fish) do
        if f.alive then
            f.age = f.age + data.world.discrete_tick
            f.mature = f.age >= data.creatures.fish.breed_age
        end
    end

    -- shark death from exposure already handled in move; here we just clean
    for _, s in ipairs(st.sharks) do
        if s.alive and s.hunger >= data.creatures.shark.starve_limit then
            kill_creature(st, s)
        end
    end
end

function count_alive(list)
    local n = 0
    for _, c in ipairs(list) do
        if c.alive then n = n + 1 end
    end
    return n
end

function count_algae_nodules(st)
    local n = 0
    for _, core in ipairs(st.algae) do
        for _, nod in ipairs(core.nodules) do
            if nod.live then n = n + 1 end
        end
    end
    return n
end

function build_render_state(st)
    local out = {
        world = {
            width = st.world.width,
            height = st.world.height,
        },
        fish = {},
        sharks = {},
        algae = {},
        chunks = {},
        stats = st.stats,
        events = st.events,
        tick_count = st.tick_count,
    }

    for _, f in ipairs(st.fish) do
        if f.alive then
            table.insert(out.fish, {
                id = f.id,
                x = f.x,
                depth = f.depth,
                radius = f.radius,
                color = f.lineage_color,
                angle = math.atan(f.vd, f.vx),
                mature = f.mature,
                cold_exposure = f.cold_exposure,
                cold_damage = f.cold_damage,
            })
        end
    end

    for _, s in ipairs(st.sharks) do
        if s.alive then
            table.insert(out.sharks, {
                id = s.id,
                x = s.x,
                depth = s.depth,
                radius = s.radius,
                color = s.lineage_color,
                angle = math.atan(s.vd, s.vx),
                exposure = s.exposure,
                mature = s.mature,
            })
        end
    end

    for _, core in ipairs(st.algae) do
        local nodules = {}
        for _, n in ipairs(core.nodules) do
            if n.live then
                table.insert(nodules, { x = n.x, depth = n.depth, radius = GAME_STATE.data.algae.nodule_radius })
            end
        end
        table.insert(out.algae, {
            id = core.id,
            x = core.x,
            depth = core.depth,
            nodules = nodules,
        })
    end

    for _, c in ipairs(st.chunks) do
        table.insert(out.chunks, {
            x = c.x,
            depth = c.depth,
            radius = c.radius,
        })
    end

    return out
end

function get_state_summary()
    if not GAME_STATE then return nil end
    local st = GAME_STATE
    return {
        initialized = true,
        fish_count = st.stats.fish_count,
        shark_count = st.stats.shark_count,
        algae_count = st.stats.algae_count,
        chunk_count = st.stats.chunk_count,
        tick_count = st.tick_count,
    }
end
