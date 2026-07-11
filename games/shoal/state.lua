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

function spawn_initial_entities(st, data)
    local world = data.world
    for i = 1, data.spawn.initial_algae_hubs do
        local x = random_float(50, world.width - 50)
        local depth = random_float(world.surface_depth + 50, world.floor_depth - 50)
        spawn_algae_core(st, x, depth)
    end

    for i = 1, data.spawn.initial_fish do
        spawn_fish(st, random_float(0, world.width), random_float(50, 400))
    end

    for i = 1, data.spawn.initial_sharks do
        spawn_shark(st, random_float(0, world.width), random_float(300, 700))
    end
end
