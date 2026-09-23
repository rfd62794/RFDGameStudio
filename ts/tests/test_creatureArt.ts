import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveCreatureArt, type CreatureArtConfig } from '../src/engine/creatureArt/index';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('creatureArt seam', () => {
  it('test_resolve_creature_art_returns_real_path', () => {
    interface WolfEntity {
      kind: 'wolf';
    }

    const config: CreatureArtConfig<WolfEntity> = {
      assetPathFor: (entity) =>
        entity.kind === 'wolf'
          ? 'engine/creatureArt/fixtures/wolf.png'
          : 'engine/creatureArt/fixtures/unknown.png',
    };

    const result = resolveCreatureArt({ kind: 'wolf' }, config);
    expect(result).toBe('engine/creatureArt/fixtures/wolf.png');
  });

  it('test_creature_art_config_carries_no_game_vocabulary', () => {
    // Static check: the types.ts module must not contain any game-specific
    // identifiers — same discipline as artGen/types.ts.
    const typesSource = readFileSync(
      resolve(__dirname, '../src/engine/creatureArt/types.ts'),
      'utf-8',
    );

    // Game names that must not appear in the generic module.
    const gameNames = [
      'dissonance',
      'shoal',
      'slimeworld',
      'planetforge',
      'mutant_battle_ball',
      'scrapcrawl',
      'chimera',
      'voiddrift',
    ];

    for (const name of gameNames) {
      expect(typesSource).not.toContain(name);
    }
  });

  it('test_wolf_fixture_is_real_generated_asset', () => {
    const fixturePath = resolve(__dirname, '../src/engine/creatureArt/fixtures/wolf.png');
    const stat = readFileSync(fixturePath);

    // Byte size must match the recorded 347,341 bytes from the
    // fork-validate phase — confirms it's the real generated image,
    // not a placeholder someone drew.
    expect(stat.length).toBe(347341);
  });
});
