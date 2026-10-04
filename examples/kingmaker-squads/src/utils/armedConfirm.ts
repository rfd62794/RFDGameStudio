// new: examples/kingmaker-squads/src/utils/armedConfirm.ts
export const ARM_WINDOW_MS = 3000;

export interface ArmedStep {
  armed: boolean;
  confirmed: boolean;
}

/** One press: disarmed -> armed (not confirmed); armed -> disarmed and confirmed. */
export function pressArmed(armed: boolean): ArmedStep {
  return armed ? { armed: false, confirmed: true } : { armed: true, confirmed: false };
}

export function armedLabel(armed: boolean, idle: string, confirm: string): string {
  return armed ? confirm : idle;
}
