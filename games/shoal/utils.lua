-- shoal/utils.lua — shared math helpers

function clamp(val, min, max)
    return math.max(min, math.min(max, val))
end

function wrap(val, max)
    local w = val % max
    if w < 0 then w = w + max end
    return w
end

function wrap_x(x, world)
    return wrap(x, world.width)
end

function clamp_depth(d, world)
    return clamp(d, world.surface_depth, world.floor_depth)
end

function dist2(ax, ay, bx, by)
    local dx, dy = ax - bx, ay - by
    return dx * dx + dy * dy
end

function distance(ax, ay, bx, by)
    return math.sqrt(dist2(ax, ay, bx, by))
end

function normalize(vx, vy)
    local m = math.sqrt(vx * vx + vy * vy)
    if m == 0 then return 0, 0 end
    return vx / m, vy / m
end

function limit_vector(vx, vy, max)
    local m2 = vx * vx + vy * vy
    if m2 > max * max then
        local m = math.sqrt(m2)
        return vx / m * max, vy / m * max
    end
    return vx, vy
end

function lerp(a, b, t)
    return a + (b - a) * clamp(t, 0, 1)
end

function uid(prefix)
    GAME_STATE.next_id = (GAME_STATE.next_id or 1) + 1
    return prefix .. "_" .. GAME_STATE.next_id
end

function random_float(a, b)
    return a + math.random() * (b - a)
end

function random_choice(list)
    return list[math.random(1, #list)]
end
