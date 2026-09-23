export type FigureId = 'chancellor' | 'archbishop' | 'commander';
export type ClaimantId = 'player' | 'aldric' | 'vivienne';
export type MoveType = 'whisper' | 'appeal' | 'evidence' | 'scout' | 'slander' | 'indictment' | 'discredit';
export type PlayerOriginId = 'bastard_scion' | 'disgraced_knight' | 'merchant_banker';

export type ClueCategory = 'suspect' | 'method' | 'motive';
export type SuspectId = 'aldric' | 'vivienne' | 'chancellor' | 'archbishop' | 'commander';
export type MethodId = 'nightshade_chalice' | 'forged_seal' | 'secret_sacrament' | 'smuggled_blade' | 'bribed_sentry';
export type MotiveId = 'treasury_embezzlement' | 'bastard_heresy' | 'citadel_coup' | 'merchant_monopoly' | 'noble_restoration';

export interface IndictmentTriad {
  suspect: SuspectId;
  method: MethodId;
  motive: MotiveId;
}

export interface ClaimTheme {
  id: string;
  label: string;
  figureId: FigureId;
  opposesThemeId: string | null; // the theme id it directly contradicts, if any
}

export interface Claim {
  figureId: FigureId;
  themeId: string;
  segment: number;
  claimantId: ClaimantId;
}

export interface RepeatState {
  themeId: string;
  count: number; // number of consecutive claims of themeId by this claimant, including this one
}

export interface FigureState {
  id: FigureId;
  favor: Record<ClaimantId, number>;
  mostRecentClaim: Claim | null; // player-only, see ⚠️ RULE below
  exposedAgainst: ClaimantId[];  // in practice only ever contains 'player'
                                  // under MVP scope, kept generic on purpose
  repeatTracker?: Partial<Record<ClaimantId, RepeatState>>;
  // Per-claimant consecutive-repeat tracking for diminishing returns
  // (ADR-002). Optional so existing FigureState literals across the
  // test suite don't need updating — favor.ts treats a missing tracker
  // as "no claimant has claimed anything yet at this figure."
}
