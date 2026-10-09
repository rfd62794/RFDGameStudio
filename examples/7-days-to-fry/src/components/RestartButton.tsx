// new: examples/7-days-to-fry/src/components/RestartButton.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface RestartButtonProps {
  onRestart: () => void;
  className?: string;
  label?: string;
  armedLabel?: string;
  title?: string;
}

/** Two-step confirm: the first click arms for 3 seconds, a second click inside that window restarts the week. */
export const RestartButton: React.FC<RestartButtonProps> = ({
  onRestart,
  className = '',
  label = 'Restart week',
  armedLabel = 'Click again to restart the week',
  title = 'Start the week over from the first screen',
}) => {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRestartRef = useRef(onRestart);
  onRestartRef.current = onRestart;

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    []
  );

  const handleClick = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (armed) {
      setArmed(false);
      onRestartRef.current();
      return;
    }
    setArmed(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setArmed(false);
    }, 3000);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
        armed
          ? 'bg-rose-900 border-rose-600 text-rose-100'
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
      } ${className}`}
      title={title}
    >
      <RotateCcw className="w-3.5 h-3.5" />
      {armed ? armedLabel : label}
    </button>
  );
};
