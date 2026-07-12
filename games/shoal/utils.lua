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

local RESERVED_COLORS = {
    {234, 179, 8},    -- core yellow #eab308
    {16, 185, 129},   -- nodule green #10b981
    {244, 63, 94},    -- chunk red #f43f5e
    {125, 211, 252},  -- background stop #7dd3fc
    {56, 189, 248},   -- background stop #38bdf8
    {14, 165, 233},   -- background stop #0ea5e9
    {3, 105, 161},    -- background stop #0369a1
    {12, 74, 110},    -- background stop #0c4a6e
}
local MIN_COLOR_DISTANCE = 55
local LIVE_MIN_DISTANCE = 30

local function color_distance(r1, g1, b1, r2, g2, b2)
    local dr, dg, db = r1 - r2, g1 - g2, b1 - b2
    return math.sqrt(dr * dr + dg * dg + db * db)
end

local function is_too_close(r, g, b)
    for _, rc in ipairs(RESERVED_COLORS) do
        if color_distance(r, g, b, rc[1], rc[2], rc[3]) < MIN_COLOR_DISTANCE then
            return true
        end
    end
    return false
end

function hex_to_rgb(hex)
    local r = tonumber(hex:sub(2, 3), 16)
    local g = tonumber(hex:sub(4, 5), 16)
    local b = tonumber(hex:sub(6, 7), 16)
    return r, g, b
end

local function is_too_close_to_live(r, g, b, live_colors)
    if not live_colors then return false end
    for _, hex in ipairs(live_colors) do
        local lr, lg, lb = hex_to_rgb(hex)
        if color_distance(r, g, b, lr, lg, lb) < LIVE_MIN_DISTANCE then
            return true
        end
    end
    return false
end

function hsl_to_rgb(h, s, l)
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
    return math.floor(r * 255), math.floor(g * 255), math.floor(b * 255)
end

function rgb_to_hex(r, g, b)
    return string.format("#%02x%02x%02x", r, g, b)
end

function hsl_to_hex(h, s, l)
    return rgb_to_hex(hsl_to_rgb(h, s, l))
end

local function extract_numeric_id(id)
    local num = id:match("_(%d+)$")
    return num and tonumber(num) or 0
end

local function hash_numeric(n)
    -- Knuth multiplicative hash — scatters sequential integers hard,
    -- unlike a rolling character hash on a shared-prefix string.
    return (n * 2654435761) % 1000000007
end

function generate_procedural_color(id, live_colors)
    local numeric_id = extract_numeric_id(id)
    local hash = hash_numeric(numeric_id)

    local hue = (hash % 3600) / 10
    local jitter_hash = math.floor(hash / 3600) % 1000
    local jitter_t = jitter_hash / 1000
    local saturation = 0.5 + 0.3 * jitter_t
    local lightness = 0.45 + 0.25 * (1 - jitter_t)

    for attempt = 0, 8 do
        local try_hue = (hue + attempt * 40) % 360
        local r, g, b = hsl_to_rgb(try_hue, saturation, lightness)
        if not is_too_close(r, g, b) and not is_too_close_to_live(r, g, b, live_colors) then
            return rgb_to_hex(r, g, b)
        end
    end

    local r, g, b = hsl_to_rgb(hue, saturation, lightness)
    return rgb_to_hex(r, g, b)
end
