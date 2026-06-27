-- engine/primitives/movement.lua
-- Position update patterns for continuous and grid-based movement.

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
