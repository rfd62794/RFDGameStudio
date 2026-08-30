import React from 'react';
import { Shield, Swords, Activity, Sparkles, Award, AlertTriangle } from 'lucide-react';
import { RunState } from '../types';
import { ENEMY_POOL } from '../logic/enemies';
import { RELIC_POOL } from '../utils';

interface EnemyIntentDisplayProps {
  runState: RunState;
  liveDifficultyMultiplier: number;
}

export default function EnemyIntentDisplay({
  runState,
  liveDifficultyMultiplier
}: EnemyIntentDisplayProps) {
  if (!runState.enemy) return null;

  const activeEnemyDef = ENEMY_POOL.find(e => runState.enemy?.name.includes(e.name));

  return (
    <div className="flex flex-col gap-6" id="enemy-intent-display">
      {/* COMBAT STATS HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Active Threat</span>
          <h2 className="text-lg font-bold font-display text-slate-200 flex items-center gap-2">
            <Swords className="w-4 h-4 text-rose-500" />
            {runState.enemy.name}
          </h2>
          {activeEnemyDef && (
            <p className="text-[11px] font-mono text-amber-400/90 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{activeEnemyDef.signature}</span>
            </p>
          )}
          {runState.enemy.secondaryType && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5" id="enemy-secondary-type-container">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80 uppercase font-bold tracking-wider" id="enemy-secondary-type-badge">
                Type: {runState.enemy.secondaryType}
              </span>
              {runState.enemy.vulnerable && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 uppercase font-bold tracking-wider" id="enemy-vulnerable-badge">
                  Vuln: {runState.enemy.vulnerable} (1.3x)
                </span>
              )}
              {runState.enemy.resistant && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80 uppercase font-bold tracking-wider" id="enemy-resistant-badge">
                  Resist: {runState.enemy.resistant} (0.7x)
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Cycle Status</span>
          <span className="text-xs font-mono font-medium text-slate-300">TURN {runState.turnCount}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 block mt-1" title="Live Difficulty Scaling (Bounded 0.8x-1.25x based on Deck Power & HP)">
            DDA: {(liveDifficultyMultiplier * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* HEALTH BARS */}
      <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 border border-slate-800/80 rounded-xl font-mono">
        <div className="flex flex-col gap-1.5" id="combat-player-stat-block">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">PLAYER INTEGRITY</span>
            <span className="text-emerald-400 font-bold">{runState.playerHp} / {runState.playerMaxHp}</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex relative">
            <div 
              className="h-full bg-emerald-500/80 transition-all duration-300 rounded-full" 
              style={{ width: `${(runState.playerHp / runState.playerMaxHp) * 100}%` }}
            />
            {runState.playerShield > 0 && (
              <div 
                className="absolute right-0 top-0 h-full bg-blue-400/80 animate-pulse transition-all duration-300 rounded-r-full"
                style={{ width: `${Math.min(100, (runState.playerShield / runState.playerMaxHp) * 100)}%` }}
              />
            )}
          </div>
          <div className="flex gap-2 items-center mt-1">
            {runState.playerShield > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900/55 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Shield: +{runState.playerShield}
              </span>
            )}
            <span className="text-[10px] text-slate-500">Defends enemy hits immediately</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5" id="combat-enemy-stat-block">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">ENEMY INTEGRITY</span>
            <span className="text-rose-400 font-bold">{runState.enemy.hp} / {runState.enemy.maxHp}</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
            <div 
              className="h-full bg-rose-500/80 transition-all duration-300 rounded-full" 
              style={{ width: `${(runState.enemy.hp / runState.enemy.maxHp) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {runState.enemy.dot && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900/55 animate-pulse">
                Void Rot ({runState.enemy.dot.damage} Dmg / {runState.enemy.dot.duration}t)
              </span>
            )}
            <span className="text-[10px] text-slate-500">Telegraphed Action</span>
          </div>
        </div>
      </div>

      {/* WARNING BAR */}
      <div className="p-3 bg-rose-950/20 border border-rose-900/35 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-rose-300">
          <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
          <span><strong>ENEMY INTENT:</strong> {runState.enemy.intent.description}</span>
        </div>
      </div>

      {/* ACTIVE RUN BOONS & RELICS STRIPS */}
      {((runState.boons && runState.boons.length > 0) || (runState.relics && runState.relics.length > 0)) && (
        <div className="flex flex-col gap-2 bg-slate-950/40 p-2.5 border border-slate-800/80 rounded-xl">
          {runState.boons && runState.boons.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Active Boons:
              </span>
              {runState.boons.map((boon) => (
                <span 
                  key={boon.id} 
                  className="text-[10px] font-mono px-2 py-1 rounded bg-amber-950/30 border border-amber-900/40 text-amber-300 flex items-center gap-1.5"
                >
                  <span className="capitalize font-bold text-slate-200">{boon.targetId}</span>
                  {boon.modifier !== undefined && (
                    <span className="text-amber-400">+{boon.modifier}</span>
                  )}
                  {boon.qualitativeEffect && (
                    <span className="text-amber-400 text-[9px] font-normal italic">({boon.qualitativeEffect})</span>
                  )}
                </span>
              ))}
            </div>
          )}
          {runState.relics && runState.relics.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center border-t border-slate-800/60 pt-2 mt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-teal-400" /> Active Relics:
              </span>
              {runState.relics.map((relicId) => {
                const relic = RELIC_POOL.find(r => r.id === relicId);
                const isConsumed = runState.usedRelicIds?.includes(relicId);
                return relic ? (
                  <span 
                    key={relicId} 
                    className={`text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1.5 ${
                      isConsumed 
                        ? 'bg-slate-950/40 border border-slate-800 text-slate-500 line-through' 
                        : 'bg-teal-950/30 border border-teal-900/40 text-teal-300'
                    }`}
                    title={relic.description}
                  >
                    <span className="font-bold text-slate-200">{relic.name}</span>
                    <span className="text-[9px] text-teal-400 italic">({relic.category})</span>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
