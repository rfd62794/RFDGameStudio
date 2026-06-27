import { useState, useEffect } from 'react';

/**
 * Returns the current timestamp in ms, updated every `intervalMs`.
 * Use for cooldown badge rendering: `horse.cooldown_until > now` 
 *
 * Usage:
 *   const now = useCooldownTicker();
 *   const isResting = horse.cooldown_until > now;
 */
export function useCooldownTicker(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
