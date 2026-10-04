import { PlayerState, Room } from "./types";

export const ROOMS: Record<string, Room> = {
  home_base: {
    id: "home_base",
    name: "Home Base",
    interactionTypes: ["home", "craft", "rest", "recruit", "breed"],
    connections: ["scrap_pit", "furnace_core"],
  },
  scrap_pit: {
    id: "scrap_pit",
    name: "Scrap Pit",
    interactionTypes: ["fight"],
    connections: ["home_base", "vent_stack"],
    difficulty: 8,
  },
  vent_stack: {
    id: "vent_stack",
    name: "Vent Stack",
    interactionTypes: ["fight"],
    connections: ["scrap_pit", "chemical_leak"],
    difficulty: 12,
  },
  chemical_leak: {
    id: "chemical_leak",
    name: "Chemical Leak",
    interactionTypes: ["fight"],
    connections: ["vent_stack", "furnace_core"],
    difficulty: 15,
  },
  furnace_core: {
    id: "furnace_core",
    name: "Furnace Core",
    interactionTypes: ["fight"],
    connections: ["chemical_leak", "home_base"],
    difficulty: 18,
  },
};

export function getRoom(roomId: string): Room {
  const room = ROOMS[roomId];
  if (!room) {
    throw new Error(`Room with ID "${roomId}" not found.`);
  }
  return room;
}

export function canMoveTo(fromRoomId: string, toRoomId: string): boolean {
  const fromRoom = ROOMS[fromRoomId];
  if (!fromRoom) return false;
  return fromRoom.connections.includes(toRoomId);
}

export function move(player: PlayerState, toRoomId: string): PlayerState {
  if (!canMoveTo(player.currentRoomId, toRoomId)) {
    return player; // returns unchanged state if unconnected
  }
  return {
    ...player,
    currentRoomId: toRoomId,
  };
}
