import { PlayerState, Room, Equipment, Combatant } from "./types";
import { growthFactor } from "./growth";
import { CATALOG } from "./catalog";
import { companionCombatant, awardCompanionXp } from "./companion";

export interface FightResult {
  won: boolean;
  scrapGained: number;
  player: PlayerState;
}

export function resolveFight(player: PlayerState, room: Room): FightResult {
  let difficulty = room.difficulty ?? 0;
  const cached = player.sculptedCache?.[room.id];
  if (cached) {
    difficulty = Math.max(1, difficulty + cached.difficultyModifier);
  }

  const weapon = player.equipped.weapon;
  const hasActiveWeapon = weapon && weapon.life > 0;
  const weaponAtk = hasActiveWeapon
    ? (CATALOG[weapon.catalogId].baseStats[weapon.tier].atk ?? 0)
    : 2; // Unarmed baseline is 2

  const playerCombatant: Combatant = {
    atk: weaponAtk,
    proficiencyXp: player.proficiencyXp.weapon ?? 0,
    label: "player",
  };

  const combatants: Combatant[] = [playerCombatant];
  const compComb = companionCombatant(player);
  if (compComb) {
    combatants.push(compComb);
  }

  let totalAtkContribution = 0;
  for (const c of combatants) {
    totalAtkContribution += c.atk * growthFactor(c.proficiencyXp);
  }

  // Roll D20 (1 to 20)
  const roll = Math.floor(Math.random() * 20) + 1;
  const score = roll + totalAtkContribution;
  const won = score >= difficulty;

  let nextPlayer = { ...player };

  // Deplete weapon life on use
  if (weapon) {
    const updatedWeapon: Equipment = {
      ...weapon,
      life: Math.max(0, weapon.life - 1),
    };
    nextPlayer.equipped = {
      ...nextPlayer.equipped,
      weapon: updatedWeapon,
    };
  }

  let scrapGained = 0;
  if (won) {
    // Random 3 to 8 scrap gained
    const baseScrap = Math.floor(Math.random() * 6) + 3;
    if (cached) {
      scrapGained = Math.max(0, baseScrap + cached.rewardModifier);
    } else {
      scrapGained = baseScrap;
    }
    nextPlayer.scrap += scrapGained;

    // Increment weapon proficiency XP by 15 on victory
    nextPlayer.proficiencyXp = {
      ...nextPlayer.proficiencyXp,
      weapon: (nextPlayer.proficiencyXp.weapon ?? 0) + 15,
    };

    // Increment companion XP if present
    if (nextPlayer.activeCompanionId) {
      nextPlayer.roster = nextPlayer.roster.map(slime => {
        if (slime.id === nextPlayer.activeCompanionId) {
          return awardCompanionXp(slime, won);
        }
        return slime;
      });
    }
  } else {
    // Loss - companion XP unchanged (awardCompanionXp handles it, but let's be explicit)
    if (nextPlayer.activeCompanionId) {
      nextPlayer.roster = nextPlayer.roster.map(slime => {
        if (slime.id === nextPlayer.activeCompanionId) {
          return awardCompanionXp(slime, won);
        }
        return slime;
      });
    }
  }

  return {
    won,
    scrapGained,
    player: nextPlayer,
  };
}
