/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// new: examples/ledger/src/components/RestartButton.tsx

import React, { useState, useEffect } from 'react';

interface RestartButtonProps {
  onRestart: () => void;
}

export const RestartButton: React.FC<RestartButtonProps> = ({ onRestart }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  const handleClick = () => {
    if (armed) {
      setArmed(false);
      onRestart();
    } else {
      setArmed(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="px-2 py-1 text-xs font-mono font-bold border border-slate-800 hover:bg-slate-800 hover:text-white rounded uppercase transition-colors shadow-sm"
      id="btn-restart-run"
    >
      {armed ? 'Confirm?' : 'Restart'}
    </button>
  );
};
