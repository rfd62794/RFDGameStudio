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

local function hue_to_rgb(p, q, t)
    if t < 0 then t = t + 1 end
    if t > 1 then t = t - 1 end
    if t < 1/6 then return p + (q - p) * 6 * t end
    if t < 1/2 then return q end
    if t < 2/3 then return p + (q - p) * (2/3 - t) * 6 end
    return p
end

function hsl_to_hex(h, s, l)
    h = h / 360
    local r, g, b
    if s == 0 then
        r, g, b = l, l, l
    else
        local q = l < 0.5 and l * (1 + s) or l + s - l * s
        local p = 2 * l - q
        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)
    end
    return string.format("#%02x%02x%02x", math.floor(r * 255), math.floor(g * 255), math.floor(b * 255))
end

function generate_procedural_color(id, hue_start, hue_end)
    local hash = 0
    for i = 1, #id do
        hash = (hash * 31 + string.byte(id, i)) % 1000000
    end
    local t = (hash % 1000) / 1000
    local hue = hue_start + (hue_end - hue_start) * t

    local jitter_hash = math.floor(hash / 1000) % 1000
    local jitter_t = jitter_hash / 1000
    local saturation = 0.45 + 0.25 * jitter_t
    local lightness = 0.50 + 0.20 * (1 - jitter_t)

    return hsl_to_hex(hue, saturation, lightness)
end
