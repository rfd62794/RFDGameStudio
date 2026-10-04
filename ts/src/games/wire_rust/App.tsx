import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Heart,
  Dices,
  Compass,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { GameShell } from '../../components';
import { Badge, Button, Card, Panel } from '../../ui/components';
import { TitleScreen } from '../../ui/components/TitleScreen';
import { useLuaCall, useGameState } from '../../hooks';
import { sfx } from '../../engine/shared/sfx';
import type { GameRendererProps } from '../../engine/types';
import type { Room, CardId } from './types';
import { GATE_ROOM, applyMove, applyPlayCard, canEnterRoom, newRun, runStatus } from './run';
import './styles.css';

const CARD_DATA: Record<CardId, { name: string; element: string; combat_mod: number; color: string }> = {
  copper_rod: { name: 'Copper Rod', element: 'Copper', combat_mod: 2, color: 'text-amber-500 border-amber-500' },
  zinc_plate: { name: 'Zinc Plate', element: 'Zinc', combat_mod: 1, color: 'text-slate-400 border-slate-400' },
  iron_block: { name: 'Iron Block', element: 'Iron', combat_mod: 3, color: 'text-orange-600 border-orange-600' },
  lead_solder: { name: 'Lead Solder', element: 'Lead', combat_mod: 0, color: 'text-gray-500 border-gray-500' },
};

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, newRun);
  const { call } = useLuaCall(session);
  const [showTitle, setShowTitle] = useState(true);

  // Shared SFX: muted until the first user gesture (autoplay-safe).
  useEffect(() => { sfx.autoUnlock(); }, []);

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
    const next = applyMove(session, state, roomId);
    if (next === state) return;
    sfx.play('whoosh');
    setState(next);
  }, [state, session, setState]);

  const handlePlayCard = useCallback((cardId: CardId) => {
    if (!state) return;
    const { state: next, result } = applyPlayCard(session, state, cardId);
    if (!result) return;
    sfx.play(result.won ? 'win' : 'lose');
    setState(next);
  }, [state, session, setState]);

  const handleReset = useCallback(() => {
    setState(newRun(session));
    sfx.play('click');
  }, [session, setState]);

  const handleRestart = useCallback(() => {
    handleReset();
    setShowTitle(true);
  }, [handleReset]);

  if (!isInitialized || !state) {
    return <div className="p-4 text-cyan-400">Booting neural connection...</div>;
  }

  if (showTitle) {
    return (
      <TitleScreen
        title="WIRE & RUST"
        pitch="Draft scrap parts, align atomic chemistry, and survive the rogue scrapyard loops."
        quote="In the scrapyard, nothing is junk. Everything has a current."
        menuItems={[
          { id: 'start-run', label: 'Start Run', onClick: () => { sfx.play('confirm'); setShowTitle(false); } }
        ]}
      />
    );
  }

  const status = runStatus(state);
  const isGameOver = status === 'lost';
  const isWon = status === 'won';

  return (
    <GameShell
      gameId="wire_rust"
      gameLabel="Wire & Rust"
      className="wire-rust-container font-mono bg-slate-950 text-slate-100 min-h-screen"
    >
      {isWon ? (
        <Card className="max-w-md mx-auto mt-12 p-6 border-emerald-500 bg-emerald-950/20 text-center">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">SYSTEM ONLINE</h2>
          <p className="text-slate-300 mb-2">You reached the Control Room and brought the scrapyard back to life.</p>
          <p className="text-slate-400 text-sm mb-6">
            Core integrity {state.player.hp} HP, {state.player.scrap} scrap, {state.cleared.length} rooms cleared.
          </p>
          <Button
            onClick={handleRestart}
            variant="primary"
            className="w-full justify-center"
            label="Play Again"
            icon={<RefreshCw className="mr-2 h-4 w-4" />}
          />
        </Card>
      ) : isGameOver ? (
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
                <p className="text-xs text-slate-400">Goal: reach the Control Room. It opens once you win in the Reactor Core.</p>
                <Button onClick={handleRestart} variant="secondary" size="sm" label="Restart" />
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
                {state.currentRoom.connections.map(connId => {
                  const open = canEnterRoom(state.cleared, connId);
                  return (
                    <Button
                      key={connId}
                      onClick={() => handleMove(connId)}
                      disabled={!open}
                      variant="secondary"
                      className="justify-between"
                      label={open ? `Move to ${rooms[connId]?.name || connId}` : `${rooms[connId]?.name || connId} (locked)`}
                      icon={
                        <span className="ml-2">
                          <Badge variant="muted" label={open ? `Threat ${rooms[connId]?.difficulty}` : `Win in ${rooms[GATE_ROOM]?.name ?? GATE_ROOM} first`} />
                        </span>
                      }
                    />
                  );
                })}
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
                        <Badge key={syn} variant="green" label={syn} />
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
                        <span className="text-[10px] uppercase">
                          <Badge variant="muted" label={info.element} />
                        </span>
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
