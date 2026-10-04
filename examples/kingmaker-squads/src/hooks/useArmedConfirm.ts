// new: examples/kingmaker-squads/src/hooks/useArmedConfirm.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { ARM_WINDOW_MS, pressArmed } from '../utils/armedConfirm';

export function useArmedConfirm(onConfirm: () => void, ms = ARM_WINDOW_MS) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    []
  );

  const trigger = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const step = pressArmed(armed);
    setArmed(step.armed);
    if (step.confirmed) {
      onConfirmRef.current();
    } else {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setArmed(false);
      }, ms);
    }
  }, [armed, ms]);

  return { armed, trigger };
}
