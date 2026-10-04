import { describe, test, expect } from "vitest";
import { getRoom, canMoveTo, move } from "../src/rooms";
import { growthFactor } from "../src/growth";
import { canCraft, craft } from "../src/crafting";
import { resolveFight } from "../src/combat";
import { initPlayer, wipe } from "../src/state";
import { CATALOG } from "../src/catalog";
import { PlayerState, Equipment, Slime, SculptedContent } from "../src/types";
import { recruitCompanion, companionCombatant, awardCompanionXp, STARTER_SLIME, breedSlimes, setActiveCompanion } from "../src/companion";
import { validateSculptedContent, fallbackContent, sculptRoomIfNeeded, GeminiClient } from "../src/llmContent";

describe("ScrapCrawl Core System Tests", () => {
  // --- rooms.ts Tests ---
  describe("rooms.ts", () => {
    test("test_getRoom_returns_seeded_room", () => {
      const room = getRoom("home_base");
      expect(room).toBeDefined();
      expect(room.id).toBe("home_base");
      expect(room.name).toBe("Home Base");
    });

    test("test_canMoveTo_true_for_connected_room", () => {
      expect(canMoveTo("home_base", "scrap_pit")).toBe(true);
    });

    test("test_canMoveTo_false_for_unconnected_room", () => {
      expect(canMoveTo("home_base", "vent_stack")).toBe(false);
    });

    test("test_move_updates_currentRoomId", () => {
      const player = initPlayer();
      const updated = move(player, "scrap_pit");
      expect(updated.currentRoomId).toBe("scrap_pit");
    });

    test("test_move_rejects_and_returns_unchanged_state_if_unconnected", () => {
      const player = initPlayer();
      const updated = move(player, "vent_stack");
      expect(updated.currentRoomId).toBe("home_base");
      expect(updated).toBe(player);
    });
  });

  // --- growth.ts Tests ---
  describe("growth.ts", () => {
    test("test_growthFactor_clamps_at_0_8_floor", () => {
      expect(growthFactor(0)).toBeCloseTo(0.8);
      expect(growthFactor(-100)).toBe(0.8);
    });

    test("test_growthFactor_clamps_at_1_5_ceiling", () => {
      expect(growthFactor(500)).toBeCloseTo(1.5);
      expect(growthFactor(1000)).toBe(1.5);
    });

    test("test_growthFactor_has_no_level_parameter", () => {
      expect(growthFactor.length).toBe(1);
    });
  });

  // --- crafting.ts Tests ---
  describe("crafting.ts", () => {
    test("test_canCraft_true_with_sufficient_scrap", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 10,
      };
      expect(canCraft(player, "beatStick")).toBe(true);
    });

    test("test_canCraft_false_with_insufficient_scrap", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 5,
      };
      expect(canCraft(player, "beatStick")).toBe(false);
    });

    test("test_craft_deducts_correct_tier1_cost", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 15,
      };
      const updated = craft(player, "beatStick");
      expect(updated.scrap).toBe(5); // 15 - 10 = 5
      expect(updated.equipped.weapon).toBeDefined();
      expect(updated.equipped.weapon?.tier).toBe(1);
    });

    test("test_craft_tier2_rejected_before_tool_crafted", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 30,
        tier2Unlocked: false,
      };
      expect(canCraft(player, "beatStick", 2)).toBe(false);
      expect(() => craft(player, "beatStick", 2)).toThrow();
    });

    test("test_craft_tool_sets_tier2Unlocked_true", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 20,
      };
      const updated = craft(player, "tool");
      expect(updated.tier2Unlocked).toBe(true);
      expect(updated.scrap).toBe(0);
      expect(updated.equipped.weapon).toBeUndefined(); // tool is not equippable
    });

    test("test_craft_tool_unlocks_all_three_slots_simultaneously", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 100,
      };
      const unlocked = craft(player, "tool");
      expect(unlocked.tier2Unlocked).toBe(true);
      expect(canCraft(unlocked, "beatStick", 2)).toBe(true);
      expect(canCraft(unlocked, "shield", 2)).toBe(true);
      expect(canCraft(unlocked, "bodyArmor", 2)).toBe(true);
    });

    test("test_tier1_cost_unchanged_after_tier2_unlock", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 100,
        tier2Unlocked: true,
      };
      // Explicitly craft Tier 1 item after Tier 2 is unlocked
      const updated = craft(player, "beatStick", 1);
      expect(updated.scrap).toBe(90); // 100 - 10 = 90
      expect(updated.equipped.weapon?.tier).toBe(1);
    });

    test("test_craft_replaces_existing_slot_item", () => {
      const oldWeapon: Equipment = {
        id: "old_stick",
        slot: "weapon",
        catalogId: "beatStick",
        tier: 1,
        life: 2,
        maxLife: 10,
      };
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 20,
        equipped: {
          weapon: oldWeapon,
        },
      };
      const updated = craft(player, "beatStick");
      expect(updated.equipped.weapon).toBeDefined();
      expect(updated.equipped.weapon?.id).not.toBe("old_stick");
      expect(updated.equipped.weapon?.life).toBe(10);
    });
  });

  // --- combat.ts Tests ---
  describe("combat.ts", () => {
    test("test_resolveFight_win_awards_scrap_in_range", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 0,
      };
      const room = getRoom("scrap_pit");
      // Loop multiple times or mock math random if necessary, let's just assert multiple resolves
      for (let i = 0; i < 20; i++) {
        const result = resolveFight(player, room);
        if (result.won) {
          expect(result.scrapGained).toBeGreaterThanOrEqual(3);
          expect(result.scrapGained).toBeLessThanOrEqual(8);
          expect(result.player.scrap).toBe(result.scrapGained);
        } else {
          expect(result.scrapGained).toBe(0);
        }
      }
    });

    test("test_resolveFight_depletes_equipped_weapon_life", () => {
      const weapon: Equipment = {
        id: "stick",
        slot: "weapon",
        catalogId: "beatStick",
        tier: 1,
        life: 10,
        maxLife: 10,
      };
      const player: PlayerState = {
        ...initPlayer(),
        equipped: { weapon },
      };
      const room = getRoom("scrap_pit");
      const result = resolveFight(player, room);
      expect(result.player.equipped.weapon?.life).toBe(9);
    });

    test("test_resolveFight_broken_weapon_falls_back_to_unarmed", () => {
      const brokenWeapon: Equipment = {
        id: "broken",
        slot: "weapon",
        catalogId: "beatStick",
        tier: 1,
        life: 0,
        maxLife: 10,
      };
      const player: PlayerState = {
        ...initPlayer(),
        equipped: { weapon: brokenWeapon },
      };
      const room = getRoom("scrap_pit");
      // Combat still resolves successfully and weapon remains equipped with 0 life
      const result = resolveFight(player, room);
      expect(result.player.equipped.weapon).toBeDefined();
      expect(result.player.equipped.weapon?.life).toBe(0);
    });

    test("test_resolveFight_increments_weapon_proficiencyXp_on_use", () => {
      const originalRandom = Math.random;
      try {
        Math.random = () => 0.9; // forces a high roll (roll = 19) for guaranteed win
        const weapon: Equipment = {
          id: "stick",
          slot: "weapon",
          catalogId: "beatStick",
          tier: 1,
          life: 10,
          maxLife: 10,
        };
        const player: PlayerState = {
          ...initPlayer(),
          equipped: { weapon },
          proficiencyXp: { weapon: 0, shield: 0, armor: 0 },
        };
        const room = getRoom("scrap_pit");
        const result = resolveFight(player, room);
        expect(result.won).toBe(true);
        expect(result.player.proficiencyXp.weapon).toBe(15);
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  // --- state.ts Tests ---
  describe("state.ts", () => {
    test("test_wipe_resets_currentRoomId_to_home", () => {
      const player: PlayerState = {
        ...initPlayer(),
        currentRoomId: "scrap_pit",
      };
      const reset = wipe(player);
      expect(reset.currentRoomId).toBe("home_base");
    });

    test("test_wipe_preserves_scrap_equipped_and_proficiency", () => {
      const weapon: Equipment = {
        id: "stick",
        slot: "weapon",
        catalogId: "beatStick",
        tier: 1,
        life: 8,
        maxLife: 10,
      };
      const player: PlayerState = {
        ...initPlayer(),
        currentRoomId: "scrap_pit",
        scrap: 42,
        tier2Unlocked: true,
        equipped: { weapon },
        proficiencyXp: { weapon: 150, shield: 0, armor: 0 },
      };
      const reset = wipe(player);
      expect(reset.currentRoomId).toBe("home_base");
      expect(reset.scrap).toBe(42);
      expect(reset.tier2Unlocked).toBe(true);
      expect(reset.equipped.weapon).toBeDefined();
      expect(reset.equipped.weapon?.life).toBe(8);
      expect(reset.proficiencyXp.weapon).toBe(150);
    });
  });

  describe("Phase 2 Companion & Win-only XP Tests", () => {
    test("test_proficiency_xp_only_increments_on_win", () => {
      const player = {
        ...initPlayer(),
        equipped: {
          weapon: {
            id: "stick",
            slot: "weapon" as const,
            catalogId: "beatStick" as const,
            tier: 1 as const,
            life: 10,
            maxLife: 10,
          }
        },
        proficiencyXp: { weapon: 0, shield: 0, armor: 0 },
      };
      const easyRoom = { id: "easy", interactionTypes: ["fight" as const], connections: [] };
      const result = resolveFight(player, easyRoom);
      expect(result.won).toBe(true);
      expect(result.player.proficiencyXp.weapon).toBe(15);
    });

    test("test_proficiency_xp_unchanged_on_loss", () => {
      const player = {
        ...initPlayer(),
        equipped: {
          weapon: {
            id: "stick",
            slot: "weapon" as const,
            catalogId: "beatStick" as const,
            tier: 1 as const,
            life: 10,
            maxLife: 10,
          }
        },
        proficiencyXp: { weapon: 0, shield: 0, armor: 0 },
      };
      const hardRoom = { id: "hard", interactionTypes: ["fight" as const], difficulty: 1000, connections: [] };
      const result = resolveFight(player, hardRoom);
      expect(result.won).toBe(false);
      expect(result.player.proficiencyXp.weapon).toBe(0);
    });

    test("test_resolveFight_broken_weapon_uses_baseline_atk_in_score", () => {
      const originalRandom = Math.random;
      try {
        Math.random = () => 0.5; // translates to roll = 11
        const brokenWeapon: Equipment = {
          id: "broken_stick",
          slot: "weapon",
          catalogId: "beatStick",
          tier: 2,
          life: 0,
          maxLife: 18,
        };
        const player: PlayerState = {
          ...initPlayer(),
          equipped: { weapon: brokenWeapon },
          proficiencyXp: { weapon: 0, shield: 0, armor: 0 },
        };
        const room = { id: "test", interactionTypes: ["fight" as const], difficulty: 15, connections: [] };
        const result = resolveFight(player, room);
        expect(result.won).toBe(false); // 11 + 0.8 * 2 = 12.6 < 15
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_resolveFight_solo_player_matches_phase1_behavior", () => {
      const originalRandom = Math.random;
      try {
        Math.random = () => 0.45; // translates to roll = 10
        const player = {
          ...initPlayer(),
          equipped: {
            weapon: {
              id: "stick",
              slot: "weapon" as const,
              catalogId: "beatStick" as const,
              tier: 1 as const,
              life: 10,
              maxLife: 10,
            }
          },
          proficiencyXp: { weapon: 100, shield: 0, armor: 0 },
        };
        const room = { id: "test", interactionTypes: ["fight" as const], difficulty: 12, connections: [] };
        const result = resolveFight(player, room);
        expect(result.won).toBe(true);
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_recruitCompanion_adds_companion_to_player", () => {
      const player = initPlayer();
      expect(player.roster.length).toBe(0);
      const updated = recruitCompanion(player);
      expect(updated.roster.length).toBe(1);
      expect(updated.roster[0].name).toBe("Grunt");
      expect(updated.roster[0].generation).toBe(0);
    });

    test("test_companionCombatant_null_when_no_active_selected", () => {
      const player = initPlayer();
      expect(companionCombatant(player)).toBeNull();
    });

    test("test_resolveFight_party_score_sums_player_and_companion", () => {
      const originalRandom = Math.random;
      try {
        Math.random = () => 0.0; // translates to roll = 1
        const playerSolo = initPlayer();
        let playerWithCompanion = recruitCompanion(initPlayer());
        const recruitedId = playerWithCompanion.roster[0].id;
        playerWithCompanion = setActiveCompanion(playerWithCompanion, recruitedId);
        const room = { id: "test", interactionTypes: ["fight" as const], difficulty: 5, connections: [] };
        const soloResult = resolveFight(playerSolo, room);
        const partyResult = resolveFight(playerWithCompanion, room);
        expect(soloResult.won).toBe(false);
        expect(partyResult.won).toBe(true);
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_awardCompanionXp_increments_on_win", () => {
      const companion: Slime = {
        id: "slime",
        name: "Grunt",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 0,
      };
      const updated = awardCompanionXp(companion, true);
      expect(updated.xp).toBe(15);
    });

    test("test_awardCompanionXp_unchanged_on_loss", () => {
      const companion: Slime = {
        id: "slime",
        name: "Grunt",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 15,
        generation: 0,
      };
      const updated = awardCompanionXp(companion, false);
      expect(updated.xp).toBe(15);
    });

    test("test_companion_growthFactor_uses_shared_curve", () => {
      const companionLow: Slime = {
        id: "slime_low",
        name: "Grunt",
        vit: 8,
        pwr: 10,
        agi: 4,
        xp: 0,
        generation: 0,
      };
      let playerLow = initPlayer();
      playerLow.roster = [companionLow];
      playerLow.activeCompanionId = "slime_low";
      const combatantLow = companionCombatant(playerLow);
      expect(combatantLow?.atk).toBe(10);
      expect(combatantLow?.proficiencyXp).toBe(0);
      
      const companionHigh: Slime = {
        id: "slime_high",
        name: "Grunt",
        vit: 8,
        pwr: 10,
        agi: 4,
        xp: 500,
        generation: 0,
      };
      let playerHigh = initPlayer();
      playerHigh.roster = [companionHigh];
      playerHigh.activeCompanionId = "slime_high";
      const combatantHigh = companionCombatant(playerHigh);
      expect(combatantHigh?.atk).toBe(10);
      expect(combatantHigh?.proficiencyXp).toBe(500);
    });

    test("test_canCraft_tool_false_after_tier2_already_unlocked", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 100,
        tier2Unlocked: true,
      };
      expect(canCraft(player, "tool")).toBe(false);
    });

    test("test_craft_tool_rejected_if_tier2_already_unlocked", () => {
      const player: PlayerState = {
        ...initPlayer(),
        scrap: 100,
        tier2Unlocked: true,
      };
      expect(() => craft(player, "tool")).toThrow("Crafting rejected: Tool already crafted and Tier 2 unlocked.");
    });

    // --- Phase 3 Breeding, Genetics, and Roster Tests ---
    test("test_recruit_generates_variance_not_identical_clones", () => {
      const originalRandom = Math.random;
      try {
        // Mock RNG to lowest offset (-2)
        Math.random = () => 0.0;
        const playerMin = recruitCompanion(initPlayer());
        const minSlime = playerMin.roster[0];

        // Mock RNG to highest offset (+2)
        Math.random = () => 0.99;
        const playerMax = recruitCompanion(initPlayer());
        const maxSlime = playerMax.roster[0];

        expect(minSlime.vit).not.toBe(maxSlime.vit);
        expect(minSlime.pwr).not.toBe(maxSlime.pwr);
        expect(minSlime.agi).not.toBe(maxSlime.agi);
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_recruit_adds_to_roster", () => {
      const player = initPlayer();
      expect(player.roster.length).toBe(0);
      const updated = recruitCompanion(player);
      expect(updated.roster.length).toBe(1);
      expect(updated.roster[0].name).toBe("Grunt");
    });

    test("test_roster_cap_enforced_on_recruit", () => {
      let player = initPlayer();
      for (let i = 0; i < 6; i++) {
        player = recruitCompanion(player);
      }
      expect(() => recruitCompanion(player)).toThrow();
    });

    test("test_setActiveCompanion_selects_from_roster", () => {
      let player = recruitCompanion(initPlayer());
      const slimeId = player.roster[0].id;
      player = setActiveCompanion(player, slimeId);
      expect(player.activeCompanionId).toBe(slimeId);
    });

    test("test_setActiveCompanion_rejects_unknown_id", () => {
      const player = initPlayer();
      expect(() => setActiveCompanion(player, "nonexistent")).toThrow();
    });

    test("test_breedSlimes_offspring_stats_derive_from_parent_average", () => {
      const originalRandom = Math.random;
      try {
        // Mock RNG to 0 offset (0.5 results in (0.5 * 5) - 2 = 0)
        Math.random = () => 0.5;

        const parentA: Slime = {
          id: "parentA",
          name: "A",
          vit: 10,
          pwr: 6,
          agi: 4,
          xp: 100,
          generation: 1,
        };
        const parentB: Slime = {
          id: "parentB",
          name: "B",
          vit: 6,
          pwr: 10,
          agi: 4,
          xp: 100,
          generation: 2,
        };

        let player = initPlayer();
        player.roster = [parentA, parentB];

        player = breedSlimes(player, "parentA", "parentB");
        const offspring = player.roster[2];

        // average of (10, 6) = 8, with 0 offset -> 8
        expect(offspring.vit).toBe(8);
        expect(offspring.pwr).toBe(8);
        expect(offspring.agi).toBe(4);
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_breedSlimes_offspring_stats_clamped_to_minimum_1", () => {
      const originalRandom = Math.random;
      try {
        // Mock RNG to lowest offset (-2)
        Math.random = () => 0.0;

        const parentA: Slime = {
          id: "parentA",
          name: "A",
          vit: 1,
          pwr: 1,
          agi: 1,
          xp: 100,
          generation: 1,
        };
        const parentB: Slime = {
          id: "parentB",
          name: "B",
          vit: 1,
          pwr: 1,
          agi: 1,
          xp: 100,
          generation: 1,
        };

        let player = initPlayer();
        player.roster = [parentA, parentB];

        player = breedSlimes(player, "parentA", "parentB");
        const offspring = player.roster[2];

        // average is 1. Offset is -2. 1 - 2 = -1 -> clamped to 1
        expect(offspring.vit).toBe(1);
        expect(offspring.pwr).toBe(1);
        expect(offspring.agi).toBe(1);
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_breedSlimes_offspring_generation_is_max_parent_plus_one", () => {
      const parentA: Slime = {
        id: "parentA",
        name: "A",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 3,
      };
      const parentB: Slime = {
        id: "parentB",
        name: "B",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 5,
      };

      let player = initPlayer();
      player.roster = [parentA, parentB];

      player = breedSlimes(player, "parentA", "parentB");
      const offspring = player.roster[2];
      expect(offspring.generation).toBe(6);
    });

    test("test_breedSlimes_records_parent_ids", () => {
      const parentA: Slime = {
        id: "parentA",
        name: "A",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 1,
      };
      const parentB: Slime = {
        id: "parentB",
        name: "B",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 1,
      };

      let player = initPlayer();
      player.roster = [parentA, parentB];

      player = breedSlimes(player, "parentA", "parentB");
      const offspring = player.roster[2];
      expect(offspring.parentIds).toEqual(["parentA", "parentB"]);
    });

    test("test_breedSlimes_rejects_self_breeding", () => {
      const parentA: Slime = {
        id: "parentA",
        name: "A",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 1,
      };
      let player = initPlayer();
      player.roster = [parentA];
      expect(() => breedSlimes(player, "parentA", "parentA")).toThrow();
    });

    test("test_breedSlimes_rejects_unknown_parent_id", () => {
      const parentA: Slime = {
        id: "parentA",
        name: "A",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 1,
      };
      let player = initPlayer();
      player.roster = [parentA];
      expect(() => breedSlimes(player, "parentA", "unknown")).toThrow();
    });

    test("test_breedSlimes_respects_roster_cap", () => {
      let player = initPlayer();
      for (let i = 0; i < 6; i++) {
        player = recruitCompanion(player);
      }
      expect(() => breedSlimes(player, player.roster[0].id, player.roster[1].id)).toThrow();
    });

    test("test_breedSlimes_adds_offspring_to_roster_not_active", () => {
      let player = recruitCompanion(initPlayer());
      player = recruitCompanion(player);
      const parentAId = player.roster[0].id;
      const parentBId = player.roster[1].id;
      player = setActiveCompanion(player, parentAId);

      expect(player.activeCompanionId).toBe(parentAId);
      player = breedSlimes(player, parentAId, parentBId);
      expect(player.roster.length).toBe(3);
      expect(player.activeCompanionId).toBe(parentAId); // unchanged
    });

    test("test_breedSlimes_does_not_mutate_parents", () => {
      const parentA: Slime = {
        id: "parentA",
        name: "A",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 1,
      };
      const parentB: Slime = {
        id: "parentB",
        name: "B",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 0,
        generation: 1,
      };

      let player = initPlayer();
      player.roster = [parentA, parentB];

      const frozenA = { ...parentA };
      const frozenB = { ...parentB };

      player = breedSlimes(player, "parentA", "parentB");

      expect(parentA).toEqual(frozenA);
      expect(parentB).toEqual(frozenB);
    });

    test("test_wipe_preserves_full_roster", () => {
      const slime: Slime = {
        id: "slime",
        name: "Grunt",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 45,
        generation: 2,
        parentIds: ["parent1", "parent2"],
      };
      const player: PlayerState = {
        ...initPlayer(),
        currentRoomId: "scrap_pit",
        roster: [slime],
      };
      const updated = wipe(player);
      expect(updated.currentRoomId).toBe("home_base");
      expect(updated.roster.length).toBe(1);
      expect(updated.roster[0]).toEqual(slime);
    });

    test("test_wipe_preserves_activeCompanionId", () => {
      const slime: Slime = {
        id: "slime",
        name: "Grunt",
        vit: 8,
        pwr: 6,
        agi: 4,
        xp: 45,
        generation: 0,
      };
      const player: PlayerState = {
        ...initPlayer(),
        currentRoomId: "scrap_pit",
        roster: [slime],
        activeCompanionId: "slime",
      };
      const updated = wipe(player);
      expect(updated.activeCompanionId).toBe("slime");
    });

    test("test_companionCombatant_uses_active_companion_from_roster", () => {
      const slime: Slime = {
        id: "my_active_slime",
        name: "Grunt",
        vit: 8,
        pwr: 12,
        agi: 4,
        xp: 15,
        generation: 0,
      };
      let player = initPlayer();
      player.roster = [slime];
      player.activeCompanionId = "my_active_slime";

      const combatant = companionCombatant(player);
      expect(combatant).toBeDefined();
      expect(combatant?.atk).toBe(12);
      expect(combatant?.proficiencyXp).toBe(15);
    });
  });

  // --- Phase 4 LLM-Sculpted Node Content Tests ---
  describe("Phase 4 — LLM-Sculpted Node Content", () => {
    test("test_validateSculptedContent_accepts_well_formed_response", () => {
      const raw = {
        flavorText: "A strange mechanical drone hums in the corner.",
        difficultyModifier: 2,
        rewardModifier: -1
      };
      const validated = validateSculptedContent(raw);
      expect(validated).not.toBeNull();
      expect(validated?.flavorText).toBe("A strange mechanical drone hums in the corner.");
      expect(validated?.difficultyModifier).toBe(2);
      expect(validated?.rewardModifier).toBe(-1);
      expect(validated?.source).toBe("llm");
    });

    test("test_validateSculptedContent_rejects_missing_flavorText", () => {
      const raw = {
        difficultyModifier: 2,
        rewardModifier: -1
      };
      const validated = validateSculptedContent(raw);
      expect(validated).toBeNull();
    });

    test("test_validateSculptedContent_rejects_nonstring_flavorText", () => {
      const raw = {
        flavorText: 123,
        difficultyModifier: 2,
        rewardModifier: -1
      };
      const validated = validateSculptedContent(raw);
      expect(validated).toBeNull();
    });

    test("test_validateSculptedContent_rejects_difficultyModifier_out_of_bounds", () => {
      const raw = {
        flavorText: "Valid flavor",
        difficultyModifier: 4,
        rewardModifier: -1
      };
      const validated = validateSculptedContent(raw);
      expect(validated).toBeNull();
    });

    test("test_validateSculptedContent_rejects_rewardModifier_out_of_bounds", () => {
      const raw = {
        flavorText: "Valid flavor",
        difficultyModifier: 2,
        rewardModifier: -3
      };
      const validated = validateSculptedContent(raw);
      expect(validated).toBeNull();
    });

    test("test_validateSculptedContent_accepts_boundary_values", () => {
      const rawA = {
        flavorText: "Valid flavor",
        difficultyModifier: -3,
        rewardModifier: -2
      };
      const rawB = {
        flavorText: "Valid flavor",
        difficultyModifier: 3,
        rewardModifier: 2
      };
      expect(validateSculptedContent(rawA)).not.toBeNull();
      expect(validateSculptedContent(rawB)).not.toBeNull();
    });

    test("test_sculptRoomIfNeeded_uses_llm_content_on_success", async () => {
      const player = initPlayer();
      const room = { id: "scrap_pit", name: "Scrap Pit", interactionTypes: ["fight" as const], connections: [] };
      const fakeClient: GeminiClient = {
        generateSculptedContent: async () => ({
          flavorText: "Sculpted successfully!",
          difficultyModifier: -1,
          rewardModifier: 1
        })
      };
      const updated = await sculptRoomIfNeeded(player, room, fakeClient);
      expect(updated.sculptedCache["scrap_pit"]).toBeDefined();
      expect(updated.sculptedCache["scrap_pit"].flavorText).toBe("Sculpted successfully!");
      expect(updated.sculptedCache["scrap_pit"].source).toBe("llm");
    });

    test("test_sculptRoomIfNeeded_falls_back_on_client_throw", async () => {
      const player = initPlayer();
      const room = { id: "scrap_pit", name: "Scrap Pit", interactionTypes: ["fight" as const], connections: [] };
      const fakeClient: GeminiClient = {
        generateSculptedContent: async () => {
          throw new Error("Network offline");
        }
      };
      const updated = await sculptRoomIfNeeded(player, room, fakeClient);
      expect(updated.sculptedCache["scrap_pit"]).toBeDefined();
      expect(updated.sculptedCache["scrap_pit"].source).toBe("fallback");
    });

    test("test_sculptRoomIfNeeded_falls_back_on_invalid_json", async () => {
      const player = initPlayer();
      const room = { id: "scrap_pit", name: "Scrap Pit", interactionTypes: ["fight" as const], connections: [] };
      const fakeClient: GeminiClient = {
        generateSculptedContent: async () => ({
          flavorText: "",
          difficultyModifier: 1,
          rewardModifier: 0
        })
      };
      const updated = await sculptRoomIfNeeded(player, room, fakeClient);
      expect(updated.sculptedCache["scrap_pit"]).toBeDefined();
      expect(updated.sculptedCache["scrap_pit"].source).toBe("fallback");
    });

    test("test_sculptRoomIfNeeded_falls_back_on_out_of_bounds_values", async () => {
      const player = initPlayer();
      const room = { id: "scrap_pit", name: "Scrap Pit", interactionTypes: ["fight" as const], connections: [] };
      const fakeClient: GeminiClient = {
        generateSculptedContent: async () => ({
          flavorText: "Cool flavor",
          difficultyModifier: 10,
          rewardModifier: 0
        })
      };
      const updated = await sculptRoomIfNeeded(player, room, fakeClient);
      expect(updated.sculptedCache["scrap_pit"]).toBeDefined();
      expect(updated.sculptedCache["scrap_pit"].source).toBe("fallback");
    });

    test("test_sculptRoomIfNeeded_caches_and_does_not_recall_client_on_second_visit", async () => {
      let player = initPlayer();
      const room = { id: "scrap_pit", name: "Scrap Pit", interactionTypes: ["fight" as const], connections: [] };
      let callCount = 0;
      const fakeClient: GeminiClient = {
        generateSculptedContent: async () => {
          callCount++;
          return {
            flavorText: "Once",
            difficultyModifier: 1,
            rewardModifier: 1
          };
        }
      };
      player = await sculptRoomIfNeeded(player, room, fakeClient);
      expect(callCount).toBe(1);
      
      player = await sculptRoomIfNeeded(player, room, fakeClient);
      expect(callCount).toBe(1);
    });

    test("test_sculptRoomIfNeeded_never_throws_regardless_of_client_behavior", async () => {
      const player = initPlayer();
      const room = { id: "scrap_pit", name: "Scrap Pit", interactionTypes: ["fight" as const], connections: [] };
      
      let fakeClient: GeminiClient = {
        generateSculptedContent: () => Promise.reject("Rejected value")
      };
      await expect(sculptRoomIfNeeded(player, room, fakeClient)).resolves.toBeDefined();

      fakeClient = {
        generateSculptedContent: async () => undefined
      };
      await expect(sculptRoomIfNeeded(player, room, fakeClient)).resolves.toBeDefined();

      fakeClient = {
        generateSculptedContent: async () => {
          throw "Some raw string error";
        }
      };
      await expect(sculptRoomIfNeeded(player, room, fakeClient)).resolves.toBeDefined();
    });

    test("test_resolveFight_applies_cached_difficultyModifier", () => {
      const originalRandom = Math.random;
      try {
        Math.random = () => 0.0;
        const room = { id: "test", name: "Test Room", difficulty: 5, interactionTypes: ["fight" as const], connections: [] };
        
        const playerWithModifier: PlayerState = {
          ...initPlayer(),
          sculptedCache: {
            test: {
              flavorText: "Easier room",
              difficultyModifier: -3,
              rewardModifier: 0,
              source: "llm"
            }
          }
        };
        const result = resolveFight(playerWithModifier, room);
        expect(result.won).toBe(true);
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_resolveFight_applies_cached_rewardModifier", () => {
      const originalRandom = Math.random;
      try {
        let callIndex = 0;
        Math.random = () => {
          callIndex++;
          if (callIndex === 1) return 0.99;
          return 0.4;
        };
        const room = { id: "test", name: "Test Room", difficulty: 5, interactionTypes: ["fight" as const], connections: [] };
        const player: PlayerState = {
          ...initPlayer(),
          sculptedCache: {
            test: {
              flavorText: "Generous loot",
              difficultyModifier: 0,
              rewardModifier: 2,
              source: "llm"
            }
          }
        };
        const result = resolveFight(player, room);
        expect(result.won).toBe(true);
        expect(result.scrapGained).toBe(7);

        callIndex = 0;
        Math.random = () => {
          callIndex++;
          if (callIndex === 1) return 0.99;
          return 0.0;
        };
        const playerNegative: PlayerState = {
          ...initPlayer(),
          sculptedCache: {
            test: {
              flavorText: "Poisonous room",
              difficultyModifier: 0,
              rewardModifier: -4,
              source: "llm"
            }
          }
        };
        const resultNeg = resolveFight(playerNegative, room);
        expect(resultNeg.won).toBe(true);
        expect(resultNeg.scrapGained).toBe(0);
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_resolveFight_unmodified_when_no_sculpted_cache_present", () => {
      const originalRandom = Math.random;
      try {
        let callIndex = 0;
        Math.random = () => {
          callIndex++;
          if (callIndex === 1) return 0.99;
          return 0.4;
        };
        const room = { id: "test", name: "Test Room", difficulty: 5, interactionTypes: ["fight" as const], connections: [] };
        const player = initPlayer();
        const result = resolveFight(player, room);
        expect(result.won).toBe(true);
        expect(result.scrapGained).toBe(5);
      } finally {
        Math.random = originalRandom;
      }
    });

    test("test_wipe_preserves_sculptedCache", () => {
      const player: PlayerState = {
        ...initPlayer(),
        sculptedCache: {
          some_room: {
            flavorText: "Preserved flavor",
            difficultyModifier: 1,
            rewardModifier: 1,
            source: "llm"
          }
        }
      };
      const updated = wipe(player);
      expect(updated.sculptedCache["some_room"]).toBeDefined();
      expect(updated.sculptedCache["some_room"].flavorText).toBe("Preserved flavor");
    });
  });
});
