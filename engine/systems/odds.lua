-- engine/systems/odds.lua
-- Probability weighting and payout calculation.
-- Depends on: engine/primitives/action.lua (clamp, rand_int, rand_item)

-- Calculate decimal betting odds for a field of horses at a given distance
-- Returns array of odds parallel to participants array
function calculate_odds(participants, distance, overround)
  overround = overround or 1.12

  -- Score each horse based on distance-weighted stats
  local scores = {}
  for _, p in ipairs(participants) do
    local h = p.horse or p  -- support both wrapped and unwrapped horse
    local score

    if distance <= 900 then
      -- Sprint: acceleration dominant
      score = h.acceleration * 0.45 + h.speed * 0.45 + h.stamina * 0.10
    elseif distance <= 1400 then
      -- Medium: speed dominant
      score = h.speed * 0.40 + h.stamina * 0.35 + h.acceleration * 0.25
    else
      -- Long: stamina dominant
      score = h.stamina * 0.55 + h.speed * 0.30 + h.acceleration * 0.15
    end

    -- Temperament bump: consistency of peak performance
    score = score + h.temperament * 0.05
    table.insert(scores, math.max(1, score))
  end

  local total_score = 0
  for _, s in ipairs(scores) do total_score = total_score + s end

  local odds = {}
  for _, s in ipairs(scores) do
    local prob = (s / total_score) * overround
    local decimal_odds = 1 / math.max(0.01, prob)
    -- Round to nearest tenth
    decimal_odds = math.floor(decimal_odds * 10 + 0.5) / 10
    table.insert(odds, math.max(1.1, decimal_odds))
  end

  return odds
end

-- Calculate place bet odds from win odds.
-- config: { place_odds_multiplier, place_odds_min }
-- Returns: float — max(min, win_odds * multiplier)
function calculate_place_odds(win_odds, config)
  local multiplier = config and config.place_odds_multiplier or 0.38
  local min_odds   = config and config.place_odds_min        or 1.15
  local place = win_odds * multiplier
  if place < min_odds then place = min_odds end
  return math.floor(place * 100 + 0.5) / 100
end

-- Calculate show bet odds (1st, 2nd, or 3rd).
function calculate_show_odds(win_odds, config)
  local multiplier = config and config.show_odds_multiplier or 0.20
  local min_odds   = config and config.show_odds_min        or 1.05
  local show = win_odds * multiplier
  if show < min_odds then show = min_odds end
  return math.floor(show * 100 + 0.5) / 100
end
