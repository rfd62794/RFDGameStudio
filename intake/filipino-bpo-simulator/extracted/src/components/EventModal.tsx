import React from 'react';
import { GameEvent } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  event: GameEvent | null;
  onClose: () => void;
}

export const EventModal: React.FC<Props> = ({ event, onClose }) => {
  if (!event) return null;

  const severityStyles = {
    info: 'border-sky-500 text-sky-400',
    warning: 'border-amber-500 text-amber-400',
    critical: 'border-rose-500 text-rose-400',
    reward: 'border-emerald-500 text-emerald-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className={`bg-slate-900 border-2 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 ${severityStyles[event.severity]}`}>
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {event.severity === 'critical' ? '🚨' : event.severity === 'warning' ? '⚠️' : event.severity === 'reward' ? '🎉' : '📢'}
            </span>
            <div>
              <h2 className="font-bold text-sm uppercase tracking-wide font-pixel">
                {event.title}
              </h2>
              <span className="text-[10px] uppercase font-bold text-slate-400">Company Advisory</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {event.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sounds.playClick();
                  option.action();
                  onClose();
                }}
                className="w-full p-3 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-500 rounded-xl text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                    {option.label}
                  </span>
                  {option.cost !== undefined && option.cost > 0 && (
                    <span className="text-xs font-mono font-bold text-amber-400">
                      Cost: ₱ {option.cost.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {option.effectDescription}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
