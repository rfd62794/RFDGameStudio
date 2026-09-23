-- engine/primitives/resolution.lua
-- RNG-seeded outcome determination patterns.

-- Convert raw scores to decimal odds with overround applied.
-- scores: array of numbers (higher = more likely to win)
-- overround: float (e.g. 1.12 = 12% house margin)
-- Returns: array of decimal odds parallel to scores
function scores_to_odds(scores, overround)
  overround = overround or 1.12
  local total = 0
  for _, s in ipairs(scores) do total = total + s end
  local odds = {}
  for _, s in ipairs(scores) do
    local prob = (s / total) * overround
    local decimal = math.floor((1 / math.max(0.01, prob)) * 10 + 0.5) / 10
    table.insert(odds, math.max(1.1, decimal))
  end
  return odds
end

-- Select an option from an array based on relative weights
-- options: array of any type
-- weights: array of numbers parallel to options (must be parallel and positive)
-- Returns: selected option
function weighted_choice(options, weights)
  local opts = collect(options)
  local wts = collect(weights)
  local total_weight = 0
  for _, w in ipairs(wts) do
    total_weight = total_weight + w
  end
  if total_weight <= 0 then
    -- fallback to uniform random
    return opts[math.random(#opts)]
  end
  local r = math.random() * total_weight
  local cumulative = 0
  for i, w in ipairs(wts) do
    cumulative = cumulative + w
    if r <= cumulative then
      return opts[i]
    end
  end
  return opts[#opts]
end

-- Resolve a contest between participants using their weights
-- participants: array of any type
-- weights: array of numbers parallel to participants
-- Returns: index of the winner (1-based)
function resolve_contest(participants, weights)
  local parts = collect(participants)
  local wts = collect(weights)
  local total_weight = 0
  for _, w in ipairs(wts) do
    total_weight = total_weight + w
  end
  if total_weight <= 0 then
    return math.random(#parts)
  end
  local r = math.random() * total_weight
  local cumulative = 0
  for i, w in ipairs(wts) do
    cumulative = cumulative + w
    if r <= cumulative then
      return i
    end
  end
  return #parts
end

-- Resolve a checks contest (D20-style or value check)
-- value: number, the actor's skill or bonus
-- difficulty: number, the target difficulty
-- variance: number, optional range of variance (e.g. 10 or 20 for d20 check)
-- Returns: boolean (true if value + roll >= difficulty)
function resolve_check(value, difficulty, variance)
  variance = variance or 20
  local roll = math.floor(math.random() * variance) + 1
  return (value + roll) >= difficulty
end

