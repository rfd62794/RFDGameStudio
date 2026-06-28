-- engine/primitives/movement.lua
-- Position update patterns for continuous and grid-based movement.
-- Also provides universal math utilities: dist2, normalize_angle.

-- Advance a continuous position by speed * delta_time.
-- Returns: new_position (float)
function advance_position(position, speed, delta_time)
  return position + speed * delta_time
end

-- Move a grid entity one step in a direction.
-- direction: {dx: int, dy: int}
-- Returns: {x: int, y: int}
function move_grid(pos, direction)
  return { x = pos.x + direction.dx, y = pos.y + direction.dy }
end

-- Check if a position is within grid bounds [0, width) x [0, height).
-- Returns: true if in bounds
function in_bounds(pos, width, height)
  return pos.x >= 0 and pos.x < width and pos.y >= 0 and pos.y < height
end

-- Calculate squared distance between two points.
-- Returns: number (avoids sqrt for cheap proximity checks)
function dist2(x1, y1, x2, y2)
  local dx, dy = x1 - x2, y1 - y2
  return dx * dx + dy * dy
end

-- Normalize an angle in radians to the range [-π, π].
-- Returns: number
function normalize_angle(a)
  while a < -math.pi do a = a + math.pi * 2 end
  while a >  math.pi do a = a - math.pi * 2 end
  return a
end

-- Lua 5.2+ compatibility wrapper for atan2.
-- math.atan2(y, x) was removed in Lua 5.2; math.atan(y, x) is the replacement.
-- Use this wrapper in any game that needs arctangent of two arguments.
function atan2(y, x)
  return math.atan(y, x)
end
