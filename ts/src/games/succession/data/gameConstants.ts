// All values are placeholders — mechanism correctness matters this phase,
// not tuning. Flag every one as unverified, same convention as
// DECAY_RATE_PER_HOUR and CHARLATAN_THRESHOLD in v0.1.
export const TOTAL_SEGMENTS = 8;
export const WHISPER_FAVOR_GAIN = 20;        // unverified
export const APPEAL_FAVOR_GAIN = 8;          // unverified — deliberately smaller and safer
export const KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN = 10; // +25% favor gain (+10 instead of +8) for Disgraced Iron Knight on Commander — reduced from +50%/12 (ADR-004): with the archbishop friction alone, knight still had 0 losses across all 6 strategies
export const KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN = 4; // -50% favor gain (-4 instead of +8) for Disgraced Iron Knight on Archbishop — recurring friction (ADR-004), matching the compounding shape of the Commander bonus instead of the one-time appeal-gate alone
export const EVIDENCE_FAVOR_GAIN = 30;       // unverified — largest, guaranteed, costs a prior Scout turn
export const INDICTMENT_FAVOR_GAIN = 40;     // decisive resolution of mystery inquiry via triangulated triad
export const RIVAL_WHISPER_FAVOR_GAIN = 15;  // unverified — rivals always Whisper, never Appeal; see ⚠️ RULE below
export const MERCHANT_RIVAL_FIRST_WHISPER_BONUS = 5; // rivals gain +5 on their first whisper move against Merchant Banker
export const RIVAL_SLANDER_PENALTY = 10;     // fixed favor subtracted from player on rival slander
export const MERCHANT_SLANDER_PENALTY = 5;   // halved slander penalty for Merchant Banker (-5 instead of -10)
export const SLANDER_LEAD_THRESHOLD = 16;   // lead margin required for rivals to deploy slander (Decisive Favor)
export const DOMAIN_RIPPLE_PENALTY = 4;       // Zero-sum domain ripple friction on opposing councilor
export const BASTARD_CHANCELLOR_STARTING_FAVOR = -2; // Starting favor penalty for Bastard Scion on Chancellor — reduced from -5 (ADR-004 Change C): testing whether softening the one-time-but-permanent-feeling friction alone closes the gap before touching the one-time advantage's shape

export interface DomainRippleConflict {
  targetFigureId: 'chancellor' | 'archbishop' | 'commander';
  penalty: number;
  reason: string;
}

export const DOMAIN_RIPPLE_CONFLICTS: Record<'chancellor' | 'archbishop' | 'commander', DomainRippleConflict> = {
  chancellor: {
    targetFigureId: 'commander',
    penalty: 4,
    reason: "Elevating aristocratic privilege breeds resentment in General Brand's garrison.",
  },
  commander: {
    targetFigureId: 'archbishop',
    penalty: 4,
    reason: "Parading military force alarms Archbishop Valerius's sacred clergy.",
  },
  archbishop: {
    targetFigureId: 'chancellor',
    penalty: 4,
    reason: "Pledging clerical tithes threatens Chancellor Hector's crown treasury balances.",
  },
};

