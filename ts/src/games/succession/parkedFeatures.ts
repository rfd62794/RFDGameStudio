// new: ts/src/games/succession/parkedFeatures.ts
export type ParkedFeatureId = 'discredit' | 'indictment' | 'domainRipple';
export type ParkedFeatures = Record<ParkedFeatureId, boolean>;
export const DEFAULT_PARKED_FEATURES: Readonly<ParkedFeatures> = {
  discredit: false,
  indictment: false,
  domainRipple: false,
};
let current: ParkedFeatures = { ...DEFAULT_PARKED_FEATURES };
export function isParked(id: ParkedFeatureId): boolean {
  return current[id];
}
export function getParkedFeatures(): ParkedFeatures {
  return { ...current };
}
export function setParkedFeatures(next: Partial<ParkedFeatures>): void {
  current = { ...current, ...next };
}
export function resetParkedFeatures(): void {
  current = { ...DEFAULT_PARKED_FEATURES };
}
