-- engine/primitives/entity.lua
-- Entity contracts: ID generation, schema validation, deep copy.

-- Generate a unique ID for a new entity.
-- prefix: string identifying the entity type (e.g. "horse", "bot", "segment")
-- Returns: string ID
function generate_id(prefix)
  return (prefix or "entity") .. "_" .. tostring(math.random(100000, 999999))
end

-- Deep-copy an entity table (prevents mutation of inputs in actions).
-- entity: table
-- Returns: new table with same values
function copy_entity(entity)
  local copy = {}
  for k, v in pairs(entity) do copy[k] = v end
  return copy
end

-- Validate that an entity table has all required fields.
-- entity: table
-- required_fields: array of field name strings
-- Returns: true, nil | false, "Missing field: {name}"
function validate_entity(entity, required_fields)
  for _, field in ipairs(required_fields) do
    if entity[field] == nil then
      return false, "Missing field: " .. tostring(field)
    end
  end
  return true, nil
end
