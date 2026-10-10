// new: ts/tools/playtest/detectors.ts
import type { MonkeyAction } from './monkey';

export type MonkeyCheck =
  | 'exception'
  | 'console-error'
  | 'hang'
  | 'crash'
  | 'blank-canvas'
  | 'bad-text'
  | 'stall'
  | 'low-fps';

export interface MonkeyFinding {
  check: MonkeyCheck;
  message: string;
  seed: number;
  actionIndex: number;
  lastActions: MonkeyAction[];
}

export function severityOf(check: MonkeyCheck): 'hard' | 'soft' {
  return check === 'stall' || check === 'low-fps' ? 'soft' : 'hard';
}

const BAD_TEXT = /\bNaN\b|\bundefined\b|\[object Object\]/;

/** The matched word with up to 20 chars either side, whitespace collapsed. */
export function findBadText(text: string): string | null {
  const m = BAD_TEXT.exec(text);
  if (!m) return null;
  const start = Math.max(0, m.index - 20);
  const end = Math.min(text.length, m.index + m[0].length + 20);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

/** 'blank' when every sampled pixel equals the first, or the list is empty. */
export function canvasSignature(rgba: number[]): 'blank' | 'varied' {
  if (rgba.length === 0) return 'blank';
  for (let i = 4; i < rgba.length; i += 4) {
    if (
      rgba[i] !== rgba[0] ||
      rgba[i + 1] !== rgba[1] ||
      rgba[i + 2] !== rgba[2] ||
      rgba[i + 3] !== rgba[3]
    ) {
      return 'varied';
    }
  }
  return 'blank';
}

/** True when the last n signatures are all 'blank' and at least n exist. */
export function blankStreak(signatures: ('blank' | 'varied')[], n = 3): boolean {
  if (signatures.length < n) return false;
  return signatures.slice(-n).every((s) => s === 'blank');
}

export function isHang(lastFrameAgeMs: number, actionPendingMs: number): boolean {
  return lastFrameAgeMs > 5000 || actionPendingMs > 10000;
}

/** True when average fps over the list is under 20; false for an empty list. */
export function lowFps(frameTimesMs: number[]): boolean {
  if (frameTimesMs.length === 0) return false;
  const avg = frameTimesMs.reduce((s, t) => s + t, 0) / frameTimesMs.length;
  return avg > 0 && 1000 / avg < 20;
}

export function makeFinding(
  check: MonkeyCheck,
  message: string,
  seed: number,
  actionIndex: number,
  actions: MonkeyAction[],
): MonkeyFinding {
  return { check, message, seed, actionIndex, lastActions: actions.slice(-5) };
}

export function shouldStop(findings: MonkeyFinding[], max = 10): boolean {
  return findings.length >= max;
}
