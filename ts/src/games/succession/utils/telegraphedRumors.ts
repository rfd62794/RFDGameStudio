import { FigureState, FigureId, ClaimantId } from '../engine/types';
import { TickerEntry } from '../types/gameState';
import { chooseRivalMoves } from '../engine/rivalAI';
import { COURT_FIGURES } from '../data/courtFigures';

export interface TelegraphedRivalIntel {
  rivalId: ClaimantId;
  rivalName: string;
  targetFigureId: FigureId;
  targetFigureName: string;
  moveType: 'whisper' | 'slander';
  headline: string;
  flavor: string;
  badgeLabel: string;
  isUrgent: boolean;
}

export function getTelegraphedRivalRumors(
  figures: FigureState[],
  ticker: TickerEntry[]
): TelegraphedRivalIntel[] {
  const rivals: ClaimantId[] = ['aldric', 'vivienne'];
  const plannedMoves = chooseRivalMoves(figures, rivals, ticker);

  return plannedMoves.map(({ rivalId, targetFigureId, moveType }) => {
    const figureMeta = COURT_FIGURES[targetFigureId];
    const rivalName = rivalId === 'aldric' ? 'Lord Aldric' : 'Lady Vivienne';

    if (moveType === 'slander') {
      return {
        rivalId,
        rivalName,
        targetFigureId,
        targetFigureName: figureMeta.name,
        moveType: 'slander',
        headline: `Slander Plot: ${rivalName} targets ${figureMeta.name.split(' ')[1]}`,
        flavor: `${rivalName}'s shadow whisperers are drafting forged correspondence to poison ${figureMeta.name}'s trust and chip away at your decisive lead!`,
        badgeLabel: 'Active Slander Plot',
        isUrgent: true,
      };
    }

    if (rivalId === 'aldric') {
      let flavor = '';
      if (targetFigureId === 'chancellor') {
        flavor = `Aldric's gilded carriage was seen outside the High Estate solar, delivering ancestral heraldry to flatter Chancellor Hector.`;
      } else if (targetFigureId === 'archbishop') {
        flavor = `Aldric was spotted making public devotions at the Cathedral, promising cathedral tithes to Archbishop Valerius.`;
      } else {
        flavor = `Aldric's quartermasters were seen ferrying grain and coin to General Brand's Iron Guard garrison.`;
      }
      return {
        rivalId,
        rivalName,
        targetFigureId,
        targetFigureName: figureMeta.name,
        moveType: 'whisper',
        headline: `Aldric's Overture to ${figureMeta.name.split(' ')[1]}`,
        flavor,
        badgeLabel: 'Courting Domain',
        isUrgent: false,
      };
    } else {
      let flavor = '';
      if (targetFigureId === 'chancellor') {
        flavor = `Vivienne's guild couriers were seen delivering lucrative trade concessions to Chancellor Hector's treasury.`;
      } else if (targetFigureId === 'archbishop') {
        flavor = `Vivienne was observed in deep theological debate, appealing to Archbishop Valerius's reformist faction.`;
      } else {
        flavor = `Vivienne met secretly with General Brand's frontier marshals to offer naval transport contracts.`;
      }
      return {
        rivalId,
        rivalName,
        targetFigureId,
        targetFigureName: figureMeta.name,
        moveType: 'whisper',
        headline: `Vivienne's Maneuver on ${figureMeta.name.split(' ')[1]}`,
        flavor,
        badgeLabel: 'Courting Domain',
        isUrgent: false,
      };
    }
  });
}

export function getRivalThreatForFigure(
  figureId: FigureId,
  figures: FigureState[],
  ticker: TickerEntry[]
): TelegraphedRivalIntel | undefined {
  const allIntel = getTelegraphedRivalRumors(figures, ticker);
  // Prioritize slander if any
  const slanderThreat = allIntel.find(
    (i) => i.targetFigureId === figureId && i.moveType === 'slander'
  );
  if (slanderThreat) return slanderThreat;
  return allIntel.find((i) => i.targetFigureId === figureId);
}
