-- shoal/logic.lua — main loop and render state

function init_game(data)
    GAME_STATE = new_game_state(data)
    GAME_STATE.diagnostics = { meals = {}, deaths = {} }
    spawn_initial_entities(GAME_STATE, data)
    local st = GAME_STATE
    st.stats.seed = st.resolved_seed
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
    -- update_algae must run before update_creatures: update_algae_core
    -- caches n.cached_danger from the freshly-computed n.depth, and
    -- compute_fish_forces (called from update_creatures) reads that cache.
    -- Reversing this order would make fish read a tick-stale danger rating.
    update_algae(st, dt)
    update_creatures(st, dt)
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

-- Bucket keys are encoded as integers (bx * 100000 + by) instead of strings
-- ("bx,by").  Profiling (August 2026) showed string key construction was 48%
-- of get_nearby's per-call cost; integer keys replace string concatenation
-- with one arithmetic op and also speed up the hash[type][k] lookup (Lua
-- handles integer table keys more efficiently than string keys).  100000 is
-- safely larger than any possible by value (max by = ceil(world_height/bd)-1).
local BUCKET_KEY_MULT = 100000

function rebuild_spatial_hash(st)
    local data = st.data
    local hash = { fish = {}, shark = {}, algae = {} }
    local bw = data.spatial_hash.bucket_width
    local bd = data.spatial_hash.bucket_depth
    local num_bx = math.ceil(st.world.width / bw)
    local num_by = math.ceil(st.world.height / bd)
    for _, f in ipairs(st.fish) do
        if f.alive then
            local bx = math.floor(f.x / bw) % num_bx
            local by = math.floor(f.depth / bd) % num_by
            local key = bx * BUCKET_KEY_MULT + by
            local bucket = hash.fish[key]
            if not bucket then bucket = {}; hash.fish[key] = bucket end
            bucket[#bucket + 1] = f
        end
    end
    for _, s in ipairs(st.sharks) do
        if s.alive then
            local bx = math.floor(s.x / bw) % num_bx
            local by = math.floor(s.depth / bd) % num_by
            local key = bx * BUCKET_KEY_MULT + by
            local bucket = hash.shark[key]
            if not bucket then bucket = {}; hash.shark[key] = bucket end
            bucket[#bucket + 1] = s
        end
    end
    for _, core in ipairs(st.algae) do
        for _, n in ipairs(core.nodules) do
            if n.live then
                local bx = math.floor(n.x / bw) % num_bx
                local by = math.floor(n.depth / bd) % num_by
                local key = bx * BUCKET_KEY_MULT + by
                local bucket = hash.algae[key]
                if not bucket then bucket = {}; hash.algae[key] = bucket end
                bucket[#bucket + 1] = { n = n, core = core }
            end
        end
    end
    st.spatial_hash = hash
end

function get_nearby(hash, bx, by, type, bx_range, by_range, wrap_bx, wrap_by)
    bx_range = bx_range or 1
    by_range = by_range or 1
    local list = {}
    local buckets = hash[type]
    for dx = -bx_range, bx_range do
        for dy = -by_range, by_range do
            local kx, ky = bx + dx, by + dy
            if wrap_bx then kx = kx % wrap_bx end
            if wrap_by then ky = ky % wrap_by end
            local bucket = buckets[kx * BUCKET_KEY_MULT + ky]
            if bucket then
                for _, ent in ipairs(bucket) do
                    list[#list + 1] = ent
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
            f.hunger = f.hunger + dt * data.creatures.fish.hunger_rate
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
        fx, fy = compute_fish_forces(c, st, st.spatial_hash)
    else
        local had_target
        fx, fy, had_target = compute_shark_forces(c, st, st.spatial_hash)
        c.ticks_total = c.ticks_total + 1
        if had_target then
            c.ticks_with_target = c.ticks_with_target + 1
        end
    end

    local old_vx, old_vd = c.vx, c.vd
    fx, fy = limit_vector(fx, fy, c.max_force)
    c.vx = c.vx + fx * dt
    c.vd = c.vd + fy * dt

    local vx, vd = limit_vector(c.vx, c.vd, c.max_speed)
    c.vx, c.vd = limit_turn(old_vx, old_vd, vx, vd, data.creatures[c.type].max_turn_rate, c.max_speed, dt)

    local drag = 0.99 ^ (dt / 0.1)
    c.vx = c.vx * drag
    c.vd = c.vd * drag

    c.x = wrap_x(c.x + c.vx * dt, st.world)
    c.depth = clamp_depth(c.depth + c.vd * dt, st.world)

    if c.type == "shark" then
        local rate = compute_exposure_rate(c.depth, data)
        local decay = data.creatures.shark.exposure.decay_rate
        c.exposure = math.max(0, c.exposure + (rate - decay) * dt)
        if c.exposure >= data.creatures.shark.exposure.threshold then
            c.exposure = data.creatures.shark.exposure.threshold
            c.hunger = c.hunger + data.creatures.shark.exposure.damage_rate * dt
        end
    elseif c.type == "fish" then
        local rate = compute_fish_cold_rate(c.depth, data)
        local decay = data.creatures.fish.cold.decay_rate
        c.cold_exposure = math.max(0, c.cold_exposure + (rate - decay) * dt)
        if c.cold_exposure >= data.creatures.fish.cold.threshold then
            c.cold_exposure = data.creatures.fish.cold.threshold
            c.cold_damage = c.cold_damage + data.creatures.fish.cold.damage_rate * dt
            if c.cold_damage >= data.creatures.fish.cold.damage_limit then
                kill_creature(st, c)
            end
        end
    end

    return c
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
    for i = #st.algae, 1, -1 do
        local alive = update_algae_core(st.algae[i], st, dt)
        if not alive then
            table.remove(st.algae, i)
        end
    end
end

function update_chunks(st, dt)
    local data = st.data
    local sink_rate = data.flesh_chunk.sink_rate
    local floor_depth = st.world.floor_depth
    local grace = data.flesh_chunk.floor_grace_time
    for i = #st.chunks, 1, -1 do
        local c = st.chunks[i]
        c.x = wrap_x(c.x + c.vx * dt, st.world)
        c.depth = clamp_depth(c.depth + c.vd * dt + sink_rate * dt, st.world)
        c.vx = c.vx * 0.95
        c.vd = c.vd * 0.95
        if c.depth >= floor_depth - 0.5 then
            c.floor_timer = (c.floor_timer or 0) + dt
            if c.floor_timer >= grace then
                decompose_chunk(st, c)
                table.remove(st.chunks, i)
                st.stats.chunk_count = #st.chunks
            end
        end
    end
end

function update_discrete_events(st, dt)
    st.discrete_accum = (st.discrete_accum or 0) + dt
    if st.discrete_accum < st.data.world.discrete_tick then return end
    st.discrete_accum = 0

    local data = st.data
    local current_fish_alive = count_alive(st.fish)
    local current_shark_alive = count_alive(st.sharks)

    -- fish grazing (via spatial hash, one bite per fish per tick)
    local bw = data.spatial_hash.bucket_width
    local bd = data.spatial_hash.bucket_depth
    for _, f in ipairs(st.fish) do
        if not f.alive then goto next_fish end

        local bx = math.floor(f.x / bw) % math.ceil(st.world.width / bw)
        local by = math.floor(f.depth / bd) % math.ceil(st.world.height / bd)
        local by_range = math.ceil(data.algae.nodule_radius / bd) + 1
        local nearby = get_nearby(st.spatial_hash, bx, by, "algae", 1, by_range)

        for _, entry in ipairs(nearby) do
            local n, core = entry.n, entry.core
            if n.live and distance(f.x, f.depth, n.x, n.depth) <= f.radius + data.algae.nodule_radius then
                if graze_nodule(st, n, core) then
                    f.fed = f.fed + 1
                    f.hunger = math.max(0, f.hunger - 1.0)
                    if f.fed >= data.creatures.fish.breed_fed_threshold and f.age >= data.creatures.fish.breed_age then
                        local capacity = data.creatures.fish.carrying_capacity
                        local breed_probability = math.max(0, 1 - (current_fish_alive / capacity))
                        if math.random() < breed_probability then
                            spawn_fish(st, f.x, f.depth)
                            f.fed = 0
                            f.age = 0
                        end
                    end
                end
                break
            end
        end
        ::next_fish::
    end

    -- shark hunting / chunk eating
    for _, s in ipairs(st.sharks) do
        if not s.alive then goto next_shark end
        local ate = false

        -- find nearest overlapping fish (via spatial hash — same pattern as
        -- fish grazing above; the touch radius is small relative to bucket
        -- size so a 1-bucket range is always sufficient.  Bucket indices are
        -- wrapped on the x-axis because fish may have crossed the world
        -- boundary during update_creatures, leaving them in a stale bucket
        -- on the opposite side — without wrapping the shark would miss a
        -- touching fish that wrapped.)
        local nearest_fish, nearest_fish_d2 = nil, nil
        local nearby_fish
        if st.spatial_hash and st.spatial_hash.fish then
            local sbx = math.floor(s.x / bw) % math.ceil(st.world.width / bw)
            local sby = math.floor(s.depth / bd) % math.ceil(st.world.height / bd)
            local max_touch = s.radius + data.creatures.fish.radius
            local fbx_range = math.ceil(max_touch / bw)
            local fby_range = math.ceil(max_touch / bd)
            local num_bx = math.ceil(st.world.width / bw)
            nearby_fish = get_nearby(st.spatial_hash, sbx, sby, "fish", fbx_range, fby_range, num_bx)
        else
            nearby_fish = st.fish
        end
        for _, f in ipairs(nearby_fish) do
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
        local chunk_eat_range = data.flesh_chunk.shark_eat_range
        for i, c in ipairs(st.chunks) do
            local d2 = dist2(s.x, s.depth, c.x, c.depth)
            if d2 <= chunk_eat_range * chunk_eat_range then
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
                st.diagnostics = st.diagnostics or { meals = {}, deaths = {} }
                table.insert(st.diagnostics.meals, {
                    shark_id = s.id,
                    tick = st.tick_count,
                    meal_type = "fish",
                    hunger_at_meal = s.hunger,
                    ticks_since_last_meal = st.tick_count - s.last_meal_tick,
                })
                s.last_meal_tick = st.tick_count
                s.hunger = math.max(0, s.hunger - data.creatures.shark.fish_hunger_refund)
                s.fed = (s.fed or 0) + 1
                ate = true
            end
        elseif nearest_chunk then
            table.remove(st.chunks, chunk_index)
            st.stats.chunk_count = #st.chunks
            st.diagnostics = st.diagnostics or { meals = {}, deaths = {} }
            table.insert(st.diagnostics.meals, {
                shark_id = s.id,
                tick = st.tick_count,
                meal_type = "chunk",
                hunger_at_meal = s.hunger,
                ticks_since_last_meal = st.tick_count - s.last_meal_tick,
            })
            s.last_meal_tick = st.tick_count
            s.hunger = math.max(0, s.hunger - data.flesh_chunk.hunger_refund)
            s.fed = (s.fed or 0) + 1
            ate = true
        end
        if s.hunger >= data.creatures.shark.starve_limit then
            kill_creature(st, s)
        end
        if s.age >= data.creatures.shark.breed_age and (s.fed or 0) >= data.creatures.shark.breed_fed_threshold then
            local capacity = data.creatures.shark.carrying_capacity
            local breed_probability = math.max(0, 1 - (current_shark_alive / capacity))
            if math.random() < breed_probability then
                spawn_shark(st, s.x, s.depth)
                s.fed = 0
                s.age = 0
            end
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

function count_algae_nodule_capacity(st)
    local total = 0
    for _, core in ipairs(st.algae) do
        total = total + (core.max_nodules or #core.nodules)
    end
    return total
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
                hunger = f.hunger,
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
                hunger = s.hunger,
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
            decay_ratio = c.floor_timer and math.min(1, c.floor_timer / st.data.flesh_chunk.floor_grace_time) or 0,
        })
    end

    return out
end

function get_state_summary()
    if not GAME_STATE then return nil end
    local st = GAME_STATE
    local live = st.stats.algae_count
    local total = count_algae_nodule_capacity(st)
    return {
        initialized = true,
        fish_count = st.stats.fish_count,
        shark_count = st.stats.shark_count,
        algae_count = live,
        algae_capacity = total,
        algae_available = total - live,
        chunk_count = st.stats.chunk_count,
        tick_count = st.tick_count,
    }
end

function get_diagnostics()
    if not GAME_STATE then return nil end
    local st = GAME_STATE
    st.diagnostics = st.diagnostics or { meals = {}, deaths = {} }
    return st.diagnostics
end

-- Test helpers: verify hash-based lookups match full-scan results.
-- These compare the spatial-hash lookup (which may use stale bucket
-- positions after creatures have moved) against a brute-force full scan
-- using current entity positions.  The distance check in both paths uses
-- the entity objects' current x/depth fields, so the only difference is
-- which entities are *considered* (bucket membership vs. full list).

function _test_flee_equivalence()
    local st = GAME_STATE
    if not st or not st.spatial_hash then return { error = "no spatial hash" } end
    local data = st.data
    local hash = st.spatial_hash
    local bw = data.spatial_hash.bucket_width
    local bd = data.spatial_hash.bucket_depth
    local cfg = data.creatures.fish
    local num_bx = math.ceil(st.world.width / bw)
    local num_by = math.ceil(st.world.height / bd)
    local perception_sq = cfg.perception.shark * cfg.perception.shark
    local mismatches = {}
    for i, f in ipairs(st.fish) do
        if f.alive then
            local bx = math.floor(f.x / bw) % num_bx
            local by = math.floor(f.depth / bd) % num_by
            local bx_r = math.ceil(cfg.perception.shark / bw)
            local by_r = math.ceil(cfg.perception.shark / bd)
            local nearby = get_nearby(hash, bx, by, "shark", bx_r, by_r, num_bx)
            local h_id, h_d2 = nil, perception_sq
            for _, s in ipairs(nearby) do
                if s.alive then
                    local d2 = dist2(f.x, f.depth, s.x, s.depth)
                    if d2 < h_d2 then h_d2 = d2; h_id = s.id end
                end
            end
            local s_id, s_d2 = nil, perception_sq
            for _, s in ipairs(st.sharks) do
                if s.alive then
                    local d2 = dist2(f.x, f.depth, s.x, s.depth)
                    if d2 < s_d2 then s_d2 = d2; s_id = s.id end
                end
            end
            if (h_id == nil) ~= (s_id == nil) then
                mismatches[#mismatches + 1] = { kind = "miss", fish = i, hash_id = h_id, scan_id = s_id }
            elseif h_id and s_id and h_id ~= s_id then
                mismatches[#mismatches + 1] = { kind = "tie", fish = i, hash_id = h_id, scan_id = s_id, hash_d2 = h_d2, scan_d2 = s_d2 }
            end
        end
    end
    return { mismatches = mismatches, fish_checked = count_alive(st.fish) }
end

function _test_seek_equivalence()
    local st = GAME_STATE
    if not st or not st.spatial_hash then return { error = "no spatial hash" } end
    local data = st.data
    local hash = st.spatial_hash
    local bw = data.spatial_hash.bucket_width
    local bd = data.spatial_hash.bucket_depth
    local cfg = data.creatures.shark
    local num_bx = math.ceil(st.world.width / bw)
    local num_by = math.ceil(st.world.height / bd)
    local perception_sq = cfg.perception.fish * cfg.perception.fish
    local mismatches = {}
    for i, s in ipairs(st.sharks) do
        if s.alive then
            local bx = math.floor(s.x / bw) % num_bx
            local by = math.floor(s.depth / bd) % num_by
            local bx_r = math.ceil(cfg.perception.fish / bw)
            local by_r = math.ceil(cfg.perception.fish / bd)
            local nearby = get_nearby(hash, bx, by, "fish", bx_r, by_r, num_bx)
            local h_id, h_d2 = nil, perception_sq
            for _, f in ipairs(nearby) do
                if f.alive then
                    local d2 = dist2(s.x, s.depth, f.x, f.depth)
                    if d2 < h_d2 then h_d2 = d2; h_id = f.id end
                end
            end
            local s_id, s_d2 = nil, perception_sq
            for _, f in ipairs(st.fish) do
                if f.alive then
                    local d2 = dist2(s.x, s.depth, f.x, f.depth)
                    if d2 < s_d2 then s_d2 = d2; s_id = f.id end
                end
            end
            if (h_id == nil) ~= (s_id == nil) then
                mismatches[#mismatches + 1] = { kind = "miss", shark = i, hash_id = h_id, scan_id = s_id }
            elseif h_id and s_id and h_id ~= s_id then
                mismatches[#mismatches + 1] = { kind = "tie", shark = i, hash_id = h_id, scan_id = s_id, hash_d2 = h_d2, scan_d2 = s_d2 }
            end
        end
    end
    return { mismatches = mismatches, sharks_checked = count_alive(st.sharks) }
end

function _test_hunt_equivalence()
    local st = GAME_STATE
    if not st or not st.spatial_hash then return { error = "no spatial hash" } end
    local data = st.data
    local hash = st.spatial_hash
    local bw = data.spatial_hash.bucket_width
    local bd = data.spatial_hash.bucket_depth
    local fish_radius = data.creatures.fish.radius
    local num_bx = math.ceil(st.world.width / bw)
    local num_by = math.ceil(st.world.height / bd)
    local mismatches = {}
    for i, s in ipairs(st.sharks) do
        if s.alive then
            local bx = math.floor(s.x / bw) % num_bx
            local by = math.floor(s.depth / bd) % num_by
            local max_touch = s.radius + fish_radius
            local bx_r = math.ceil(max_touch / bw)
            local by_r = math.ceil(max_touch / bd)
            local nearby = get_nearby(hash, bx, by, "fish", bx_r, by_r, num_bx)
            local h_id, h_d2 = nil, nil
            for _, f in ipairs(nearby) do
                if f.alive then
                    local d2 = dist2(s.x, s.depth, f.x, f.depth)
                    local tr = s.radius + f.radius
                    if d2 <= tr * tr then
                        if not h_d2 or d2 < h_d2 then h_d2 = d2; h_id = f.id end
                    end
                end
            end
            local s_id, s_d2 = nil, nil
            for _, f in ipairs(st.fish) do
                if f.alive then
                    local d2 = dist2(s.x, s.depth, f.x, f.depth)
                    local tr = s.radius + f.radius
                    if d2 <= tr * tr then
                        if not s_d2 or d2 < s_d2 then s_d2 = d2; s_id = f.id end
                    end
                end
            end
            if (h_id == nil) ~= (s_id == nil) then
                mismatches[#mismatches + 1] = { kind = "miss", shark = i, hash_id = h_id, scan_id = s_id }
            elseif h_id and s_id and h_id ~= s_id then
                mismatches[#mismatches + 1] = { kind = "tie", shark = i, hash_id = h_id, scan_id = s_id, hash_d2 = h_d2, scan_d2 = s_d2 }
            end
        end
    end
    return { mismatches = mismatches, sharks_checked = count_alive(st.sharks) }
end

-- Count pairwise checks per tick for the three converted loops (hash-based)
-- vs. what a full scan would have done.  Returns counts for a single
-- "measurement" call — the test resets, ticks, then calls this.
function _test_count_pairwise_hash()
    local st = GAME_STATE
    if not st or not st.spatial_hash then return { error = "no spatial hash" } end
    local data = st.data
    local hash = st.spatial_hash
    local bw = data.spatial_hash.bucket_width
    local bd = data.spatial_hash.bucket_depth
    local fcfg = data.creatures.fish
    local scfg = data.creatures.shark
    local num_bx = math.ceil(st.world.width / bw)
    local num_by = math.ceil(st.world.height / bd)
    local flee_checks, seek_checks, hunt_checks = 0, 0, 0
    for _, f in ipairs(st.fish) do
        if f.alive then
            local bx = math.floor(f.x / bw) % num_bx
            local by = math.floor(f.depth / bd) % num_by
            local bx_r = math.ceil(fcfg.perception.shark / bw)
            local by_r = math.ceil(fcfg.perception.shark / bd)
            local nearby = get_nearby(hash, bx, by, "shark", bx_r, by_r, num_bx)
            flee_checks = flee_checks + #nearby
        end
    end
    for _, s in ipairs(st.sharks) do
        if s.alive then
            local bx = math.floor(s.x / bw) % num_bx
            local by = math.floor(s.depth / bd) % num_by
            local bx_r = math.ceil(scfg.perception.fish / bw)
            local by_r = math.ceil(scfg.perception.fish / bd)
            local nearby = get_nearby(hash, bx, by, "fish", bx_r, by_r, num_bx)
            seek_checks = seek_checks + #nearby
            local max_touch = s.radius + data.creatures.fish.radius
            local hbx_r = math.ceil(max_touch / bw)
            local hby_r = math.ceil(max_touch / bd)
            local hnearby = get_nearby(hash, bx, by, "fish", hbx_r, hby_r, num_bx)
            hunt_checks = hunt_checks + #hnearby
        end
    end
    local scan_flee = count_alive(st.fish) * count_alive(st.sharks)
    local scan_seek = count_alive(st.sharks) * count_alive(st.fish)
    local scan_hunt = count_alive(st.sharks) * count_alive(st.fish)
    return {
        hash = { flee = flee_checks, seek = seek_checks, hunt = hunt_checks, total = flee_checks + seek_checks + hunt_checks },
        scan = { flee = scan_flee, seek = scan_seek, hunt = scan_hunt, total = scan_flee + scan_seek + scan_hunt },
    }
end

function _test_measure_tick_time(n)
    n = n or 100
    local dt = 0.1
    local start = os.clock()
    for _ = 1, n do
        tick_game(dt, {})
    end
    local elapsed = os.clock() - start
    return { avg_ms = (elapsed / n) * 1000, total_s = elapsed, n = n }
end
