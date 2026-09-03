import { useCallback, useMemo, useState } from 'react';
import {
  Shield,
  Zap,
  Target,
  Sword,
  Compass,
  ArrowRight,
  RefreshCw,
  Cpu,
  Lock,
} from 'lucide-react';
import { GameShell } from '../../components';
import { Badge, Button, Card, Panel } from '../../ui/components';
import { TitleScreen } from '../../ui/components/TitleScreen';
import { useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps, GameSession } from '../../engine/types';
import type { ChokePointGameState, TowerType, Tower, Enemy } from './types';
import './styles.css';

const GRID_W = 6;
const GRID_H = 5;
const CORE_X = 1;
const CORE_Y = 3;

function buildInitialState(session: GameSession): ChokePointGameState {
  const data = session.files.data as Record<string, unknown>;
  return session.executor.call('init_game', data)[0] as ChokePointGameState;
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call, error } = useLuaCall(session);
  const [showTitle, setShowTitle] = useState(true);
  const [selectedTower, setSelectedTower] = useState<TowerType>('blocker');
  
  const data = session.files.data as Record<string, unknown>;

  const handleCellClick = useCallback((x: number, y: number) => {
    if (!state) return;
    const nextState = call('place_tower', data, state, selectedTower, x, y) as ChokePointGameState | null;
    if (nextState) {
      setState(nextState);
    }
  }, [state, selectedTower, call, data, setState]);

  const handleCommit = useCallback(() => {
    if (!state) return;
    const nextState = call('commit_turn', data, state) as ChokePointGameState | null;
    if (nextState) {
      setState(nextState);
    }
  }, [state, call, data, setState]);

  const handleReset = useCallback(() => {
    setState(buildInitialState(session));
  }, [session, setState]);

  // Construct a flat list of grid cells for easy rendering
  const gridCells = useMemo(() => {
    const cells = [];
    for (let y = 1; y <= GRID_H; y++) {
      for (let x = 1; x <= GRID_W; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }, []);

  if (!isInitialized || !state) {
    return <div className="p-4 text-red-400 font-mono">Initializing defense grid...</div>;
  }

  if (showTitle) {
    return (
      <TitleScreen
        title="CHOKE POINT"
        pitch="Turn-based grid defense. Intercept automated threats with perfect foresight."
        quote="Analyze their vectors. Lock their trajectories. Construct the choke point."
        onStart={() => setShowTitle(false)}
        menuItems={[
          { label: 'Establish Connection', onClick: () => setShowTitle(false) }
        ]}
      />
    );
  }

  const isGameOver = state.core_hp <= 0;

  return (
    <GameShell
      gameId="choke_point"
      gameLabel="Choke Point"
      className="choke-point-container font-mono bg-slate-950 text-slate-100 min-h-screen p-4"
    >
      {isGameOver ? (
        <Card className="max-w-md mx-auto mt-12 p-6 border-red-500 bg-red-950/20 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4 font-mono">CORE BREACHED</h2>
          <p className="text-slate-300 mb-6 font-mono">The neural defense core collapsed. Hostile units bypassed your lines.</p>
          <Button
            onClick={handleReset}
            variant="danger"
            className="w-full justify-center"
            label="Reset Grid"
            icon={<RefreshCw className="mr-2 h-4 w-4" />}
          />
        </Card>
      ) : (
        <div className="choke-point-grid">
          {/* Main Defense Board */}
          <div className="flex flex-col gap-4">
            <div className="defense-grid">
              {gridCells.map(({ x, y }) => {
                const isCore = x === CORE_X && y === CORE_Y;
                const tower = state.towers?.find(t => t.x === x && t.y === y);
                const enemy = state.enemies?.find(e => e.x === x && e.y === y);
                
                // Find if any enemy is previewing a move to this cell
                const headingHere = state.enemies?.filter(e => e.preview_x === x && e.preview_y === y && e.x !== x);
                // Find if any enemy is previewing an attack on this cell
                const targetedBy = state.enemies?.filter(e => {
                  if (isCore && e.preview_attack_target === 'core') return true;
                  if (e.preview_attack_target && typeof e.preview_attack_target === 'object') {
                    return e.preview_attack_target.x === x && e.preview_attack_target.y === y;
                  }
                  return false;
                });

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => !isCore && !tower && !enemy && handleCellClick(x, y)}
                    className={`defense-cell ${isCore ? 'core' : ''} ${tower ? 'has-tower' : ''} ${enemy ? 'has-enemy' : ''}`}
                  >
                    <span className="absolute top-1 left-1 text-[9px] text-slate-600">{x},{y}</span>
                    
                    {isCore && (
                      <div className="flex flex-col items-center">
                        <Cpu className="h-6 w-6 text-indigo-400 mb-1 animate-pulse" />
                        <span className="text-[10px] font-bold text-indigo-400">CORE</span>
                        <span className="text-[9px] text-slate-400">{state.core_hp} HP</span>
                      </div>
                    )}

                    {tower && (
                      <div className="flex flex-col items-center text-center p-1">
                        <Shield className={`h-5 w-5 ${tower.type === 'turret' ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="text-[10px] font-bold text-white mt-1 uppercase">{tower.type}</span>
                        <span className="text-[9px] text-slate-400">{tower.hp}/{tower.max_hp} HP</span>
                      </div>
                    )}

                    {enemy && (
                      <div className="flex flex-col items-center text-center p-1">
                        <Sword className="h-5 w-5 text-red-500 animate-bounce" />
                        <span className="text-[10px] font-bold text-red-400 mt-1 uppercase">{enemy.type}</span>
                        <span className="text-[9px] text-slate-400">{enemy.hp} HP</span>
                      </div>
                    )}

                    {/* Path Previews overlay */}
                    {!enemy && headingHere && headingHere.length > 0 && (
                      <div className="absolute bottom-1 flex gap-1 justify-center w-full">
                        {headingHere.map((_, i) => (
                          <div key={i} className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                        ))}
                      </div>
                    )}

                    {/* Attack Previews overlay */}
                    {targetedBy && targetedBy.length > 0 && (
                      <div className="absolute inset-0 border border-red-500/60 bg-red-950/10 flex items-center justify-center pointer-events-none">
                        <Target className="h-6 w-6 text-red-500/80 animate-spin" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Preview Vector Simulation</h3>
                <p className="text-xs text-slate-400">Threats announce their targets. Block their vectors or destroy them.</p>
              </div>
              <Button
                onClick={handleCommit}
                variant="primary"
                size="lg"
                className="px-8 justify-center font-bold"
                label="Commit Turn"
                icon={<Zap className="mr-2 h-5 w-5 animate-pulse" />}
              />
            </div>
          </div>

          {/* Right Control & Console Panel */}
          <div className="flex flex-col gap-4">
            <Card className="border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-md font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5" /> Tactical Resources
              </h3>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm">Available Energy:</span>
                <span className="text-2xl font-bold text-yellow-400">{state.energy} units</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-yellow-400 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, state.energy * 10))}%` }}
                />
              </div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-md font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" /> Tactical Blueprint
              </h3>
              <div className="flex flex-col gap-3">
                <div
                  onClick={() => setSelectedTower('blocker')}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedTower === 'blocker' ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900/40'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white uppercase">Barricade</span>
                    <Badge variant="warning">3 Energy</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">High health obstacle. Directs and blocks vector pathing.</p>
                </div>

                <div
                  onClick={() => setSelectedTower('turret')}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedTower === 'turret' ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900/40'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white uppercase">Autocannon</span>
                    <Badge variant="warning">5 Energy</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">Deals 3 damage to nearest threat in its column/lane.</p>
                </div>
              </div>
            </Card>

            <Panel className="border-slate-800 bg-slate-950 p-3 h-48 overflow-y-auto font-mono text-[11px] flex flex-col gap-1">
              <div className="text-cyan-400 font-bold mb-2 flex items-center gap-1 border-b border-slate-900 pb-1">
                <Target className="h-4 w-4" /> Defense Logs
              </div>
              {state.history && state.history.length > 0 ? (
                state.history.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    &gt; {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 italic">No historical data. Select a cell to place units.</div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </GameShell>
  );
}
