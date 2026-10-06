import { Corporation, MapCell, CultureId, GameDate, GameState } from './types';
import { CULTURE_WHEEL, CULTURE_DEFINITIONS, PLAYER_CORP_ID } from './campaignConstants';
import { EngineContext } from './rng';
import { generateVoronoiMap } from './utils/mapGenerator';
import { initializeFragments } from './fragmentSystem';
import { getHouseStats } from './houseStats';

// Builds all six corporations, in wheel order, with identical starting
// treasury/garrison/combat strength -- only the player's chosen culture
// differs in which slot gets PLAYER_CORP_ID vs an `ai-{cultureId}` id.
export function buildInitialCorporations(playerCultureId: CultureId): Corporation[] {
  return CULTURE_WHEEL.map((cultureId) => {
    const def = CULTURE_DEFINITIONS[cultureId];
    const isPlayer = cultureId === playerCultureId;
    return {
      id: isPlayer ? PLAYER_CORP_ID : `ai-${cultureId}`,
      name: def.corpName,
      color: def.color,
      borderColor: def.borderColor,
      bgClass: def.bgClass,
      textClass: def.textClass,
      isPlayer,
      cultureId,
      treasury: 200000,
      scoutedCells: {},
      rank: 1, // placeholder -- computeRank() sets this for real right after map generation
      fragments: [] // placeholder -- initializeFragments() sets this to [cultureId] right after
    };
  });
}

// Rank = Territory + Population Balance standing, computed fresh from real
// state -- not incrementally maintained. Mutates corp.rank in place on the
// corps array passed in, matching this file's existing convention for
// per-corp updates (e.g. generateAIWeeklyOrders' direct `corp.treasury -=`,
// `corp.scoutedCells[...] =`). Called only at real, distinct trigger points
// (Annual Report; post-combat displacement check) -- never continuously.
export function computeRank(corps: Corporation[], cells: MapCell[]): void {
  const scores = corps.map(corp => {
    const ownedCells = cells.filter(c => c.ownerId === corp.id);
    const territory = ownedCells.length;
    const avgPublicOpinion = ownedCells.length > 0
      ? ownedCells.reduce((sum, c) => sum + (c.publicOpinion ?? 50), 0) / ownedCells.length
      : 50;
    // Placeholder weighting, tunable -- territory and standing both matter,
    // neither dominates by construction alone.
    return { corp, score: territory * 10 + avgPublicOpinion };
  });
  scores.sort((a, b) => b.score - a.score);
  scores.forEach((s, i) => { s.corp.rank = i + 1; });
}

// The pure part of App.tsx's old initializeNewGame: everything that builds
// the initial GameState, with the map's jitter driven by ctx.rng so a
// campaign is replayable from a seed. No React, no side effects.
export function createInitialCampaign(playerCultureId: CultureId, ctx: EngineContext): GameState {
  const freshCorps = buildInitialCorporations(playerCultureId);
  const freshCells = generateVoronoiMap(600, 600, 36, freshCorps, ctx.rng);

  // Phase 3: each House starts holding exactly one Fragment -- its own
  // cultureId. Pure initialization, before any game state exists.
  initializeFragments(freshCorps);

  // Normalize Population Balance to a real, concrete value on every cell.
  // Base opinion is per-House (Marsh 60, Crystal 45, default 50) — derived
  // from narrative. Each cell is owned by a specific corp at init (capitals),
  // so we use the owner's culture stats. Unowned cells get the default 50.
  freshCells.forEach(cell => {
    if (cell.ownerId) {
      const owner = freshCorps.find(c => c.id === cell.ownerId);
      cell.publicOpinion = owner ? getHouseStats(owner.cultureId).baseOpinion : 50;
    } else {
      cell.publicOpinion = 50;
    }
  });

  // Initial scouted cells for corporations:
  // Mark capital cell and all immediate neighbors of capitals as scouted.
  for (const corp of freshCorps) {
    corp.scoutedCells = {};
    const capitalCell = freshCells.find(c => c.ownerId === corp.id);
    if (capitalCell) {
      corp.scoutedCells[capitalCell.id] = true;
      for (const neighId of capitalCell.neighbors) {
        corp.scoutedCells[neighId] = true;
      }
    }
  }

  // Real initial Rank, not a placeholder left dangling until the first
  // Annual Report.
  computeRank(freshCorps, freshCells);

  const initialDate: GameDate = { year: 1, month: 1, week: 1, day: 1 };

  const playerCorpName = freshCorps.find(c => c.id === PLAYER_CORP_ID)?.name ?? 'Player Corporation';
  const initialLog = {
    date: initialDate,
    message: `${playerCorpName} Pod landing confirmed. Grid operations initialized. Welcome to Sector Boardroom.`,
    type: 'success' as const
  };

  return {
    date: initialDate,
    cells: freshCells,
    corporations: freshCorps,
    transits: [],
    playerOrders: {},
    isSimulating: false,
    simulationSpeed: 1,
    currentActiveEvent: null,
    eventHistory: [],
    combatHistory: [],
    activeCombatsToResolve: [],
    currentCombatInView: null,
    campaignOver: false,
    endingEvent: null,
    logs: [initialLog]
  };
}
