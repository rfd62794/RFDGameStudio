// @vitest-environment node
// new: ts/tests/test_factory_idle_labels.ts

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  RAW_PARTS, WEAPON_RECIPES, BUILDING_DEFS, TECH_UPGRADES, INITIAL_SECTORS, PRESET_FACTORIES,
} from '../../examples/factory-idle-precision-armory-phase2/src/engine/recipes';

const BANNED = /\b(pistols?|shotguns?|rifles?|smgs?|dmrs?|firearms?|weapons?|armory|ammo|swat|handgun|small arms|munitions|assault|sidearm|marksman|tactical|mil-spec)\b/i;
const EXAMPLE = '../../examples/factory-idle-precision-armory-phase2/src/';

function collect(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const add = (where: string, v: unknown) => { if (typeof v === 'string') out.push([where, v]); };
  for (const p of Object.values(RAW_PARTS)) { add(`part ${p.id} name`, p.name); add(`part ${p.id} description`, p.description); }
  for (const w of Object.values(WEAPON_RECIPES)) { add(`item ${w.id} name`, w.name); add(`item ${w.id} category`, w.category); add(`item ${w.id} description`, w.description); }
  for (const b of Object.values(BUILDING_DEFS)) { add(`building ${b.type} name`, b.name); add(`building ${b.type} description`, b.description); }
  for (const t of TECH_UPGRADES) { add(`tech ${t.id} name`, t.name); add(`tech ${t.id} description`, t.description); }
  for (const s of Object.values(INITIAL_SECTORS)) { add(`sector ${s.id} name`, s.name); add(`sector ${s.id} tagline`, s.tagline); }
  for (const f of PRESET_FACTORIES) { add(`preset ${f.id} name`, f.name); add(`preset ${f.id} description`, f.description); }
  return out;
}

describe('test_factory_idle_labels', () => {
  it('no player-facing data string uses weapon wording', () => {
    for (const [where, text] of collect()) {
      expect(BANNED.test(text), `${where}: "${text}"`).toBe(false);
    }
  });

  it('the UI files carry no weapon wording in visible text', () => {
    const files = ['components/Header.tsx', 'components/RecipeBookModal.tsx', 'components/StorefrontPanel.tsx'];
    for (const f of files) {
      const lines = readFileSync(new URL(EXAMPLE + f, import.meta.url), 'utf8').split('\n');
      lines.forEach((line, i) => {
        // visible text sits between > and < or inside quotes; identifiers and comments are skipped
        if (/^\s*(\/\/|\{\/\*)/.test(line) || /import |WEAPON_RECIPES|WeaponId|weaponId|weaponList|weaponKeys/.test(line)) return;
        const visible = [...line.matchAll(/>([^<>{}]+)</g)].map(m => m[1]).join(' ')
          + ' ' + [...line.matchAll(/title="([^"]*)"/g)].map(m => m[1]).join(' ');
        expect(BANNED.test(visible), `${f}:${i + 1}: ${line.trim()}`).toBe(false);
      });
    }
  });

  it('the customer pool in the reducer names no law-enforcement or military groups', () => {
    const src = readFileSync(new URL(EXAMPLE + 'engine/gameReducer.ts', import.meta.url), 'utf8');
    expect(/SWAT|Task Force|Constabulary|Armored|Recon|Sheriff|Marshal|Major|Commander|Captain|Operative/.test(src)).toBe(false);
  });

  it('ids are unchanged so saves and presets keep working', () => {
    expect(Object.keys(WEAPON_RECIPES).sort()).toEqual(['dmr', 'pistol', 'rifle', 'shotgun', 'smg']);
    expect(Object.keys(RAW_PARTS).sort()).toEqual(['barrel', 'chassis', 'magazine', 'optic', 'stock']);
  });
});
