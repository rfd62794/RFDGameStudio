import React from 'react';
import { sounds } from '../utils/audio';
import type { DialerConfig, LeadList } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dialerConfig: DialerConfig;
  activeList: LeadList;
  onPaceChange: (pace: number) => void;
  onRequestNewList: () => void;
}

export const DialerControlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  dialerConfig,
  activeList,
  onPaceChange,
  onRequestNewList,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-sky-500 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">

        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <h2 className="font-bold text-lg text-sky-400 tracking-wide uppercase font-pixel text-xs">
                DIALER & LIST CONTROL
              </h2>
              <p className="text-xs text-slate-400">Adjust pace and manage lead lists</p>
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
        <div className="p-6 space-y-5 text-xs">

          {/* Current list summary */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Active List: {activeList.id}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Purity', value: activeList.purity },
                { label: 'Freshness', value: activeList.freshness },
                { label: 'Volume', value: activeList.volume },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-center"
                >
                  <div className="text-slate-400 text-[10px]">{stat.label}</div>
                  <div className="text-sky-400 font-mono font-bold text-sm">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pace throttle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Dialer Pace (Tier {dialerConfig.tier})
            </label>
            <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-3">
              <input
                type="range"
                min={1}
                max={20}
                value={dialerConfig.pace}
                onChange={e => onPaceChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <span className="text-lg font-mono font-bold text-sky-400 w-8 text-right">
                {dialerConfig.pace}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Calls pushed per tick. Higher pace may exceed the floor's safe capacity.
            </p>
          </div>

          {/* List swap action */}
          <button
            onClick={() => {
              sounds.playClick();
              onRequestNewList();
            }}
            className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider bg-sky-700 hover:bg-sky-600 text-white shadow-md active:scale-[0.98] transition-all"
          >
            Request New ACBS List
          </button>
        </div>
      </div>
    </div>
  );
};
