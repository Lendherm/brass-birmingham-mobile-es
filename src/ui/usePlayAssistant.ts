import { useEffect, useState } from 'react';

const KEY = 'bbsolo-play-assistant';

export function usePlayAssistant() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(KEY) === '1');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    localStorage.setItem(KEY, enabled ? '1' : '0');
  }, [enabled]);

  const pressAssistant = () => {
    if (enabled) setRefreshKey((k) => k + 1);
    else setEnabled(true);
  };

  return {
    assistantEnabled: enabled,
    assistantRefresh: refreshKey,
    pressAssistant,
    disableAssistant: () => setEnabled(false),
  };
}
