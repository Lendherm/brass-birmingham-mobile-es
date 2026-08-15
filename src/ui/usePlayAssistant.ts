import { useEffect, useState } from 'react';

const KEY = 'bbsolo-play-assistant';

export function usePlayAssistant() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(KEY) === '1');

  useEffect(() => {
    localStorage.setItem(KEY, enabled ? '1' : '0');
  }, [enabled]);

  return {
    assistantEnabled: enabled,
    toggleAssistant: () => setEnabled((v) => !v),
  };
}
