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
