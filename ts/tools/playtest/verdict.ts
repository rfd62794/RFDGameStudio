// new: ts/tools/playtest/verdict.ts
export interface Rect { x: number; y: number; w: number; h: number }
export interface ChainLink {
  tag: string;
  rect: Rect;
  overflowX: string;
  overflowY: string;
}
export type Severity = 'hard' | 'soft';
export interface SmokeFinding {
  demo: string;
  viewport: string;
  check: string;
  severity: Severity;
  message: string;
  step: number;
}
export type Verdict = 'SAFE' | 'UNSAFE' | 'NEEDS-LOOK';

export function isAllowedConsole(type: string, text: string): boolean {
  if (text.includes('favicon.ico')) return true;
  if (type === 'warning' && text.includes('AudioContext')) return true;
  return false;
}

export function isClipped(chain: ChainLink[], viewport: { w: number; h: number }): boolean {
  if (chain.length === 0) return false;
  const ctrl = chain[0].rect;
  for (let i = 1; i < chain.length; i++) {
    const anc = chain[i];
    if (
      (anc.overflowX === 'hidden' || anc.overflowX === 'clip') &&
      (ctrl.x < anc.rect.x - 1 || ctrl.x + ctrl.w > anc.rect.x + anc.rect.w + 1)
    ) {
      return true;
    }
    if (
      (anc.overflowY === 'hidden' || anc.overflowY === 'clip') &&
      (ctrl.y < anc.rect.y - 1 || ctrl.y + ctrl.h > anc.rect.y + anc.rect.h + 1)
    ) {
      return true;
    }
  }
  return ctrl.x < -1 || ctrl.x + ctrl.w > viewport.w + 1;
}

export function tapTargetOk(rect: Rect, min = 44): boolean {
  return rect.w >= min && rect.h >= min;
}

export function classifyVerdict(findings: SmokeFinding[]): Verdict {
  if (findings.some((f) => f.severity === 'hard')) return 'UNSAFE';
  if (findings.some((f) => f.severity === 'soft')) return 'NEEDS-LOOK';
  return 'SAFE';
}
