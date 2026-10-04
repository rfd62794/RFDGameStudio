import { PlayerState } from "./types";

export function initPlayer(): PlayerState {
  return {
    currentRoomId: "home_base",
    scrap: 0,
    tier2Unlocked: false,
    equipped: {},
    proficiencyXp: {
      weapon: 0,
      shield: 0,
      armor: 0,
    },
    roster: [],
    activeCompanionId: undefined,
    sculptedCache: {},
  };
}

export function wipe(player: PlayerState): PlayerState {
  return {
    ...player,
    currentRoomId: "home_base",
  };
}
