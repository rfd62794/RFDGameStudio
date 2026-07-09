import { useCallback } from 'react';
import { GameShell } from '../../components';
import { useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps, GameSession } from '../../engine/types';
import type { Room, PlayerState, FightResult, ScrapCrawlGameState } from './types';
import './styles.css';

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

function getEquippedSummary(equipped: Partial<Record<string, { tier: number; life: number; maxLife: number }>>): string {
  const parts: string[] = [];
  if (equipped.weapon) parts.push(`W:T${equipped.weapon.tier} ${equipped.weapon.life}/${equipped.weapon.maxLife}`);
  if (equipped.shield) parts.push(`S:T${equipped.shield.tier} ${equipped.shield.life}/${equipped.shield.maxLife}`);
  if (equipped.armor) parts.push(`A:T${equipped.armor.tier} ${equipped.armor.life}/${equipped.armor.maxLife}`);
  return parts.length ? parts.join(' · ') : 'Unarmed / Unequipped';
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call, error } = useLuaCall(session);

  const handleFight = useCallback(() => {
    if (!state) return;
    const data = session.files.data as Record<string, unknown>;
    const roll = Math.floor(Math.random() * 20) + 1;
    const result = call('resolve_fight', data, state.player, state.currentRoom, roll) as FightResult | null;
    if (!result) return;

    setState(prev => prev ? {
      ...prev,
      player: result.player,
      lastResult: result,
      combatHistory: [
        `${result.won ? 'WIN' : 'LOSS'} in ${prev.currentRoom.id} (roll ${result.roll}, score ${result.score.toFixed(1)} vs ${result.difficulty})`,
        ...prev.combatHistory,
      ],
    } : prev);
  }, [state, call, session, setState]);

  const handleMove = useCallback((roomId: string) => {
    if (!state) return;
    const data = session.files.data as Record<string, unknown>;
    const next = call('move_player', data, state.player, roomId) as PlayerState | null;
    if (!next) return;
    const rooms = (data.rooms ?? {}) as Record<string, Room>;
    setState(prev => prev ? {
      ...prev,
      player: next,
      currentRoom: rooms[next.currentRoomId] ?? prev.currentRoom,
      message: `Moved to ${next.currentRoomId}`,
    } : prev);
  }, [state, call, session, setState]);

  const handleCraft = useCallback((catalogId: string, tier?: number) => {
    if (!state) return;
    const data = session.files.data as Record<string, unknown>;
    const next = call('craft', data, state.player, catalogId, tier) as PlayerState | null;
    if (!next) return;
    setState(prev => prev ? {
      ...prev,
      player: next,
      message: `Crafted ${catalogId} T${next.equipped.weapon?.tier ?? next.equipped.shield?.tier ?? next.equipped.armor?.tier ?? 'ool'}`,
    } : prev);
  }, [state, call, session, setState]);

  if (!isInitialized || !state) {
    return <div className="sc-loading">Loading ScrapCrawl…</div>;
  }

  const connections = state.currentRoom.connections ?? [];

  return (
    <GameShell
      header={
        <div className="sc-header">
          <span className="sc-title">SCRAPCRAWL</span>
          <span className="sc-status">
            {state.currentRoom.name} · Scrap: {state.player.scrap} ·
            Proficiency: {state.player.proficiencyXp.weapon} · {getEquippedSummary(state.player.equipped)}
          </span>
          {error && <span className="sc-error">{error}</span>}
        </div>
      }
      footer={
        <div className="sc-footer">
          Room navigation, scrap economy, craft, and D20 combat with win-only proficiency.
        </div>
      }
    >
      <div className="sc-main">
        <div className="sc-panel">
          <h2>Actions</h2>
          <div className="sc-actions">
            <button className="sc-button" onClick={handleFight}>Fight</button>
            <button className="sc-button" onClick={() => handleCraft('beatStick')}>Craft Beat Stick</button>
            <button className="sc-button" onClick={() => handleCraft('tool')}>Craft Tool</button>
          </div>
          <h3>Move</h3>
          <div className="sc-actions">
            {connections.map(roomId => (
              <button key={roomId} className="sc-button" onClick={() => handleMove(roomId)}>
                {roomId}
              </button>
            ))}
          </div>
          {state.message && <p className="sc-message">{state.message}</p>}
          {state.lastResult && (
            <div className={`sc-badge ${state.lastResult.won ? 'sc-win' : 'sc-loss'}`}>
              {state.lastResult.won ? 'WIN' : 'LOSS'} — roll {state.lastResult.roll} → score {state.lastResult.score.toFixed(1)} vs difficulty {state.lastResult.difficulty}
            </div>
          )}
        </div>

        {state.combatHistory.length > 0 && (
          <div className="sc-panel sc-history">
            <h2>Combat Log</h2>
            <ul>
              {state.combatHistory.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GameShell>
  );
}
