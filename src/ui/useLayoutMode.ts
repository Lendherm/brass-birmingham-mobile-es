import { useEffect, useState } from 'react';

const KEY = 'bbsolo-layout';

export type LayoutMode = 'auto' | 'landscape' | 'portrait';

const LABELS: Record<LayoutMode, string> = {
  auto: 'Auto',
  landscape: 'Horizontal',
  portrait: 'Vertical',
};

function readMode(): LayoutMode {
  const v = localStorage.getItem(KEY);
  return v === 'landscape' || v === 'portrait' ? v : 'auto';
}

function applyMode(mode: LayoutMode) {
  delete document.documentElement.dataset.simLandscape;
  if (mode === 'auto') {
    delete document.documentElement.dataset.layout;
  } else {
    document.documentElement.dataset.layout = mode;
  }
}

export function useLayoutMode() {
  const [mode, setMode] = useState<LayoutMode>(() => {
    const v = readMode();
    applyMode(v);
    return v;
  });

  useEffect(() => {
    applyMode(mode);
    localStorage.setItem(KEY, mode);
    window.dispatchEvent(new Event('orientationchange'));
  }, [mode]);

  const cycleLayout = () => {
    setMode((m) => (m === 'auto' ? 'landscape' : m === 'landscape' ? 'portrait' : 'auto'));
  };

  return {
    layoutMode: mode,
    layoutLabel: LABELS[mode],
    cycleLayout,
  };
}
