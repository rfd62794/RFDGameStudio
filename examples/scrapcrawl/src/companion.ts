import { PlayerState, Slime, Combatant } from "./types";

export const STARTER_SLIME: Omit<Slime, "id" | "generation" | "parentIds"> = {
  name: "Grunt",
  vit: 8,
  pwr: 6,
  agi: 4,
  xp: 0,
};

export const ROSTER_CAP = 6;
export const VARIANCE = 2;

export function recruitCompanion(player: PlayerState): PlayerState {
  if (player.roster.length >= ROSTER_CAP) {
    throw new Error(`Recruitment rejected: Roster is full (cap: ${ROSTER_CAP}).`);
  }

  const randomOffset = () => Math.floor(Math.random() * (VARIANCE * 2 + 1)) - VARIANCE;
  const vit = Math.max(1, STARTER_SLIME.vit + randomOffset());
  const pwr = Math.max(1, STARTER_SLIME.pwr + randomOffset());
  const agi = Math.max(1, STARTER_SLIME.agi + randomOffset());

  const newCompanion: Slime = {
    id: `slime_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name: "Grunt",
    vit,
    pwr,
    agi,
    xp: 0,
    generation: 0,
  };

  return {
    ...player,
    roster: [...player.roster, newCompanion],
  };
}

export function setActiveCompanion(player: PlayerState, slimeId: string): PlayerState {
  const exists = player.roster.some(s => s.id === slimeId);
  if (!exists) {
    throw new Error(`Companion selection rejected: Slime with ID "${slimeId}" not found in roster.`);
  }
  return {
    ...player,
    activeCompanionId: slimeId,
  };
}

export function breedSlimes(player: PlayerState, parentAId: string, parentBId: string): PlayerState {
  if (parentAId === parentBId) {
    throw new Error("Breeding rejected: A slime cannot breed with itself.");
  }

  const parentA = player.roster.find(s => s.id === parentAId);
  const parentB = player.roster.find(s => s.id === parentBId);

  if (!parentA || !parentB) {
    throw new Error("Breeding rejected: One or both parent slimes not found in roster.");
  }

  if (player.roster.length >= ROSTER_CAP) {
    throw new Error(`Breeding rejected: Roster is full (cap: ${ROSTER_CAP}).`);
  }

  const randomOffset = () => Math.floor(Math.random() * (VARIANCE * 2 + 1)) - VARIANCE;

  const breedStat = (statA: number, statB: number) => {
    const avg = (statA + statB) / 2;
    const roundedAvg = Math.round(avg);
    const offset = randomOffset();
    return Math.max(1, roundedAvg + offset);
  };

  const vit = breedStat(parentA.vit, parentB.vit);
  const pwr = breedStat(parentA.pwr, parentB.pwr);
  const agi = breedStat(parentA.agi, parentB.agi);

  const maxGen = Math.max(parentA.generation, parentB.generation);
  const offspringGen = maxGen + 1;

  const offspring: Slime = {
    id: `slime_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name: "Junior",
    vit,
    pwr,
    agi,
    xp: 0,
    generation: offspringGen,
    parentIds: [parentAId, parentBId],
  };

  return {
    ...player,
    roster: [...player.roster, offspring],
  };
}

export function companionCombatant(player: PlayerState): Combatant | null {
  if (!player.activeCompanionId) return null;
  const companion = player.roster.find(s => s.id === player.activeCompanionId);
  if (!companion) return null;
  return {
    atk: companion.pwr,
    proficiencyXp: companion.xp,
    label: "companion",
  };
}

export function awardCompanionXp(companion: Slime, won: boolean): Slime {
  if (!won) return companion;
  return {
    ...companion,
    xp: companion.xp + 15,
  };
}
