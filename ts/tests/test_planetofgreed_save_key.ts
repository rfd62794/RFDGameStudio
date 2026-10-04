import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// <!-- new: ts/tests/test_planetofgreed_save_key.ts -->
// This test exists so a rename of the 'corpworld_state' save key fails
// loudly: renaming it would orphan every existing player save. It also
// guards the player-facing CorpWorld leftover removed from the dossier
// panel by the Tier A polish directive.
const APP_TSX_PATH = resolve(__dirname, '../src/games/planetofgreed/App.tsx');
const appSource = readFileSync(APP_TSX_PATH, 'utf-8');

describe('Planet of Greed save key and naming', () => {
  it('loads saves under the unchanged corpworld_state key', () => {
    expect(appSource).toContain(
      "loadSave<{ selectedCellId?: number | null; isPlanningPhase?: boolean }>('corpworld_state')"
    );
  });

  it('writes saves under the unchanged corpworld_state key', () => {
    expect(appSource).toContain("writeSave('corpworld_state'");
  });

  it('has no player-facing CorpWorld naming left in the dossier', () => {
    expect(appSource).not.toContain('CorpWorld commanders');
  });

  it('addresses Planet of Greed commanders in the dossier', () => {
    expect(appSource).toContain('Planet of Greed commanders');
  });
});
