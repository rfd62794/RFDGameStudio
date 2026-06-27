-- engine/primitives/physics.lua
-- Collision detection and response patterns.

-- Check if two grid positions are the same cell.
-- Returns: true if collision
function grid_collision(pos_a, pos_b)
  return pos_a.x == pos_b.x and pos_a.y == pos_b.y
end

-- Check if a position matches any position in an array (self-collision).
-- body: array of {x, y} tables
-- head: {x, y}
-- Returns: true if head hits body
function self_collision(head, body)
  for _, segment in ipairs(body) do
    if grid_collision(head, segment) then return true end
  end
  return false
end
