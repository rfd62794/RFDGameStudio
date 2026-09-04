import React from 'react';
import { Agent } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  agent: Agent | null;
  onClose: () => void;
  onSendBreak: (agentId: string) => void;
  onGiveDrink: (agentId: string) => void;
  onGiveBonus: (agentId: string, amount: number) => void;
  onPromote: (agentId: string) => void;
  onFire: (agentId: string) => void;
}

export const AgentModal: React.FC<Props> = ({
  agent,
  onClose,
  onSendBreak,
  onGiveDrink,
  onGiveBonus,
  onPromote,
  onFire,
}) => {
  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-sky-500 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-sky-400 flex items-center justify-center text-2xl shadow-inner">
              {agent.gender === 'M' ? '👨‍💼' : '👩‍💼'}
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                {agent.name}
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700 font-bold uppercase">
                  {agent.role}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Shift: <strong className="text-amber-300">{agent.shift}</strong> · Desk: {agent.deskId || 'Floater'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white px-2 py-1 text-xl font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Status & Live Call info */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                Current Floor Status
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold inline-block ${
                agent.state === 'ON_CALL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse' :
                agent.state === 'BREAK' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                agent.state === 'ACW' ? 'bg-sky-950 text-sky-300 border border-sky-700' :
                'bg-slate-800 text-slate-300'
              }`}>
                {agent.state === 'ON_CALL' ? '📞 Active on Call with Customer' :
                 agent.state === 'BREAK' ? '☕ In Pantry / Coffee Break' :
                 agent.state === 'ACW' ? '💻 After-Call Work (ACW Documentation)' :
                 agent.state.replace('_', ' ')}
              </span>
            </div>

            {agent.state === 'ON_CALL' && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Call Duration</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {Math.floor(agent.activeCallDuration / 60)}:{(agent.activeCallDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Vitals: Energy, Stress, Morale */}
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Energy Level</span>
                <span className="font-bold text-amber-300">{agent.energy}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${agent.energy < 30 ? 'bg-rose-500' : 'bg-amber-400'}`}
                  style={{ width: `${agent.energy}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Stress / Burnout</span>
                <span className="font-bold text-rose-400">{agent.stress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${agent.stress}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Morale & Loyalty</span>
                <span className="font-bold text-emerald-400">{agent.morale}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${agent.morale}%` }}
                />
              </div>
            </div>
          </div>

          {/* Core Competencies */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">English & Accent</span>
              <span className="font-bold text-sky-300 font-mono">{agent.englishSkill}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Empathy & Patience</span>
              <span className="font-bold text-emerald-300 font-mono">{agent.empathySkill}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tech Troubleshooting</span>
              <span className="font-bold text-purple-300 font-mono">{agent.techSkill}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Typing & Speed</span>
              <span className="font-bold text-amber-300 font-mono">{agent.speed}%</span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Calls Handled</span>
              <span className="font-bold text-slate-100 font-mono">{agent.callsHandledToday} today</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">CSAT Rating</span>
              <span className="font-bold text-sky-400 font-mono">{agent.csat}% ⭐</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Monthly Salary</span>
              <span className="font-bold text-amber-300 font-mono">₱ {agent.salary.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => {
                sounds.playClick();
                onSendBreak(agent.id);
              }}
              className="py-2 px-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>☕</span> Send on Break
            </button>

            <button
              onClick={() => {
                sounds.playCash();
                onGiveDrink(agent.id);
              }}
              className="py-2 px-3 bg-sky-950/80 hover:bg-sky-900 border border-sky-700 text-sky-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>⚡</span> 3-in-1 Kopiko (₱150)
            </button>

            <button
              onClick={() => {
                sounds.playCash();
                onGiveBonus(agent.id, 1000);
              }}
              className="py-2 px-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>💰</span> Spot Bonus (₱1,000)
            </button>

            {agent.role !== 'TL' ? (
              <button
                onClick={() => {
                  sounds.playLevelUp();
                  onPromote(agent.id);
                }}
                className="py-2 px-3 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>🏆</span> Promote to TL
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playAlert();
                  onFire(agent.id);
                }}
                className="py-2 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>🚪</span> Terminate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
