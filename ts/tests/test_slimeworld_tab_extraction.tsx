import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { test, expect } from 'vitest';

const components = resolve(__dirname, '../src/games/slimeworld/components');

function read(name: string) {
  return readFileSync(resolve(components, name), 'utf8');
}

test('no facade imports in new tab components', () => {
  const roster = read('RosterTab.tsx');
  const missions = read('MissionsTab.tsx');
  const economy = read('EconomyTab.tsx');

  expect(roster).not.toContain("import { LabTab }");
  expect(roster).not.toContain("import { PlanetTab }");
  expect(missions).not.toContain("import { LabTab }");
  expect(missions).not.toContain("import { PlanetTab }");
  expect(economy).not.toContain("import { LabTab }");
  expect(economy).not.toContain("import { PlanetTab }");
});

test('PlanetTab.tsx is removed', () => {
  expect(existsSync(resolve(components, 'PlanetTab.tsx'))).toBe(false);
});

test('LabTab.tsx is reduced and contains only Upgrades', () => {
  const lab = read('LabTab.tsx');
  const lineCount = lab.split('\n').length;

  // Should be significantly smaller than original ~1332 lines
  expect(lineCount).toBeLessThan(500);

  // Should contain upgrades content
  expect(lab).toContain("activeSubTab === 'upgrades'");

  // Should NOT contain other sub-tab markers
  expect(lab).not.toContain("activeSubTab === 'collection'");
  expect(lab).not.toContain("activeSubTab === 'breeding'");
  expect(lab).not.toContain("activeSubTab === 'slimedex'");
  expect(lab).not.toContain("activeSubTab === 'requisitions'");

  // handlePurchaseSeedSlime should remain in LabTab
  expect(lab).toContain('handlePurchaseSeedSlime');
});

test('RosterTab.tsx contains Collection, Splicing, and SlimeDex content', () => {
  const roster = read('RosterTab.tsx');

  expect(roster).toContain("activeSubTab === 'collection'");
  expect(roster).toContain("activeSubTab === 'breeding'");
  expect(roster).toContain("activeSubTab === 'slimedex'");
  expect(roster).toContain('export function RosterTab');
  expect(roster).toContain('TabBar');

  // Should NOT contain handlePurchaseSeedSlime
  expect(roster).not.toContain('handlePurchaseSeedSlime');
});

test('EconomyTab.tsx contains Contracts and Market content', () => {
  const economy = read('EconomyTab.tsx');

  expect(economy).toContain("activeSubTab === 'requisitions'");
  expect(economy).toContain('export function EconomyTab');
  expect(economy).toContain('handleDeliverContract');
  expect(economy).toContain('handleSellOnMarket');
});

test('MissionsTab.tsx contains planet mission content', () => {
  const missions = read('MissionsTab.tsx');

  expect(missions).toContain('export function MissionsTab');
  expect(missions).toContain("activeSubTab === 'regions'");
  expect(missions).toContain('TabBar');
  expect(missions).toContain('handleLaunchDispatch');
  expect(missions).toContain('handleAssignGarrison');
});

test('App.tsx routes to four primary tabs', () => {
  const app = readFileSync(resolve(__dirname, '../src/games/slimeworld/App.tsx'), 'utf8');

  expect(app).toContain("import { RosterTab }");
  expect(app).toContain("import { MissionsTab }");
  expect(app).toContain("import { EconomyTab }");
  expect(app).toContain("import { LabTab }");
  expect(app).not.toContain("import { PlanetTab }");
  expect(app).toContain("'roster'");
  expect(app).toContain("'missions'");
  expect(app).toContain("'economy'");
  expect(app).toContain("'lab'");
});
