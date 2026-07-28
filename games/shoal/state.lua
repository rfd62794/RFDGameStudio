-- shoal/state.lua — GAME_STATE shape and initialization helpers

function new_game_state(data)
    local world = data.world
    return {
        data = data,
        world = world,
        fish = {},
        sharks = {},
        algae = {},
        chunks = {},
        events = {},
        next_id = 0,
        tick_count = 0,
        discrete_accum = 0,
        stats = {
            fish_count = 0,
            shark_count = 0,
            algae_count = 0,
            chunk_count = 0,
        },
    }
end

-- Deterministic linear-congruential PRNG, seeded from data.spawn.seed. When
-- no seed is given, falls back to os.time() — matches the previous
-- non-deterministic behavior; a run only becomes reproducible-by-seed when a
-- seed is explicitly provided.
local function make_prng(seed)
    local s = seed or os.time()
    return function()
        s = (s * 1103515245 + 12345) % 2147483648
        return s / 2147483648
    end
end

local function prng_float(prng, a, b)
    return a + prng() * (b - a)
end

-- Picks one algae hub center via rejection sampling: candidates closer than
-- cluster_radius to an already-placed hub are resampled. Depth is drawn from
-- a randomly-assigned depth_bands entry, biased toward the shallow (top) end
-- of that band via a squared random term.
local function pick_hub_center(prng, world, bands, cluster_radius, placed)
    local max_attempts = 1000
    for _ = 1, max_attempts do
        local x = prng_float(prng, 0, world.width)
        local band_index = math.min(#bands, math.floor(prng() * #bands) + 1)
        local band = bands[band_index]
        local depth = clamp_depth(band.top + (prng() * prng()) * (band.bottom - band.top), world)

        local far_enough = true
        for _, p in ipairs(placed) do
            local dx, dd = x - p.x, depth - p.depth
            if math.sqrt(dx * dx + dd * dd) < cluster_radius then
                far_enough = false
                break
            end
        end
        if far_enough then
            return x, depth
        end
    end
    -- Space couldn't fit another hub_count-th cluster at this radius within
    -- max_attempts; accept the last candidate rather than looping forever.
    local x = prng_float(prng, 0, world.width)
    local band_index = math.min(#bands, math.floor(prng() * #bands) + 1)
    local band = bands[band_index]
    local depth = clamp_depth(band.top + (prng() * prng()) * (band.bottom - band.top), world)
    return x, depth
end

function spawn_initial_entities(st, data)
    local world = data.world
    local resolved_seed = data.spawn.seed or os.time()
    local prng = make_prng(resolved_seed)
    st.resolved_seed = resolved_seed

    local hub_count = data.spawn.initial_algae_hubs
    local cluster_radius = data.spawn.cluster_radius
    local bands = data.depth_bands
    local placed = {}
    for i = 1, hub_count do
        local x, depth = pick_hub_center(prng, world, bands, cluster_radius, placed)
        spawn_algae_core(st, x, depth)
        placed[#placed + 1] = { x = x, depth = depth }
    end

    for i = 1, data.spawn.initial_fish do
        spawn_fish(st, prng_float(prng, 0, world.width), prng_float(prng, 50, 400))
    end

    for i = 1, data.spawn.initial_sharks do
        spawn_shark(st, prng_float(prng, 0, world.width), prng_float(prng, 300, 700))
    end
end
