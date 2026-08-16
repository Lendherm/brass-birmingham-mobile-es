import { useEffect, useState } from 'react';
import { HOTSEAT_COACH_KEY } from '../engine/ai/coach';

const KEY = 'bbsolo-training-coach';

/** Training coach on by default in vs AI mode. */
export function useTrainingCoach() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === '0') return false;
    if (saved === '1') return true;
    return true;
  });

  const [hotseatEnabled, setHotseatEnabled] = useState(() => localStorage.getItem(HOTSEAT_COACH_KEY) === '1');

  useEffect(() => {
    localStorage.setItem(KEY, enabled ? '1' : '0');
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem(HOTSEAT_COACH_KEY, hotseatEnabled ? '1' : '0');
  }, [hotseatEnabled]);

  return {
    coachEnabled: enabled,
    hotseatCoachEnabled: hotseatEnabled,
    toggleCoach: () => setEnabled((v) => !v),
    toggleHotseatCoach: () => setHotseatEnabled((v) => !v),
    disableCoach: () => setEnabled(false),
  };
}
