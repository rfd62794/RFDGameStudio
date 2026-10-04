import React from 'react';
import { GameState } from '../types';
import { Radio, Key, BookOpen, Clock, Sparkles } from 'lucide-react';

interface Props {
  gameState: GameState;
  onTractorBottle?: (bottleId: string) => void;
}

export const SignalPanel: React.FC<Props> = ({ gameState, onTractorBottle }) => {
  const signalArrays = gameState.modules.filter((m) => m.type === 'signal_array' && m.isPowered);

  return (
    <div className="flex flex-col gap-5 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400" />
            Signal Array & Capsule Decoder
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Decodes tumbling void capsules into Signal Keys and Pre-Collapse Lore Transmissions.
          </p>
        </div>
        <span className="text-xs font-mono text-blue-300">
          {signalArrays.length} Active Signal Arrays
        </span>
      </div>

      {/* Signal Bottles Queue */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-slate-300">Signal Bottles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gameState.signalBottles.map((bottle) => {
            return (
              <div
                key={bottle.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{bottle.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">
                      Status: {bottle.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                    Tier {bottle.tier}
                  </span>
                </div>

                {bottle.status === 'drifting' && onTractorBottle && (
                  <button
                    onClick={() => onTractorBottle(bottle.id)}
                    className="w-full py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-200 text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tractor-Beam</span>
                  </button>
                )}

                {bottle.status === 'retrieved' && (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono text-blue-300">
                      <span>Decoding...</span>
                      <span>{Math.round(bottle.decodingProgress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${bottle.decodingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {bottle.status === 'decoded' && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    ✓ Decryption Complete
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Signal Keys */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-purple-400" />
          Signal Keys
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {gameState.signalKeys.map((k) => (
            <div
              key={k.id}
              className={`p-3 rounded-lg border flex items-start justify-between gap-2 ${
                k.unlocked
                  ? 'bg-slate-950/80 border-purple-500/30'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div>
                <span className="text-xs font-semibold text-slate-200 block">{k.name}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">{k.description}</p>
              </div>
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                  k.unlocked ? 'bg-purple-950 text-purple-300' : 'bg-slate-900 text-slate-500'
                }`}
              >
                {k.unlocked ? 'ACTIVE' : 'LOCKED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
