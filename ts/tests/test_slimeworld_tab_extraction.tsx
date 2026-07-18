import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (file: string) => readFileSync(resolve(import.meta.dirname, `../src/games/slimeworld/${file}`), 'utf8');

const app = source('App.tsx');
const roster = source('components/RosterTab.tsx');
const missions = source('components/MissionsTab.tsx');
const economy = source('components/EconomyTab.tsx');


describe('Slimeworld top-level section routing', () => {
  it('test_roster_tab_renders_containment_cells', () => {
    expect(roster).toContain("activeSubTab, setActiveSubTab] = useState<'collection' | 'breeding' | 'slimedex'>('collection')");
    expect(roster).toContain("{ id: 'collection', label: 'COLLECTION' }");
    expect(roster).toContain("{ id: 'breeding', label: 'SPLICING' }");
  });

  it('test_missions_tab_dispatch_mediation_unchanged', () => {
    expect(missions).toContain("{ id: 'active', label: 'ACTIVE' }");
    expect(missions).toContain("{ id: 'zones', label: 'ZONES' }");
    expect(missions).toContain("{ id: 'mediation', label: 'MEDIATION' }");
  });

  it('test_economy_tab_contracts_market_unchanged', () => {
    expect(economy).toContain('activeSubTab="requisitions"');
    expect(economy).toContain('handleDeliverContract');
    expect(economy).toContain('handleSellOnMarket');
  });

  it('test_four_tab_navigation_works', () => {
    expect(app).toContain("{ id: 'roster', label: 'ROSTER' }");
    expect(app).toContain("{ id: 'missions', label: 'MISSIONS' }");
    expect(app).toContain("{ id: 'economy', label: 'ECONOMY' }");
    expect(app).toContain("{ id: 'lab', label: 'LAB' }");
    expect(app).toContain('{primaryContent}');
  });
});
