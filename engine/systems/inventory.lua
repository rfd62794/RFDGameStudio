-- engine/systems/inventory.lua
-- Reusable inventory and item management system.
-- Follows pure state transformation principles.

-- Helper to recursively copy a table to prevent in-place mutation.
local function copy_table(t)
  if type(t) ~= "table" then return t end
  local c = {}
  for k, v in pairs(t) do
    if type(v) == "table" then
      c[k] = copy_table(v)
    else
      c[k] = v
    end
  end
  return c
end

-- Add an item to the inventory.
-- inventory: table with an 'items' array (or empty/nil to initialize)
-- item: string (item_id) or table containing at least an 'id' field
-- Returns: new updated inventory table
function add_item(inventory, item)
  local next_inv = copy_table(inventory) or {}
  if next_inv.items == nil then next_inv.items = {} end
  
  -- Always collect the items array in case it came from lupa proxy
  next_inv.items = collect(next_inv.items)
  
  local item_to_add
  if type(item) == "string" then
    item_to_add = { id = item, quantity = 1 }
  else
    item_to_add = copy_table(item)
    if item_to_add.quantity == nil then item_to_add.quantity = 1 end
  end
  
  -- If it is a simple item, we stack it if a match is found
  local found = false
  for _, it in ipairs(next_inv.items) do
    if it.id == item_to_add.id then
      -- It is stackable only if it doesn't have other unique qualities
      local is_simple = true
      for k, v in pairs(item_to_add) do
        if k ~= "id" and k ~= "quantity" then
          is_simple = false
          break
        end
      end
      if is_simple then
        it.quantity = (it.quantity or 1) + item_to_add.quantity
        found = true
        break
      end
    end
  end
  
  if not found then
    table.insert(next_inv.items, item_to_add)
  end
  
  return next_inv
end

-- Remove one instance of an item from the inventory.
-- inventory: table with an 'items' array
-- item_id: string id of the item to remove
-- Returns: new updated inventory table, and boolean indicating if an item was removed
function remove_item(inventory, item_id)
  local next_inv = copy_table(inventory) or {}
  if next_inv.items == nil then next_inv.items = {} end
  
  next_inv.items = collect(next_inv.items)
  
  local removed = false
  for i, it in ipairs(next_inv.items) do
    if it.id == item_id then
      if it.quantity and it.quantity > 1 then
        it.quantity = it.quantity - 1
        removed = true
      else
        table.remove(next_inv.items, i)
        removed = true
      end
      break
    end
  end
  
  return next_inv, removed
end

-- Check if the inventory contains at least one instance of an item.
-- inventory: table with an 'items' array
-- item_id: string id of the item to check
-- Returns: boolean
function has_item(inventory, item_id)
  if inventory == nil or inventory.items == nil then return false end
  local items = collect(inventory.items)
  for _, it in ipairs(items) do
    if it.id == item_id then
      return true
    end
  end
  return false
end

-- Count total quantity of an item in the inventory.
-- inventory: table with an 'items' array
-- item_id: string id of the item to count
-- Returns: integer
function count_item(inventory, item_id)
  if inventory == nil or inventory.items == nil then return 0 end
  local items = collect(inventory.items)
  local count = 0
  for _, it in ipairs(items) do
    if it.id == item_id then
      count = count + (it.quantity or 1)
    end
  end
  return count
end

-- Use an item on a target by applying effect_fn.
-- inventory: table with an 'items' array
-- item_id: string id of the item to use
-- target: any type, passed to effect_fn
-- effect_fn: function(target) -> result
-- Returns: table { updated_inventory, result }
function use_item(inventory, item_id, target, effect_fn)
  if not has_item(inventory, item_id) then
    return { updated_inventory = inventory, result = nil }
  end
  
  local next_inv, removed = remove_item(inventory, item_id)
  if not removed then
    return { updated_inventory = inventory, result = nil }
  end
  
  local result = nil
  if effect_fn then
    result = effect_fn(target)
  end
  
  return { updated_inventory = next_inv, result = result }
end
