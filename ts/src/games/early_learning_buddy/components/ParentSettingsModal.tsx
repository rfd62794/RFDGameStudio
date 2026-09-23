import React from 'react';
import { X, Volume2, VolumeX, ShieldCheck, RotateCcw, Sliders } from 'lucide-react';
import { CategoryType } from '../types';

interface ParentSettingsModalProps {
  categoryFilter: CategoryType | 'all';
  onSetCategoryFilter: (filter: CategoryType | 'all') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const ParentSettingsModal: React.FC<ParentSettingsModalProps> = ({
  categoryFilter,
  onSetCategoryFilter,
  isMuted,
  onToggleMute,
  onResetProgress,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Sliders className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-black text-slate-800">Learning Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Practice Category Selection */}
          <div>
            <label className="text-xs font-black uppercase text-slate-500 block mb-2">
              Practice Focus Area
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: '🌟 All Mix' },
                { id: 'letter', label: '🔤 Letters (A-Z)' },
                { id: 'number', label: '🔢 Numbers (1-20)' },
                { id: 'word', label: '✨ Simple Words' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSetCategoryFilter(cat.id as CategoryType | 'all')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black border transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mute Audio */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <p className="text-sm font-black text-slate-800">App Sound Effects</p>
              <p className="text-xs text-slate-500">Chimes and action audio</p>
            </div>
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-colors ${
                isMuted
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
          </div>

          {/* Privacy Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 font-medium">
              Private local app session. No external data collection or accounts required.
            </p>
          </div>

          {/* Reset Progress */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => {
                if (window.confirm('Reset all collected characters and progress?')) {
                  onResetProgress();
                }
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Collection</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-900 text-white text-xs font-black px-5 py-2.5 rounded-2xl hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
