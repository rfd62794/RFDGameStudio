// new: ts/tools/playtest/monkeyArgs.ts
import type { Target } from './manifest';

export interface MonkeyArgs {
  base: string;
  target: Target;
  demos: string[] | 'all';
  seconds: number;
  seed: number | 'random';
  throttleMs: number;
  viewport: 'phone' | 'desktop';
  out: string;
  replay: string | null;
  readonly: boolean;
}

export function parseMonkeyArgs(
  argv: string[],
): { ok: true; value: MonkeyArgs } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const value: MonkeyArgs = {
    base: 'http://127.0.0.1:5199',
    target: 'local',
    demos: 'all',
    seconds: 60,
    seed: 'random',
    throttleMs: 150,
    viewport: 'phone',
    out: 'docs/state',
    replay: null,
    readonly: false,
  };
  const intIn = (raw: string, lo: number, hi: number): number | null => {
    const n = Number(raw);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') continue;
    const peek = argv[i + 1];
    const needValue = (): string | null => {
      if (peek === undefined || peek.startsWith('--')) {
        errors.push(`${arg} needs a value`);
        return null;
      }
      return peek;
    };
    switch (arg) {
      case '--base': {
        const v = needValue();
        if (v !== null) {
          value.base = v;
          i++;
        }
        break;
      }
      case '--target': {
        const v = needValue();
        if (v !== null) {
          if (v === 'local' || v === 'live') {
            value.target = v;
          } else {
            errors.push(`unknown --target '${v}'`);
          }
          i++;
        }
        break;
      }
      case '--demos': {
        const v = needValue();
        if (v !== null) {
          value.demos =
            v === 'all' ? 'all' : v.split(',').map((s) => s.trim()).filter(Boolean);
          i++;
        }
        break;
      }
      case '--seconds': {
        const v = needValue();
        if (v !== null) {
          const n = intIn(v, 1, 600);
          if (n === null) errors.push(`bad --seconds '${v}'`);
          else value.seconds = n;
          i++;
        }
        break;
      }
      case '--seed': {
        const v = needValue();
        if (v !== null) {
          if (v === 'random') {
            value.seed = 'random';
          } else {
            const n = Number(v);
            if (!Number.isInteger(n) || n < 0) errors.push(`bad --seed '${v}'`);
            else value.seed = n;
          }
          i++;
        }
        break;
      }
      case '--throttle': {
        const v = needValue();
        if (v !== null) {
          const n = intIn(v, 0, 2000);
          if (n === null) errors.push(`bad --throttle '${v}'`);
          else value.throttleMs = n;
          i++;
        }
        break;
      }
      case '--viewport': {
        const v = needValue();
        if (v !== null) {
          if (v === 'phone' || v === 'desktop') {
            value.viewport = v;
          } else {
            errors.push(`unknown --viewport '${v}'`);
          }
          i++;
        }
        break;
      }
      case '--out': {
        const v = needValue();
        if (v !== null) {
          value.out = v;
          i++;
        }
        break;
      }
      case '--replay': {
        const v = needValue();
        if (v !== null) {
          value.replay = v;
          i++;
        }
        break;
      }
      case '--readonly':
        value.readonly = true;
        break;
      default:
        errors.push(`unknown flag '${arg}'`);
    }
  }
  if (value.target === 'live') value.readonly = true;
  if (value.replay !== null && (value.demos === 'all' || value.demos.length !== 1)) {
    errors.push('--replay needs exactly one demo in --demos');
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}
