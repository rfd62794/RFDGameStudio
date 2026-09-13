EXAMPLE of a high-quality HeraldDirective:
{
  "session_id": "S006",
  "title": "Loot System v1 — Item Drops and Equipment Slots",
  "preamble": "Run `python -m src.tools.apj handoff`.",
  "context": "Loot system spec is in docs/reference/DUNGEON_DESIGN.md. Data contracts (ItemDrop, RarityTier, EquipmentSlot) are defined in the Port Notes section. Existing combat system is in src/shared/engine/combat/. Follow the dataclass pattern used in src/shared/engine/combat/combat_result.py. Do not add pygame calls to any shared/ file.",
  "tasks": [
    "1. Create src/shared/engine/loot/__init__.py — empty package marker",
    "2. Create src/shared/engine/loot/item.py — ItemDrop, RarityTier, EquipmentSlot dataclasses from DUNGEON_DESIGN.md Port Notes section",
    "3. Create src/shared/engine/loot/drop_table.py — DropTable class: standard_drop(), elite_drop(), boss_drop() following rarity rules from DUNGEON_DESIGN.md Loot System v1 section",
    "4. Create tests/unit/test_loot.py — test_item_drop_creation, test_rarity_tiers, test_drop_table_standard, test_drop_table_boss_guaranteed_rare",
    "5. Run pytest — target 452 passing (448 + 4 new)"
  ],
  "verification": "uv run pytest tests/unit/test_loot.py -v. Manual: python -c \"from src.shared.engine.loot.item import ItemDrop, RarityTier; print(RarityTier.RARE)\"",
  "commit_message": "feat: loot system v1 — ItemDrop, RarityTier, DropTable, 4 tests",
  "confidence": "high"
}

EXAMPLE of a BAD directive (do not do this):
{
  "tasks": [
    "1. Implement the loot system",
    "2. Add some tests",
    "3. Make sure it works"
  ]
}
The bad example has no file paths, no specificity, no verification. Every task must name a file.

CRITICAL: Output ONLY the JSON object. No prose, no markdown fences, no explanation. Start with { and end with }.
