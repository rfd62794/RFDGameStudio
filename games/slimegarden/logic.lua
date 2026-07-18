local SLIME_NAME_PREFIXES = {
  "Specimen", "Subject", "Orbital", "Cinder", "Dusty", "Rusty", "Void",
  "Gloop", "Solder", "Glitch", "Slick", "Vapor", "Anode", "Cathode",
  "Zero", "Ion", "Debris", "Vector", "Echo", "Drift"
}

local SLIME_NAME_SUFFIXES = {
  "A-01", "B-12", "X", "Beta", "Omega", "Prime", "Zero", "09", "402",
  "77", "Core", "V", "Dampener", "Isotope", "Sol", "Flux", "Drifter", "Echo"
}

local COLOR_SPECS = {
  Red = { base = { hp = 120, atk = 18, def = 8, agi = 6, int = 5, chm = 6 }, growth = { hp = 15, atk = 3, def = 1, agi = 0.8, int = 0.5, chm = 0.6 } },
  Blue = { base = { hp = 90, atk = 10, def = 14, agi = 5, int = 15, chm = 12 }, growth = { hp = 10, atk = 1.2, def = 2, agi = 0.6, int = 2.5, chm = 1.5 } },
  Yellow = { base = { hp = 80, atk = 15, def = 6, agi = 18, int = 8, chm = 10 }, growth = { hp = 9, atk = 2.2, def = 0.8, agi = 2.4, int = 1, chm = 1 } },
  Purple = { base = { hp = 100, atk = 12, def = 10, agi = 10, int = 20, chm = 15 }, growth = { hp = 11, atk = 1.5, def = 1.2, agi = 1.2, int = 3, chm = 2 } },
  Orange = { base = { hp = 110, atk = 22, def = 5, agi = 14, int = 6, chm = 8 }, growth = { hp = 12, atk = 3.5, def = 0.5, agi = 1.8, int = 0.6, chm = 0.8 } },
  Green = { base = { hp = 160, atk = 8, def = 16, agi = 4, int = 7, chm = 14 }, growth = { hp = 22, atk = 1, def = 2.5, agi = 0.5, int = 0.8, chm = 1.6 } },
  Gray = { base = { hp = 110, atk = 14, def = 11, agi = 11, int = 14, chm = 11 }, growth = { hp = 13, atk = 2, def = 1.5, agi = 1.5, int = 2, chm = 1.2 } },
}

function generate_slime_name()
  return SLIME_NAME_PREFIXES[math.floor(math.random() * #SLIME_NAME_PREFIXES) + 1]
    .. "-" .. SLIME_NAME_SUFFIXES[math.floor(math.random() * #SLIME_NAME_SUFFIXES) + 1]
end

function breed_colors(c1, c2)
  if c1 == c2 then return c1 end
  local pair = c1 < c2 and c1 .. "+" .. c2 or c2 .. "+" .. c1
  if pair == "Blue+Red" then return "Purple" end
  if pair == "Red+Yellow" then return "Orange" end
  if pair == "Blue+Yellow" then return "Green" end
  local rand = math.random()
  if rand < 0.4 then return c1 end
  if rand < 0.8 then return c2 end
  return "Gray"
end

function breed_patterns(p1, p2)
  local rand = math.random()
  if p1 == p2 then
    if p1 == "Solid" then return rand < 0.8 and "Solid" or "Stripe" end
    if p1 == "Stripe" then return rand < 0.6 and "Stripe" or (rand < 0.9 and "Polka" or "Glow") end
    if p1 == "Polka" then return rand < 0.6 and "Polka" or (rand < 0.85 and "Glow" or "Crown") end
    if p1 == "Glow" then return rand < 0.6 and "Glow" or (rand < 0.85 and "Crown" or "Ringed") end
    if p1 == "Crown" then return rand < 0.6 and "Crown" or (rand < 0.85 and "Ringed" or "Nebula") end
    if p1 == "Ringed" then return rand < 0.6 and "Ringed" or (rand < 0.85 and "Nebula" or "Obsidian") end
    if p1 == "Nebula" then return rand < 0.7 and "Nebula" or "Obsidian" end
    return "Obsidian"
  end
  local pair = p1 < p2 and p1 .. "+" .. p2 or p2 .. "+" .. p1
  if pair == "Solid+Stripe" then return rand < 0.5 and "Stripe" or (rand < 0.9 and "Solid" or "Polka") end
  if pair == "Polka+Solid" or pair == "Glow+Solid" then return rand < 0.4 and p1 or (rand < 0.8 and p2 or "Stripe") end
  if pair == "Polka+Stripe" then return rand < 0.4 and "Polka" or (rand < 0.8 and "Stripe" or "Glow") end
  if pair == "Glow+Stripe" or pair == "Glow+Polka" then return rand < 0.35 and "Glow" or (rand < 0.7 and p2 or (rand < 0.9 and "Crown" or "Ringed")) end
  if pair == "Crown+Glow" or pair == "Crown+Polka" then return rand < 0.4 and "Crown" or (rand < 0.8 and p1 or "Ringed") end
  if pair == "Crown+Ringed" then return rand < 0.4 and "Crown" or (rand < 0.8 and "Ringed" or "Nebula") end
  if pair == "Nebula+Ringed" or pair == "Crown+Nebula" then return rand < 0.45 and "Nebula" or (rand < 0.8 and p2 or "Obsidian") end
  if rand < 0.45 then return p1 end
  if rand < 0.9 then return p2 end
  local all_patterns = { "Solid", "Stripe", "Polka", "Glow", "Crown", "Ringed", "Nebula", "Obsidian" }
  return all_patterns[math.floor(math.random() * #all_patterns) + 1]
end

function stage_from_level(level)
  if level <= 1 then return "Hatchling" end
  if level <= 3 then return "Juvenile" end
  if level <= 5 then return "Young" end
  if level <= 7 then return "Prime" end
  if level <= 9 then return "Veteran" end
  return "Elder"
end

function stage_modifier(stage)
  return ({ Hatchling = 0.6, Juvenile = 0.8, Young = 1, Prime = 1.2, Veteran = 1.1, Elder = 0.85 })[stage]
end

function calculate_stats(color, pattern, level)
  local spec, l = COLOR_SPECS[color], level - 1
  local stats = {}
  for _, key in ipairs({ "hp", "atk", "def", "agi", "int", "chm" }) do
    stats[key] = math.floor(spec.base[key] + spec.growth[key] * l)
  end
  if pattern == "Stripe" then stats.agi = math.floor(stats.agi * 1.1)
  elseif pattern == "Polka" then stats.hp = math.floor(stats.hp * 1.1)
  elseif pattern == "Glow" then stats.int = math.floor(stats.int * 1.15)
  elseif pattern == "Crown" then stats.atk = math.floor(stats.atk * 1.15)
  elseif pattern == "Ringed" then stats.def = math.floor(stats.def * 1.15)
  elseif pattern == "Nebula" then
    for _, key in ipairs({ "hp", "atk", "def", "agi", "int", "chm" }) do stats[key] = math.floor(stats[key] * 1.1) end
  elseif pattern == "Obsidian" then
    stats.hp = math.floor(stats.hp * 1.25)
    stats.def = math.floor(stats.def * 1.25)
  end
  local multiplier = stage_modifier(stage_from_level(level))
  for _, key in ipairs({ "hp", "atk", "def", "agi", "int", "chm" }) do stats[key] = math.floor(stats[key] * multiplier) end
  return stats
end

function breed_slimes(p1, p2, generation)
  local color = breed_colors(p1.color, p2.color)
  local pattern = breed_patterns(p1.pattern, p2.pattern)
  local name = generate_slime_name()
  return {
    id = "slime_" .. os.time() .. "_" .. math.floor(math.random() * 1000),
    name = name, color = color, pattern = pattern, level = 1, xp = 0,
    stats = calculate_stats(color, pattern, 1), role = "idle", generation = generation,
    parent_a = p1.id, parent_b = p2.id, created_at = os.time(),
  }
end

function create_seed_slime(color, pattern)
  color, pattern = color or "Red", pattern or "Solid"
  local name = generate_slime_name()
  return {
    id = "slime_" .. os.time() .. "_" .. math.floor(math.random() * 1000),
    name = name, color = color, pattern = pattern, level = 1, xp = 0,
    stats = calculate_stats(color, pattern, 1), role = "idle", generation = 0, created_at = os.time(),
  }
end
