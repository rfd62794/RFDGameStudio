import { FigureId, ClueCategory, SuspectId, MethodId, MotiveId } from '../engine/types';

export interface RegicideClue {
  id: string;
  name: string;
  category: ClueCategory;
  relatesTo: SuspectId | MethodId | MotiveId;
  inquiryTarget: FigureId;
  clueText: string;
  sourceEvidenceId?: string;
}

export interface EvidenceItem {
  id: string;
  name: string;
  relevantFigureId: FigureId;
  inquiryResolved: string; // The mystery question answered
  blackmailLeverage: string; // The political pressure applied
  flavor: string;
  clueIds?: string[];
}

export const REGICIDE_CLUES: RegicideClue[] = [
  // Clues linked to Chancellor case (signet_proof)
  {
    id: 'clue_chancellor_suspect',
    name: 'Patrician Smuggling Manifest',
    category: 'suspect',
    relatesTo: 'chancellor',
    inquiryTarget: 'chancellor',
    clueText: 'Ledgers link missing gold directly to Lord Hector’s private vaults and House Montfort.',
    sourceEvidenceId: 'signet_proof',
  },
  {
    id: 'clue_forged_seal_method',
    name: 'Counterfeit Chancellor Wax Signet',
    category: 'method',
    relatesTo: 'forged_seal',
    inquiryTarget: 'chancellor',
    clueText: 'The royal treasury seal was duplicated in lead before the banquet to authenticate false shipments.',
    sourceEvidenceId: 'signet_proof',
  },
  {
    id: 'clue_treasury_embezzlement_motive',
    name: 'Defaulted Royal Debt Audit',
    category: 'motive',
    relatesTo: 'treasury_embezzlement',
    inquiryTarget: 'chancellor',
    clueText: 'Millions in missing crown tax revenues were about to be uncovered during King Aldous’s audit.',
    sourceEvidenceId: 'signet_proof',
  },

  // Clues linked to Archbishop case (relic_shard)
  {
    id: 'clue_archbishop_suspect',
    name: 'High Sanctum Secret Register',
    category: 'suspect',
    relatesTo: 'archbishop',
    inquiryTarget: 'archbishop',
    clueText: 'Archbishop Valerius’s personal seal confirms he performed an unrecorded royal christening.',
    sourceEvidenceId: 'relic_shard',
  },
  {
    id: 'clue_secret_sacrament_method',
    name: 'Consecrated Anointing Oils',
    category: 'method',
    relatesTo: 'secret_sacrament',
    inquiryTarget: 'archbishop',
    clueText: 'Secret rites of royal succession were conducted in the cathedral crypts at the hour of demise.',
    sourceEvidenceId: 'relic_shard',
  },
  {
    id: 'clue_bastard_heresy_motive',
    name: 'Papal Bull of Heresy Threat',
    category: 'motive',
    relatesTo: 'bastard_heresy',
    inquiryTarget: 'archbishop',
    clueText: 'Fear of papal trial and loss of Church tithe sovereignty if the secret lineage leaked.',
    sourceEvidenceId: 'relic_shard',
  },

  // Clues linked to Commander case (service_record)
  {
    id: 'clue_commander_suspect',
    name: 'Iron Gate Shift Log',
    category: 'suspect',
    relatesTo: 'commander',
    inquiryTarget: 'commander',
    clueText: 'General Brand’s inner garrison command permitted the poisoner unvetted passage past the gate.',
    sourceEvidenceId: 'service_record',
  },
  {
    id: 'clue_nightshade_chalice_method',
    name: 'Almond-Scented Poison Vial',
    category: 'method',
    relatesTo: 'nightshade_chalice',
    inquiryTarget: 'commander',
    clueText: 'Concentrated nightshade essence was mixed into the King’s coronation goblet by a corrupt sentry.',
    sourceEvidenceId: 'service_record',
  },
  {
    id: 'clue_citadel_coup_motive',
    name: 'Garrison Regency Manifesto',
    category: 'motive',
    relatesTo: 'citadel_coup',
    inquiryTarget: 'commander',
    clueText: 'A conspiracy among legion commanders to demand total military regency and troop amnesty.',
    sourceEvidenceId: 'service_record',
  },
];

export const SCOUTABLE_EVIDENCE: EvidenceItem[] = [
  {
    id: 'signet_proof',
    name: "The Smuggler's Vault Ledger",
    relevantFigureId: 'chancellor',
    inquiryResolved: 'Proves Lord Hector forged the royal seals and siphoned royal tax gold to House Montfort.',
    blackmailLeverage: 'Guarantees Hector must back the new Monarch to conceal high treason and embezzled debt.',
    flavor: 'Wax-sealed columns showing millions in missing gold redirected to patrician coffers prior to the regicide.',
    clueIds: ['clue_chancellor_suspect', 'clue_forged_seal_method', 'clue_treasury_embezzlement_motive'],
  },
  {
    id: 'relic_shard',
    name: "The King's Sealed Absolution",
    relevantFigureId: 'archbishop',
    inquiryResolved: 'Proves King Aldous sought absolution and anointed a true heir under holy rite.',
    blackmailLeverage: 'Protects the High Sanctum from heretical inquest, locking Valerius’s ecclesiastical blessing.',
    flavor: 'Vellum parchment bearing the King’s final confession and the High Primate’s secret baptismal seal.',
    clueIds: ['clue_archbishop_suspect', 'clue_secret_sacrament_method', 'clue_bastard_heresy_motive'],
  },
  {
    id: 'service_record',
    name: 'Iron Gate Poisoner Phial',
    relevantFigureId: 'commander',
    inquiryResolved: 'Identifies the rogue sentry who smuggled nightshade into the chalice, clearing the command chain.',
    blackmailLeverage: 'Exonerates General Brand and the Iron Guard from regicide complicity while delivering the killer.',
    flavor: 'A glass phial smelling of bitter almond, sealed with a disgraced officer’s wax signet.',
    clueIds: ['clue_commander_suspect', 'clue_nightshade_chalice_method', 'clue_citadel_coup_motive'],
  },
];
