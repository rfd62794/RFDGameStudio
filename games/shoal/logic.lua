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

function move_creature(c, dt)
    local st = GAME_STATE
    local data = st.data
    local fx, fy = 0, 0
    if c.type == "fish" then
        fx, fy = compute_fish_forces(c, st, nil)
    else
        fx, fy = compute_shark_forces(c, st, nil)
    end

    fx, fy = limit_vector(fx, fy, c.max_force)
    c.vx = c.vx + fx * dt
    c.vd = c.vd + fy * dt

    local vx, vd = limit_vector(c.vx, c.vd, c.max_speed)
    c.vx = vx
    c.vd = vd

    c.x = wrap_x(c.x + c.vx * dt, st.world)
    c.depth = clamp_depth(c.depth + c.vd * dt, st.world)

    if c.type == "shark" then
        local rate = compute_exposure_rate(c.depth, data)
        c.exposure = c.exposure + rate * dt
        if c.exposure >= data.creatures.shark.exposure.threshold then
            c.exposure = data.creatures.shark.exposure.threshold
            c.hunger = c.hunger + data.creatures.shark.exposure.damage_rate * dt
        end
    end
end

function update_algae(st, dt)
    for _, core in ipairs(st.algae) do
        update_algae_core(core, st, dt)
    end
end

function update_chunks(st, dt)
    for i = #st.chunks, 1, -1 do
        local c = st.chunks[i]
        c.x = wrap_x(c.x + c.vx * dt, st.world)
        c.depth = clamp_depth(c.depth + c.vd * dt, st.world)
        c.vx = c.vx * 0.95
        c.vd = c.vd * 0.95
        c.life = c.life - dt
        if c.life <= 0 then
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
                        f.age = f.age + 1
                        if f.fed >= 3 and f.age >= data.creatures.fish.breed_age then
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
        for _, f in ipairs(st.fish) do
            if f.alive and distance(s.x, s.depth, f.x, f.depth) <= s.radius + f.radius then
                kill_creature(st, f)
                s.hunger = math.max(0, s.hunger - 4)
                s.fed = (s.fed or 0) + 1
                ate = true
                break
            end
        end
        if not ate then
            for i = #st.chunks, 1, -1 do
                local c = st.chunks[i]
                if distance(s.x, s.depth, c.x, c.depth) <= s.radius + c.radius then
                    table.remove(st.chunks, i)
                    s.hunger = math.max(0, s.hunger - 2)
                    s.fed = (s.fed or 0) + 1
                    ate = true
                    break
                end
            end
        end
        if s.hunger >= data.creatures.shark.starve_limit then
            kill_creature(st, s)
        end
        if s.age >= data.creatures.shark.breed_age and (s.fed or 0) >= 2 then
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
