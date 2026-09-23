import { X, AlertTriangle } from 'lucide-react';
import type { LogEntry } from '../types';

interface AlertBoxProps {
  entry: LogEntry;
  onDismiss: (id: string) => void;
}

export function AlertBox({ entry, onDismiss }: AlertBoxProps) {
  return (
    <div className="relative max-w-sm p-4 rounded-lg border border-amber-500/40 bg-slate-900/95 shadow-xl">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-amber-300 font-mono">ALERT</h3>
        </div>
        <button onClick={() => onDismiss(entry.id)} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-300 font-mono leading-relaxed">{entry.text}</p>
      <button
        onClick={() => onDismiss(entry.id)}
        className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-mono"
      >
        Dismiss
      </button>
    </div>
  );
}
