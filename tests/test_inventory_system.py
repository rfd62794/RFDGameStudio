from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from studio.executor import Executor

ROOT = Path(__file__).parent.parent
ACTION_SOURCE = (ROOT / "engine" / "primitives" / "action.lua").read_text(encoding="utf-8")
# We will create inventory.lua shortly.
INVENTORY_PATH = ROOT / "engine" / "systems" / "inventory.lua"

def test_inventory_flow() -> None:
    # Ensure inventory.lua exists before loading
    assert INVENTORY_PATH.exists()
    inventory_source = INVENTORY_PATH.read_text(encoding="utf-8")
    executor = Executor(inventory_source, engine_source=ACTION_SOURCE)
    
    # 1. Start with empty inventory
    inv = {"items": []}
    
    # has_item / count_item should be false / 0
    assert executor.call("has_item", inv, "iron") is False
    assert executor.call("count_item", inv, "iron") == 0
    
    # 2. Add an item (string format)
    inv2 = executor.call("add_item", inv, "iron")
    assert executor.call("has_item", inv2, "iron") is True
    assert executor.call("count_item", inv2, "iron") == 1
    
    # Original inv should remain unchanged (no mutation)
    assert executor.call("has_item", inv, "iron") is False
    
    # 3. Add same item again -> quantity increases
    inv3 = executor.call("add_item", inv2, "iron")
    assert executor.call("count_item", inv3, "iron") == 2
    
    # 4. Add non-stackable item (with extra stats)
    custom_part = {"id": "engine_part", "tier": 2, "quality": "refurbished"}
    inv4 = executor.call("add_item", inv3, custom_part)
    assert executor.call("has_item", inv4, "engine_part") is True
    assert executor.call("count_item", inv4, "engine_part") == 1
    
    # 5. Remove item
    inv5, removed = executor.call("remove_item", inv4, "iron")
    assert removed is True
    assert executor.call("count_item", inv5, "iron") == 1
    
    inv6, removed = executor.call("remove_item", inv5, "iron")
    assert removed is True
    assert executor.call("count_item", inv6, "iron") == 0
    assert executor.call("has_item", inv6, "iron") is False
    
    # 6. Use item
    # We can test use_item with a simple target and effect
    # Since effect_fn needs to be a lua function, let's execute a block with a mock effect_fn
    lua_code = """
    function test_use_helper(inv, item_id, target)
      local effect = function(t)
        t.hp = t.hp + 10
        return "healed"
      end
      return use_item(inv, item_id, target, effect)
    end
    """
    temp_executor = Executor(inventory_source + "\n" + lua_code, engine_source=ACTION_SOURCE)
    target = {"hp": 50}
    inv_with_potion = temp_executor.call("add_item", {"items": []}, "potion")
    
    res = temp_executor.call("test_use_helper", inv_with_potion, "potion", target)
    assert res is not None
    # res is a dictionary with updated_inventory and result
    assert res["result"] == "healed"
    assert len(res["updated_inventory"]["items"]) == 0
