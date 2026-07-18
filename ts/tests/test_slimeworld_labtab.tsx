import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/LabTab.tsx'),
  'utf8'
);

describe('Slimeworld LabTab shared UI migration', () => {
  it('test_slimeworld_role_toggle_uses_shared_button', () => {
    expect(source).toContain("import { Button, StatBar } from '../../../ui/components';");
    expect(source).toContain('label="Assign as Lab Worker"');
    expect(source).toContain('label="Decommission from Worker Duties"');
    expect(source).not.toContain('>\n                                      Assign as Lab Worker\n                                    </button>');
    expect(source).not.toContain('>\n                                      Decommission from Worker Duties\n                                    </button>');
  });

  it('test_slimeworld_confirm_cancel_use_icon_buttons', () => {
    expect(source).toContain('icon={<Check className="w-3.5 h-3.5" />}');
    expect(source).toContain('title="Confirm rename"');
    expect(source).toContain('icon={<X className="w-3.5 h-3.5" />}');
    expect(source).toContain('title="Cancel"');
  });

  it('test_slimeworld_stat_uses_statbar', () => {
    expect(source).toContain('<StatBar label="HP" value={Math.round(currentlySelectedSlime.stats.hp)} max={200} color="#cbd5e1" />');
  });
});
