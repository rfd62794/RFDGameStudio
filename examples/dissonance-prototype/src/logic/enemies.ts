import { SecondaryType } from '../types';

export interface EnemyDef {
  id: string;
  name: string;
  tier: 'basic' | 'advanced' | 'elite' | 'master';
  hp: number;
  signature: string; // one-line mechanical hook, for intent-telegraph text
  secondaryType?: SecondaryType;
  vulnerable?: SecondaryType;
  resistant?: SecondaryType;
  behaviorPattern?: string;
  dmgPerTurn?: number;
}

export interface BehaviorType {
  id: string;
  name: string;
  description: string;
}

export const BEHAVIOR_TYPES: BehaviorType[] = [
  { id: 'mirror', name: 'The Mirror', description: "Reflects the player's last-played Action back at them." },
  { id: 'escalator', name: 'The Escalator', description: "Damage/effect grows measurably every N turns — direct generalization of Molten Ashling's existing Escalating mechanic." },
  { id: 'weaver', name: 'The Weaver', description: "Its own Vulnerable/Resistant Secondary Type shifts during the fight." },
  { id: 'saboteur', name: 'The Saboteur', description: "Disables a specific, visible hand slot for one turn. NO Essence-drain variant — explicitly rejected." },
  { id: 'parasite', name: 'The Parasite', description: "Applies a debuff that worsens each turn left unanswered." },
  { id: 'coin', name: 'The Coin', description: "Telegraphs two possible next moves at once, resolves to one at random." },
  { id: 'countdown', name: 'The Countdown', description: "Telegraphs one devastating attack a fixed, visible number of turns in advance." },
  { id: 'tally', name: 'The Tally', description: "Counts repeated same-Action plays from the player; crosses a threshold, triggers a punishing response." },
];

export interface EnemyInstance extends EnemyDef {
  behaviorTypeIds?: [string] | [string, string];
  band?: 'advanced' | 'elite' | 'master';
}

export const BAND_STATS: Record<'advanced'|'elite'|'master', { hp: number; dmgPerTurn: number }> = {
  advanced: { hp: 20, dmgPerTurn: 3.5 }, // matches existing tier average
  elite:    { hp: 32, dmgPerTurn: 4 },
  master:   { hp: 55, dmgPerTurn: 3.5 }, // + existing phase spikes apply on top
};

export function generateBehaviorRoster(): EnemyInstance[] {
  const roster: EnemyInstance[] = [];

  // 1. Single Advanced Band (8 entries: 1 for each Behavior Type)
  const singleAdvanced: Array<{ id: string; name: string; typeId: string; sec: SecondaryType; vuln: SecondaryType; res: SecondaryType }> = [
    { id: 'mirror_adv', name: 'Mirror Sentinel', typeId: 'mirror', sec: 'burst', vuln: 'hybrid', res: 'volatile' },
    { id: 'escalator_adv', name: 'Escalator Ashling', typeId: 'escalator', sec: 'hybrid', vuln: 'burst', res: 'volatile' },
    { id: 'weaver_adv', name: 'Weaver Phantom', typeId: 'weaver', sec: 'volatile', vuln: 'burst', res: 'hybrid' },
    { id: 'saboteur_adv', name: 'Saboteur Fiend', typeId: 'saboteur', sec: 'burst', vuln: 'hybrid', res: 'volatile' },
    { id: 'parasite_adv', name: 'Parasite Spore', typeId: 'parasite', sec: 'hybrid', vuln: 'burst', res: 'volatile' },
    { id: 'coin_adv', name: 'Coin Gambler', typeId: 'coin', sec: 'volatile', vuln: 'burst', res: 'hybrid' },
    { id: 'countdown_adv', name: 'Countdown Charger', typeId: 'countdown', sec: 'burst', vuln: 'hybrid', res: 'volatile' },
    { id: 'tally_adv', name: 'Tally Counter', typeId: 'tally', sec: 'hybrid', vuln: 'burst', res: 'volatile' },
  ];

  for (const item of singleAdvanced) {
    const beh = BEHAVIOR_TYPES.find(b => b.id === item.typeId);
    roster.push({
      id: item.id,
      name: `${item.name} (Advanced)`,
      tier: 'advanced',
      band: 'advanced',
      hp: BAND_STATS.advanced.hp,
      dmgPerTurn: BAND_STATS.advanced.dmgPerTurn,
      secondaryType: item.sec,
      vulnerable: item.vuln,
      resistant: item.res,
      behaviorTypeIds: [item.typeId],
      signature: `[Single: ${beh?.name}] ${beh?.description} Vulnerable to ${item.vuln?.toUpperCase()}, Resistant to ${item.res?.toUpperCase()}.`
    });
  }

  // 2. Blended Elite Band (10 entries: high-tension pairs)
  const blendedElite: Array<{ id: string; name: string; types: [string, string]; sec: SecondaryType; vuln: SecondaryType; res: SecondaryType; rationale: string }> = [
    { id: 'elite_countdown_parasite', name: 'Ticking Void', types: ['countdown', 'parasite'], sec: 'burst', vuln: 'hybrid', res: 'volatile', rationale: 'Race the timer while a debuff snowballs' },
    { id: 'elite_escalator_weaver', name: 'Flux Shifter', types: ['escalator', 'weaver'], sec: 'hybrid', vuln: 'burst', res: 'volatile', rationale: 'Scaling damage combined with shifting type resistances' },
    { id: 'elite_tally_saboteur', name: 'Lattice Lock', types: ['tally', 'saboteur'], sec: 'burst', vuln: 'hybrid', res: 'volatile', rationale: 'Punishes repeated plays while restricting hand slots' },
    { id: 'elite_mirror_coin', name: 'Prism Gambler', types: ['mirror', 'coin'], sec: 'volatile', vuln: 'burst', res: 'hybrid', rationale: 'Reflects plays while presenting dual unpredictable choices' },
    { id: 'elite_parasite_weaver', name: 'Miasma Weaver', types: ['parasite', 'weaver'], sec: 'hybrid', vuln: 'burst', res: 'volatile', rationale: 'Escalating rot with cycling defense stances' },
    { id: 'elite_countdown_weaver', name: 'Chronos Ward', types: ['countdown', 'weaver'], sec: 'burst', vuln: 'hybrid', res: 'volatile', rationale: 'Massive countdown spike paired with shifting weaknesses' },
    { id: 'elite_tally_escalator', name: 'Resonance Overload', types: ['tally', 'escalator'], sec: 'volatile', vuln: 'burst', res: 'hybrid', rationale: 'Scaling threat that punishes repetitive card combinations' },
    { id: 'elite_saboteur_mirror', name: 'Echo Binder', types: ['saboteur', 'mirror'], sec: 'burst', vuln: 'hybrid', res: 'volatile', rationale: 'Locks hand options and reflects active plays' },
    { id: 'elite_coin_parasite', name: 'Fate Decay', types: ['coin', 'parasite'], sec: 'hybrid', vuln: 'burst', res: 'volatile', rationale: 'Dual telegraphed moves with worsening decay debuffs' },
    { id: 'elite_escalator_countdown', name: 'Dual Engine', types: ['escalator', 'countdown'], sec: 'volatile', vuln: 'burst', res: 'hybrid', rationale: 'Simultaneous steady scaling and big burst countdown timer' },
  ];

  for (const item of blendedElite) {
    const b1 = BEHAVIOR_TYPES.find(b => b.id === item.types[0]);
    const b2 = BEHAVIOR_TYPES.find(b => b.id === item.types[1]);
    roster.push({
      id: item.id,
      name: `${item.name} (Elite)`,
      tier: 'elite',
      band: 'elite',
      hp: BAND_STATS.elite.hp,
      dmgPerTurn: BAND_STATS.elite.dmgPerTurn,
      secondaryType: item.sec,
      vulnerable: item.vuln,
      resistant: item.res,
      behaviorTypeIds: item.types,
      signature: `[Blended: ${b1?.name} + ${b2?.name}] ${item.rationale}. Alternates intents each turn.`
    });
  }

  // 3. Blended Master Band (6 entries)
  const blendedMaster: Array<{ id: string; name: string; types: [string, string]; sec: SecondaryType; vuln: SecondaryType; res: SecondaryType; rationale: string }> = [
    { id: 'master_countdown_parasite', name: 'Singularity Core', types: ['countdown', 'parasite'], sec: 'burst', vuln: 'hybrid', res: 'volatile', rationale: 'Extreme countdown pressure with worsening rot' },
    { id: 'master_tally_saboteur', name: 'Dissonance Sovereign', types: ['tally', 'saboteur'], sec: 'volatile', vuln: 'burst', res: 'hybrid', rationale: 'Locked hand slots and punishing counter-strikes' },
    { id: 'master_mirror_escalator', name: 'Reflective Storm', types: ['mirror', 'escalator'], sec: 'hybrid', vuln: 'burst', res: 'volatile', rationale: 'Action reflection paired with non-stop scaling damage' },
    { id: 'master_weaver_tally', name: 'Shifting Judgement', types: ['weaver', 'tally'], sec: 'burst', vuln: 'hybrid', res: 'volatile', rationale: 'Constantly cycling weaknesses and repetition counter' },
    { id: 'master_countdown_escalator', name: 'Apex Overload', types: ['countdown', 'escalator'], sec: 'volatile', vuln: 'burst', res: 'hybrid', rationale: 'Relentless escalation punctuated by heavy countdown spikes' },
    { id: 'master_parasite_saboteur', name: 'Corrupting Warden', types: ['parasite', 'saboteur'], sec: 'hybrid', vuln: 'burst', res: 'volatile', rationale: 'Hand slot disruption with snowballing parasitic decay' },
  ];

  for (const item of blendedMaster) {
    const b1 = BEHAVIOR_TYPES.find(b => b.id === item.types[0]);
    const b2 = BEHAVIOR_TYPES.find(b => b.id === item.types[1]);
    roster.push({
      id: item.id,
      name: `${item.name} (Master)`,
      tier: 'master',
      band: 'master',
      hp: BAND_STATS.master.hp,
      dmgPerTurn: BAND_STATS.master.dmgPerTurn,
      secondaryType: item.sec,
      vulnerable: item.vuln,
      resistant: item.res,
      behaviorTypeIds: item.types,
      signature: `[Master Blended: ${b1?.name} + ${b2?.name}] ${item.rationale}.`
    });
  }

  return roster;
}

export const BASIC_ENEMIES: EnemyDef[] = [
  // BASIC — Floor 1, Denial (Untyped, Single relation baseline)
  { id: 'ashling', name: 'Ashling', tier: 'basic', hp: 14,
    signature: 'Single-pattern Ember striker.' },
  { id: 'drifting_cinder', name: 'Drifting Cinder', tier: 'basic', hp: 10,
    signature: 'Low HP, erratic — intent changes randomly each turn.' },
  { id: 'sparkling_husk', name: 'Sparkling Husk', tier: 'basic', hp: 8,
    signature: 'Fast, fragile — dies in 2-3 hits, but hits first.' },
  { id: 'ashbound_wisp', name: 'Ashbound Wisp', tier: 'basic', hp: 12,
    signature: 'Always telegraphs Guard on turn 1, forcing a wasted opening turn if rushed.' },
];

export const LEGACY_NAMED_ENEMIES: EnemyDef[] = [
  { id: 'molten_ashling', name: 'Molten Ashling', tier: 'advanced', hp: 20, secondaryType: 'burst', vulnerable: 'hybrid', resistant: 'volatile',
    signature: 'Aggressive escalation — damage output increases each turn survived.' },
  { id: 'cinder_brute', name: 'Cinder Brute', tier: 'advanced', hp: 24, secondaryType: 'hybrid', vulnerable: 'burst', resistant: 'volatile',
    signature: 'Telegraphs one heavy hit every 3rd turn — real punish for not Guarding on cue.' },
  { id: 'spark_lash', name: 'Spark Lash', tier: 'advanced', hp: 16, secondaryType: 'volatile', vulnerable: 'burst', resistant: 'hybrid',
    signature: 'Hits twice per turn, low individual damage — punishes ignoring chip damage.' },
  { id: 'ashen_marauder', name: 'Ashen Marauder', tier: 'advanced', hp: 18, secondaryType: 'hybrid', vulnerable: 'burst', resistant: 'volatile',
    signature: 'DoT-focused — mirrors the player\'s own Unmake pattern back at them.' },
  { id: 'rootbound_guardian', name: 'Rootbound Guardian', tier: 'elite', hp: 30, secondaryType: 'burst', vulnerable: 'hybrid', resistant: 'volatile',
    signature: 'Self-heals each turn — real damage race, punishes slow builds.' },
  { id: 'bulwark', name: 'Bulwark', tier: 'elite', hp: 40, secondaryType: 'hybrid', vulnerable: 'burst', resistant: 'volatile',
    signature: 'High HP, immovable — the Depression-floor grind fight.' },
  { id: 'fracture_warden', name: 'Fracture Warden', tier: 'elite', hp: 28, secondaryType: 'volatile', vulnerable: 'burst', resistant: 'hybrid',
    signature: 'Punishes Opposed-relation plays specifically — reduces their success chance.' },
  { id: 'cinderlord_sentinel', name: 'Cinderlord Sentinel', tier: 'elite', hp: 32, secondaryType: 'burst', vulnerable: 'hybrid', resistant: 'volatile',
    signature: 'Stacks its own Shield each turn uninterrupted — rewards sustained aggression.' },
];

export const BOSS_ENEMIES: EnemyDef[] = [
  { id: 'fractured_echo', name: 'Fractured Echo (Boss)', tier: 'master', hp: 50, secondaryType: 'hybrid', vulnerable: 'burst', resistant: 'volatile',
    signature: 'Shifting resonance and void rot DoT bursts.' },
  { id: 'deep_dissonance', name: 'Deep Dissonance (Boss)', tier: 'master', hp: 60, secondaryType: 'volatile', vulnerable: 'burst', resistant: 'hybrid',
    signature: 'Overwhelming dissonance scream and phase rot.' }
];

export const ENEMY_POOL: EnemyDef[] = [
  ...BASIC_ENEMIES,
  ...generateBehaviorRoster(),
  ...LEGACY_NAMED_ENEMIES,
  ...BOSS_ENEMIES
];
