import { Corporation, MapCell, GameDate, EndingEvent } from './types';
import { PLAYER_CORP_ID } from './campaignConstants';
import { computeRank } from './campaignState';
import { getHouseStats } from './houseStats';
import { checkEnding } from './endingSystem';

// The annual sequence existed twice in App.tsx (advanceDay and
// handleConcludeCombats); it lives here once now.

export const CAMPAIGN_LAST_YEAR = 3;

export function isCampaignOverDate(date: GameDate): boolean {
  return date.year > CAMPAIGN_LAST_YEAR;
}

/** computeRank, then each House's annualBonusUnits on every owned cell, then checkEnding(corps, PLAYER_CORP_ID). Mutates corps and cells in place like the code it replaces; returns the ending or null. */
export function finalizeAnnualReport(corps: Corporation[], cells: MapCell[]): EndingEvent | null {
  computeRank(corps, cells);

  // House stat: annual bonus units (Crystal +1 per owned cell).
  // Applied at Annual Report — a research dividend, bounded and
  // tied to a specific trigger, not a compounding multiplier.
  for (const corp of corps) {
    const stats = getHouseStats(corp.cultureId);
    if (stats.annualBonusUnits > 0) {
      const ownedCells = cells.filter(c => c.ownerId === corp.id);
      for (const cell of ownedCells) {
        cell.units[cell.preferredProduction] += stats.annualBonusUnits;
      }
    }
  }

  return checkEnding(corps, PLAYER_CORP_ID);
}
