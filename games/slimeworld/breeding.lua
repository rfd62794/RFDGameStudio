function clamp(value, minimum, maximum)
  if value < minimum then return minimum end
  if value > maximum then return maximum end
  return value
end

function circular_distance(hue_a, hue_b)
  local difference = math.abs(hue_a - hue_b) % 360
  return math.min(difference, 360 - difference)
end

function circular_hue_midpoint(hue_a, hue_b)
  local difference = ((hue_b - hue_a + 540) % 360) - 180
  return (hue_a + difference / 2 + 360) % 360
end

function snap_to_faction(hue)
  local anchors = {
    { color = "Red", value = 0 },
    { color = "Orange", value = 60 },
    { color = "Yellow", value = 120 },
    { color = "Green", value = 180 },
    { color = "Purple", value = 240 },
    { color = "Blue", value = 300 },
  }
  local closest = anchors[1].color
  local minimum_distance = 360
  for _, anchor in ipairs(anchors) do
    local distance = circular_distance(hue, anchor.value)
    if distance < minimum_distance then
      closest = anchor.color
      minimum_distance = distance
    end
  end
  return closest
end

function snap_to_shape_name(vertex_count, irregularity)
  local anchors = {
    { shape = "Triangle", vertex = 3, irregularity = 5 },
    { shape = "Square", vertex = 4, irregularity = 5 },
    { shape = "Circle", vertex = 12, irregularity = 0 },
    { shape = "Star", vertex = 5, irregularity = 60 },
    { shape = "Diamond", vertex = 4, irregularity = 40 },
    { shape = "Teardrop", vertex = 6, irregularity = 50 },
    { shape = "Pentagon", vertex = 5, irregularity = 10 },
    { shape = "Crescent", vertex = 7, irregularity = 70 },
    { shape = "Hexa", vertex = 6, irregularity = 15 },
    { shape = "Crown", vertex = 8, irregularity = 85 },
  }
  local closest = anchors[1].shape
  local minimum_distance = math.huge
  for _, anchor in ipairs(anchors) do
    local vertex_distance = vertex_count - anchor.vertex
    local irregularity_distance = irregularity - anchor.irregularity
    local distance = vertex_distance * vertex_distance + irregularity_distance * irregularity_distance
    if distance < minimum_distance then
      closest = anchor.shape
      minimum_distance = distance
    end
  end
  return closest
end

local COLOR_TIERS = { Red = 1, Yellow = 1, Blue = 1, Orange = 2, Green = 2, Purple = 2, Gray = 1 }
local SHAPE_TIERS = { Triangle = 1, Square = 1, Circle = 1, Star = 2, Diamond = 2, Teardrop = 2, Pentagon = 3, Crescent = 3, Hexa = 3, Crown = 4 }
local TIER_VALUE = { [1] = 5, [2] = 22, [3] = 95, [4] = 300 }

function get_color_tier(color_name)
  return COLOR_TIERS[color_name] or 1
end

function get_shape_tier(shape_name)
  return SHAPE_TIERS[shape_name] or 1
end

function calculate_tier_value(color_name, shape_name, variance)
  variance = variance or 0
  local color_value = TIER_VALUE[get_color_tier(color_name)] or 5
  local shape_value = TIER_VALUE[get_shape_tier(shape_name)] or 5
  return math.max(1, math.floor((color_value + shape_value) * (1 + variance) + 0.5))
end

function find_color_target(color_targets, target_id)
  if color_targets == nil or target_id == nil then return nil end
  for _, target in ipairs(color_targets) do
    if target.id == target_id then return target end
  end
  return nil
end

function match_color_target(hue, saturation, color_targets)
  if color_targets == nil then return nil end
  for _, target in ipairs(color_targets) do
    if saturation >= target.saturation_min and saturation < target.saturation_max then
      for _, center in ipairs(target.center_hues) do
        if circular_distance(hue, center) <= target.tolerance then
          return target.id
        end
      end
    end
  end
  return nil
end

function match_shape_target(vertex_count, irregularity, shape_targets)
  if shape_targets == nil then return nil end
  for _, target in ipairs(shape_targets) do
    local tolerance = target.vertex_tolerance or 0.5
    if math.abs(vertex_count - target.vertex_count) <= tolerance then
      local irr_min = target.irregularity_min or 0
      local irr_max = target.irregularity_max or 100
      if irregularity >= irr_min and irregularity <= irr_max then
        return target.id
      end
    end
  end
  return nil
end

function find_shape_target(shape_targets, target_id)
  if shape_targets == nil or target_id == nil then return nil end
  for _, target in ipairs(shape_targets) do
    if target.id == target_id then return target end
  end
  return nil
end

function breed_shape(parent_a, parent_b, shape_targets, active_shape_target)
  local vertex_a = parent_a.vertex_count or 4
  local vertex_b = parent_b.vertex_count or 4
  local irregularity_a = parent_a.irregularity or 10
  local irregularity_b = parent_b.irregularity or 10
  local offspring_vertex = (vertex_a + vertex_b) / 2
  local normalized_distance = math.abs(vertex_a - vertex_b) / 19
  local average_irregularity = (irregularity_a + irregularity_b) / 2
  local spiked_irregularity = clamp(average_irregularity + normalized_distance * 0.5 * 100, 0, 100)
  local final_vertex = offspring_vertex
  local final_irregularity = spiked_irregularity
  local target = find_shape_target(shape_targets, active_shape_target)
  if target ~= nil then
    final_vertex = offspring_vertex + (target.vertex_count - offspring_vertex) * 0.6
    local target_irregularity_midpoint = ((target.irregularity_min or 0) + target.irregularity_max) / 2
    final_irregularity = clamp(spiked_irregularity + (target_irregularity_midpoint - spiked_irregularity) * 0.6, 0, 100)
  end
  return { vertex_count = final_vertex, irregularity = final_irregularity }
end

function find_accent_type(accent_targets, diffusion_ratio)
  for _, target in ipairs(accent_targets or {}) do
    if target.id ~= "accent_metallic" and target.diffusion_min ~= nil and diffusion_ratio >= target.diffusion_min and diffusion_ratio <= target.diffusion_max then
      return target
    end
  end
  return nil
end

function find_accent_intensity(accent_targets, amplitude)
  for _, target in ipairs(accent_targets or {}) do
    if target.id ~= "accent_metallic" and target.amplitude_min ~= nil and amplitude >= target.amplitude_min and amplitude <= target.amplitude_max then
      return target
    end
  end
  return nil
end

function find_metallic_accent(accent_targets, diffusion_ratio, amplitude)
  for _, target in ipairs(accent_targets or {}) do
    if target.id == "accent_metallic" and diffusion_ratio >= target.diffusion_min and diffusion_ratio <= target.diffusion_max and amplitude >= target.amplitude_min and amplitude <= target.amplitude_max then
      return target
    end
  end
  return nil
end

function breed_accent(parent_a, parent_b, offspring_vertex_count, offspring_irregularity, offspring_hue)
  local diffusion_a = parent_a.diffusion_ratio or 20
  local diffusion_b = parent_b.diffusion_ratio or 20
  local amplitude_a = parent_a.amplitude or 40
  local amplitude_b = parent_b.amplitude or 40
  local offspring_diffusion = (diffusion_a + diffusion_b) / 2
  local offspring_amplitude = (amplitude_a + amplitude_b) / 2
  local shape_complexity = ((offspring_vertex_count - 3) / 19) * 0.5 + (offspring_irregularity / 100) * 0.5
  offspring_diffusion = clamp(offspring_diffusion + (shape_complexity * 100 - offspring_diffusion) * 0.3, 0, 100)
  local diffusion_distance = math.abs(diffusion_a - diffusion_b) / 100
  offspring_amplitude = clamp(offspring_amplitude - diffusion_distance * 0.4 * 100, 0, 100)
  local accent_hue = (offspring_hue + 180 * (offspring_amplitude / 100)) % 360
  return { diffusion_ratio = offspring_diffusion, amplitude = offspring_amplitude, accent_hue = accent_hue }
end

-- Seed shape defaults (ported from SEED_SHAPE_DEFAULTS in gameLogic.ts)
local SEED_SHAPE_DEFAULTS = {
  Red    = { vertex_count = 3, irregularity = 10 },
  Orange = { vertex_count = 3, irregularity = 15 },
  Yellow = { vertex_count = 6, irregularity = 10 },
  Green  = { vertex_count = 6, irregularity = 15 },
  Purple = { vertex_count = 4, irregularity = 15 },
  Blue   = { vertex_count = 4, irregularity = 10 },
  Gray   = { vertex_count = 4, irregularity = 20 },
}

-- Ported exactly from getInterpolatedSpecs in gameLogic.ts.
-- Finds the two adjacent color anchors the hue falls between, linearly
-- interpolates base_stats and growth by sector position, then blends
-- toward Gray by saturation/100.
function get_interpolated_specs(hue, saturation, color_specs)
  local norm_hue = ((hue % 360) + 360) % 360

  local anchors = {
    { color = "Red",    hue = 0   },
    { color = "Orange", hue = 60  },
    { color = "Yellow", hue = 120 },
    { color = "Green",  hue = 180 },
    { color = "Purple", hue = 240 },
    { color = "Blue",   hue = 300 },
    { color = "Red",    hue = 360 },
  }

  local i = 0
  for j = 1, #anchors - 1 do
    if norm_hue >= anchors[j].hue and norm_hue <= anchors[j + 1].hue then
      i = j
      break
    end
  end

  local a1 = anchors[i]
  local a2 = anchors[i + 1]
  local sector_range = a2.hue - a1.hue
  local t = 0
  if sector_range ~= 0 then t = (norm_hue - a1.hue) / sector_range end

  local spec1 = color_specs[a1.color]
  local spec2 = color_specs[a2.color]

  local function lerp(v1, v2, f) return v1 * (1 - f) + v2 * f end

  local base_hp  = lerp(spec1.base_stats.hp,  spec2.base_stats.hp,  t)
  local base_atk = lerp(spec1.base_stats.atk, spec2.base_stats.atk, t)
  local base_def = lerp(spec1.base_stats.def, spec2.base_stats.def, t)
  local base_agi = lerp(spec1.base_stats.agi, spec2.base_stats.agi, t)
  local base_int = lerp(spec1.base_stats.int, spec2.base_stats.int, t)
  local base_chm = lerp(spec1.base_stats.chm, spec2.base_stats.chm, t)

  local grow_hp  = lerp(spec1.growth.hp,  spec2.growth.hp,  t)
  local grow_atk = lerp(spec1.growth.atk, spec2.growth.atk, t)
  local grow_def = lerp(spec1.growth.def, spec2.growth.def, t)
  local grow_agi = lerp(spec1.growth.agi, spec2.growth.agi, t)
  local grow_int = lerp(spec1.growth.int, spec2.growth.int, t)
  local grow_chm = lerp(spec1.growth.chm, spec2.growth.chm, t)

  local sat_factor = saturation / 100
  local gray = color_specs.Gray

  local final_base = {
    hp  = gray.base_stats.hp  * (1 - sat_factor) + base_hp  * sat_factor,
    atk = gray.base_stats.atk * (1 - sat_factor) + base_atk * sat_factor,
    def = gray.base_stats.def * (1 - sat_factor) + base_def * sat_factor,
    agi = gray.base_stats.agi * (1 - sat_factor) + base_agi * sat_factor,
    int = gray.base_stats.int * (1 - sat_factor) + base_int * sat_factor,
    chm = gray.base_stats.chm * (1 - sat_factor) + base_chm * sat_factor,
  }

  local final_growth = {
    hp  = gray.growth.hp  * (1 - sat_factor) + grow_hp  * sat_factor,
    atk = gray.growth.atk * (1 - sat_factor) + grow_atk * sat_factor,
    def = gray.growth.def * (1 - sat_factor) + grow_def * sat_factor,
    agi = gray.growth.agi * (1 - sat_factor) + grow_agi * sat_factor,
    int = gray.growth.int * (1 - sat_factor) + grow_int * sat_factor,
    chm = gray.growth.chm * (1 - sat_factor) + grow_chm * sat_factor,
  }

  return { base_stats = final_base, growth = final_growth }
end

-- Ported exactly from getShapeStatModifiers in gameLogic.ts.
-- Weighted linear ramps (not step functions), each capped at 10% bonus.
function get_shape_stat_modifiers(vertex_count, irregularity)
  local low_vertex_weight = math.max(0, math.min(1, (6 - vertex_count) / 3))
  local low_irr_weight = math.max(0, math.min(1, (35 - irregularity) / 35))
  local simple_stable_weight = low_vertex_weight * low_irr_weight

  local high_vertex_weight = math.max(0, math.min(1, (vertex_count - 6) / 8))
  local clean_complex_weight = high_vertex_weight * low_irr_weight

  local jagged_weight = math.max(0, math.min(1, (irregularity - 15) / 35))

  return {
    hp_bonus  = simple_stable_weight * 0.10,
    def_bonus = simple_stable_weight * 0.10,
    int_bonus = clean_complex_weight * 0.10,
    chm_bonus = clean_complex_weight * 0.10,
    atk_bonus = jagged_weight * 0.10,
    agi_bonus = jagged_weight * 0.10,
  }
end

-- Ported from calculateStats in gameLogic.ts, minus the retired Pattern switch.
-- Computes base stats from interpolated color specs + level growth, then
-- applies shape modifiers as multiplicative bonuses.
-- NOTE: 'int' is used as a table key matching the existing convention in
-- create_seed_slime's stats table. It is a valid Lua identifier.
function calculate_stats(color, level, hue, saturation, vertex_count, irregularity, color_specs)
  local spec = get_interpolated_specs(hue, saturation, color_specs)
  local l = level - 1

  local stats = {
    hp  = math.floor(spec.base_stats.hp  + spec.growth.hp  * l),
    atk = math.floor(spec.base_stats.atk + spec.growth.atk * l),
    def = math.floor(spec.base_stats.def + spec.growth.def * l),
    agi = math.floor(spec.base_stats.agi + spec.growth.agi * l),
    int = math.floor(spec.base_stats.int + spec.growth.int * l),
    chm = math.floor(spec.base_stats.chm + spec.growth.chm * l),
  }

  local mod = get_shape_stat_modifiers(vertex_count, irregularity)
  stats.hp  = math.floor(stats.hp  * (1 + mod.hp_bonus))
  stats.atk = math.floor(stats.atk * (1 + mod.atk_bonus))
  stats.def = math.floor(stats.def * (1 + mod.def_bonus))
  stats.agi = math.floor(stats.agi * (1 + mod.agi_bonus))
  stats.int = math.floor(stats.int * (1 + mod.int_bonus))
  stats.chm = math.floor(stats.chm * (1 + mod.chm_bonus))

  return stats
end

function breed_slimes(parent_a, parent_b, generation, same_pair_streak, color_targets, active_target_regent)
  local hue_a = parent_a.hue or 0
  local hue_b = parent_b.hue or 0
  local saturation_a = parent_a.saturation
  local saturation_b = parent_b.saturation
  if saturation_a == nil then saturation_a = parent_a.color == "Gray" and 0 or 100 end
  if saturation_b == nil then saturation_b = parent_b.color == "Gray" and 0 or 100 end
  same_pair_streak = same_pair_streak or 0

  local offspring_hue = circular_hue_midpoint(hue_a, hue_b)
  local normalized_distance = circular_distance(hue_a, hue_b) / 180
  local repetition_penalty = math.max(0.15, 1 - same_pair_streak * 0.12)
  local effective_k = 0.12 * repetition_penalty
  local average_saturation = (saturation_a + saturation_b) / 2
  local offspring_saturation = clamp(average_saturation * (1 - effective_k * normalized_distance), 0, 100)
  local final_hue = offspring_hue
  local final_saturation = offspring_saturation

  local target = find_color_target(color_targets, active_target_regent)
  if target ~= nil then
    local closest_center = target.center_hues[1]
    local minimum_distance = 360
    for _, center in ipairs(target.center_hues) do
      local distance = circular_distance(offspring_hue, center)
      if distance < minimum_distance then
        closest_center = center
        minimum_distance = distance
      end
    end
    local difference = ((closest_center - offspring_hue + 540) % 360) - 180
    final_hue = (offspring_hue + difference * 0.6 + 360) % 360
    local target_saturation_midpoint = (target.saturation_min + target.saturation_max) / 2
    final_saturation = clamp(offspring_saturation + (target_saturation_midpoint - offspring_saturation) * 0.6, 0, 100)
  end

  local color = final_saturation < 15 and "Gray" or snap_to_faction(final_hue)
  return {
    id = "slime_" .. os.time() .. "_" .. math.random(1000),
    color = color,
    hue = final_hue,
    saturation = final_saturation,
    color_saturation = final_saturation,
    pattern = parent_a.pattern,
    level = 1,
    xp = 0,
    generation = generation,
    role = "idle",
    parent_a = parent_a.id,
    parent_b = parent_b.id,
  }
end