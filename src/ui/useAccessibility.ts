import { useEffect, useState } from 'react';

const KEY = 'bbsolo-a11y-large';

function readLargeText(): boolean {
  return localStorage.getItem(KEY) === '1';
}

function applyLargeText(largeText: boolean) {
  document.documentElement.dataset.a11y = largeText ? 'large' : 'normal';
}

export function useAccessibility() {
  const [largeText, setLargeText] = useState(() => {
    const v = readLargeText();
    applyLargeText(v);
    return v;
  });

  useEffect(() => {
    applyLargeText(largeText);
    localStorage.setItem(KEY, largeText ? '1' : '0');
  }, [largeText]);

  return {
    largeText,
    toggleLargeText: () => setLargeText((v) => !v),
  };
}
