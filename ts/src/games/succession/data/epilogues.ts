import { PlayerOriginId, FigureId, ClaimantId } from '../engine/types';
import { VerdictResult } from '../engine/verdict';
import { COURT_FIGURES } from './courtFigures';
import { PLAYER_ORIGINS } from './origins';
import { CLAIMANTS } from './claimants';

export interface CouncilPostMortem {
  figureId: FigureId;
  figureName: string;
  domain: string;
  quote: string;
  reactionType: 'endorsing' | 'opposing' | 'disdain' | 'deadlocked';
}

export interface EpilogueData {
  title: string;
  subtitle: string;
  chapterTitle: string;
  chronicleText: string;
  fateOutcome: 'ascension' | 'usurpation' | 'interregnum';
  originFlavor: string;
  coalitionDescription: string;
  postMortems: CouncilPostMortem[];
}

export function getEpilogue(
  verdict: VerdictResult,
  playerOriginId: PlayerOriginId
): EpilogueData {
  const origin = PLAYER_ORIGINS.find((o) => o.id === playerOriginId) || PLAYER_ORIGINS[0];
  const overallWinner = verdict.overallWinner;
  const isPlayerWinner = overallWinner === 'player';

  // Determine winning figures for player
  const playerWonFigures = (['chancellor', 'archbishop', 'commander'] as FigureId[]).filter(
    (id) => verdict.perFigureWinner[id] === 'player'
  );

  // Helper to generate post-mortems for each of the 3 figures
  const postMortems: CouncilPostMortem[] = (['chancellor', 'archbishop', 'commander'] as FigureId[]).map(
    (figId) => {
      const figMeta = COURT_FIGURES[figId];
      const figWinner = verdict.perFigureWinner[figId];
      const isPlayerEndorsed = figWinner === 'player';

      let quote = '';
      let reactionType: CouncilPostMortem['reactionType'] = 'deadlocked';

      if (isPlayerEndorsed) {
        reactionType = 'endorsing';
        if (figId === 'chancellor') {
          quote = `"The royal treasury and ancestral privileges of the high estates are preserved. Order shall prevail under the new reign."`;
        } else if (figId === 'archbishop') {
          quote = `"The sacred oaths are sanctified upon the high altars. Heaven smiles upon this righteous coronation."`;
        } else {
          quote = `"A sovereign who understands iron discipline and the garrison’s sacrifice will hold the realm against all enemies."`;
        }
      } else if (figWinner === 'aldric') {
        reactionType = 'opposing';
        if (figId === 'chancellor') {
          quote = `"Lord Aldric's ancestral credentials restored noble primacy to the Council. A triumph of aristocratic continuity."`;
        } else if (figId === 'archbishop') {
          quote = `"Lord Aldric committed the crown's tithes to the sacred cathedrals. The holy rites remain supreme."`;
        } else {
          quote = `"Aldric's mercenaries and quartermasters bolstered our frontier ramparts when others offered empty rhetoric."`;
        }
      } else if (figWinner === 'vivienne') {
        reactionType = 'opposing';
        if (figId === 'chancellor') {
          quote = `"Lady Vivienne's guild trade monopolies will pour boundless wealth into the royal vaults. A modern mercantile crown."`;
        } else if (figId === 'archbishop') {
          quote = `"Lady Vivienne championed cathedral reform and moral charity across the lower parishes."`;
        } else {
          quote = `"Vivienne’s maritime fleets and siege engineers gave our legions the naval supremacy we desperately needed."`;
        }
      } else {
        reactionType = 'disdain';
        quote = `"Contradictory promises and shattered oaths have disgraced these sacred halls. No crown can be bestowed with honor today."`;
      }

      return {
        figureId: figId,
        figureName: figMeta.name,
        domain: figMeta.domain,
        quote,
        reactionType,
      };
    }
  );

  // Player Victory Epilogue Resolution
  if (isPlayerWinner) {
    if (verdict.isMajority) {
      // Majority (2 or 3 Councilors)
      let coalitionDescription = '';
      let chapterTitle = '';
      let chronicleText = '';

      if (playerWonFigures.length === 3) {
        coalitionDescription = 'The Grand Triad of the Realm (Unanimous 3-Councilor Mandate)';
        chapterTitle = 'Book I: The Golden Restoration';
        chronicleText = `In an extraordinary feat of political mastery, you unified the Treasury, the Holy Church, and the Iron Garrison in unanimous consent. None dared contest the coronation, and King Aldous’s shadow was banished as a golden era dawned over the realm.`;
      } else if (
        playerWonFigures.includes('chancellor') &&
        playerWonFigures.includes('archbishop')
      ) {
        coalitionDescription = 'The High Sanctum & Estate Coalition (Chancellor + Archbishop)';
        chapterTitle = 'Book I: The Sovereign Concordat';
        chronicleText = `With the blessing of the Holy Church and the seal of the Crown Treasury, you outmaneuvered the frontier marshals. While the garrisons grumbled at reduced military stipends, the realm’s nobility and clergy formed an unshakeable governing pillar.`;
      } else if (
        playerWonFigures.includes('chancellor') &&
        playerWonFigures.includes('commander')
      ) {
        coalitionDescription = 'The Steel & Treasury Pact (Chancellor + Commander)';
        chapterTitle = 'Book I: The Iron Ledger';
        chronicleText = `Securing both the realm's coin and the garrison's broadswords, your ascent was swift and uncompromising. Archbishop Valerius looked on in solemn resignation as tax collectors and heavy battalions established immediate civic dominance.`;
      } else {
        // Archbishop + Commander
        coalitionDescription = 'The Sacred Vanguard Alliance (Archbishop + Commander)';
        chapterTitle = 'Book I: The Holy Crusade';
        chronicleText = `The bells of the grand Cathedral rang in union with the marching drums of the Iron Guard. Chancellor Hector was forced to yield the crown jewels as divine authority and military force coalesced beneath your righteous banner.`;
      }

      let originFlavor = '';
      if (playerOriginId === 'bastard_scion') {
        originFlavor = `The unacknowledged heir who once walked palace back-alleys now sits atop the Gilded Throne. The royal bloodline is reconciled, silencing aristocratic whispers forever.`;
      } else if (playerOriginId === 'disgraced_knight') {
        originFlavor = `Stripped of your honor after the Citadel Siege, you have returned not as a disgraced outcast, but as the supreme Monarch. The veterans weep openly as you claim the ancestral blade.`;
      } else {
        originFlavor = `From the counting houses of the merchant guilds to the supreme seat of sovereign power, your gold and political intellect out-leveraged ancient dynasties.`;
      }

      return {
        title: 'Coronation of the Sovereign',
        subtitle: `Ascension of the ${origin.name}`,
        chapterTitle,
        chronicleText,
        fateOutcome: 'ascension',
        originFlavor,
        coalitionDescription,
        postMortems,
      };
    } else {
      // Deadlock Tiebreak Victory (Cleanest Record / Fewest Contradictions)
      let originFlavor = '';
      if (playerOriginId === 'bastard_scion') {
        originFlavor = `When the high nobility fractured into bitter strife, your undeniable royal poise and absence of exposed perjury forced the Council to legitimize your claim.`;
      } else if (playerOriginId === 'disgraced_knight') {
        originFlavor = `In a court suffocated by deceit and rival fabrications, your unyielding martial integrity broke the deadlock and won the throne.`;
      } else {
        originFlavor = `As rival claimants ruined themselves with blatant contradictions and forged claims, your disciplined restraint allowed you to claim the crown uncontested.`;
      }

      return {
        title: 'Ascension by Compromise',
        subtitle: `Deadlock Tiebreak Victory — Cleanest Record`,
        chapterTitle: 'Book I: The Fragile Mandate',
        chronicleText: `With the Council of Three locked in bitter paralysis and rival claimants disqualified by cross-examination and exposed deceit, your consistency prevailed. You ascend to the throne through supreme diplomatic composure.`,
        fateOutcome: 'ascension',
        originFlavor,
        coalitionDescription: 'The Arbiter’s Compromise (Breakthrough via Lowest Contradiction Exposure)',
        postMortems,
      };
    }
  }

  // Rival Victory (Usurpation)
  if (overallWinner) {
    const winnerClaimant = CLAIMANTS[overallWinner];
    const winnerName = winnerClaimant ? winnerClaimant.name : 'The Rival';
    let chronicleText = '';
    let originFlavor = '';

    if (overallWinner === 'aldric') {
      chronicleText = `Lord Aldric consolidated the realm’s traditionalist lords and marshals, casting your maneuvers aside as unauthorized ambition. Royal heralds proclaim House Aldric as the true masters of the kingdom.`;
    } else {
      chronicleText = `Lady Vivienne marshaled the guild masters, municipal coin, and reformist clerics, rendering your petitions obsolete. A new mercantile dynasty ascends the throne.`;
    }

    if (playerOriginId === 'bastard_scion') {
      originFlavor = `Your bloodline remains unrecognized, relegated once more to palace whispers and the cold shadows of the outer keep.`;
    } else if (playerOriginId === 'disgraced_knight') {
      originFlavor = `Your exile from knightly favor is sealed. With ${winnerName} upon the throne, you must retire your scarred armor once more.`;
    } else {
      originFlavor = `Your commercial assets are heavily levied by the new sovereign's decrees, forcing your banking guild into defensive concession.`;
    }

    return {
      title: `Usurpation of the Throne`,
      subtitle: `${winnerName} Crowned Monarch`,
      chapterTitle: 'Book I: The New Order',
      chronicleText,
      fateOutcome: 'usurpation',
      originFlavor,
      coalitionDescription: `${winnerName} forged the decisive Council alignment.`,
      postMortems,
    };
  }

  // Pure Interregnum (Total Deadlock with 0 Consensus)
  return {
    title: 'The Fractured Realm',
    subtitle: 'Total Impasse & Regent Interregnum',
    chapterTitle: 'Book I: The Shadow Regency',
    chronicleText: `Neither claimant nor rival could secure consensus, and contradictory claims poisoned the Council chamber. The High Council assumes a fractious temporary regency, while the realm teeters on the brink of civil war.`,
    fateOutcome: 'interregnum',
    originFlavor: `As the Council locks the palace gates, your ambitions remain in indefinite suspension.`,
    coalitionDescription: 'Total Council Deadlock — Sovereign Seat Vacant',
    postMortems,
  };
}
