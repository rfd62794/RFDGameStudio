import React from 'react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameSpeed: number;
  onSetGameSpeed: (speed: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetGame: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  gameSpeed,
  onSetGameSpeed,
  soundEnabled,
  onToggleSound,
  onResetGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-600 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="font-bold text-base text-slate-200 font-pixel text-xs">
                SIMULATOR SETTINGS
              </h2>
              <p className="text-xs text-slate-400">Audio, game speed, and preferences</p>
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
          
          {/* Game Simulation Speed */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Simulation Clock Speed
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { speed: 0, label: '⏸️ Pause' },
                { speed: 1, label: '▶ 1x Normal' },
                { speed: 2, label: '⏩ 2x Fast' },
                { speed: 4, label: '⚡ 4x Turbo' },
              ].map(opt => (
                <button
                  key={opt.speed}
                  onClick={() => {
                    sounds.playClick();
                    onSetGameSpeed(opt.speed);
                  }}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    gameSpeed === opt.speed
                      ? 'bg-sky-600 border-sky-400 text-white shadow'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div>
              <span className="font-bold text-slate-200 block">Retro Sound Effects (SFX)</span>
              <span className="text-[11px] text-slate-400">Keyboard typing, call chimes, cha-ching cash register</span>
            </div>
            <button
              onClick={() => {
                onToggleSound();
                sounds.enabled = !soundEnabled;
                if (!soundEnabled) sounds.playCash();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                soundEnabled
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {soundEnabled ? '🔊 Sound ON' : '🔇 Muted'}
            </button>
          </div>

          {/* Reset Save Data */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (window.confirm('Reset call center to day 1? All progress will be re-initialized.')) {
                  sounds.playAlert();
                  onResetGame();
                  onClose();
                }
              }}
              className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold transition-colors"
            >
              🔄 Reset Call Center to Default State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
