import { useEffect, useState } from 'react';

const KEY = 'bbsolo-training-coach';

/** Training coach on by default in vs AI mode. */
export function useTrainingCoach() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === '0') return false;
    if (saved === '1') return true;
    return true;
  });

  useEffect(() => {
    localStorage.setItem(KEY, enabled ? '1' : '0');
  }, [enabled]);

  return {
    coachEnabled: enabled,
    toggleCoach: () => setEnabled((v) => !v),
    disableCoach: () => setEnabled(false),
  };
}
