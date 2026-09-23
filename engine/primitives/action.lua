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

-- Collect a Python list proxy (or any Lua table) into a Lua-native sequence.
-- Required when receiving list arguments from lupa (Python→Lua bridge).
-- lupa proxies do not support the # operator — rawlen returns 0.
-- Always use collect() before iterating or measuring Python-origin lists.
--
-- t: any table or lupa list proxy
-- Returns: Lua-native sequence table
function collect(t)
  local out = {}
  for _, v in ipairs(t) do out[#out+1] = v end
  return out
end
