import { useEffect, useState } from 'react';

/**
 * Renvoie le nombre de secondes écoulées depuis `startTime`.
 * Tique chaque seconde tant que la séance n'est pas terminée ; gèle à `endTime`.
 */
export function useChrono(startTime: number, endTime: number | null): number {
  const [now, setNow] = useState(() => endTime ?? Date.now());

  useEffect(() => {
    if (endTime != null) {
      setNow(endTime);
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return Math.max(0, Math.floor((now - startTime) / 1000));
}
