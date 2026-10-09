// new: ts/tools/playtest/args.ts
import type { Target } from './manifest';

export interface Args {
  base: string;
  target: Target;
  demos: string[] | 'all';
  out: string;
  readonly: boolean;
  viewports: ('desktop' | 'phone')[];
}

export function parseArgs(
  argv: string[],
): { ok: true; value: Args } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const value: Args = {
    base: 'http://127.0.0.1:5199',
    target: 'local',
    demos: 'all',
    out: 'docs/state',
    readonly: false,
    viewports: ['desktop', 'phone'],
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
      case '--out': {
        const v = needValue();
        if (v !== null) {
          value.out = v;
          i++;
        }
        break;
      }
      case '--viewports': {
        const v = needValue();
        if (v !== null) {
          const parts = v.split(',').map((s) => s.trim()).filter(Boolean);
          if (parts.length === 0 || parts.some((p) => p !== 'desktop' && p !== 'phone')) {
            errors.push(`unknown --viewports '${v}'`);
          } else {
            value.viewports = parts as ('desktop' | 'phone')[];
          }
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
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}
