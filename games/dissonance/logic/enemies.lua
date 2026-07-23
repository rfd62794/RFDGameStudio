-- Dissonance Depths — Enemy Definitions & Pooling
-- Loads enemy tables from data.yaml into a flat ENEMY_POOL for combat.lua.

local function ensure_collect(t)
  if type(t) ~= "table" then return {} end
  -- Lupa proxies from Python lists may not support #; collect is provided by engine primitives.
  if collect then return collect(t) end
  local out = {}
  for _, v in ipairs(t) do table.insert(out, v) end
  return out
end

function build_enemy_pool(data)
  local groups = data.enemies
  if not groups then return {} end

  local pool = {}
  local sections = { "basic", "behavior_roster", "legacy_named", "bosses" }
  for _, key in ipairs(sections) do
    local section = groups[key]
    if section then
      for _, e in ipairs(ensure_collect(section)) do
        local enemy = {}
        for k, v in pairs(e) do enemy[k] = v end
        table.insert(pool, enemy)
      end
    end
  end

  ENEMY_POOL = pool
  return pool
end

function find_enemy_def(enemy_name)
  local pool = ENEMY_POOL
  if not pool then return nil end
  for _, e in ipairs(pool) do
    if e.name == enemy_name or e.id == enemy_name then
      return e
    end
    if e.name and string.find(enemy_name, e.name, 1, true) == 1 then
      return e
    end
  end
  return nil
end

function enemy_pool_for_tier(data, tier)
  local pool = build_enemy_pool(data)
  local out = {}
  for _, e in ipairs(pool) do
    if e.tier == tier then
      table.insert(out, e)
    end
  end
  return out
end

function generate_enemy(tier, seed, data)
  local candidates = enemy_pool_for_tier(data, tier)
  if #candidates == 0 then
    return { name = "Corrupted Ashling", tier = "basic", hp = 14 }
  end
  -- Deterministic selection from seed.
  math.randomseed(seed)
  return candidates[math.random(#candidates)]
end

function generate_enemy_band(tier, seed, data, count)
  count = count or 1
  local band = {}
  for i = 1, count do
    table.insert(band, generate_enemy(tier, seed + i, data))
  end
  return band
end
