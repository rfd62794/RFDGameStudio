import { useCallback, useEffect, useState } from 'react';
import './styles.css';
import { Coins } from 'lucide-react';
import { GameShell } from '../../components';
import { call } from '../../engine/runtime';
import type { GameRendererProps } from '../../engine/types';
import { TabBar } from '../../ui/components/TabBar';
import { LabTab } from './components/LabTab';
import { RosterTab } from './components/RosterTab';
import { MissionsTab } from './components/MissionsTab';
import { EconomyTab } from './components/EconomyTab';
import { luaNodeToTs, luaSlimeToTs, stateToLua, type CombatZone, type CorporateContract, type LabState, type LogEntry, type Slime, type SlimeColor, type SlimePattern } from './types';
import { generatePlanetRegion } from './planetRegion';

const COLORS: SlimeColor[] = ['Red', 'Blue', 'Yellow', 'Purple', 'Orange', 'Green', 'Gray'];
const HUES: Record<SlimeColor, number> = { Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300, Gray: 0 };

function seedSlime(name: string, color: SlimeColor, index: number): Slime {
  return { id: `starter_${index}`, name, color, pattern: 'Solid', level: 1, xp: 0, stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 }, role: 'idle', generation: 0, colorSaturation: color === 'Gray' ? 0 : 100, hue: HUES[color], saturation: color === 'Gray' ? 0 : 100, diffusionRatio: 20, amplitude: 40, accentHue: HUES[color], vertexCount: 4, irregularity: 10, createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Hatchling' };
}

const INITIAL_ZONES: CombatZone[] = [
  { id: 'zone_cinder', name: 'Rusty Cinder Craters', requiredColor: 'Red', recommendedLevel: 1, difficulty: 1, creditsReward: 50, xpReward: 60, isUnlocked: true, isFirstClearCompleted: false, flavorText: 'An iron-rich expanse of heat chimneys and jagged slag-heaps. Ideal for Red Slimes to solidify their core.' },
  { id: 'zone_sulphur', name: 'Yellow Sulphur Fissures', requiredColor: 'Yellow', recommendedLevel: 2, difficulty: 1, creditsReward: 75, xpReward: 80, isUnlocked: false, isFirstClearCompleted: false, flavorText: 'Acrid volcanic streams containing raw energetic sulfur dust. Yellow Slimes thrive in the high-speed thermal winds.' },
  { id: 'zone_abyssal', name: 'Abyssal Frost Caves', requiredColor: 'Blue', recommendedLevel: 4, difficulty: 2, creditsReward: 120, xpReward: 150, isUnlocked: false, isFirstClearCompleted: false, flavorText: 'Sub-surface ice tunnels with deep lithium reservoirs. Extremely dense. Blue Slimes absorb freezing pressure with ease.' },
  { id: 'zone_jungle', name: 'Overgrown Biome Reactor', requiredColor: 'Green', recommendedLevel: 6, difficulty: 3, creditsReward: 200, xpReward: 250, isUnlocked: false, isFirstClearCompleted: false, flavorText: 'A derelict agriculture vessel overgrown with synthetic bioluminescent flora. Green Slimes can assimilate the dense foliage.' },
];

const INITIAL_CONTRACTS: CorporateContract[] = [
  { id: 'contract_init_1', title: 'CONTRACT RQ-3109', requiredColor: 'Purple', requiredPattern: 'Solid', creditsReward: 120, cyclesRemaining: 6, totalCycles: 6, flavorText: 'Corporation chemical trial requested. Purple membrane needed to buffer thermal fuel waste tanks on Reactor C-4.' },
  { id: 'contract_init_2', title: 'CONTRACT RQ-8821', requiredColor: 'Red', requiredPattern: 'Stripe', creditsReward: 160, cyclesRemaining: 4, totalCycles: 4, flavorText: 'Physical shock loading test. Stripe pattern elastic membrane required for deceleration orbital sleds.' },
];

function initialState(session: GameRendererProps['session']): LabState {
  const data = session.files.data as Record<string, unknown>;
  const lab = (data['lab'] ?? {}) as Record<string, unknown>;
  const starters = (lab['starter_slimes'] ?? []) as Array<Record<string, unknown>>;
  const relationships = (lab['culture_relationships'] ?? {}) as Record<SlimeColor, number>;
  return { cycle: Number(lab['starting_cycle'] ?? 1), credits: Number(lab['starting_credits'] ?? 100), rosterCap: Number(lab['starting_roster_cap'] ?? 10), breedingSuccessRateModifier: Number(lab['starting_breeding_success_rate_modifier'] ?? 0), slimes: starters.map((starter, index) => seedSlime(String(starter['name'] ?? `Specimen-${index + 1}`), (starter['color'] ?? COLORS[index % COLORS.length]) as SlimeColor, index)), contracts: INITIAL_CONTRACTS, zones: INITIAL_ZONES, activeDispatch: null, logs: [], activeMediation: null, activeExploration: null, planetRegion: generatePlanetRegion(), wildsUnlocked: false, hasAutoFeeder: false, cultureRelationships: relationships, recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {} };
}

function luaResult(value: unknown): [Record<string, unknown> | null, string | null] {
  if (Array.isArray(value)) return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] ?? null) as string | null];
  return [value as Record<string, unknown> | null, null];
}

export default function App({ session }: GameRendererProps) {
  const [state, setState] = useState<LabState>(() => initialState(session));
  const [primaryTab, setPrimaryTab] = useState<'roster' | 'missions' | 'economy' | 'lab'>('roster');
  const [selectedSlimeId, setSelectedSlimeId] = useState<string | null>(null);
  const [parentAId, setParentAId] = useState<string | null>(null);
  const [parentBId, setParentBId] = useState<string | null>(null);
  const [isBreedingHatching, setIsBreedingHatching] = useState(false);
  const [activeRegentPattern, setActiveRegentPattern] = useState<SlimePattern | null>(null);
  const [activeRegentColor, setActiveRegentColor] = useState<SlimeColor | null>(null);
  const [activeTargetRegent, setActiveTargetRegent] = useState<string | null>(null);
  const [renameSlimeId, setRenameSlimeId] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [dispatchDraftIds, setDispatchDraftIds] = useState<string[]>([]);
  const [mediationDraftIds, setMediationDraftIds] = useState<string[]>([]);
  const [explorationDraftIds, setExplorationDraftIds] = useState<string[]>([]);
  const [selectedMediationNodeId, setSelectedMediationNodeId] = useState<string | null>(null);
  const [selectedExplorationNodeId, setSelectedExplorationNodeId] = useState<string | null>(null);
  const [activeDispatchReport, setActiveDispatchReport] = useState<{ logs: string[]; success: boolean; xp: number; credits: number } | null>(null);
  const [activeMediationReport, setActiveMediationReport] = useState<{ logs: string[]; success: boolean; stabilityChange: number } | null>(null);
  const [activeExplorationReport, setActiveExplorationReport] = useState<{ logs: string[]; success: boolean } | null>(null);
  const [lastConsumedSlimeId, setLastConsumedSlimeId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => { if (!selectedSlimeId && state.slimes[0]) setSelectedSlimeId(state.slimes[0].id); }, [selectedSlimeId, state.slimes]);

  const handleInitiateBreeding = useCallback(() => {
    if (!parentAId || !parentBId) return;
    setIsBreedingHatching(true);
    const data = session.files.data as Record<string, unknown>;
    const value = call(session, 'initiate_breeding', stateToLua(state), parentAId, parentBId, 0, data['color_targets'], activeTargetRegent, data['shape_targets'], null);
    const [raw, error] = luaResult(value);
    if (!raw || error) { setWarning(error ?? 'Breeding failed.'); setIsBreedingHatching(false); return; }
    const child = luaSlimeToTs(raw);
    setLastConsumedSlimeId(child.consumedSlimeId ?? null);
    setState(previous => {
      const newColorTargetCodex = { ...(previous.colorTargetCodex ?? {}) };
      if (child.matchedTargetId) newColorTargetCodex[child.matchedTargetId] = true;
      const newShapeTargetCodex = { ...(previous.shapeTargetCodex ?? {}) };
      if (child.matchedShapeTargetId) newShapeTargetCodex[child.matchedShapeTargetId] = true;
      return {
        ...previous,
        credits: Math.max(0, previous.credits - 10),
        slimes: [...previous.slimes, child],
        colorTargetCodex: newColorTargetCodex,
        shapeTargetCodex: newShapeTargetCodex,
      };
    });
    setParentAId(null); setParentBId(null); setIsBreedingHatching(false);
  }, [activeTargetRegent, parentAId, parentBId, session, state]);

  const handleRecycleSlime = useCallback((id: string) => {
    const value = call(session, 'recycle_slime', stateToLua(state), id);
    const [credits, error] = Array.isArray(value) ? [value[0] as number | null, value[1] as string | null] : [null, 'Recycle failed.'];
    if (error || credits === null) { setWarning(error ?? 'Recycle failed.'); return; }
    setState(previous => ({ ...previous, credits: previous.credits + credits, slimes: previous.slimes.filter(slime => slime.id !== id) }));
  }, [session, state]);

  const handleBuyUpgrade = useCallback((type: 'capacity' | 'stabilizer' | 'autofeeder') => {
    const value = call(session, 'buy_upgrade', stateToLua(state), type);
    if (value !== true) { setWarning('Upgrade could not be purchased.'); return; }
    const costs = { capacity: 150, stabilizer: 200, autofeeder: 250 };
    setState(previous => ({ ...previous, credits: previous.credits - costs[type], rosterCap: type === 'capacity' ? previous.rosterCap + 5 : previous.rosterCap, breedingSuccessRateModifier: type === 'stabilizer' ? previous.breedingSuccessRateModifier + 0.1 : previous.breedingSuccessRateModifier, hasAutoFeeder: type === 'autofeeder' ? true : previous.hasAutoFeeder }));
  }, [session, state]);

  const handleToggleWorkerRole = useCallback((id: string) => {
    if (call(session, 'toggle_worker_role', stateToLua(state), id) !== true) return;
    setState(previous => ({ ...previous, slimes: previous.slimes.map(slime => slime.id === id ? { ...slime, lockedRole: slime.lockedRole === 'worker' ? null : 'worker' } : slime) }));
  }, [session, state]);

  const handleAdvanceCycle = useCallback(() => {
    const raw = call(session, 'advance_cycle', stateToLua(state));
    if (!raw || typeof raw !== 'object') { setWarning('Cycle advance failed.'); return; }
    const result = raw as Record<string, unknown>;
    const luaLogs = Array.isArray(result['logs']) ? (result['logs'] as Array<Record<string, unknown>>).map(l => ({
      id: String(l['id'] ?? ''), cycle: Number(l['cycle'] ?? 0), timestamp: String(l['timestamp'] ?? ''),
      text: String(l['text'] ?? ''), type: (l['type'] ?? 'system') as LogEntry['type'],
    })) : [];
    const luaActiveExploration = result['active_exploration'] as Record<string, unknown> | null;
    const luaRegion = result['planet_region'] as Record<string, unknown> | null;
    setState(previous => ({
      ...previous,
      cycle: Number(result['cycle'] ?? previous.cycle + 1),
      credits: Number(result['credits'] ?? previous.credits),
      wildsUnlocked: Boolean(result['wilds_unlocked'] ?? previous.wildsUnlocked ?? false),
      contracts: Array.isArray(result['contracts']) ? (result['contracts'] as Array<Record<string, unknown>>).map(c => ({
        id: String(c['id'] ?? ''), title: String(c['title'] ?? 'CONTRACT'), requiredColor: String(c['required_color'] ?? 'Red') as SlimeColor,
        requiredPattern: String(c['required_pattern'] ?? 'Solid') as SlimePattern, creditsReward: Number(c['credits_reward'] ?? 0),
        cyclesRemaining: Number(c['cycles_remaining'] ?? 0), totalCycles: Number(c['total_cycles'] ?? 0), flavorText: String(c['flavor_text'] ?? ''),
      })) : previous.contracts,
      activeExploration: luaActiveExploration ? { id: String(luaActiveExploration['id']), targetNodeId: String(luaActiveExploration['target_node_id']), slimeIds: (luaActiveExploration['slime_ids'] as string[]) ?? [], cyclesRemaining: Number(luaActiveExploration['cycles_remaining']), status: String(luaActiveExploration['status']) as 'active' } : null,
      planetRegion: luaRegion && Array.isArray(luaRegion['nodes']) ? { nodes: (luaRegion['nodes'] as Array<Record<string, unknown>>).map(luaNodeToTs), generatedAt: Number(luaRegion['generated_at'] ?? Date.now()), geometryVersion: Number(luaRegion['geometry_version'] ?? 3) } : previous.planetRegion,
      slimes: Array.isArray(result['slimes']) ? (result['slimes'] as Array<Record<string, unknown>>).map(luaSlimeToTs) : previous.slimes,
      logs: [...previous.logs, ...luaLogs].slice(-50),
    }));
  }, [session, state]);
  const handlePurchaseSeedSlime = useCallback((_color: SlimeColor) => setWarning('Seed purchase is visible but unavailable: no Lua function exists.'), []);
  const handleBuyRegent = useCallback((_pattern: SlimePattern) => setWarning('Regent purchase has no Lua action.'), []);
  const handleBuyColorRegent = useCallback((_color: SlimeColor) => setWarning('Color Regent purchase has no Lua action.'), []);
  const handleBuyTargetRegent = useCallback((_id: string) => setWarning('Target Regent purchase has no Lua action.'), []);
  const handleSellOnMarket = useCallback((slime: Slime, price: number) => {
    const value = call(session, 'sell_on_market', stateToLua(state), slime.id, price);
    const [credits, error] = Array.isArray(value) ? [value[0] as number | null, value[1] as string | null] : [null, 'Market sale failed.'];
    if (error || credits === null) { setWarning(error ?? 'Market sale failed.'); return; }
    setState(previous => ({ ...previous, credits: previous.credits + credits, slimes: previous.slimes.filter(s => s.id !== slime.id), recentMarketSales: [...(previous.recentMarketSales ?? []), { color: slime.color, cycle: previous.cycle }] }));
  }, [session, state]);

  const handleRenameSlime = useCallback((id: string, newName: string) => {
    const value = call(session, 'rename_slime', stateToLua(state), id, newName);
    const [raw, error] = luaResult(value);
    if (error || !raw) { setWarning(error ?? 'Rename failed.'); return; }
    const updated = luaSlimeToTs(raw);
    setState(previous => ({ ...previous, slimes: previous.slimes.map(s => s.id === id ? updated : s) }));
    setRenameSlimeId(null); setNewNameInput('');
  }, [session, state]);

  const handleDeliverContract = useCallback((contract: CorporateContract, slime: Slime) => {
    const value = call(session, 'deliver_contract', stateToLua(state), contract.id, slime.id);
    const [credits, error] = Array.isArray(value) ? [value[0] as number | null, value[1] as string | null] : [null, 'Contract delivery failed.'];
    if (error || credits === null) { setWarning(error ?? 'Contract delivery failed.'); return; }
    setState(previous => ({ ...previous, credits: previous.credits + credits, contracts: previous.contracts.filter(c => c.id !== contract.id), slimes: previous.slimes.filter(s => s.id !== slime.id) }));
  }, [session, state]);

  const handleLaunchDispatch = useCallback(() => { if (!selectedZoneId) return; const raw = call(session, 'launch_dispatch', stateToLua(state), selectedZoneId, dispatchDraftIds) as Record<string, unknown> | null; if (!raw) return; setState(previous => ({ ...previous, activeDispatch: { id: String(raw['id']), zoneId: String(raw['zone_id']), slimeIds: (raw['slime_ids'] as string[]) ?? [], cyclesRemaining: Number(raw['cycles_remaining']), status: String(raw['status']) as 'active' } })); }, [dispatchDraftIds, selectedZoneId, session, state]);
  const handleRetrieveCompletedPod = useCallback(() => { const value = call(session, 'retrieve_completed_dispatch', stateToLua(state)); const [raw, error] = luaResult(value); if (error || !raw) { setWarning(error ?? 'No completed dispatch.'); return; } setState(previous => ({ ...previous, activeDispatch: null })); }, [session, state]);
  const handleLaunchMediation = useCallback(() => { if (!selectedMediationNodeId) return; call(session, 'launch_mediation', stateToLua(state), selectedMediationNodeId, mediationDraftIds); }, [mediationDraftIds, selectedMediationNodeId, session, state]);
  const handleLaunchExploration = useCallback(() => {
    if (!selectedExplorationNodeId || explorationDraftIds.length === 0) return;
    const raw = call(session, 'launch_exploration', stateToLua(state), selectedExplorationNodeId, explorationDraftIds) as Record<string, unknown> | null;
    if (!raw) return;
    setState(previous => ({
      ...previous,
      activeExploration: { id: String(raw['id']), targetNodeId: String(raw['target_node_id']), slimeIds: (raw['slime_ids'] as string[]) ?? [], cyclesRemaining: Number(raw['cycles_remaining']), status: String(raw['status']) as 'active' },
      slimes: previous.slimes.map(s => explorationDraftIds.includes(s.id) ? { ...s, role: 'dispatch' as const } : s),
    }));
    setExplorationDraftIds([]);
    setSelectedExplorationNodeId(null);
  }, [explorationDraftIds, selectedExplorationNodeId, session, state]);
  const handleAssignGarrison = useCallback((nodeId: string, slimeId: string) => { const value = call(session, 'assign_garrison', stateToLua(state), nodeId, slimeId); const [raw, error] = luaResult(value); if (error || !raw) { setWarning(error ?? 'Garrison unavailable.'); return; } const node = luaNodeToTs(raw); setState(previous => ({ ...previous, planetRegion: previous.planetRegion ? { ...previous.planetRegion, nodes: previous.planetRegion.nodes.map(current => current.id === node.id ? node : current) } : previous.planetRegion, slimes: previous.slimes.map(slime => slime.id === slimeId ? { ...slime, lockedRole: 'garrison', garrisonedAt: nodeId } : slime) })); }, [session, state]);
  const handleRecallGarrison = useCallback((slimeId: string) => { const value = call(session, 'recall_garrison', stateToLua(state), slimeId); const [raw, error] = luaResult(value); if (error || !raw) { setWarning(error ?? 'Recall unavailable.'); return; } setState(previous => ({ ...previous, slimes: previous.slimes.map(slime => slime.id === slimeId ? { ...slime, lockedRole: null, garrisonedAt: null } : slime) })); }, [session, state]);

  const claim = useCallback((fn: string, nodeId: string, args: unknown[]) => {
    const value = call(session, fn, stateToLua(state), nodeId, ...args);
    const [raw, error] = luaResult(value); if (error || !raw) return { success: false, log: [error ?? 'Claim failed.'] };
    const result = raw as { success?: boolean; updated_node?: Record<string, unknown> };
    if (result.success && result.updated_node) { const node = luaNodeToTs(result.updated_node); setState(previous => ({ ...previous, planetRegion: previous.planetRegion ? { ...previous.planetRegion, nodes: previous.planetRegion.nodes.map(current => current.id === node.id ? node : current) } : previous.planetRegion })); }
    return { success: result.success === true, log: [] };
  }, [session, state]);
  const handleForceClaim = useCallback((nodeId: string, ids: string[]) => claim('force_claim_action', nodeId, [ids]), [claim]);
  const handleBribeClaim = useCallback((nodeId: string, amount: number) => claim('bribe_claim_action', nodeId, [amount]), [claim]);
  const handleConvertClaim = useCallback((nodeId: string, ids: string[]) => claim('convert_claim_action', nodeId, [ids]), [claim]);

  const primaryContent = primaryTab === 'roster' ? (
    <RosterTab {...({ state, session, selectedSlimeId, setSelectedSlimeId, setRenameSlimeId, setNewNameInput, handleRenameSlime, renameSlimeId, newNameInput, handleRecycleSlime, parentAId, parentBId, setParentAId, setParentBId, isBreedingHatching, handleInitiateBreeding, activeRegentPattern, setActiveRegentPattern, onBuyRegent: handleBuyRegent, activeRegentColor, setActiveRegentColor, onBuyColorRegent: handleBuyColorRegent, activeTargetRegent, setActiveTargetRegent, onBuyTargetRegent: handleBuyTargetRegent, handleToggleWorkerRole, lastConsumedSlimeId } as any)} />
  ) : primaryTab === 'missions' ? (
    <MissionsTab {...({ state, handleLaunchMediation, mediationDraftIds, setMediationDraftIds, selectedMediationNodeId, setSelectedMediationNodeId, activeMediationReport, setActiveMediationReport, handleLaunchExploration, explorationDraftIds, setExplorationDraftIds, selectedExplorationNodeId, setSelectedExplorationNodeId, activeExplorationReport, setActiveExplorationReport, handleAdvanceCycle, setSelectedZoneId, selectedZoneId, dispatchDraftIds, setDispatchDraftIds, realtimeRemainingMs: 0, activeDispatchReport, setActiveDispatchReport, handleLaunchDispatch, handleRetrieveCompletedPod, handleAssignGarrison, handleRecallGarrison, handleForceClaim, handleBribeClaim, handleConvertClaim } as any)} />
  ) : primaryTab === 'economy' ? (
    <EconomyTab {...({ state, handleDeliverContract, handleSellOnMarket, handleToggleWorkerRole } as any)} />
  ) : (
    <LabTab {...({ state, handleBuyUpgrade, handlePurchaseSeedSlime, activeSubTab: 'upgrades', setActiveSubTab: () => {}, selectedSlimeId: null, setSelectedSlimeId: () => {}, setRenameSlimeId: () => {}, setNewNameInput: () => {}, handleRecycleSlime: () => {}, parentAId: null, parentBId: null, setParentAId: () => {}, setParentBId: () => {}, isBreedingHatching: false, handleInitiateBreeding: () => {}, activeRegentPattern: null, setActiveRegentPattern: () => {}, onBuyRegent: () => {}, activeRegentColor: null, setActiveRegentColor: () => {}, onBuyColorRegent: () => {}, activeTargetRegent: null, setActiveTargetRegent: () => {}, onBuyTargetRegent: () => {}, handleToggleWorkerRole, handleDeliverContract: () => {}, handleSellOnMarket: () => {} } as any)} />
  );


  return (
    <GameShell gameLabel="SLIMEWORLD" gameId="slimeworld" statusArea={<div className="header-bank"><Coins size={14} /> {state.credits} Biomass</div>}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {warning && <div role="alert">{warning}</div>}
        <TabBar
          tabs={[{ id: 'roster', label: 'ROSTER' }, { id: 'missions', label: 'MISSIONS' }, { id: 'economy', label: 'ECONOMY' }, { id: 'lab', label: 'LAB' }]}
          active={primaryTab}
          onSelect={id => setPrimaryTab(id as 'roster' | 'missions' | 'economy' | 'lab')}
          variant="default"
        />
        {primaryContent}
      </div>
    </GameShell>
  );
}
