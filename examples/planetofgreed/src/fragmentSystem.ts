import { Corporation } from './types';

// Phase 3: AI Fragment tracking with elimination-transfer.
//
// Every House starts holding exactly one Fragment -- its own cultureId.
// When a House is eliminated (reduced to 0 cells), ALL Fragments it
// currently holds (its own plus any it had already inherited from Houses
// IT eliminated) transfer entirely to whichever House caused the
// elimination. A House that eliminates a House that had already absorbed
// two others inherits all three at once (chain transfer).
//
// "Eliminated" = reduced to 0 cells. "Eliminating House" = whichever
// House's combat action brought the cell count to 0. Attribution is done
// in App.tsx's handleConcludeCombats (the single place combats are
// resolved); this module is the pure transfer logic, called once per
// (eliminated, eliminator) pair.

// Initialize each House's fragments to [ownCultureId]. Mutates the corps
// array in place, matching App.tsx's existing convention for per-corp
// updates. Called once at game start (initializeNewGame).
export function initializeFragments(corps: Corporation[]): void {
  for (const corp of corps) {
    corp.fragments = [corp.cultureId];
  }
}

// Transfer ALL of eliminatedHouse's fragments to eliminatingHouse, then
// clear the eliminated House's fragments array (not left dangling).
// Mutates both corp objects in place. Idempotent on the eliminated side:
// calling again with the same eliminated House transfers nothing (its
// fragments are already empty).
export function onHouseEliminated(
  eliminatedHouse: Corporation,
  eliminatingHouse: Corporation,
): void {
  eliminatingHouse.fragments = eliminatingHouse.fragments.concat(eliminatedHouse.fragments);
  eliminatedHouse.fragments = [];
}
