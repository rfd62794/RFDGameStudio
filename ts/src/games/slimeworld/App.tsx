import { useCallback, useEffect, useState, useRef } from 'react';
import './styles.css';
import { Coins, FastForward, X, Sparkles } from 'lucide-react';
import { GameShell } from '../../components';
import { call } from '../../engine/runtime';
import { navigateTo } from '../../arcade/routing';
import { STANDALONE_BUILD_GAMES } from '../../games/registry';
import type { GameRendererProps } from '../../engine/types';
import { Button, ErrorBox, MoreGamesByMe, TabBar } from '../../ui/components';
import { LabTab } from './components/LabTab';
import { TUTORIAL_IDS, TUTORIAL_CONTENT, shouldFireTutorial, markTutorialShown, prepopulateAllTutorials } from './tutorial';
import { RosterTab } from './components/RosterTab';
import { MissionsTab } from './components/MissionsTab';
import { EconomyTab } from './components/EconomyTab';
import { AlertBox } from './components/AlertBox';
import { luaNodeToTs, luaSlimeToTs, luaPetitionToTs, luaFavorToTs, stateToLua, type CombatZone, type CorporateContract, type LabState, type LogEntry, type Mission, type Slime, type SlimeColor, type SlimePattern } from './types';
import { generatePlanetRegion } from './planetRegion';

const COLORS: SlimeColor[] = ['Red', 'Blue', 'Yellow', 'Purple', 'Orange', 'Green', 'Gray'];
const HUES: Record<SlimeColor, number> = { Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300, Gray: 0 };

function buildColorSpecs(data: Record<string, unknown>): Record<string, { base_stats: Record<string, number>; growth: Record<string, number> }> {
  const specs: Record<string, { base_stats: Record<string, number>; growth: Record<string, number> }> = {};
  const cultures = data['cultures'] as Record<string, Record<string, unknown>>;
  if (cultures) {
    for (const key of Object.keys(cultures)) {
      const c = cultures[key];
      const color = c['color'] as string;
      specs[color] = { base_stats: c['base_stats'] as Record<string, number>, growth: c['growth'] as Record<string, number> };
    }
  }
  const neutralTraits = data['neutral_traits'] as Record<string, Record<string, unknown>>;
  if (neutralTraits) {
    const gray = neutralTraits['gray'];
    if (gray) specs['Gray'] = { base_stats: gray['base_stats'] as Record<string, number>, growth: gray['growth'] as Record<string, number> };
  }
  return specs;
}

// SEED_SHAPE_DEFAULTS — mirrors the Lua table for TS-side field defaults
// that create_seed_slime does not set on its return object.
const SEED_SHAPE_DEFAULTS: Record<string, { vertexCount: number; irregularity: number }> = {
  Red: { vertexCount: 3, irregularity: 10 },
  Orange: { vertexCount: 3, irregularity: 15 },
  Yellow: { vertexCount: 6, irregularity: 10 },
  Green: { vertexCount: 6, irregularity: 15 },
  Purple: { vertexCount: 4, irregularity: 15 },
  Blue: { vertexCount: 4, irregularity: 10 },
  Gray: { vertexCount: 4, irregularity: 20 },
};


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

const SAVE_KEY = 'slimeworld_save';

function saveState(state: LabState): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

function loadSavedState(): LabState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LabState;
  } catch { return null; }
}

export function initialState(session: GameRendererProps['session']): LabState {
  const data = session.files.data as Record<string, unknown>;
  const lab = (data['lab'] ?? {}) as Record<string, unknown>;
  const starters = (lab['starter_slimes'] ?? []) as Array<Record<string, unknown>>;
  const relationships = (lab['color_relationships'] ?? {}) as Record<SlimeColor, number>;
  const colorSpecs = buildColorSpecs(data);
  const starterSlimes = starters.map((starter, index) => {
    const color = (starter['color'] ?? COLORS[index % COLORS.length]) as SlimeColor;
    const [raw] = call(session, 'create_seed_slime', color, 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
    if (!raw) throw new Error(`create_seed_slime returned null for starter ${index}`);
    const lua = luaSlimeToTs(raw);
    const shapeDefaults = SEED_SHAPE_DEFAULTS[color] ?? { vertexCount: 4, irregularity: 10 };
    // Override id and name with the real, intended starter values.
    // create_seed_slime internally calls generate_slime_name() which produces
    // a random name; the starter's configured name from data.yaml must win.
    return {
      ...lua,
      id: `starter_${index}`,
      name: String(starter['name'] ?? `Specimen-${index + 1}`),
      // Fields create_seed_slime does not set — real TS-side defaults
      diffusionRatio: lua.diffusionRatio || 20,
      amplitude: lua.amplitude || 40,
      accentHue: lua.accentHue || HUES[color],
      vertexCount: lua.vertexCount || shapeDefaults.vertexCount,
      irregularity: lua.irregularity || shapeDefaults.irregularity,
      createdAt: lua.createdAt || Date.now(),
      stage: lua.stage ?? 'Hatchling',
    } as Slime;
  });
  const colorCodex: Record<SlimeColor, { discovered: boolean }> = {} as Record<SlimeColor, { discovered: boolean }>;
  const patternCodex: Record<SlimePattern, { discovered: boolean }> = {} as Record<SlimePattern, { discovered: boolean }>;
  for (const slime of starterSlimes) {
    colorCodex[slime.color] = { discovered: true };
    patternCodex[slime.pattern] = { discovered: true };
  }
  return { cycle: Number(lab['starting_cycle'] ?? 1), credits: Number(lab['starting_credits'] ?? 100), rosterCap: Number(lab['starting_roster_cap'] ?? 10), breedingSuccessRateModifier: Number(lab['starting_breeding_success_rate_modifier'] ?? 0), slimes: starterSlimes, contracts: INITIAL_CONTRACTS, zones: INITIAL_ZONES, activeDispatch: null, logs: [], activeMediation: null, activeExploration: null, planetRegion: generatePlanetRegion(), wildsUnlocked: false, hasAutoFeeder: false, colorRelationships: relationships, recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {}, petitions: [], colorCodex, patternCodex };
}

function luaResult(value: unknown[]): [Record<string, unknown> | null, string | null] {
  return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] as string | undefined) ?? null];
}

export default function App({ session }: GameRendererProps) {
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [gamePhase, setGamePhase] = useState<'opening' | 'hub'>(() => {
    const saved = loadSavedState();
    if (saved) {
      // Continue — skip opening beat, pre-populate tutorials (New Game Guard)
      return 'hub';
    }
    // New Campaign — show opening beat
    return 'opening';
  });
  const [state, setState] = useState<LabState>(() => {
    const saved = loadSavedState();
    if (saved) {
      // New Game Guard: pre-populate all tutorial IDs as shown
      return { ...saved, shownTutorials: prepopulateAllTutorials() };
    }
    return initialState(session);
  });
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
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
  const [pendingDisposalFavorId, setPendingDisposalFavorId] = useState<string | null>(null);
  const [disposalConfirmSlimeId, setDisposalConfirmSlimeId] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<LogEntry[]>([]);
  const prevRegionUnlocksRef = useRef<Record<string, boolean> | undefined>(state.regionUnlocks);
  const t1FiredRef = useRef(false);

  useEffect(() => { if (!selectedSlimeId && state.slimes[0]) setSelectedSlimeId(state.slimes[0].id); }, [selectedSlimeId, state.slimes]);

  // T-1: fires on first Hub view (fresh game only)
  useEffect(() => {
    if (gamePhase !== 'hub') return;
    if (t1FiredRef.current) return;
    t1FiredRef.current = true;
    if (shouldFireTutorial(state.shownTutorials, TUTORIAL_IDS.T1_HUB_VIEW)) {
      setActiveTutorial(TUTORIAL_IDS.T1_HUB_VIEW);
      setState(prev => ({ ...prev, shownTutorials: markTutorialShown(prev.shownTutorials, TUTORIAL_IDS.T1_HUB_VIEW) }));
    }
  }, [gamePhase, state.shownTutorials]);

  // T-3: fires on first region unlock
  useEffect(() => {
    const prev = prevRegionUnlocksRef.current;
    const curr = state.regionUnlocks;
    if (!prev && curr) {
      // First time regionUnlocks is set
      const newKeys = Object.keys(curr).filter(k => curr[k]);
      if (newKeys.length > 0 && shouldFireTutorial(state.shownTutorials, TUTORIAL_IDS.T3_REGION_UNLOCK)) {
        setActiveTutorial(TUTORIAL_IDS.T3_REGION_UNLOCK);
        setState(prev => ({ ...prev, shownTutorials: markTutorialShown(prev.shownTutorials, TUTORIAL_IDS.T3_REGION_UNLOCK) }));
      }
    } else if (prev && curr) {
      // Check for newly added unlocks
      const newKeys = Object.keys(curr).filter(k => curr[k] && !prev[k]);
      if (newKeys.length > 0 && shouldFireTutorial(state.shownTutorials, TUTORIAL_IDS.T3_REGION_UNLOCK)) {
        setActiveTutorial(TUTORIAL_IDS.T3_REGION_UNLOCK);
        setState(prev => ({ ...prev, shownTutorials: markTutorialShown(prev.shownTutorials, TUTORIAL_IDS.T3_REGION_UNLOCK) }));
      }
    }
    prevRegionUnlocksRef.current = curr;
  }, [state.regionUnlocks, state.shownTutorials]);

  // Auto-save on state change (after opening beat)
  useEffect(() => {
    if (gamePhase === 'hub') saveState(state);
  }, [state, gamePhase]);

  const handleInitiateBreeding = useCallback(() => {
    if (!parentAId || !parentBId) return;
    setIsBreedingHatching(true);
    const data = session.files.data as Record<string, unknown>;
    const colorSpecs = buildColorSpecs(data);
    const value = call(session, 'initiate_breeding', stateToLua(state), parentAId, parentBId, 0, data['color_targets'], activeTargetRegent, data['shape_targets'], null, colorSpecs, data['region_locks'], data['accent_targets']);
    const [raw, error] = luaResult(value);
    if (!raw || error) { setWarning(error ?? 'Breeding failed.'); setIsBreedingHatching(false); return; }
    const child = luaSlimeToTs(raw);
    const childRegionUnlocks = (raw['region_unlocks'] ?? []) as string[];
    setLastConsumedSlimeId(child.consumedSlimeId ?? null);
    setState(previous => {
      const filteredSlimes = child.consumedSlimeId
        ? previous.slimes.filter(s => s.id !== child.consumedSlimeId)
        : previous.slimes;
      const newColorTargetCodex = { ...(previous.colorTargetCodex ?? {}) };
      if (child.matchedTargetId) newColorTargetCodex[child.matchedTargetId] = true;
      const newShapeTargetCodex = { ...(previous.shapeTargetCodex ?? {}) };
      if (child.matchedShapeTargetId) newShapeTargetCodex[child.matchedShapeTargetId] = true;
      const newColorCodex = { ...(previous.colorCodex ?? {}), [child.color]: { discovered: true } } as Record<SlimeColor, { discovered: boolean }>;
      const newPatternCodex = { ...(previous.patternCodex ?? {}), [child.pattern]: { discovered: true } } as Record<SlimePattern, { discovered: boolean }>;
      const newRegionUnlocks = { ...(previous.regionUnlocks ?? {}) };
      for (const nodeId of childRegionUnlocks) { newRegionUnlocks[nodeId] = true; }
      return {
        ...previous,
        credits: Math.max(0, previous.credits - 10),
        slimes: [...filteredSlimes, child],
        colorTargetCodex: newColorTargetCodex,
        shapeTargetCodex: newShapeTargetCodex,
        colorCodex: newColorCodex,
        patternCodex: newPatternCodex,
        regionUnlocks: newRegionUnlocks,
      };
    });
    setParentAId(null); setParentBId(null); setIsBreedingHatching(false);
  }, [activeTargetRegent, parentAId, parentBId, session, state]);

  const handleRecycleSlime = useCallback((id: string) => {
    const [credits, error] = call(session, 'recycle_slime', stateToLua(state), id) as [number | null, string | null];
    if (error || credits === null) { setWarning(error ?? 'Recycle failed.'); return; }
    setState(previous => ({ ...previous, credits: previous.credits + credits, slimes: previous.slimes.filter(slime => slime.id !== id) }));
  }, [session, state]);

  const handleBuyUpgrade = useCallback((type: 'capacity' | 'stabilizer' | 'autofeeder') => {
    const [ok] = call(session, 'buy_upgrade', stateToLua(state), type);
    if (ok !== true) { setWarning('Upgrade could not be purchased.'); return; }
    const costs = { capacity: 150, stabilizer: 200, autofeeder: 250 };
    setState(previous => ({ ...previous, credits: previous.credits - costs[type], rosterCap: type === 'capacity' ? previous.rosterCap + 5 : previous.rosterCap, breedingSuccessRateModifier: type === 'stabilizer' ? previous.breedingSuccessRateModifier + 0.1 : previous.breedingSuccessRateModifier, hasAutoFeeder: type === 'autofeeder' ? true : previous.hasAutoFeeder }));
  }, [session, state]);

  const handleToggleWorkerRole = useCallback((id: string) => {
    if (call(session, 'toggle_worker_role', stateToLua(state), id)[0] !== true) return;
    setState(previous => ({ ...previous, slimes: previous.slimes.map(slime => slime.id === id ? { ...slime, lockedRole: slime.lockedRole === 'worker' ? null : 'worker' } : slime) }));
  }, [session, state]);

  const handleAdvanceCycle = useCallback(() => {
    const data = session.files.data as Record<string, unknown>;
    const colorSpecs = buildColorSpecs(data);
    const [raw] = call(session, 'advance_cycle', stateToLua(state), colorSpecs);
    if (!raw || typeof raw !== 'object') { setWarning('Cycle advance failed.'); return; }
    const result = raw as Record<string, unknown>;
    const luaLogs = Array.isArray(result['logs']) ? (result['logs'] as Array<Record<string, unknown>>).map(l => ({
      id: String(l['id'] ?? ''), cycle: Number(l['cycle'] ?? 0), timestamp: String(l['timestamp'] ?? ''),
      text: String(l['text'] ?? ''), type: (l['type'] ?? 'system') as LogEntry['type'],
    })) : [];
    const luaActiveExploration = result['active_exploration'] as Record<string, unknown> | null;
    const luaActiveMediation = result['active_mediation'] as Record<string, unknown> | null;
    const luaActiveDispatch = result['active_dispatch'] as Record<string, unknown> | null;
    const luaZones = Array.isArray(result['zones']) ? (result['zones'] as Array<Record<string, unknown>>) : null;
    const luaRegion = result['planet_region'] as Record<string, unknown> | null;
    const missionFromLua = (m: Record<string, unknown>) => ({
      id: String(m['id'] ?? ''), zoneId: m['zone_id'] as string | undefined, targetNodeId: m['target_node_id'] as string | undefined,
      slimeIds: (m['slime_ids'] as string[]) ?? [], cyclesRemaining: Number(m['cycles_remaining'] ?? 0),
      status: String(m['status'] ?? 'active') as Mission['status'],
    });
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
      activeExploration: luaActiveExploration ? missionFromLua(luaActiveExploration) : null,
      activeMediation: luaActiveMediation ? missionFromLua(luaActiveMediation) : null,
      activeDispatch: luaActiveDispatch ? missionFromLua(luaActiveDispatch) : null,
      zones: luaZones ? luaZones.map(z => ({
        id: String(z['id'] ?? ''), name: String(z['name'] ?? ''), requiredColor: String(z['requiredColor'] ?? 'Red') as SlimeColor,
        recommendedLevel: Number(z['recommendedLevel'] ?? 1), difficulty: Number(z['difficulty'] ?? 1),
        creditsReward: Number(z['creditsReward'] ?? 0), xpReward: Number(z['xpReward'] ?? 0),
        isUnlocked: Boolean(z['isUnlocked'] ?? false), isFirstClearCompleted: Boolean(z['isFirstClearCompleted'] ?? false),
        flavorText: String(z['flavorText'] ?? ''),
      })) : previous.zones,
      planetRegion: luaRegion && Array.isArray(luaRegion['nodes']) ? { nodes: (luaRegion['nodes'] as Array<Record<string, unknown>>).map(luaNodeToTs), generatedAt: Number(luaRegion['generated_at'] ?? Date.now()), geometryVersion: Number(luaRegion['geometry_version'] ?? 3) } : previous.planetRegion,
      slimes: Array.isArray(result['slimes']) ? (result['slimes'] as Array<Record<string, unknown>>).map(luaSlimeToTs) : previous.slimes,
      petitions: Array.isArray(result['petitions']) ? (result['petitions'] as Array<Record<string, unknown>>).map(luaPetitionToTs) : previous.petitions,
      colorRelationships: (result['color_relationships'] ?? previous.colorRelationships) as Record<SlimeColor, number> | undefined,
      favors: Array.isArray(result['favors']) ? (result['favors'] as Array<Record<string, unknown>>).map(luaFavorToTs) : previous.favors,
      logs: [...previous.logs, ...luaLogs].slice(-50),
    }));
    const strayAlerts = luaLogs.filter(l => l.type === 'combat' && l.text.startsWith('STRAY DETECTION'));
    const fealtyAlerts = luaLogs.filter(l => l.type === 'system' && l.text.startsWith('FEALTY:'));
    if (strayAlerts.length > 0 || fealtyAlerts.length > 0) {
      setActiveAlerts(prev => [...prev, ...strayAlerts, ...fealtyAlerts]);
    }
  }, [session, state]);
  const handlePurchaseSeedSlime = useCallback((color: SlimeColor) => {
    const data = session.files.data as Record<string, unknown>;
    const colorSpecs = buildColorSpecs(data);
    const [raw, err] = call(session, 'purchase_seed_slime', stateToLua(state), color, colorSpecs) as [Record<string, unknown> | null, string | null];
    if (err) { setWarning(err); return; }
    if (!raw || typeof raw !== 'object') { setWarning('Seed purchase failed.'); return; }
    const newSlime = luaSlimeToTs(raw as Record<string, unknown>);
    const shapeDefaults = SEED_SHAPE_DEFAULTS[color] ?? { vertexCount: 4, irregularity: 10 };
    setState(prev => ({
      ...prev,
      credits: prev.credits - 50,
      slimes: [...prev.slimes, {
        ...newSlime,
        diffusionRatio: newSlime.diffusionRatio || 20,
        amplitude: newSlime.amplitude || 40,
        accentHue: newSlime.accentHue || HUES[color],
        vertexCount: newSlime.vertexCount || shapeDefaults.vertexCount,
        irregularity: newSlime.irregularity || shapeDefaults.irregularity,
      }],
      logs: [...prev.logs, {
        id: `log_seed_${Date.now()}`, cycle: prev.cycle, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        text: `RECRUITMENT: Dispensed starter specimen ${newSlime.name} (${color} Core).`, type: 'system' as LogEntry['type'],
      }].slice(-50),
    }));
  }, [session, state]);
  const handleBuyRegent = useCallback((_pattern: SlimePattern) => setWarning('Regent purchase has no Lua action.'), []);
  const handleBuyColorRegent = useCallback((_color: SlimeColor) => setWarning('Color Regent purchase has no Lua action.'), []);
  const handleBuyTargetRegent = useCallback((_id: string) => setWarning('Target Regent purchase has no Lua action.'), []);
  const handleSellOnMarket = useCallback((slime: Slime, price: number) => {
    const [credits, error] = call(session, 'sell_on_market', stateToLua(state), slime.id, price) as [number | null, string | null];
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
    const [credits, error] = call(session, 'deliver_contract', stateToLua(state), contract.id, slime.id) as [number | null, string | null];
    if (error || credits === null) { setWarning(error ?? 'Contract delivery failed.'); return; }
    setState(previous => ({ ...previous, credits: previous.credits + credits, contracts: previous.contracts.filter(c => c.id !== contract.id), slimes: previous.slimes.filter(s => s.id !== slime.id) }));
  }, [session, state]);

  const handleLaunchDispatch = useCallback(() => { if (!selectedZoneId) return; const [raw] = call(session, 'launch_dispatch', stateToLua(state), selectedZoneId, dispatchDraftIds); if (!raw) return; const r = raw as Record<string, unknown>; setState(previous => ({ ...previous, activeDispatch: { id: String(r['id']), zoneId: String(r['zone_id']), slimeIds: (r['slime_ids'] as string[]) ?? [], cyclesRemaining: Number(r['cycles_remaining']), status: String(r['status']) as 'active' } })); }, [dispatchDraftIds, selectedZoneId, session, state]);
  const handleRetrieveCompletedPod = useCallback(() => { const value = call(session, 'retrieve_completed_dispatch', stateToLua(state)); const [raw, error] = luaResult(value); if (error || !raw) { setWarning(error ?? 'No completed dispatch.'); return; } setState(previous => ({ ...previous, activeDispatch: null })); }, [session, state]);
  const handleLaunchMediation = useCallback(() => {
    if (!selectedMediationNodeId) return;
    const data = session.files.data as Record<string, unknown>;
    const [raw, error] = call(session, 'launch_mediation', stateToLua(state), selectedMediationNodeId, mediationDraftIds, data['region_locks']) as [Record<string, unknown> | null, string | null];
    if (error || !raw) { setWarning(error ?? 'Region is locked.'); return; }
    const r = raw as Record<string, unknown>;
    setState(previous => ({
      ...previous,
      activeMediation: { id: String(r['id']), targetNodeId: String(r['target_node_id']), slimeIds: (r['slime_ids'] as string[]) ?? [], cyclesRemaining: Number(r['cycles_remaining']), status: String(r['status']) as 'active' },
    }));
    setMediationDraftIds([]);
    setSelectedMediationNodeId(null);
  }, [mediationDraftIds, selectedMediationNodeId, session, state]);
  const handleLaunchExploration = useCallback(() => {
    if (!selectedExplorationNodeId || explorationDraftIds.length === 0) return;
    const data = session.files.data as Record<string, unknown>;
    const [raw, error] = call(session, 'launch_exploration', stateToLua(state), selectedExplorationNodeId, explorationDraftIds, data['region_locks']) as [Record<string, unknown> | null, string | null];
    if (error || !raw) { setWarning(error ?? 'Region is locked.'); return; }
    const r = raw as Record<string, unknown>;
    setState(previous => ({
      ...previous,
      activeExploration: { id: String(r['id']), targetNodeId: String(r['target_node_id']), slimeIds: (r['slime_ids'] as string[]) ?? [], cyclesRemaining: Number(r['cycles_remaining']), status: String(r['status']) as 'active' },
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

  const handleFulfillPetition = useCallback((petitionId: string, slimeId: string) => {
    const raw = call(session, 'fulfill_petition', stateToLua(state), petitionId, slimeId);
    const [result, error] = luaResult(raw);
    if (!result || error) { setWarning(error ?? 'Petition fulfillment failed.'); return; }
    setState(previous => ({
      ...previous,
      credits: previous.credits + Number(result['payout'] ?? 0),
      petitions: previous.petitions?.filter(p => p.id !== petitionId) ?? [],
    }));
  }, [session, state]);

  const handleDisposeSlime = useCallback((favorId: string, slimeId: string) => {
    const value = call(session, 'resolve_disposal', stateToLua(state), slimeId, favorId);
    const [ok, error] = luaResult(value);
    if (!ok || error) { setWarning(error ?? 'Disposal failed.'); return; }
    setState(previous => ({
      ...previous,
      slimes: previous.slimes.filter(s => s.id !== slimeId),
      favors: previous.favors?.filter(f => f.id !== favorId) ?? [],
    }));
    setPendingDisposalFavorId(null);
    setDisposalConfirmSlimeId(null);
  }, [session, state]);

  // T-2: fires when breeding/roster screen opened with an unlocked-region target visible
  useEffect(() => {
    if (gamePhase !== 'hub') return;
    if (primaryTab !== 'roster') return;
    if (!shouldFireTutorial(state.shownTutorials, TUTORIAL_IDS.T2_BREEDING_SCREEN)) return;
    // Check if any region lock target is visible (any locked region exists)
    const regionLockData = (session.files.data as Record<string, unknown>)['region_locks'] as Array<Record<string, unknown>> | undefined;
    if (regionLockData && regionLockData.length > 0) {
      setActiveTutorial(TUTORIAL_IDS.T2_BREEDING_SCREEN);
      setState(prev => ({ ...prev, shownTutorials: markTutorialShown(prev.shownTutorials, TUTORIAL_IDS.T2_BREEDING_SCREEN) }));
    }
  }, [primaryTab, gamePhase, state.shownTutorials, session]);

  // Gate Missions/Economy tab visibility on the real "at least one region
  // unlocked" signal — the same underlying state T3_REGION_UNLOCK's own
  // trigger derives from (state.regionUnlocks), not a tutorial-shown proxy.
  // Persisted as part of LabState, so returning players with real existing
  // progress see all four tabs immediately on load.
  const hasUnlockedRegion = Object.values(state.regionUnlocks ?? {}).some(Boolean);
  const visibleTabs = hasUnlockedRegion
    ? [{ id: 'roster', label: 'ROSTER' }, { id: 'missions', label: 'MISSIONS' }, { id: 'economy', label: 'ECONOMY' }, { id: 'lab', label: 'LAB' }]
    : [{ id: 'roster', label: 'ROSTER' }, { id: 'lab', label: 'LAB' }];

  const primaryContent = primaryTab === 'roster' ? (
    <RosterTab {...({ state, session, selectedSlimeId, setSelectedSlimeId, setRenameSlimeId, setNewNameInput, handleRenameSlime, renameSlimeId, newNameInput, handleRecycleSlime, parentAId, parentBId, setParentAId, setParentBId, isBreedingHatching, handleInitiateBreeding, activeRegentPattern, setActiveRegentPattern, onBuyRegent: handleBuyRegent, activeRegentColor, setActiveRegentColor, onBuyColorRegent: handleBuyColorRegent, activeTargetRegent, setActiveTargetRegent, onBuyTargetRegent: handleBuyTargetRegent, handleToggleWorkerRole, lastConsumedSlimeId } as any)} />
  ) : primaryTab === 'missions' ? (
    <MissionsTab {...({ state, handleLaunchMediation, mediationDraftIds, setMediationDraftIds, selectedMediationNodeId, setSelectedMediationNodeId, activeMediationReport, setActiveMediationReport, handleLaunchExploration, explorationDraftIds, setExplorationDraftIds, selectedExplorationNodeId, setSelectedExplorationNodeId, activeExplorationReport, setActiveExplorationReport, handleAdvanceCycle, setSelectedZoneId, selectedZoneId, dispatchDraftIds, setDispatchDraftIds, realtimeRemainingMs: 0, activeDispatchReport, setActiveDispatchReport, handleLaunchDispatch, handleRetrieveCompletedPod, handleAssignGarrison, handleRecallGarrison, handleForceClaim, handleBribeClaim, handleConvertClaim, pendingDisposalFavorId, setPendingDisposalFavorId, disposalConfirmSlimeId, setDisposalConfirmSlimeId, handleDisposeSlime, regionLockNodeIds: ((session.files.data as Record<string, unknown>)['region_locks'] as Array<Record<string, unknown>>)?.map(l => l['node_id']) ?? [] } as any)} />
  ) : primaryTab === 'economy' ? (
    <EconomyTab {...({ state, handleDeliverContract, handleSellOnMarket, handleToggleWorkerRole, handleFulfillPetition } as any)} />
  ) : (
    <LabTab {...({ state, handleBuyUpgrade, handlePurchaseSeedSlime, activeSubTab: 'upgrades', setActiveSubTab: () => {}, selectedSlimeId: null, setSelectedSlimeId: () => {}, setRenameSlimeId: () => {}, setNewNameInput: () => {}, handleRecycleSlime: () => {}, parentAId: null, parentBId: null, setParentAId: () => {}, setParentBId: () => {}, isBreedingHatching: false, handleInitiateBreeding: () => {}, activeRegentPattern: null, setActiveRegentPattern: () => {}, onBuyRegent: () => {}, activeRegentColor: null, setActiveRegentColor: () => {}, onBuyColorRegent: () => {}, activeTargetRegent: null, setActiveTargetRegent: () => {}, onBuyTargetRegent: () => {}, handleToggleWorkerRole, handleDeliverContract: () => {}, handleSellOnMarket: () => {} } as any)} />
  );


  // Opening beat — New Campaign only, never on Continue
  if (gamePhase === 'opening') {
    return (
      <GameShell gameLabel="SLIMEWORLD" gameId="slimeworld" statusArea={<span className="text-slate-400 font-mono text-xs">New Campaign</span>}>
        <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
          <div className="text-center space-y-4 max-w-md">
            <Sparkles className="w-12 h-12 mx-auto text-orange-400" />
            <h2 className="text-xl font-bold text-slate-200 font-mono">EMBER STATION</h2>
            <p className="text-sm text-slate-400 font-mono leading-relaxed">
              Ember is your home. Two regions — Thornward and Abyssal Ember — lie within reach, but they are locked. Reach them to open them.
            </p>
          </div>
          <Button id="slimeworld-begin" label="Begin" variant="primary" onClick={() => setGamePhase('hub')} />
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell
      gameLabel="SLIMEWORLD"
      gameId="slimeworld"
      statusArea={<div className="header-bank flex items-center gap-3"><span className="text-slate-400 font-mono text-xs">Cycle {state.cycle}</span><Button id="slimeworld-advance-cycle" label="Advance Cycle" icon={<FastForward className="w-3.5 h-3.5" />} onClick={handleAdvanceCycle} variant="primary" size="sm" /><span className="flex items-center gap-1"><Coins size={14} /> {state.credits} Biomass</span></div>}
      footer={
        <MoreGamesByMe
          mode={mode}
          currentGameId="slimeworld"
          games={STANDALONE_BUILD_GAMES}
          onSelectGame={navigateTo}
          arcadeBaseUrl={arcadeBaseUrl}
        />
      }
    >
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {warning && <ErrorBox message={warning} />}
        <TabBar
          tabs={visibleTabs}
          active={primaryTab}
          onSelect={id => setPrimaryTab(id as 'roster' | 'missions' | 'economy' | 'lab')}
          variant="default"
        />
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {primaryContent}
        </div>
        {activeTutorial && TUTORIAL_CONTENT[activeTutorial] && (
          <div className="absolute top-4 right-4 z-50 max-w-xs p-4 rounded-lg border border-blue-500/40 bg-slate-900/95 shadow-xl">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold text-blue-300 font-mono">{TUTORIAL_CONTENT[activeTutorial].title}</h3>
              <button onClick={() => setActiveTutorial(null)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">{TUTORIAL_CONTENT[activeTutorial].body}</p>
            <button onClick={() => setActiveTutorial(null)} className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-mono">Dismiss</button>
          </div>
        )}
        {activeAlerts.length > 0 && (
          <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
            {activeAlerts.map(alert => (
              <AlertBox key={alert.id} entry={alert} onDismiss={(id) => setActiveAlerts(prev => prev.filter(a => a.id !== id))} />
            ))}
          </div>
        )}
      </div>
    </GameShell>
  );
}
