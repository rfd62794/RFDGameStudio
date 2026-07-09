-- chimera_wilds/logic.lua — Phase 1 minimal encounter loop
-- All randomness is owned by the caller; Lua only assembles and resolves.

local PART_SLOTS = {
  "head",
  "chest",
  "left_arm",
  "right_arm",
  "left_leg",
  "right_leg",
}

-- Assemble a chimera from a caller-provided parts table.
-- parts_table: array of PartDefinitions; must contain at least one part per slot.
-- On success: returns { parts, part_ids, total_power, total_endurance }, nil
-- On failure: returns nil, "Missing slot: {slot}"
function generate_chimera(parts_table)
  local by_slot = {}
  for _, part in ipairs(parts_table or {}) do
    if part and part.slot then
      by_slot[part.slot] = by_slot[part.slot] or {}
      table.insert(by_slot[part.slot], part)
    end
  end

  local selected = {}
  for _, slot in ipairs(PART_SLOTS) do
    local opts = by_slot[slot]
    if not opts or #opts == 0 then
      return nil, "Missing slot: " .. tostring(slot)
    end
    -- Caller owns the random selection; Lua takes the first candidate per slot.
    selected[slot] = opts[1]
  end

  local chimera = {
    parts = {},
    part_ids = {},
    total_power = 0,
    total_endurance = 0,
  }

  for _, slot in ipairs(PART_SLOTS) do
    local part = selected[slot]
    chimera.parts[slot] = part
    chimera.part_ids[slot] = part.id
    chimera.total_power = chimera.total_power + (part.power or 0)
    chimera.total_endurance = chimera.total_endurance + (part.endurance or 0)
  end

  return chimera, nil
end

-- Resolve a single D20-style encounter.
-- player_power, player_endurance: baseline player stats
-- chimera: assembled chimera from generate_chimera
-- roll: integer 1-20, provided by the caller
-- Returns: { won = score >= chimera_score, score, chimera_score }
function resolve_encounter(player_power, player_endurance, chimera, roll)
  local player_score = player_power + player_endurance + roll
  local chimera_score = (chimera.total_power or 0) + (chimera.total_endurance or 0)
  return {
    won = player_score >= chimera_score,
    score = player_score,
    chimera_score = chimera_score,
  }
end
