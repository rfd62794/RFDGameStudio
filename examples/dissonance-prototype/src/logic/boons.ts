import { TypedBoon } from '../types';

export const BOON_POOL: TypedBoon[] = [
  // Basic — flat +2, cost 20
  { id: 'ember_power', tier: 'basic', targetType: 'element', targetId: 'ember', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'ash_shield', tier: 'basic', targetType: 'element', targetId: 'ash', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'spark_heal', tier: 'basic', targetType: 'element', targetId: 'spark', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'cinder_power', tier: 'basic', targetType: 'element', targetId: 'cinder', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'sever_basic', tier: 'basic', targetType: 'action', targetId: 'sever', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'guard_basic', tier: 'basic', targetType: 'action', targetId: 'guard', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'mend_basic', tier: 'basic', targetType: 'action', targetId: 'mend', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'unmake_basic', tier: 'basic', targetType: 'action', targetId: 'unmake', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'single_basic', tier: 'basic', targetType: 'combination', targetId: 'single', effectShape: 'flat', modifier: 2, essenceCost: 20 },
  { id: 'same_basic', tier: 'basic', targetType: 'combination', targetId: 'same', effectShape: 'flat', modifier: 2, essenceCost: 20 },

  // Advanced — flat +3, cost 30
  { id: 'sever_power', tier: 'advanced', targetType: 'action', targetId: 'sever', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'guard_power', tier: 'advanced', targetType: 'action', targetId: 'guard', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'mend_power', tier: 'advanced', targetType: 'action', targetId: 'mend', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'unmake_power', tier: 'advanced', targetType: 'action', targetId: 'unmake', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'ember_advanced', tier: 'advanced', targetType: 'element', targetId: 'ember', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'ash_advanced', tier: 'advanced', targetType: 'element', targetId: 'ash', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'spark_advanced', tier: 'advanced', targetType: 'element', targetId: 'spark', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'cinder_advanced', tier: 'advanced', targetType: 'element', targetId: 'cinder', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'single_advanced', tier: 'advanced', targetType: 'combination', targetId: 'single', effectShape: 'flat', modifier: 3, essenceCost: 30 },
  { id: 'same_advanced', tier: 'advanced', targetType: 'combination', targetId: 'same', effectShape: 'flat', modifier: 3, essenceCost: 30 },

  // Elite (Duo) — +5, requires a prerequisite Basic or Advanced Boon already held
  { id: 'ember_sever_duo', tier: 'elite', targetType: 'combination', targetId: 'ember_sever', effectShape: 'flat', modifier: 5, essenceCost: 45, requiresBoonId: 'ember_power' },
  { id: 'spark_mend_duo', tier: 'elite', targetType: 'combination', targetId: 'spark_mend', effectShape: 'flat', modifier: 5, essenceCost: 45, requiresBoonId: 'spark_heal' },
  { id: 'ash_guard_duo', tier: 'elite', targetType: 'combination', targetId: 'ash_guard', effectShape: 'flat', modifier: 5, essenceCost: 45, requiresBoonId: 'ash_shield' },
  { id: 'cinder_unmake_duo', tier: 'elite', targetType: 'combination', targetId: 'cinder_unmake', effectShape: 'flat', modifier: 5, essenceCost: 45, requiresBoonId: 'cinder_power' },

  // Master — qualitative, cost 65
  { id: 'no_fizzle', tier: 'master', targetType: 'combination', targetId: 'opposed', effectShape: 'qualitative', qualitativeEffect: 'Opposed plays cannot Fizzle this run', essenceCost: 65 },
  { id: 'same_amplify', tier: 'master', targetType: 'combination', targetId: 'same', effectShape: 'qualitative', qualitativeEffect: 'Same-relation plays gain +1 to their multiplier this run', essenceCost: 65 },
  { id: 'guard_reflect', tier: 'master', targetType: 'action', targetId: 'guard', effectShape: 'qualitative', qualitativeEffect: 'Guard actions also deal their shield value as damage', essenceCost: 65 },
  { id: 'escalation_boon', tier: 'master', targetType: 'combination', targetId: 'same', effectShape: 'qualitative', qualitativeEffect: 'Burster Build: Consecutive Same plays stack Escalation (+0.25x multiplier per stack)', essenceCost: 65 },
  { id: 'volatile_surge', tier: 'master', targetType: 'combination', targetId: 'opposed', effectShape: 'qualitative', qualitativeEffect: 'Gambler Build: Opposed plays stack Momentum multipliers on both success & fail', essenceCost: 65 },
  { id: 'essence_ledger', tier: 'master', targetType: 'economy', targetId: 'essence', effectShape: 'qualitative', qualitativeEffect: 'Vault Build: Unspent Essence grants compounding card power efficiency (+1% per 2 Essence)', essenceCost: 65 },
];
