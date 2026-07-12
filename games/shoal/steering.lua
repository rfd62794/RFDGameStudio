-- shoal/steering.lua — force accumulation for fish and sharks

local wander_targets = {}

function get_wander_target(id, x, y, cfg)
    if not wander_targets[id] then
        wander_targets[id] = { x = random_float(-1, 1), y = random_float(-1, 1) }
    end
    return wander_targets[id]
end

function set_wander_target(id, wx, wy)
    wander_targets[id] = { x = wx, y = wy }
end

function force_seek(x, y, tx, ty, weight, max_force)
    local dx, dy = tx - x, ty - y
    local dist = math.sqrt(dx * dx + dy * dy)
    if dist == 0 then return 0, 0 end
    return (dx / dist) * weight * max_force, (dy / dist) * weight * max_force
end

function force_flee(x, y, tx, ty, weight, max_force, radius_sq)
    local dx, dy = x - tx, y - ty
    local dist2 = dx * dx + dy * dy
    if dist2 == 0 or dist2 > radius_sq then return 0, 0 end
    local dist = math.sqrt(dist2)
    return (dx / dist) * weight * max_force, (dy / dist) * weight * max_force
end

function force_wander(id, x, y, vx, vy, weight, max_force, cfg)
    local circle_dist = cfg.circle_distance
    local circle_radius = cfg.circle_radius
    local tx = x + vx * circle_dist
    local ty = y + vy * circle_dist
    local wt = get_wander_target(id, x, y, cfg)
    wt.x = wt.x + random_float(-1, 1) * cfg.change_interval
    wt.y = wt.y + random_float(-1, 1) * cfg.change_interval
    local wx, wy = normalize(wt.x, wt.y)
    wt.x = wx
    wt.y = wy
    local target_x = tx + wx * circle_radius
    local target_y = ty + wy * circle_radius
    return force_seek(x, y, target_x, target_y, weight, max_force)
end

function force_separate(x, y, neighbors, radius_sq, weight, max_force)
    local sx, sy = 0, 0
    for _, n in ipairs(neighbors) do
        if n.alive then
            local dx, dy = x - n.x, y - n.depth
            local dist2 = dx * dx + dy * dy
            if dist2 > 0 and dist2 < radius_sq then
                local dist = math.sqrt(dist2)
                sx = sx + (dx / dist) / dist
                sy = sy + (dy / dist) / dist
            end
        end
    end
    if sx == 0 and sy == 0 then return 0, 0 end
    local nx, ny = normalize(sx, sy)
    return nx * weight * max_force, ny * weight * max_force
end

function force_align(x, y, neighbors, radius_sq, weight, max_force)
    local avx, avy, count = 0, 0, 0
    for _, n in ipairs(neighbors) do
        if n.alive then
            local dx, dy = x - n.x, y - n.depth
            local dist2 = dx * dx + dy * dy
            if dist2 > 0 and dist2 < radius_sq then
                avx = avx + n.vx
                avy = avy + n.vd
                count = count + 1
            end
        end
    end
    if count == 0 then return 0, 0 end
    avx = avx / count
    avy = avy / count
    local nx, ny = normalize(avx, avy)
    return nx * weight * max_force, ny * weight * max_force
end

function force_cohere(x, y, neighbors, radius_sq, weight, max_force)
    local sx, sy, count = 0, 0, 0
    for _, n in ipairs(neighbors) do
        if n.alive then
            local dx, dy = x - n.x, y - n.depth
            local dist2 = dx * dx + dy * dy
            if dist2 > 0 and dist2 < radius_sq then
                sx = sx + n.x
                sy = sy + n.depth
                count = count + 1
            end
        end
    end
    if count == 0 then return 0, 0 end
    local centroid_x, centroid_y = sx / count, sy / count
    return force_seek(x, y, centroid_x, centroid_y, weight, max_force)
end

function compute_fish_forces(f, st, hash)
    local data = st.data
    local weights = data.steering_weights.fish
    local cfg = data.creatures.fish
    local fx, fy = 0, 0

    -- seek nearest live algae nodule
    local nearest_nodule, nearest_dist2 = nil, cfg.perception.algae * cfg.perception.algae
    for _, core in ipairs(st.algae) do
        for _, n in ipairs(core.nodules) do
            if n.live then
                local d2 = dist2(f.x, f.depth, n.x, n.depth)
                if d2 < nearest_dist2 then
                    nearest_dist2 = d2
                    nearest_nodule = n
                end
            end
        end
    end
    if nearest_nodule then
        local sx, sy = force_seek(f.x, f.depth, nearest_nodule.x, nearest_nodule.depth, weights.seek_algae, f.max_force)
        fx, fy = fx + sx, fy + sy
    end

    -- flee nearest shark
    local nearest_shark, shark_dist2 = nil, cfg.perception.shark * cfg.perception.shark
    for _, s in ipairs(st.sharks) do
        if s.alive then
            local d2 = dist2(f.x, f.depth, s.x, s.depth)
            if d2 < shark_dist2 then
                shark_dist2 = d2
                nearest_shark = s
            end
        end
    end
    if nearest_shark then
        local flx, fly = force_flee(f.x, f.depth, nearest_shark.x, nearest_shark.depth, weights.flee_shark, f.max_force, shark_dist2)
        fx, fy = fx + flx, fy + fly
    end

    -- boids forces: separate, align, cohere share the same neighbor source and school radius
    local others = hash and hash[f.lineage_id] or st.fish
    local school_radius_sq = cfg.perception.school * cfg.perception.school
    local sep_x, sep_y = force_separate(f.x, f.depth, others, school_radius_sq, weights.separate, f.max_force)
    fx, fy = fx + sep_x, fy + sep_y

    local align_x, align_y = force_align(f.x, f.depth, others, school_radius_sq, weights.align, f.max_force)
    fx, fy = fx + align_x, fy + align_y

    local cohere_x, cohere_y = force_cohere(f.x, f.depth, others, school_radius_sq, weights.cohere, f.max_force)
    fx, fy = fx + cohere_x, fy + cohere_y

    -- depth bias (mild upward pull)
    local bias = -weights.depth_bias * f.max_force
    fy = fy + bias

    -- wander
    local wx, wy = force_wander(f.id, f.x, f.depth, f.vx, f.vd, weights.wander, f.max_force, data.wander)
    fx, fy = fx + wx, fy + wy

    return fx, fy
end

function compute_shark_forces(s, st, hash)
    local data = st.data
    local weights = data.steering_weights.shark
    local cfg = data.creatures.shark
    local fx, fy = 0, 0

    -- seek nearest fish
    local nearest_fish, fish_dist2 = nil, cfg.perception.fish * cfg.perception.fish
    for _, f in ipairs(st.fish) do
        if f.alive then
            local d2 = dist2(s.x, s.depth, f.x, f.depth)
            if d2 < fish_dist2 then
                fish_dist2 = d2
                nearest_fish = f
            end
        end
    end
    if nearest_fish then
        local sx, sy = force_seek(s.x, s.depth, nearest_fish.x, nearest_fish.depth, weights.seek_fish, s.max_force)
        fx, fy = fx + sx, fy + sy
    else
        -- no fish: seek nearest flesh chunk
        local nearest_chunk, chunk_dist2 = nil, cfg.perception.flesh * cfg.perception.flesh
        for _, c in ipairs(st.chunks) do
            local d2 = dist2(s.x, s.depth, c.x, c.depth)
            if d2 < chunk_dist2 then
                chunk_dist2 = d2
                nearest_chunk = c
            end
        end
        if nearest_chunk then
            local sx, sy = force_seek(s.x, s.depth, nearest_chunk.x, nearest_chunk.depth, weights.seek_flesh, s.max_force)
            fx, fy = fx + sx, fy + sy
        else
            -- wander
            local wx, wy = force_wander(s.id, s.x, s.depth, s.vx, s.vd, weights.wander, s.max_force, data.wander)
            fx, fy = fx + wx, fy + wy
        end
    end

    return fx, fy
end

function compute_exposure_rate(depth, data)
    local bands = data.depth_bands
    for i = 1, #bands do
        if depth <= bands[i].bottom then
            if i == 1 then
                return bands[i].exposure_rate
            else
                local prev = bands[i - 1]
                local t = (depth - prev.bottom) / (bands[i].bottom - prev.bottom)
                return lerp(prev.exposure_rate, bands[i].exposure_rate, t)
            end
        end
    end
    return bands[#bands].exposure_rate
end
