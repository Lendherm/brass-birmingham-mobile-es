import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import App from './App';

function initTheme() {
  const saved = localStorage.getItem('bbsolo-theme');
  const theme =
    saved === 'light' || saved === 'dark'
      ? saved
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.dataset.theme = theme;
}

initTheme();

if (Capacitor.isNativePlatform()) {
  void navigator.serviceWorker?.getRegistrations().then((regs) => {
    for (const reg of regs) void reg.unregister();
  });
} else {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
