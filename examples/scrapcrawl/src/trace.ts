import { initPlayer } from "./state";
import { getRoom } from "./rooms";
import { resolveFight } from "./combat";
import { recruitCompanion, setActiveCompanion } from "./companion";

function runTrace() {
  console.log("=== TRACE 1: SOLO FIGHT VS PARTY FIGHT (SAME ROLL = 2) ===");
  const room = getRoom("scrap_pit"); // difficulty = 8

  const originalRandom = Math.random;
  try {
    // 1. Solo Player
    const playerSolo = initPlayer();
    Math.random = () => 0.05; // 0.05 * 20 = 1 -> Math.floor(1) + 1 = 2 (roll of 2)
    const resultSolo = resolveFight(playerSolo, room);
    Math.random = originalRandom; // Reset so companion recruit gets real RNG or we control it
    console.log("Solo Player Fight Result:");
    console.log(` - Roll: 2`);
    console.log(` - Player Unarmed Contribution: 2 * 0.8 = 1.6`);
    console.log(` - Total Combat Score: 3.6`);
    console.log(` - Room Difficulty: 8`);
    console.log(` - Outcome: ${resultSolo.won ? "WIN" : "LOSS"}`);
    console.log(` - Player Weapon XP: ${resultSolo.player.proficiencyXp.weapon}`);

    console.log("\n-------------------------------------------");

    // 2. Party Player (with Companion "Grunt")
    let playerParty = initPlayer();
    // We want Grunt's base stats, so we mock random offset to 0 during recruitment
    Math.random = () => 0.5; // Math.floor(0.5 * 5) - 2 = 2 - 2 = 0
    playerParty = recruitCompanion(playerParty);
    Math.random = originalRandom; // Reset
    
    const companion = playerParty.roster[0];
    console.log(`Generated Companion PWR: ${companion.pwr}, VIT: ${companion.vit}, AGI: ${companion.agi}`);
    const recruitedId = companion.id;
    playerParty = setActiveCompanion(playerParty, recruitedId);
    
    Math.random = () => 0.05; // Same roll of 2
    const resultParty = resolveFight(playerParty, room);
    console.log("Party Player Fight Result:");
    console.log(` - Roll: 2`);
    console.log(` - Player Unarmed Contribution: 2 * 0.8 = 1.6`);
    console.log(` - Companion Grunt Contribution: ${companion.pwr} * 0.8 = ${companion.pwr * 0.8}`);
    console.log(` - Total Combat Score: ${1.6 + companion.pwr * 0.8} + 2 = ${1.6 + companion.pwr * 0.8 + 2}`);
    console.log(` - Room Difficulty: 8`);
    console.log(` - Outcome: ${resultParty.won ? "WIN" : "LOSS"}`);
    console.log(` - Scrap Gained: ${resultParty.scrapGained}`);
    
    const activeComp = resultParty.player.roster.find(s => s.id === resultParty.player.activeCompanionId);
    console.log(` - Companion Grunt XP: ${activeComp?.xp}`);
    console.log(` - Player Weapon XP: ${resultParty.player.proficiencyXp.weapon}`);
  } finally {
    Math.random = originalRandom;
  }

  console.log("\n=== TRACE 2: FORCED LOSS XP VERIFICATION ===");
  let playerLoss = initPlayer();
  playerLoss = recruitCompanion(playerLoss);
  const recruitedLossId = playerLoss.roster[0].id;
  playerLoss = setActiveCompanion(playerLoss, recruitedLossId);
  
  const startPlayerXp = playerLoss.proficiencyXp.weapon;
  const startComp = playerLoss.roster.find(s => s.id === playerLoss.activeCompanionId);
  const startCompanionXp = startComp?.xp ?? 0;
  
  const hardRoom = { id: "furnace_core", difficulty: 100, connections: [], interactionTypes: ["fight" as const] };
  const lossResult = resolveFight(playerLoss, hardRoom);
  console.log("Forced Loss Result:");
  console.log(` - Won: ${lossResult.won}`);
  console.log(` - Player Weapon XP: Before = ${startPlayerXp}, After = ${lossResult.player.proficiencyXp.weapon}`);
  
  const lossComp = lossResult.player.roster.find(s => s.id === lossResult.player.activeCompanionId);
  console.log(` - Companion XP: Before = ${startCompanionXp}, After = ${lossComp?.xp}`);
}

runTrace();
