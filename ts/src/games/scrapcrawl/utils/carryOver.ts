// new: ts/src/games/scrapcrawl/utils/carryOver.ts
// What a crawler keeps between runs: weapon/shield/armor proficiency and the best win.
import { loadSave, writeSave, clearSave } from '../../../engine/shared/persistence';
import type { PlayerState, ProficiencyXp } from '../types';

export const PROFICIENCY_KEY = 'scrapcrawl_proficiency';
export const BEST_RUN_KEY = 'scrapcrawl_best_run';

const ZERO_XP: ProficiencyXp = { weapon: 0, shield: 0, armor: 0 };

function cleanXp(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

export function savedProficiency(): ProficiencyXp {
  const raw = loadSave<Partial<ProficiencyXp>>(PROFICIENCY_KEY);
  if (!raw || typeof raw !== 'object') return { ...ZERO_XP };
  return { weapon: cleanXp(raw.weapon), shield: cleanXp(raw.shield), armor: cleanXp(raw.armor) };
}

export function saveProficiency(xp: ProficiencyXp): void {
  writeSave(PROFICIENCY_KEY, { weapon: cleanXp(xp.weapon), shield: cleanXp(xp.shield), armor: cleanXp(xp.armor) });
}

/** A fresh player that starts with the proficiency earned in earlier runs. */
export function withSavedProficiency(player: PlayerState): PlayerState {
  return { ...player, proficiencyXp: savedProficiency() };
}

/** Best winning run so far, as HP left (higher is better); null before the first win. */
export function bestWinHp(): number | null {
  const raw = loadSave<number>(BEST_RUN_KEY);
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
}

export function recordWin(hpLeft: number): { best: number; improved: boolean } {
  const prev = bestWinHp();
  const improved = prev === null || hpLeft > prev;
  const best = improved ? hpLeft : (prev as number);
  if (improved) writeSave(BEST_RUN_KEY, hpLeft);
  return { best, improved };
}

export function clearCarryOver(): void {
  clearSave(PROFICIENCY_KEY);
  clearSave(BEST_RUN_KEY);
}
