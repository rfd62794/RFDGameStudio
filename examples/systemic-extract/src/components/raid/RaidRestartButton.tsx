/**
 * RaidRestartButton.tsx — two-press NEW RUN control for the raid HUD.
 *
 * <!-- new: examples/systemic-extract/src/components/raid/RaidRestartButton.tsx -->
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { nextRestartPrompt, RestartPrompt } from '../../game/restart-confirm';

export const RaidRestartButton: React.FC<{ onRestart: () => void }> = ({ onRestart }) => {
  const [prompt, setPrompt] = useState<RestartPrompt>('idle');

  useEffect(() => {
    if (prompt !== 'armed') return;
    const timer = setTimeout(() => {
      setPrompt((current) => nextRestartPrompt(current, 'timeout').state);
    }, 3000);
    return () => clearTimeout(timer);
  }, [prompt]);

  const handleClick = () => {
    const next = nextRestartPrompt(prompt, 'press');
    setPrompt(next.state);
    if (next.restart) {
      onRestart();
    }
  };

  return (
    <button
      id="btn-new-run"
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e293b]/90 hover:bg-[#334155] text-xs font-mono text-[#38bdf8] border border-[#38bdf8]/40 transition shadow-lg cursor-pointer"
      title="Abandon this run and start over at the sanctuary"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      <span>{prompt === 'armed' ? 'CONFIRM NEW RUN?' : 'NEW RUN'}</span>
    </button>
  );
};
