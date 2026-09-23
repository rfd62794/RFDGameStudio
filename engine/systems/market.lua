-- engine/systems/market.lua
-- Bet settlement, horse valuation, prize distribution.

-- DEPRECATED: Use settle_bets() instead.
-- settle_bets() returns horse_earnings alongside bet_payout in one call.
-- This function will be removed in Phase 4.
function calculate_payouts(results, prize_pool, prize_split)
  local payouts = {}
  for i, result in ipairs(results) do
    local fraction = prize_split[i] or 0
    payouts[result.horse_id] = math.floor(prize_pool * fraction)
  end
  return payouts
end

-- Recalculate a horse's market value based on current stats and career
function calculate_horse_price(horse)
  local avg_stat = (horse.speed + horse.stamina +
                    horse.acceleration + horse.temperament) / 4
  local base_price = math.floor(avg_stat * avg_stat * 0.35 +
                                (horse.generation * 100))
  -- Career premium: each win adds value
  local career_premium = horse.wins * 150 + horse.places * 60 + horse.thirds * 30
  return base_price + career_premium
end

-- Validate and execute a horse sale
-- Returns new_funds or nil + error
function sell_horse(horse, current_funds)
  if horse.runs == 0 then
    -- Unraced: sell at base price
    return current_funds + horse.price, nil
  end
  -- Raced: sell at current turf bid value
  local value = calculate_horse_price(horse)
  return current_funds + value, nil
end

-- Settle all bets for a completed race.
-- bets: array of { horse_id, amount, type, payout_odds }
--   type is "Win" (must finish 1st), "Place" (1st/2nd), or "Show" (1st/2nd/3rd)
-- standings: array of { horse_id, final_rank } sorted rank ascending
-- prize_pool: integer total purse
-- prize_splits: array of fractions e.g. {0.60, 0.25, 0.15}
--
-- Returns: {
--   bet_payout: integer (total won from bets),
--   horse_earnings: table { horse_id = prize_integer }
-- }
function settle_bets(bets, standings, prize_pool, prize_splits)
  -- Build rank lookup: horse_id -> rank
  local rank_of = {}
  for _, s in ipairs(standings) do
    rank_of[s.horse_id] = s.final_rank
  end

  -- Calculate bet winnings (only winning bets; losing bets were deducted on placement)
  local bet_payout = 0
  for _, bet in ipairs(bets) do
    local rank = rank_of[bet.horse_id]
    if rank then
      local is_winner = false
      if bet.type == "Win" and rank == 1 then
        is_winner = true
      elseif bet.type == "Place" and rank <= 2 then
        is_winner = true
      elseif bet.type == "Show" and rank <= 3 then
        is_winner = true
      end
      if is_winner then
        bet_payout = bet_payout + math.floor(bet.amount * bet.payout_odds)
      end
    end
  end

  -- Calculate prize pool earnings per horse
  local horse_earnings = {}
  for _, s in ipairs(standings) do
    local fraction = prize_splits[s.final_rank] or 0
    if fraction > 0 then
      horse_earnings[s.horse_id] = math.floor(prize_pool * fraction)
    else
      horse_earnings[s.horse_id] = 0
    end
  end

  return { bet_payout = bet_payout, horse_earnings = horse_earnings }
end
