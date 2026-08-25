import { useEffect, useState } from 'react';

const KEY = 'bbsolo-training-mode';

/** Proactive training mode: pattern detection, block explainers, action quality bar. */
export function useTrainingMode() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === '0') return false;
      if (saved === '1') return true;
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, enabled ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [enabled]);

  return {
    trainingMode: enabled,
    toggleTrainingMode: () => setEnabled((v) => !v),
    enableTrainingMode: () => setEnabled(true),
    disableTrainingMode: () => setEnabled(false),
  };
}
