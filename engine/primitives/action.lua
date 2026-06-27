-- engine/primitives/action.lua
-- Pure state transformation utilities.
-- Convention: functions return new state; never mutate inputs.

-- Clamp a value between min and max
function clamp(val, min_val, max_val)
  return math.max(min_val, math.min(max_val, val))
end

-- Random integer in range [min, max]
function rand_int(min_val, max_val)
  return math.floor(min_val + math.random() * (max_val - min_val))
end

-- Random item from a table (array)
function rand_item(arr)
  return arr[math.random(#arr)]
end
