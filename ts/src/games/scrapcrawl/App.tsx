import { useCallback, useMemo } from 'react';
import {
  Dices,
  Compass,
  Terminal,
  Sword,
  Shield,
  Heart,
  Wrench,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { GameShell } from '../../components';
import { useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps, GameSession } from '../../engine/types';
import type { Room, PlayerState, FightResult, ScrapCrawlGameState, GearSlot } from './types';
import './styles.css';

const SLOTS: { key: GearSlot; label: string; icon: typeof Sword }[] = [
  { key: 'weapon', label: 'WEAP', icon: Sword },
  { key: 'shield', label: 'SHLD', icon: Shield },
  { key: 'armor', label: 'ARMR', icon: Heart },
];

const CATALOG_ORDER = [
  { id: 'beatStick', slot: 'weapon', icon: Sword },
  { id: 'shield', slot: 'shield', icon: Shield },
  { id: 'bodyArmor', slot: 'armor', icon: Heart },
  { id: 'tool', slot: undefined, icon: Wrench },
];

function buildInitialState(session: GameSession): ScrapCrawlGameState {
  const data = session.files.data as Record<string, unknown>;
  const rooms = (data.rooms ?? {}) as Record<string, Room>;
  const player = session.executor.call('init_player') as PlayerState;
  return {
    player,
    currentRoom: rooms[player.currentRoomId] ?? rooms.home_base,
    combatHistory: [],
    message: '',
  };
}

function getCatalogName(data: Record<string, unknown>, catalogId: string): string {
  const catalog = (data.catalog ?? {}) as Record<string, { name?: string }>;
  return catalog[catalogId]?.name ?? catalogId;
}

function getCatalogEntry(data: Record<string, unknown>, catalogId: string) {
  const catalog = (data.catalog ?? {}) as Record<string, {
    name: string;
    slot?: GearSlot;
    tierCost: Record<string | number, number>;
  }>;
  return catalog[catalogId];
}

function getTierCost(entry: { tierCost: Record<string | number, number> } | undefined, tier: number): number {
  if (!entry) return Infinity;
  return entry.tierCost[tier] ?? entry.tierCost[String(tier)] ?? Infinity;
}

function getGrowthFactor(session: GameSession, data: Record<string, unknown>, xp: number): number {
  try {
    return (session.executor.call('growth_factor', data, xp) as number) ?? 0.8;
  } catch {
    return 0.8;
  }
}

function pushLog(prev: ScrapCrawlGameState | null, entry: string): string[] {
  if (!prev) return [entry];
  return [entry, ...prev.combatHistory.slice(0, 49)];
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call, error } = useLuaCall(session);
  const data = session.files.data as Record<string, unknown>;
  const rooms = useMemo(() => (data.rooms ?? {}) as Record<string, Room>, [data.rooms]);

  const canFight = state?.currentRoom.interaction_types?.includes('fight') ?? false;

  const handleFight = useCallback(() => {
    if (!state || !canFight) return;
    const roll = Math.floor(Math.random() * 20) + 1;
    const result = call('resolve_fight', data, state.player, state.currentRoom, roll) as FightResult | null;
    if (!result) return;

    const roomName = state.currentRoom.name;
    const log = result.won
      ? `[WIN] ${roomName}: D20 ${result.roll} + modifier = ${result.score.toFixed(1)} vs ${result.difficulty} — gained ${result.scrapGained} scrap`
      : `[LOSS] ${roomName}: D20 ${result.roll} + modifier = ${result.score.toFixed(1)} vs ${result.difficulty}`;

    setState(prev => prev ? {
      ...prev,
      player: result.player,
      lastResult: result,
      combatHistory: pushLog(prev, log),
      message: result.won ? 'Combat won' : 'Combat lost',
    } : prev);
  }, [state, canFight, call, data, setState]);

  const handleMove = useCallback((roomId: string) => {
    if (!state) return;
    const next = call('move_player', data, state.player, roomId) as PlayerState | null;
    if (!next) return;
    setState(prev => prev ? {
      ...prev,
      player: next,
      currentRoom: rooms[next.currentRoomId] ?? prev.currentRoom,
      combatHistory: pushLog(prev, `[MOVE] ${prev.currentRoom.name} → ${rooms[roomId]?.name ?? roomId}`),
      message: `Moved to ${rooms[roomId]?.name ?? roomId}`,
    } : prev);
  }, [state, call, data, rooms, setState]);

  const handleCraft = useCallback((catalogId: string, tier?: number) => {
    if (!state) return;
    const next = call('craft', data, state.player, catalogId, tier) as PlayerState | null;
    if (!next) return;
    const entry = getCatalogEntry(data, catalogId);
    const resolvedTier = catalogId === 'tool' ? 1 : (tier ?? (next.tier2Unlocked ? 2 : 1));
    const name = entry?.name ?? catalogId;
    setState(prev => prev ? {
      ...prev,
      player: next,
      combatHistory: pushLog(prev, `[CRAFT] ${name} (Tier ${resolvedTier}) equipped`),
      message: `Crafted ${name} Tier ${resolvedTier}`,
    } : prev);
  }, [state, call, data, setState]);

  if (!isInitialized || !state) {
    return <div className="sc-loading">Loading ScrapCrawl…</div>;
  }

  const { player, currentRoom, lastResult, combatHistory } = state;

  return (
    <GameShell
      header={
        <div className="sc-header">
          <div className="sc-header-brand">
            <span className="sc-title">SCRAPCRAWL</span>
            <span className="sc-phase">PHASE A.1</span>
          </div>
          <div className="sc-header-stats">
            <div className="sc-stat">
              <span className="sc-stat-label">Scrap</span>
              <span className="sc-stat-value sc-stat-accent">{String(player.scrap).padStart(3, '0')}</span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-label">Tier 2</span>
              <span className={`sc-stat-badge ${player.tier2Unlocked ? 'sc-badge-active' : 'sc-badge-locked'}`}>
                {player.tier2Unlocked ? 'ACTIVE' : 'LOCKED'}
              </span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-label">Room</span>
              <span className="sc-stat-value">{currentRoom.name}</span>
            </div>
          </div>
          {error && <span className="sc-error">{error}</span>}
        </div>
      }
      footer={
        <div className="sc-footer">
          Disposable equipment, win-only proficiency, no repair. Fight only where hostiles exist.
        </div>
      }
    >
      <div className="sc-dashboard">
        <div className="sc-grid">
          {/* Left column — World Graph */}
          <section className="sc-panel sc-world">
            <h2 className="sc-panel-title"><Compass size={12} /> World Graph</h2>

            <div className="sc-current-room">
              <div className="sc-current-room-header">
                <span className="sc-current-room-label">Current Node</span>
                <span className="sc-current-room-id">{currentRoom.id}</span>
              </div>
              <div className="sc-current-room-name">{currentRoom.name}</div>
              <div className="sc-room-tags">
                {currentRoom.interaction_types.map(type => (
                  <span key={type} className={`sc-room-tag ${type === 'fight' ? 'sc-tag-fight' : type === 'craft' ? 'sc-tag-craft' : 'sc-tag-safe'}`}>
                    {type}
                  </span>
                ))}
                {currentRoom.difficulty !== undefined && (
                  <span className="sc-room-tag sc-tag-diff">DIFF {currentRoom.difficulty}</span>
                )}
              </div>
            </div>

            <div className="sc-interact">
              <div className="sc-interact-label">Interact Node</div>
              <button
                className="sc-button sc-fight-button"
                onClick={handleFight}
                disabled={!canFight}
                title={canFight ? 'Resolve a D20 combat encounter' : 'No combat encounters detected in this node'}
              >
                <Dices size={14} /> {canFight ? 'Resolve Combat (D20)' : 'No Combat Here'}
              </button>
            </div>

            {lastResult && (
              <div className="sc-last-roll">
                <div className="sc-last-roll-header">
                  <span>Combat Roll</span>
                  <span className={lastResult.won ? 'sc-text-win' : 'sc-text-loss'}>
                    {lastResult.won ? 'WIN' : 'LOSS'}
                  </span>
                </div>
                <div className="sc-last-roll-body">
                  <div>D20 Roll: <span>{lastResult.roll}</span></div>
                  <div>Score: <span>{lastResult.score.toFixed(1)}</span> vs <span>{lastResult.difficulty}</span></div>
                </div>
              </div>
            )}

            <div className="sc-connections">
              <div className="sc-interact-label">Adjacent Connections</div>
              <div className="sc-connection-list">
                {currentRoom.connections.map(targetId => {
                  const target = rooms[targetId];
                  const isFight = target?.interaction_types?.includes('fight') ?? false;
                  return (
                    <button
                      key={targetId}
                      className="sc-connection"
                      onClick={() => handleMove(targetId)}
                    >
                      <span className="sc-connection-name">
                        <ChevronRight size={12} /> {targetId}
                      </span>
                      <span className={`sc-connection-badge ${isFight ? 'sc-badge-fight' : 'sc-badge-safe'}`}>
                        {isFight ? 'Fight' : 'Safe'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Center column — Equipment & Trace */}
          <section className="sc-panel sc-loadout">
            <h2 className="sc-panel-title"><Terminal size={12} /> Equipment Life & Growth</h2>

            <div className="sc-equipment-table">
              <div className="sc-equipment-row sc-equipment-header">
                <span>Slot</span>
                <span>Asset</span>
                <span>Tier</span>
                <span>Durability</span>
                <span>Proficiency</span>
              </div>
              {SLOTS.map(({ key, label, icon: Icon }) => {
                const item = player.equipped[key];
                const ratio = item ? item.life / item.maxLife : 0;
                const low = item ? ratio <= 0.2 || item.life === 0 : false;
                const xp = player.proficiencyXp[key];
                const factor = getGrowthFactor(session, data, xp);
                return (
                  <div key={key} className="sc-equipment-row">
                    <span className="sc-slot-label"><Icon size={14} /> {label}</span>
                    <span className="sc-asset-name">{item ? getCatalogName(data, item.catalogId) : 'EMPTY'}</span>
                    <span>{item ? `T${item.tier}` : '-'}</span>
                    <span className="sc-durability-cell">
                      {item ? (
                        <>
                          <div className="sc-durability-bar">
                            <div
                              className={`sc-durability-fill ${low ? 'sc-durability-low' : ''}`}
                              style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
                            />
                          </div>
                          <span className="sc-durability-text">
                            {item.life}/{item.maxLife}
                            {item.life === 0 && <span className="sc-broken">BROKEN</span>}
                          </span>
                        </>
                      ) : (
                        <span className="sc-durability-empty">--/--</span>
                      )}
                    </span>
                    <span className="sc-proficiency-cell">
                      <span className="sc-proficiency-factor">x{factor.toFixed(2)}</span>
                      <div className="sc-proficiency-bar">
                        <div
                          className="sc-proficiency-fill"
                          style={{ width: `${Math.min(1, xp / 500) * 100}%` }}
                        />
                      </div>
                      <span className="sc-proficiency-text">{xp} / 500</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="sc-rule">
              <strong>Rule §2</strong> When life reaches 0, fall back to unarmed baseline. Broken state is not an error.
            </div>
          </section>

          {/* Right column — Crafting Catalog */}
          <section className="sc-panel sc-crafting">
            <h2 className="sc-panel-title"><Wrench size={12} /> Crafting Catalog</h2>
            <div className="sc-recipe-list">
              {CATALOG_ORDER.map(({ id, slot, icon: Icon }) => {
                const entry = getCatalogEntry(data, id);
                const tier1Cost = getTierCost(entry, 1);
                const tier2Cost = getTierCost(entry, 2);
                const isTool = id === 'tool';
                return (
                  <div key={id} className="sc-recipe-card">
                    <div className="sc-recipe-header">
                      <div>
                        <div className="sc-recipe-name">{entry?.name ?? id}</div>
                        <div className="sc-recipe-slot">{slot ? `${slot.toUpperCase()} SLOT` : 'ACCESS KEY'}</div>
                      </div>
                      <Icon size={16} className="sc-recipe-icon" />
                    </div>
                    <div className="sc-recipe-buttons">
                      <button
                        className={`sc-button sc-craft-button ${player.scrap >= tier1Cost ? 'sc-button-affordable' : 'sc-button-unaffordable'}`}
                        onClick={() => handleCraft(id, 1)}
                        disabled={isTool ? player.tier2Unlocked : player.scrap < tier1Cost}
                      >
                        <span className="sc-recipe-tier">Tier 1</span>
                        <span className="sc-recipe-cost">{tier1Cost} Scrap</span>
                      </button>
                      <button
                        className={`sc-button sc-craft-button ${!isTool && player.tier2Unlocked && player.scrap >= tier2Cost ? 'sc-button-affordable' : 'sc-button-unaffordable'}`}
                        onClick={() => handleCraft(id, 2)}
                        disabled={isTool ? player.tier2Unlocked : (!player.tier2Unlocked || player.scrap < tier2Cost)}
                      >
                        <span className="sc-recipe-tier">
                          {!player.tier2Unlocked && <Lock size={10} />} Tier 2
                        </span>
                        <span className="sc-recipe-cost">{tier2Cost} Scrap</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Terminal trace */}
        <section className="sc-trace">
          <h2 className="sc-panel-title"><Terminal size={12} /> Manual Trace Log</h2>
          <div className="sc-trace-body">
            {combatHistory.length === 0 && (
              <div className="sc-trace-empty">System loaded. Player initialized at Home Base.</div>
            )}
            {combatHistory.map((entry, i) => {
              let modifier = 'sc-trace-info';
              if (entry.startsWith('[WIN]')) modifier = 'sc-trace-win';
              else if (entry.startsWith('[LOSS]')) modifier = 'sc-trace-loss';
              else if (entry.startsWith('[CRAFT]')) modifier = 'sc-trace-craft';
              else if (entry.startsWith('[MOVE]')) modifier = 'sc-trace-move';
              return (
                <div key={i} className={`sc-trace-line ${modifier}`}>
                  {entry}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </GameShell>
  );
}

