-- shoal/state.lua — GAME_STATE shape and initialization helpers

function daily_seed()
    local t = os.date("!*t")  -- UTC, not local time
    return t.year * 10000 + t.month * 100 + t.day
end

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
-- Full period: 2^31 = 2,147,483,648 draws (multiplier 1103515245 is 1 mod 4,
-- increment 12345 is odd/coprime with 2^31). At ~56M draws/hour (60fps),
-- the period lasts ~38 hours of continuous gameplay.
-- Uses split-multiplication to keep intermediate values within 2^53, ensuring
-- identical results across Lua VMs that use IEEE 754 doubles (fengari) and
-- native 64-bit integers (wasmoon). Without this, s * 1103515245 can exceed
-- 2^53 (~9e15), causing silent precision loss in double-only runtimes.
local MOD = 2147483648   -- 2^31
local MULT = 1103515245
local INC = 12345
local MULT_HI = math.floor(MULT / 65536)   -- 16842
local MULT_LO = MULT % 65536               -- 19173

function make_prng(seed)
    local s = seed or os.time()
    return function()
        -- (s * MULT + INC) % MOD, split to avoid >2^53 intermediates:
        -- s * MULT = s * MULT_HI * 65536 + s * MULT_LO
        -- s * MULT_HI < 2^31 * 2^15 = 2^46 < 2^53 ✓
        -- s * MULT_LO < 2^31 * 2^16 = 2^47 < 2^53 ✓
        s = ((s * MULT_HI % MOD) * 65536 + s * MULT_LO + INC) % MOD
        return s / MOD
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

local _seed_counter = 0

function spawn_initial_entities(st, data)
    local world = data.world
    local raw_seed = data.spawn.seed
    local resolved_seed
    if raw_seed == "daily" then
        resolved_seed = daily_seed()
    elseif raw_seed then
        resolved_seed = raw_seed
    else
        _seed_counter = _seed_counter + 1
        resolved_seed = os.time() + _seed_counter
    end
    local prng = make_prng(resolved_seed)
    st.resolved_seed = resolved_seed
    st.prng = prng

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
