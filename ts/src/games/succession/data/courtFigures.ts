import { FigureId, PersuasionMethod } from '../engine/types';

export interface CourtFigureData {
  id: FigureId;
  name: string;
  title: string;
  domain: string;
  description: string;
  avatarIcon: string;
  agenda: string; // Private vulnerability & background agenda
  demand: string; // Required Throne guarantee
  mysteryInquiry: string; // Key mystery question the councilor seeks answered
  lockedMethod: PersuasionMethod; // The persuasion method this councilor values most (ADR-007)
  methodAffinity: string; // Why this councilor values that approach — flavor for the dossier
}

export const COURT_FIGURES: Record<FigureId, CourtFigureData> = {
  chancellor: {
    id: 'chancellor',
    name: 'Lord Hector Vane',
    title: 'High Chancellor of Oakhaven',
    domain: 'Noble High Estates',
    description: 'Keeper of the King’s Seal and Arbiter of the High Estates. Secretly siphoned royal gold to House Montfort and now seeks absolute immunity.',
    avatarIcon: 'Crown',
    agenda: 'Embezzled Crown Debt — Siphoned millions in tax gold to House Montfort to fund illicit loans.',
    demand: 'Sovereign Debt Forgiveness & Exclusive Maritime Trade Monopoly',
    mysteryInquiry: 'Who forged the royal treasury seals prior to the banquet to conceal the missing gold?',
    lockedMethod: 'evidence',
    methodAffinity: 'A man of ledgers and seals — Hector is moved by irrefutable documentary proof, not flattery or pleading.',
  },
  archbishop: {
    id: 'archbishop',
    name: 'Archbishop Valerius',
    title: 'Primate of the High Sanctum',
    domain: 'The Sacred Order',
    description: 'Voice of the Sacred Order. Administered secret deathbed rites to an unacknowledged heir and fears charges of heresy.',
    avatarIcon: 'Sparkles',
    agenda: 'The Bastard Sacrament — Secretly performed holy baptism for the King’s unacknowledged child.',
    demand: 'Ecclesiastical Immunity & Tithe Sovereignty across all parish lands',
    mysteryInquiry: 'Did King Aldous IV die in heretical sin or under holy absolution by the Sacred Order?',
    lockedMethod: 'whisper',
    methodAffinity: 'A keeper of confessions and secret rites — Valerius responds to truths spoken privately, in the confessional register he knows best.',
  },
  commander: {
    id: 'commander',
    name: 'General Brand',
    title: 'Warden of the Iron Gate',
    domain: 'Fortress Garrison & Iron Guard',
    description: 'Commander of the Fortress Legion. A bribed gate sentry permitted the nightshade poisoner entry, leaving the garrison vulnerable to treason trials.',
    avatarIcon: 'Shield',
    agenda: 'Breached Iron Gate — A corrupt garrison officer accepted a bribe to admit the banquet poisoner.',
    demand: 'Full Military Regency & Unconditional Troop Amnesty from treason trials',
    mysteryInquiry: 'How was the nightshade poison smuggled past the fortress sentries into the royal chalice?',
    lockedMethod: 'appeal',
    methodAffinity: 'A soldier who distrusts whispers and parchment alike — Brand respects an open, honorable appeal made plainly before the Council.',
  },
};
