export const kingdomPath = (kingdomId: string) => `kingdoms/${kingdomId}`;
export const housePath = (kingdomId: string, houseId: string) =>
  `${kingdomPath(kingdomId)}/houses/${houseId}`;
export const playersCollectionPath = (kingdomId: string, houseId: string) =>
  `${housePath(kingdomId, houseId)}/players`;
export const playerPath = (kingdomId: string, houseId: string, userId: string) =>
  `${playersCollectionPath(kingdomId, houseId)}/${userId}`;
export const taskPath = (kingdomId: string, houseId: string, userId: string) =>
  `${playerPath(kingdomId, houseId, userId)}/task/current`;
export const workersCollectionPath = (kingdomId: string, houseId: string, userId: string) =>
  `${playerPath(kingdomId, houseId, userId)}/workers`;
