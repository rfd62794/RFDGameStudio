// new: examples/kingmaker-squads/src/components/RestartButton.tsx
import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useArmedConfirm } from '../hooks/useArmedConfirm';
import { armedLabel } from '../utils/armedConfirm';

export function RestartButton({ onConfirm }: { onConfirm: () => void }) {
  const { armed, trigger } = useArmedConfirm(onConfirm);
  const label = armedLabel(armed, 'Restart', 'Confirm restart?');

  return (
    <button
      onClick={trigger}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
        armed
          ? 'bg-rose-950/60 text-rose-200 border border-rose-500/60'
          : 'bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800'
      }`}
      title="Restart Campaign"
      aria-label={label}
    >
      <RotateCcw className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
