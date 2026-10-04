import { initPlayer, wipe } from "./state";
import { move, getRoom } from "./rooms";
import { resolveFight } from "./combat";
import { craft, canCraft } from "./crafting";
import { PlayerState } from "./types";

export function runSamplePlaythrough(): string[] {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  log("--- STARTING SAMPLE PLAYTHROUGH PROTOCOL ---");

  // 1. Initialize Player
  let player = initPlayer();
  log(`[INIT] Player initialized at: ${player.currentRoomId}. Scrap: ${player.scrap}. Tier 2 Unlocked: ${player.tier2Unlocked}`);

  // 2. Move to Scrap Pit (Fight)
  log(`[MOVE] Moving from home_base to scrap_pit`);
  player = move(player, "scrap_pit");
  log(`[STATUS] Position: ${player.currentRoomId}`);

  // 3. Fight until we have enough scrap for a Beat Stick (cost 10)
  const scrapPitRoom = getRoom(player.currentRoomId);
  let fightCount = 0;
  while (player.scrap < 10 && fightCount < 10) {
    fightCount++;
    const result = resolveFight(player, scrapPitRoom);
    player = result.player;
    log(`[COMBAT] Fight #${fightCount} in ${player.currentRoomId}: ${result.won ? "WIN" : "LOSS"}. Scrap Gained: ${result.scrapGained}. New Scrap: ${player.scrap}. Weapon Life: ${player.equipped.weapon?.life ?? "N/A"} (XP: ${player.proficiencyXp.weapon})`);
  }

  // 4. Move to Home Base to craft Beat Stick
  log(`[MOVE] Moving back to home_base to craft`);
  player = move(player, "home_base");
  log(`[STATUS] Position: ${player.currentRoomId}`);

  // Craft Beat Stick
  if (canCraft(player, "beatStick")) {
    player = craft(player, "beatStick");
    const weapon = player.equipped.weapon!;
    log(`[CRAFT] Crafted Beat Stick (Tier ${weapon.tier}). Scrap remaining: ${player.scrap}. Max Life: ${weapon.maxLife}`);
  } else {
    log(`[CRAFT ERROR] Could not craft Beat Stick. Scrap: ${player.scrap}`);
  }

  // 5. Move to Vent Stack (higher difficulty)
  log(`[MOVE] Moving: home_base -> scrap_pit -> vent_stack`);
  player = move(player, "scrap_pit");
  player = move(player, "vent_stack");
  log(`[STATUS] Position: ${player.currentRoomId}`);

  // Fight in Vent Stack
  const ventStackRoom = getRoom(player.currentRoomId);
  const ventResult = resolveFight(player, ventStackRoom);
  player = ventResult.player;
  log(`[COMBAT] Vent Stack fight: ${ventResult.won ? "WIN" : "LOSS"}. Scrap Gained: ${ventResult.scrapGained}. New Scrap: ${player.scrap}. Weapon Life: ${player.equipped.weapon?.life ?? "N/A"}`);

  // 6. Simulate/Force a wipe to show state preservation
  log(`[WIPE CHECK] Experiencing a failure / force wipe to Home Base...`);
  const originalScrap = player.scrap;
  const originalEquipped = { ...player.equipped };
  const originalXp = { ...player.proficiencyXp };
  
  player = wipe(player);
  log(`[WIPE SUCCESS] Position reset to: ${player.currentRoomId}`);
  log(`[WIPE VERIFICATION] Scrap intact: ${player.scrap === originalScrap} (${player.scrap}). Weapon slot intact: ${!!player.equipped.weapon} (Life: ${player.equipped.weapon?.life}). XP intact: ${player.proficiencyXp.weapon === originalXp.weapon} (${player.proficiencyXp.weapon})`);

  // 7. Inject scrap to unlock Tier 2 and craft Tier 2 items
  log(`[DEV SYSTEM] Granting +110 scrap for Tier 2 clearance testing`);
  player.scrap += 110;

  // Verify Tier 2 craft is rejected BEFORE tool is crafted
  const preToolCheck = canCraft(player, "beatStick", 2);
  log(`[TIER 2 GATING] Can craft Tier 2 Beat Stick before Tool owned? ${preToolCheck} (Expected: false)`);

  // Craft Tool
  log(`[CRAFT] Crafting Tier-2 Tool...`);
  player = craft(player, "tool");
  log(`[TIER 2 UNLOCKED] Tool crafted! player.tier2Unlocked = ${player.tier2Unlocked}`);

  // Craft Tier 2 items
  log(`[CRAFT] Crafting Tier 2 Beat Stick...`);
  player = craft(player, "beatStick", 2);
  log(`[CRAFT] Crafted Beat Stick (Tier ${player.equipped.weapon?.tier}). Life: ${player.equipped.weapon?.life}/${player.equipped.weapon?.maxLife}`);

  log(`[CRAFT] Crafting Tier 2 Shield...`);
  player = craft(player, "shield", 2);
  log(`[CRAFT] Crafted Shield (Tier ${player.equipped.shield?.tier}). Life: ${player.equipped.shield?.life}/${player.equipped.shield?.maxLife}`);

  log(`[CRAFT] Crafting Tier 2 Body Armor...`);
  player = craft(player, "bodyArmor", 2);
  log(`[CRAFT] Crafted Body Armor (Tier ${player.equipped.armor?.tier}). Life: ${player.equipped.armor?.life}/${player.equipped.armor?.maxLife}`);

  log(`[VERIFY] Final equipped state of all slots:`);
  log(` - Weapon: ${player.equipped.weapon ? "Tier " + player.equipped.weapon.tier : "Empty"}`);
  log(` - Shield: ${player.equipped.shield ? "Tier " + player.equipped.shield.tier : "Empty"}`);
  log(` - Armor: ${player.equipped.armor ? "Tier " + player.equipped.armor.tier : "Empty"}`);

  log("--- PROTOCOL PLAYTHROUGH COMPLETED SUCCESS ---");
  return logs;
}
