-- RFDGameStudio — Layout Resolver
-- Implements the Yoga/Flutter flex layout algorithm.
-- Input:  layout_tree node + parent bounds {x, y, w, h}
-- Output: flat array of {id, x, y, w, h} in absolute pixels
--
-- Algorithm: "constraints go down, sizes go up" (Flutter terminology)
--   1. Walk tree top-down
--   2. Fixed nodes: height/width as fraction of parent
--   3. Flex nodes: share remaining space proportionally
--   4. Position children sequentially along direction axis
--   5. Recurse into children with their computed bounds
--   6. Return flat list of all resolved nodes

-- Resolve a layout tree node given its parent's absolute pixel bounds.
-- node: table with id, direction?, height?, width?, flex?, children?
-- parent: {x, y, w, h} in pixels
-- results: flat array to accumulate into (pass {} at root call)
-- Returns: results (same reference, for convenience)
function resolve_layout(node, parent, results)
  results = results or {}
  parent  = parent or { x=0, y=0, w=800, h=600 }

  local direction = node.direction or "column"
  local is_column = (direction == "column")
  local children  = node.children or {}

  -- Step 1: Compute this node's own bounds from parent
  local x = parent.x
  local y = parent.y
  local w = node.width  and (node.width  * parent.w) or parent.w
  local h = node.height and (node.height * parent.h) or parent.h

  -- Root node: override with parent bounds
  if not node.width  then w = parent.w end
  if not node.height then h = parent.h end

  -- Record this node if it has an id
  if node.id then
    table.insert(results, { id=node.id, x=x, y=y, w=w, h=h })
  end

  if #children == 0 then
    return results
  end

  -- Step 2: Separate fixed children from flex children
  local fixed_total = 0   -- total fixed size along main axis
  local total_flex  = 0   -- sum of flex factors

  for _, child in ipairs(children) do
    if is_column then
      if child.height then
        fixed_total = fixed_total + child.height * h
      elseif child.flex then
        total_flex = total_flex + child.flex
      end
    else
      if child.width then
        fixed_total = fixed_total + child.width * w
      elseif child.flex then
        total_flex = total_flex + child.flex
      end
    end
  end

  -- Step 3: Remaining space for flex children
  local main_size    = is_column and h or w
  local remaining    = math.max(0, main_size - fixed_total)
  local flex_unit    = (total_flex > 0) and (remaining / total_flex) or 0

  -- Step 4: Position each child sequentially
  local cursor = 0  -- current offset along main axis

  for _, child in ipairs(children) do
    local child_main  -- size along main axis
    local child_cross -- size along cross axis

    if is_column then
      child_cross = w
      if child.height then
        child_main = child.height * h
      elseif child.flex then
        child_main = flex_unit * child.flex
      else
        child_main = 0
      end
    else
      child_cross = h
      if child.width then
        child_main = child.width * w
      elseif child.flex then
        child_main = flex_unit * child.flex
      else
        child_main = 0
      end
    end

    -- Build child bounds
    local child_bounds
    if is_column then
      child_bounds = { x=x, y=y+cursor, w=child_cross, h=child_main }
    else
      child_bounds = { x=x+cursor, y=y, w=child_main, h=child_cross }
    end

    -- Recurse
    resolve_layout(child, child_bounds, results)
    cursor = cursor + child_main
  end

  return results
end

-- Convenience: resolve from a viewport size directly.
-- tree: the layout_tree table from ui.yaml
-- viewport_w, viewport_h: canvas/window dimensions in pixels
-- Returns: flat array of {id, x, y, w, h}
function resolve_viewport(tree, viewport_w, viewport_h)
  return resolve_layout(tree, { x=0, y=0, w=viewport_w, h=viewport_h }, {})
end
