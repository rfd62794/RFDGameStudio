import { describe, expect, it } from 'vitest';
import { generateStandaloneEntry } from '../tools/generate-standalone-entry';

describe('standalone entry generator', () => {
  it('generates shoal entry with action and movement primitives', () => {
    const { entry } = generateStandaloneEntry('shoal');
    expect(entry).toContain(
      "import actionRaw from '../../../../engine/primitives/action.lua?raw';"
    );
    expect(entry).toContain(
      "import movementRaw from '../../../../engine/primitives/movement.lua?raw';"
    );
    expect(entry).toContain("'utils.lua': utilsRaw");
    expect(entry).toContain("'steering.lua': steeringRaw");
  });

  it('generates brewfield entry without action primitive (audit D)', () => {
    const { entry } = generateStandaloneEntry('brewfield');
    expect(entry).toContain(
      "import logicRaw from '../../../../games/brewfield/logic.lua?raw';"
    );
    expect(entry).not.toContain('actionRaw');
  });

  it('sets html title from data.yaml', () => {
    const { html } = generateStandaloneEntry('shoal');
    expect(html).toContain('<title>Shoal</title>');
  });
});
