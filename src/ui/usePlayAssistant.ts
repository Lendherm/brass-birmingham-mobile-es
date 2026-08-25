import { useEffect, useState } from 'react';

const KEY = 'bbsolo-play-assistant';

export function usePlayAssistant() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === '0') return false;
    if (saved === '1') return true;
    return true;
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    localStorage.setItem(KEY, enabled ? '1' : '0');
  }, [enabled]);

  /** Interruptor: activar / desactivar (persiste en localStorage). */
  const pressAssistant = () => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) setRefreshKey((k) => k + 1);
      return next;
    });
  };

  const refreshAssistant = () => setRefreshKey((k) => k + 1);

  return {
    assistantEnabled: enabled,
    assistantRefresh: refreshKey,
    pressAssistant,
    refreshAssistant,
    disableAssistant: () => setEnabled(false),
  };
}
