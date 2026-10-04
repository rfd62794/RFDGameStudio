import React from 'react';
import { GameState } from '../services/simulation';
import { Radio, Key, MapPin, BookOpen, Clock, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface Props {
  gameState: GameState;
  onTractorBottle: (bottleId: string) => void;
}

export const SignalArrayTerminal: React.FC<Props> = ({ gameState, onTractorBottle }) => {
  const signalArrays = gameState.modules.filter((m) => m.type === 'signal_array' && m.isPowered);
  const driftingBottles = gameState.signalBottles.filter((b) => b.status === 'drifting');
  const decodingBottles = gameState.signalBottles.filter(
    (b) => b.status === 'retrieved' || b.status === 'decoding'
  );

  return (
    <div id="signal-array-terminal-dashboard" className="p-4 flex flex-col gap-6 select-none">
      {/* 1. Terminal Overview */}
      <div className="bg-slate-900/70 border border-blue-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            Quantum Signal Array Terminal (Decoding Engine)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Decodes tumbling void capsules into Signal Keys, Coordinates, and lost Pre-Collapse Lore.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-blue-300 bg-blue-950/60 border border-blue-500/30 px-2.5 py-1 rounded-lg">
            {signalArrays.length} Active Signal Arrays
          </span>
          <span className="text-slate-400">
            {gameState.stats.totalBottlesDecoded} Capsules Decoded
          </span>
        </div>
      </div>

      {/* 2. Active Bottle Decoding Queue */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Decryption Matrix</h3>
            <span className="text-xs text-slate-400 font-mono">
              ({decodingBottles.length} in processing)
            </span>
          </div>
        </div>

        {decodingBottles.length === 0 && driftingBottles.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            Scanning horizon... Signal Bottles tumble in periodically from the black hole event horizon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Drifting Bottles waiting to be retrieved */}
            {driftingBottles.map((bottle) => (
              <div
                key={bottle.id}
                id={`bottle-${bottle.id}`}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex flex-col justify-between gap-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-cyan-300">{bottle.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Drifting in void sector ({Math.round(bottle.worldX)}, {Math.round(bottle.worldY)})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                    Tier {bottle.tier}
                  </span>
                </div>

                <button
                  id={`btn-tractor-${bottle.id}`}
                  onClick={() => {
                    onTractorBottle(bottle.id);
                    soundEngine.playBottleChime();
                  }}
                  className="w-full py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tractor-Beam to Station</span>
                </button>
              </div>
            ))}

            {/* Currently Decoding Bottles */}
            {decodingBottles.map((bottle) => {
              const progress = bottle.decodingProgress || 0;
              return (
                <div
                  key={bottle.id}
                  id={`bottle-${bottle.id}`}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-blue-500/40 flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">{bottle.name}</h4>
                        <span className="text-[10px] text-blue-400 font-mono uppercase">
                          Decrypting Frequency...
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {bottle.decodingDuration}s cycle
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Analysis:</span>
                      <span className="text-blue-300 font-semibold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-200 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Decoded Signal Keys (Progression Tree) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">Decoded Signal Keys (Progression)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {gameState.signalKeys.filter((k) => k.unlocked).length} / {gameState.signalKeys.length} Decoded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gameState.signalKeys.map((key) => {
            return (
              <div
                key={key.id}
                id={`signal-key-${key.id}`}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 ${
                  key.unlocked
                    ? 'bg-slate-900/80 border-purple-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        key.unlocked
                          ? 'bg-purple-950/80 border border-purple-500/40 text-purple-300'
                          : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200">{key.name}</h4>
                  </div>

                  {key.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">{key.description}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">{key.category}</span>
                  <span className={key.unlocked ? 'text-purple-400 font-semibold' : 'text-slate-500'}>
                    {key.unlocked ? 'ACTIVE PROTOCOL' : 'LOCKED IN VOID'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Pre-Collapse Lore Transmissions Archive */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Recovered Transmission Logs (Pre-Collapse Archive)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {gameState.loreEntries.filter((l) => l.discovered).length} / {gameState.loreEntries.length} Recovered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gameState.loreEntries.map((lore) => {
            return (
              <div
                key={lore.id}
                id={`lore-card-${lore.id}`}
                className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
                  lore.discovered
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-amber-300">
                      {lore.discovered ? lore.title : 'Corrupted Archive Sector'}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {lore.discovered ? `${lore.author} • ${lore.timestamp}` : 'Unknown Source'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-serif leading-relaxed italic">
                  {lore.discovered
                    ? `“${lore.content}”`
                    : 'Signal frequencies encrypted in compressed dark matter. Decode more signal bottles to restore transmission audio.'}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
