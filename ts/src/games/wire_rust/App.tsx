import { useCallback, useMemo, useState } from 'react';
import {
  Shield,
  Heart,
  Wrench,
  Dices,
  Compass,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { GameShell } from '../../components';
import { Badge, Button, Card, Panel } from '../../ui/components';
import { TitleScreen } from '../../ui/components/TitleScreen';
import { useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps, GameSession } from '../../engine/types';
import type { Room, PlayerState, EncounterResult, WireRustGameState, CardId } from './types';
import './styles.css';

const CARD_DATA: Record<CardId, { name: string; element: string; combat_mod: number; color: string }> = {
  copper_rod: { name: 'Copper Rod', element: 'Copper', combat_mod: 2, color: 'text-amber-500 border-amber-500' },
  zinc_plate: { name: 'Zinc Plate', element: 'Zinc', combat_mod: 1, color: 'text-slate-400 border-slate-400' },
  iron_block: { name: 'Iron Block', element: 'Iron', combat_mod: 3, color: 'text-orange-600 border-orange-600' },
  lead_solder: { name: 'Lead Solder', element: 'Lead', combat_mod: 0, color: 'text-gray-500 border-gray-500' },
};

function buildInitialState(session: GameSession): WireRustGameState {
  const data = session.files.data as Record<string, unknown>;
  const rooms = (data.rooms ?? {}) as Record<string, Room>;
  const player = session.executor.call('init_game', data)[0] as PlayerState;
  return {
    player,
    currentRoom: rooms[player.current_room_id] ?? rooms.junk_heap,
    combatHistory: [],
    message: 'Scrapyard entered.',
  };
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call, error } = useLuaCall(session);
  const [showTitle, setShowTitle] = useState(true);
  const data = session.files.data as Record<string, unknown>;
  const rooms = useMemo(() => (data.rooms ?? {}) as Record<string, Room>, [data.rooms]);

  // Compute active synergies in hand
  const { handSynergies, handBonus } = useMemo(() => {
    if (!state?.player?.hand) return { handSynergies: [], handBonus: 0 };
    try {
      const res = call('get_synergies', state.player.hand) as { synergies?: string[]; bonus?: number } | null;
      if (res) {
        return {
          handSynergies: res.synergies ?? [],
          handBonus: res.bonus ?? 0,
        };
      }
    } catch {
      // safe fallback
    }
    return { handSynergies: [], handBonus: 0 };
  }, [state?.player?.hand, call]);

  const handleMove = useCallback((roomId: string) => {
    if (!state) return;
    const nextPlayer = call('move_room', data, state.player, roomId) as PlayerState | null;
    if (!nextPlayer) return;
    
    setState(prev => prev ? {
      ...prev,
      player: nextPlayer,
      currentRoom: rooms[nextPlayer.current_room_id] ?? prev.currentRoom,
      message: `Moved to ${rooms[nextPlayer.current_room_id]?.name ?? roomId}`,
    } : prev);
  }, [state, call, data, rooms, setState]);

  const handlePlayCard = useCallback((cardId: CardId) => {
    if (!state) return;
    const roll = Math.floor(Math.random() * 20) + 1;
    const result = call('resolve_encounter', data, state.player, cardId, roll) as EncounterResult | null;
    if (!result) return;

    const logMsg = result.won
      ? `[WIN] ${state.currentRoom.name}: D20 ${roll} + card ${CARD_DATA[cardId].combat_mod} + chem ${result.bonus} = ${result.total_score} vs ${result.difficulty} — salvage stored!`
      : `[LOSS] ${state.currentRoom.name}: D20 ${roll} + card ${CARD_DATA[cardId].combat_mod} + chem ${result.bonus} = ${result.total_score} vs ${result.difficulty} — core integrity damaged.`;

    setState(prev => prev ? {
      ...prev,
      player: result.player,
      combatHistory: [logMsg, ...prev.combatHistory.slice(0, 49)],
      message: result.won ? 'Encounter resolved' : 'Core hit',
    } : prev);
  }, [state, call, data, setState]);

  const handleReset = useCallback(() => {
    setState(buildInitialState(session));
  }, [session, setState]);

  if (!isInitialized || !state) {
    return <div className="p-4 text-cyan-400">Booting neural connection...</div>;
  }

  if (showTitle) {
    return (
      <TitleScreen
        title="WIRE & RUST"
        pitch="Draft scrap parts, align atomic chemistry, and survive the rogue scrapyard loops."
        quote="In the scrapyard, nothing is junk. Everything has a current."
        onStart={() => setShowTitle(false)}
        menuItems={[
          { label: 'Start Run', onClick: () => setShowTitle(false) }
        ]}
      />
    );
  }

  const isGameOver = state.player.hp <= 0;

  return (
    <GameShell
      gameId="wire_rust"
      gameLabel="Wire & Rust"
      className="wire-rust-container font-mono bg-slate-950 text-slate-100 min-h-screen"
    >
      {isGameOver ? (
        <Card className="max-w-md mx-auto mt-12 p-6 border-red-500 bg-red-950/20 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">SYSTEM SHUTDOWN</h2>
          <p className="text-slate-300 mb-6">Your core integrity reached critical limits. Your scrap has rusted over.</p>
          <Button
            onClick={handleReset}
            variant="danger"
            className="w-full justify-center"
            label="Reboot Core"
            icon={<RefreshCw className="mr-2 h-4 w-4" />}
          />
        </Card>
      ) : (
        <div className="wire-rust-grid">
          {/* Left panel: Info & Navigation */}
          <div className="flex flex-col gap-4">
            <Card className="border-cyan-800 bg-slate-900/60 p-4">
              <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Compass className="h-5 w-5" /> Location
              </h3>
              <p className="text-xl font-bold text-white mb-2">{state.currentRoom.name}</p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span>Room Threat:</span>
                  <span className="text-yellow-500 font-bold">{state.currentRoom.difficulty}</span>
                </div>
              </div>
            </Card>

            <Card className="border-cyan-800 bg-slate-900/60 p-4">
              <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5" /> Vital Stats
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span>Core Integrity:</span>
                  <span className="font-bold text-red-400">{state.player.hp} HP</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, state.player.hp * 2))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Scrap Economy:</span>
                  <span className="font-bold text-yellow-400">{state.player.scrap}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                  <span>Stored Items:</span>
                  <span>{state.player.inventory?.items?.length || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="border-cyan-800 bg-slate-900/60 p-4">
              <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <ArrowRight className="h-5 w-5" /> Navigation
              </h3>
              <div className="flex flex-col gap-2">
                {state.currentRoom.connections.map(connId => (
                  <Button
                    key={connId}
                    onClick={() => handleMove(connId)}
                    variant="secondary"
                    className="justify-between"
                    label={`Move to ${rooms[connId]?.name || connId}`}
                    icon={<Badge variant="outline" className="ml-2">Threat {rooms[connId]?.difficulty}</Badge>}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Right panel: Active Room, Hand, & Log */}
          <div className="flex flex-col gap-4">
            <Card className="border-cyan-800 bg-slate-900/40 p-4 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Active Hand</h3>
                  <p className="text-xs text-slate-400">Select a part to play against the room challenge.</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">
                    Synergy Bonus: +{handBonus}
                  </div>
                  <div className="flex gap-1 justify-end mt-1">
                    {handSynergies.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No synergies</span>
                    ) : (
                      handSynergies.map(syn => (
                        <Badge key={syn} variant="success">{syn}</Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                {state.player.hand.map((cardId, index) => {
                  const info = CARD_DATA[cardId as CardId];
                  if (!info) return null;
                  return (
                    <Card
                      key={`${cardId}-${index}`}
                      onClick={() => handlePlayCard(cardId as CardId)}
                      className="border border-slate-700 bg-slate-900 hover:border-cyan-500 cursor-pointer p-3 flex flex-col justify-between h-40 transition-all"
                    >
                      <div>
                        <div className="text-sm font-bold text-white mb-1">{info.name}</div>
                        <Badge variant="outline" className="text-[10px] uppercase">{info.element}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span>Combat:</span>
                        <span className="font-bold text-cyan-400">+{info.combat_mod}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Panel className="border-cyan-950 bg-slate-950 p-3 h-48 overflow-y-auto font-mono text-xs flex flex-col gap-1">
                <div className="text-cyan-400 font-bold mb-2 flex items-center gap-1 border-b border-cyan-950 pb-1">
                  <Dices className="h-4 w-4" /> Combat History
                </div>
                {state.combatHistory.length === 0 ? (
                  <div className="text-slate-600 italic">No actions recorded.</div>
                ) : (
                  state.combatHistory.map((log, i) => (
                    <div key={i} className={log.includes('[WIN]') ? 'text-emerald-400' : 'text-red-400'}>
                      {log}
                    </div>
                  ))
                )}
              </Panel>
            </Card>
          </div>
        </div>
      )}
    </GameShell>
  );
}
