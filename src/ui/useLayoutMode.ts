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

function applySimLandscape(mode: LayoutMode) {
  const sim = mode === 'landscape' && window.innerWidth < window.innerHeight;
  if (sim) {
    document.documentElement.dataset.simLandscape = '1';
  } else {
    delete document.documentElement.dataset.simLandscape;
  }
}

function applyMode(mode: LayoutMode) {
  if (mode === 'auto') {
    delete document.documentElement.dataset.layout;
  } else {
    document.documentElement.dataset.layout = mode;
  }
  applySimLandscape(mode);
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

  useEffect(() => {
    const onResize = () => applySimLandscape(mode);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mode]);

  const cycleLayout = () => {
    setMode((m) => (m === 'auto' ? 'landscape' : m === 'landscape' ? 'portrait' : 'auto'));
  };

  const simLandscape = mode === 'landscape' && typeof window !== 'undefined' && window.innerWidth < window.innerHeight;

  return {
    layoutMode: mode,
    layoutLabel: simLandscape ? 'Horizontal (sim.)' : LABELS[mode],
    cycleLayout,
  };
}
