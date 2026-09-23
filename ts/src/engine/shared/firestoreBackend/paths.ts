// Shared Firestore Path Builder — generalized from House of Kings Collab
//
// Source: House of Kings Collab (src/lib/paths.ts)
// Generalized: the original paths (kingdom/house/player/task/workers) were
// HoK-specific collection names. This module provides the generic path-builder
// pattern plus the original HoK paths as a concrete example.
//
// Pattern: all Firestore document paths should be constructed via helper
// functions, not string-concatenated inline. This prevents path-injection
// bugs, makes refactoring safe, and provides a single source of truth for
// the document hierarchy.

// --- Generic path builder ---

/**
 * Build a Firestore document path from a list of path segments.
 * Example: docPath('kingdoms', 'kingdom-0', 'houses', 'house-0')
 * → 'kingdoms/kingdom-0/houses/house-0'
 */
export function docPath(...segments: string[]): string {
  return segments.filter(Boolean).join('/');
}

/**
 * Build a Firestore collection path from a parent document path and a
 * collection name.
 */
export function collectionPath(parentDocPath: string, collection: string): string {
  return `${parentDocPath}/${collection}`;
}

/**
 * Build a Firestore document path from a parent collection path and a
 * document ID.
 */
export function documentPath(collectionPath: string, docId: string): string {
  return `${collectionPath}/${docId}`;
}

// --- HoK-specific path helpers (preserved as a concrete example) ---
// These are used by the House of Kings Collab game's server-side routes
// and Cloud Functions. Other projects should define their own path helpers
// following the same pattern.

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
