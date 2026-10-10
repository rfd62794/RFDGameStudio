// new: examples/factory-idle-precision-armory-phase2/src/engine/useArmedConfirm.ts
import { useCallback, useEffect, useRef, useState } from 'react';

/** Two-step confirm: the first call arms (for `ms`), the second call inside that window runs `onConfirm`. */
export function useArmedConfirm(onConfirm: () => void, ms = 3000) {
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
    if (armed) {
      setArmed(false);
      onConfirmRef.current();
    } else {
      setArmed(true);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setArmed(false);
      }, ms);
    }
  }, [armed, ms]);

  return { armed, trigger };
}
