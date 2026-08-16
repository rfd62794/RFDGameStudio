import {
  FigureId,
  IndictmentTriad,
  SuspectId,
  MethodId,
  MotiveId,
} from './types';
import { EvidenceItem, REGICIDE_CLUES, RegicideClue } from '../data/evidence';

export interface SuspectMeta {
  id: SuspectId;
  name: string;
  title: string;
  description: string;
}

export interface MethodMeta {
  id: MethodId;
  label: string;
  description: string;
}

export interface MotiveMeta {
  id: MotiveId;
  label: string;
  description: string;
}

export const SUSPECTS: SuspectMeta[] = [
  {
    id: 'chancellor',
    name: 'Lord Hector Vane',
    title: 'The High Chancellor',
    description: 'Master of the Royal Treasury and head of House Montfort.',
  },
  {
    id: 'archbishop',
    name: 'Archbishop Valerius',
    title: 'Primate of the High Sanctum',
    description: 'Custodian of royal confessions, sacred sacraments, and ecclesiastical tithes.',
  },
  {
    id: 'commander',
    name: 'General Brand',
    title: 'Commander of the Iron Guard',
    description: 'Supreme marshal of the citadel garrison and palace perimeter security.',
  },
  {
    id: 'aldric',
    name: 'Lord Aldric',
    title: 'The Royal Nephew',
    description: 'Highborn claimant backed by foreign mercenaries and patrician peers.',
  },
  {
    id: 'vivienne',
    name: 'Lady Vivienne',
    title: 'The Steel Duchess',
    description: 'Ruthless provincial warlord controlling border trade and armories.',
  },
];

export const METHODS: MethodMeta[] = [
  {
    id: 'forged_seal',
    label: 'Counterfeit Royal Seal',
    description: 'Wax signets forged to falsify shipments, bullion transfers, and sovereign edicts.',
  },
  {
    id: 'secret_sacrament',
    label: 'Unsanctioned Crypt Sacrament',
    description: 'Covert midnight baptism and coronation rites conducted beneath cathedral altars.',
  },
  {
    id: 'nightshade_chalice',
    label: 'Nightshade-Laced Goblet',
    description: 'Deadly almond-scented belladonna extract poured into the King’s banquet cup.',
  },
  {
    id: 'smuggled_blade',
    label: 'Smuggled Stiletto Dagger',
    description: 'Concealed patrician blade brought past ceremonial guards inside a diplomatic chest.',
  },
  {
    id: 'bribed_sentry',
    label: 'Suborned Gate Sentry',
    description: 'Bribed garrison guard leaving the north sally port unbolted during the feast.',
  },
];

export const MOTIVES: MotiveMeta[] = [
  {
    id: 'treasury_embezzlement',
    label: 'Treasury Embezzlement Cover-Up',
    description: 'Concealing millions in missing crown bullion drained into private patrician estates.',
  },
  {
    id: 'bastard_heresy',
    label: 'Heresy & Tithe Protection',
    description: 'Averting papal interdict and church property seizure over an unholy royal lineage.',
  },
  {
    id: 'citadel_coup',
    label: 'Military Regency & Garrison Coup',
    description: 'Imposing martial martial law and sweeping indemnities for mercenary forces.',
  },
  {
    id: 'merchant_monopoly',
    label: 'Merchant Guild Monopoly',
    description: 'Seizing sovereign trade charters and sovereign tax-free port concessions.',
  },
  {
    id: 'noble_restoration',
    label: 'Ancient Noble Primacy',
    description: 'Restoring absolute feudal prerogatives and dismantling royal administrative reform.',
  },
];

/**
 * The canonical mystery solution associated with each Council member's secret inquiry.
 */
export const COUNCIL_CASE_SOLUTIONS: Record<FigureId, IndictmentTriad> = {
  chancellor: {
    suspect: 'chancellor',
    method: 'forged_seal',
    motive: 'treasury_embezzlement',
  },
  archbishop: {
    suspect: 'archbishop',
    method: 'secret_sacrament',
    motive: 'bastard_heresy',
  },
  commander: {
    suspect: 'commander',
    method: 'nightshade_chalice',
    motive: 'citadel_coup',
  },
};

export interface IndictmentValidationResult {
  isCorrect: boolean;
  explanation: string;
  title: string;
  details: {
    suspectMatch: boolean;
    methodMatch: boolean;
    motiveMatch: boolean;
  };
}

/**
 * Pure evaluation function validating an indictment triad against the Councilor's case.
 */
export function validateIndictmentForFigure(
  figureId: FigureId,
  triad: IndictmentTriad
): IndictmentValidationResult {
  const targetSolution = COUNCIL_CASE_SOLUTIONS[figureId];
  if (!targetSolution) {
    return {
      isCorrect: false,
      title: 'Unknown Councilor',
      explanation: 'The Council has no record of this trial docket.',
      details: {
        suspectMatch: false,
        methodMatch: false,
        motiveMatch: false,
      },
    };
  }

  const isSuspectMatch = triad.suspect === targetSolution.suspect;
  const isMethodMatch = triad.method === targetSolution.method;
  const isMotiveMatch = triad.motive === targetSolution.motive;

  if (isSuspectMatch && isMethodMatch && isMotiveMatch) {
    if (figureId === 'chancellor') {
      return {
        isCorrect: true,
        title: 'High Treason & Embezzlement Proven',
        explanation:
          'Your indictment proves Lord Hector forged the royal seals to siphon crown treasury gold. Trapped by irrefutable proof, Hector is forced to pledge his full backing to bury the scandal!',
        details: {
          suspectMatch: true,
          methodMatch: true,
          motiveMatch: true,
        },
      };
    }
    if (figureId === 'archbishop') {
      return {
        isCorrect: true,
        title: 'Secret Sacramental Lineage Validated',
        explanation:
          'Your indictment exposes the clandestine crypt baptism and anointing rites. Archbishop Valerius concedes divine sovereignty and anoints your claim with holy oil!',
        details: {
          suspectMatch: true,
          methodMatch: true,
          motiveMatch: true,
        },
      };
    }
    return {
      isCorrect: true,
      title: 'Regicide Conspiracy & Gate Breach Exposed',
      explanation:
        'Your indictment uncovers the nightshade chalice plot and rogue garrison sentry. General Brand salutes your investigative grit and commits the Iron Guard vanguard to your cause!',
      details: {
        suspectMatch: true,
        methodMatch: true,
        motiveMatch: true,
      },
    };
  }

  // Generate detailed reason for flawed indictment
  const flawedAspects: string[] = [];
  if (!isSuspectMatch) flawedAspects.push('the conspirator suspect');
  if (!isMethodMatch) flawedAspects.push('the exact method of treason');
  if (!isMotiveMatch) flawedAspects.push('the underlying motive');

  return {
    isCorrect: false,
    title: 'Malicious Fabrication & Perjury',
    explanation: `Your indictment fell apart under cross-examination regarding ${flawedAspects.join(
      ' and '
    )}. The Council rejects your fabricated charges as malicious perjury!`,
    details: {
      suspectMatch: isSuspectMatch,
      methodMatch: isMethodMatch,
      motiveMatch: isMotiveMatch,
    },
  };
}

/**
 * Extracts discovered clues matching held evidence.
 */
export function getDiscoveredCluesFromEvidence(playerEvidence: EvidenceItem[]): RegicideClue[] {
  const heldEvidenceIds = new Set(playerEvidence.map((e) => e.id));
  return REGICIDE_CLUES.filter((clue) => clue.sourceEvidenceId && heldEvidenceIds.has(clue.sourceEvidenceId));
}

/**
 * Returns the set of discovered suspect, method, and motive IDs from held evidence.
 */
export function getDiscoveredTriadOptions(playerEvidence: EvidenceItem[]): {
  suspects: Set<SuspectId>;
  methods: Set<MethodId>;
  motives: Set<MotiveId>;
} {
  const clues = getDiscoveredCluesFromEvidence(playerEvidence);
  const suspects = new Set<SuspectId>();
  const methods = new Set<MethodId>();
  const motives = new Set<MotiveId>();

  clues.forEach((c) => {
    if (c.category === 'suspect') suspects.add(c.relatesTo as SuspectId);
    if (c.category === 'method') methods.add(c.relatesTo as MethodId);
    if (c.category === 'motive') motives.add(c.relatesTo as MotiveId);
  });

  return { suspects, methods, motives };
}
