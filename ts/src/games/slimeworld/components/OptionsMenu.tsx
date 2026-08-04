import { X, AlertTriangle } from 'lucide-react';

interface OptionsMenuProps {
  onClose: () => void;
  pendingHardReset: boolean;
  setPendingHardReset: (pending: boolean) => void;
  onConfirmHardReset: () => void;
}

export function OptionsMenu({ onClose, pendingHardReset, setPendingHardReset, onConfirmHardReset }: OptionsMenuProps) {
  return (
    <div className="relative max-w-sm p-4 rounded-lg border border-slate-700 bg-slate-900/95 shadow-xl">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-slate-200 font-mono">OPTIONS</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      {!pendingHardReset ? (
        <button
          onClick={() => setPendingHardReset(true)}
          className="w-full px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded text-[9px] uppercase tracking-wider font-mono cursor-pointer transition-all"
        >
          Hard Reset
        </button>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-[9px] font-mono font-bold uppercase">Confirm permanent Hard Reset</p>
          </div>
          <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
            This permanently erases your save. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onConfirmHardReset}
              className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white border border-red-500 rounded text-[9px] uppercase tracking-wider font-mono font-bold cursor-pointer transition-all"
            >
              Confirm Hard Reset
            </button>
            <button
              onClick={() => setPendingHardReset(false)}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded text-[9px] uppercase tracking-wider font-mono cursor-pointer transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
